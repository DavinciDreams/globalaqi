'use client'

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAQI } from '@/utils/AQIContext'

// Shader for the fog layer
const fogVertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    // Calculate position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = modelPosition.xyz; // Store world position for accurate mapping
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
  }
`

const fogFragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform sampler2D heatmapTexture;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  // Noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    // First corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    // Permutations
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
    // Gradients
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
  
  // Function to map AQI value to color
  vec3 getAQIColor(float value) {
    // Good - Green
    if (value < 0.2) return vec3(0.0, 1.0, 0.25);
    // Moderate - Yellow
    else if (value < 0.4) return vec3(1.0, 1.0, 0.0);
    // Unhealthy for Sensitive Groups - Orange
    else if (value < 0.6) return vec3(1.0, 0.67, 0.0);
    // Unhealthy - Red
    else if (value < 0.8) return vec3(1.0, 0.2, 0.0);
    // Very Unhealthy - Purple
    else if (value < 0.9) return vec3(0.8, 0.0, 0.8);
    // Hazardous - Deep Red
    else return vec3(0.7, 0.0, 0.0);
  }
  
  void main() {
    // Convert normalized position to spherical coordinates
    // This ensures the texture mapping stays fixed to the globe
    vec3 normalizedPos = normalize(vPosition);
    
    // Calculate latitude and longitude from the normalized position
    float longitude = atan(normalizedPos.z, normalizedPos.x);
    float latitude = asin(normalizedPos.y);
    
    // Convert to texture coordinates (0-1 range)
    vec2 latLong;
    latLong.x = (longitude / (2.0 * 3.14159265) + 0.5); // 0-1 range
    latLong.y = (latitude / 3.14159265 + 0.5); // 0-1 range
    
    // Sample the heatmap texture using the lat/long coordinates
    vec4 heatmapColor = texture2D(heatmapTexture, latLong);
    
    // Calculate subtle noise variation that stays fixed to the position
    // Use position directly instead of adding time to position to keep it fixed
    // Only use time for very subtle animation
    vec3 noisePos = normalizedPos * 3.0;
    float noiseTime = time * 0.05; // Very slow time factor
    
    // Create fixed noise pattern with very subtle time-based variation
    float noise1 = snoise(noisePos + vec3(noiseTime * 0.1, 0.0, 0.0)) * 0.5 + 0.5;
    float noise2 = snoise(noisePos * 2.0 - vec3(0.0, noiseTime * 0.05, 0.0)) * 0.5 + 0.5;
    float noise = mix(noise1, noise2, 0.5);
    
    // Calculate fog density based on heatmap and noise
    float fogDensity = heatmapColor.r * intensity * noise;
    
    // Get color based on heatmap value
    vec3 fogColor = getAQIColor(heatmapColor.r);
    
    // Rim lighting effect
    float rim = 1.0 - max(0.0, dot(vNormal, normalize(vec3(0.0, 0.0, 1.0))));
    rim = smoothstep(0.0, 1.0, rim);
    
    // Mix fog color with rim lighting
    vec3 finalColor = mix(fogColor, vec3(1.0), rim * 0.3);
    
    // Apply fog density and alpha
    float alpha = fogDensity * smoothstep(0.0, 0.2, heatmapColor.r);
    alpha = min(alpha, 0.9); // Cap maximum opacity
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export default function AQIFogLayer() {
  const { aqiData } = useAQI()
  const fogLayerRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)
  
  // We don't want the fog layer to rotate independently
  // It should be part of the Earth's rotation
  
  // Create a heatmap texture from AQI data
  const heatmapTexture = useMemo(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return new THREE.Texture()
    }
    
    const size = 1024
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size / 2 // Match equirectangular projection ratio
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return new THREE.Texture()
    
    // Clear canvas
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, size, size / 2)
    
    // Debug - draw grid lines for latitude/longitude reference
    if (false && ctx) { // Set to true for debugging
      ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)'
      ctx.lineWidth = 1
      
      // Draw longitude lines (vertical)
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = ((lon + 180) / 360) * size
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, size / 2)
        ctx.stroke()
      }
      
      // Draw latitude lines (horizontal)
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * (size / 2)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(size, y)
        ctx.stroke()
      }
    }
    
    console.log(`Drawing heatmap with ${aqiData.length} data points`)
    
    // Draw heatmap points - only if ctx is available
    if (ctx) {
      aqiData.forEach(point => {
        try {
          // Convert lat/lon to x,y coordinates on the canvas
          const x = ((point.lon + 180) / 360) * size
          const y = ((90 - point.lat) / 180) * (size / 2)
          
          // Ensure coordinates are valid numbers
          if (isNaN(x) || isNaN(y)) {
            console.warn('Invalid coordinates:', point.lat, point.lon)
            return
          }
          
          // Normalize AQI value (PM2.5) to a 0-1 scale for better visualization
          // PM2.5 scale: 0-12 (Good), 12.1-35.4 (Moderate), 35.5-55.4 (Unhealthy for Sensitive), 
          // 55.5-150.4 (Unhealthy), 150.5-250.4 (Very Unhealthy), 250.5+ (Hazardous)
          const normalizedValue = Math.min(1.0, point.value / 300)
          
          // Determine radius based on normalized value
          const maxRadius = 100
          const minRadius = 40
          const radius = Math.max(1, minRadius + normalizedValue * (maxRadius - minRadius))
          
          // Create radial gradient for each point - ensure radius is positive
          const gradient = ctx.createRadialGradient(x, y, 0.1, x, y, radius)
          
          // Determine color based on AQI value
          let color
          if (point.value <= 12) color = 'rgba(0, 255, 64, 0.8)'       // Good - Green
          else if (point.value <= 35.4) color = 'rgba(255, 255, 0, 0.8)'  // Moderate - Yellow
          else if (point.value <= 55.4) color = 'rgba(255, 170, 0, 0.8)'  // Unhealthy for Sensitive Groups - Orange
          else if (point.value <= 150.4) color = 'rgba(255, 51, 0, 0.8)'   // Unhealthy - Red
          else if (point.value <= 250.4) color = 'rgba(204, 0, 204, 0.8)'  // Very Unhealthy - Purple
          else color = 'rgba(180, 0, 0, 0.8)'                          // Hazardous - Deep Red
          
          gradient.addColorStop(0, color)
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
        } catch (error) {
          console.warn('Error drawing heatmap point:', error)
        }
      })
    }
    
    // For debugging - save canvas as image
    if (false && ctx) { // Set to true for debugging
      const dataURL = canvas.toDataURL()
      console.log('Heatmap texture:', dataURL)
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [aqiData])
  
  // Create shader material with uniforms
  const fogMaterial = useMemo(() => {
    // Create a default texture if heatmapTexture creation failed
    const texture = heatmapTexture || new THREE.Texture()
    
    return new THREE.ShaderMaterial({
      vertexShader: fogVertexShader,
      fragmentShader: fogFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false, // Prevent z-fighting
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.5 }, // Increased intensity for better visibility
        heatmapTexture: { value: texture }
      }
    })
  }, [heatmapTexture])
  
  // Update shader uniforms on each frame - just for subtle animation effects
  useFrame((_, delta) => {
    timeRef.current += delta
    if (fogMaterial) {
      fogMaterial.uniforms.time.value = timeRef.current
    }
    
    // No independent rotation - fog should stay fixed relative to Earth
  })
  
  // Only render if we have data
  if (aqiData.length === 0) {
    return null
  }
  
  return (
    <mesh ref={fogLayerRef}>
      <sphereGeometry args={[1.025, 64, 64]} />
      <primitive object={fogMaterial} attach="material" />
    </mesh>
  )
}
