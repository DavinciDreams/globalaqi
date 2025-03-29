'use client'

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useAQI } from '@/utils/AQIContext'

// Enhanced shader for AQI points with better visibility
const vertexShader = `
  attribute float size;
  varying vec3 vColor;
  uniform float time;
  
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Larger base size and more pronounced pulsing effect
    gl_PointSize = size * (15.0 / -mvPosition.z) * (1.0 + 0.3 * sin(time * 2.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  uniform float time;
  
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    
    // Add glowing effect
    vec3 color = vColor;
    // Brighter center
    color = mix(vec3(1.0), color, d * 1.5);
    // Higher base opacity and smoother falloff
    float alpha = smoothstep(0.5, 0.1, d) * 0.9;
    
    gl_FragColor = vec4(color, alpha);
  }
`

interface AQIPointsProps {
  earthGroupRef?: React.RefObject<THREE.Group>
}

export default function AQIPoints({ earthGroupRef }: AQIPointsProps = {}) {
  const pointsRef = useRef<THREE.Points>(null)
  const { aqiData, setSelectedPoint } = useAQI()
  const { camera, raycaster, pointer } = useThree()
  const timeRef = useRef(0)
  const groupRef = useRef<THREE.Group>(null)

  // Convert lat/lon to 3D position
  const latLonToPosition = (lat: number, lon: number, radius: number = 1) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    const x = -(radius * Math.sin(phi) * Math.cos(theta))
    const z = radius * Math.sin(phi) * Math.sin(theta)
    const y = radius * Math.cos(phi)
    return new THREE.Vector3(x, y, z)
  }

  // Get color based on AQI value with enhanced brightness
  const getPointColor = (value: number) => {
    if (value <= 50) return new THREE.Color(0x00ff40)      // Good - Brighter green
    if (value <= 100) return new THREE.Color(0xffff00)     // Moderate - Yellow
    if (value <= 150) return new THREE.Color(0xffaa00)     // Unhealthy for Sensitive Groups - Brighter orange
    if (value <= 200) return new THREE.Color(0xff3300)     // Unhealthy - Brighter red
    if (value <= 300) return new THREE.Color(0xcc00cc)     // Very Unhealthy - Brighter purple
    return new THREE.Color(0xff0000)                       // Hazardous - Pure red for visibility
  }

  // Create points geometry
  const pointsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const colors: number[] = []
    const sizes: number[] = []

    aqiData.forEach(({ lat, lon, value }) => {
      const position = latLonToPosition(lat, lon, 1.02)
      positions.push(position.x, position.y, position.z)

      const color = getPointColor(value)
      colors.push(color.r, color.g, color.b)

      // Larger base size for better visibility
      const size = Math.min(30, 15 + (value / 40))
      sizes.push(size)
    })

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

    return geometry
  }, [aqiData])

  // Create enhanced shader material
  const pointsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending, // Add additive blending for glow effect
      depthWrite: false, // Prevent z-fighting
      uniforms: {
        time: { value: 0 }
      }
    })
  }, [])

  // Handle point interaction
  useFrame((_, delta) => {
    timeRef.current += delta
    if (pointsMaterial) {
      pointsMaterial.uniforms.time.value = timeRef.current
    }

    // Ray casting for point interaction
    if (pointsRef.current && aqiData.length > 0) {
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObject(pointsRef.current)
      
      if (intersects.length > 0) {
        const index = intersects[0].index!
        const point = aqiData[index]
        setSelectedPoint(point)
        document.body.style.cursor = 'pointer'
      } else {
        document.body.style.cursor = 'default'
      }
    }
  })

  // Clean up cursor style
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={pointsGeometry} material={pointsMaterial} />
    </group>
  )
}
