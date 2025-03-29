'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export default function StarField() {
  const starCount = 2000
  
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      const radius = Math.random() * 25 + 10
      const theta = 2 * Math.PI * Math.random()
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)

      const brightness = Math.random() * 0.3 + 0.7
      colors[i3] = brightness
      colors[i3 + 1] = brightness
      colors[i3 + 2] = brightness
    }

    return [positions, colors]
  }, [])

  useFrame((state, delta) => {
    state.camera.rotation.x += delta * 0.005
    state.camera.rotation.y += delta * 0.0075
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}