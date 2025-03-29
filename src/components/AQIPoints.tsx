'use client'

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useAQI } from '@/utils/AQIContext'

// Shader for AQI points
const vertexShader = `
  attribute float size;
  varying vec3 vColor;
  uniform float time;
  
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (10.0 / -mvPosition.z) * (1.0 + 0.2 * sin(time * 2.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    
    vec3 color = vColor;
    float alpha = smoothstep(0.5, 0.2, d);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function AQIPoints() {
  const pointsRef = useRef<THREE.Points>(null)
  const { aqiData, setSelectedPoint } = useAQI()
  const { camera, raycaster, pointer } = useThree()
  const timeRef = useRef(0)

  // Convert lat/lon to 3D position
  const latLonToPosition = (lat: number, lon: number, radius: number = 1) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    const x = -(radius * Math.sin(phi) * Math.cos(theta))
    const z = radius * Math.sin(phi) * Math.sin(theta)
    const y = radius * Math.cos(phi)
    return new THREE.Vector3(x, y, z)
  }

  // Get color based on AQI value
  const getPointColor = (value: number) => {
    if (value <= 50) return new THREE.Color(0x00ff00)      // Good
    if (value <= 100) return new THREE.Color(0xffff00)     // Moderate
    if (value <= 150) return new THREE.Color(0xff9900)     // Unhealthy for Sensitive Groups
    if (value <= 200) return new THREE.Color(0xff0000)     // Unhealthy
    if (value <= 300) return new THREE.Color(0x990066)     // Very Unhealthy
    return new THREE.Color(0x660000)                       // Hazardous
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

      const size = Math.min(20, 8 + (value / 50))
      sizes.push(size)
    })

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

    return geometry
  }, [aqiData])

  // Create shader material
  const pointsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      vertexColors: true,
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
    <points ref={pointsRef} geometry={pointsGeometry} material={pointsMaterial} />
  )
}
