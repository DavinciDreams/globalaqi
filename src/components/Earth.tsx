'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null)
  
  // Load earth textures
  const [colorMap, normalMap, specularMap] = useLoader(THREE.TextureLoader, [
    '/earth-texture.jpg',   // Base color texture
    '/earth-bump.jpg',      // Normal/bump map
    '/earth-specular.jpg'   // Specular map
  ])

  // Configure textures
  colorMap.colorSpace = THREE.SRGBColorSpace
  
  // Gentle auto-rotation
  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group>
      {/* Earth sphere */}
      <Sphere ref={earthRef} args={[1, 64, 64]}>
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.1, 0.1)}
          specularMap={specularMap}
          shininess={10}
          specular={new THREE.Color(0x333333)}
        />
      </Sphere>

      {/* Atmosphere effect */}
      <Sphere args={[1.01, 32, 32]}>
        <meshPhongMaterial
          transparent
          opacity={0.2}
          color="#4040ff"
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  )
}
