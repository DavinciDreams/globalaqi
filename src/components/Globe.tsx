'use client'

import { useRef, useEffect, Suspense } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls, PerspectiveCamera, Sphere } from '@react-three/drei'
import { useAQI } from '@/utils/AQIContext'
import { convertLatLngToVector3 } from '@/utils/helpers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useKeyboardControls } from '@/utils/useKeyboardControls'

interface GlobeProps {
  onLoad?: () => void
}

function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Load textures using useLoader
  const colorMap = useLoader(THREE.TextureLoader, '/earth-texture.jpg')
  const bumpMap = useLoader(THREE.TextureLoader, '/earth-bump.jpg')
  const specularMap = useLoader(THREE.TextureLoader, '/earth-specular.jpg')

  useEffect(() => {
    if (colorMap && bumpMap && specularMap) {
      colorMap.colorSpace = THREE.SRGBColorSpace
      bumpMap.colorSpace = THREE.NoColorSpace
      specularMap.colorSpace = THREE.NoColorSpace
    }
  }, [colorMap, bumpMap, specularMap])

  return (
    <>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.05}
          specularMap={specularMap}
          specular={new THREE.Color('grey')}
          shininess={5}
        />
      </mesh>

      <Sphere args={[1.01, 32, 32]}>
        <meshPhongMaterial
          color={new THREE.Color(0x4444ff)}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
      
      <Sphere args={[1.02, 32, 32]}>
        <meshPhongMaterial
          color={new THREE.Color(0x0000ff)}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </Sphere>
    </>
  )
}

export default function Globe({ onLoad }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<any>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const { selectedPoint, focusedPoint, setFocusedPoint } = useAQI()
  const animationFrameRef = useRef<number | undefined>(undefined)
  const initialCameraPosition = new THREE.Vector3(0, 0, 2.5)
  const initialTargetPosition = new THREE.Vector3(0, 0, 0)

  // Add keyboard controls
  useKeyboardControls()

  // Auto-rotation and camera position updates
  useFrame((state, delta) => {
    if (groupRef.current && !state.camera.userData.isDragging && !focusedPoint) {
      groupRef.current.rotation.y += delta * 0.1
    }
  })

  // Handle click away from points to reset camera
  const handleBackgroundClick = () => {
    if (focusedPoint) {
      setFocusedPoint(null)
      
      if (cameraRef.current && controlsRef.current) {
        const animate = () => {
          if (!cameraRef.current) return

          cameraRef.current.position.lerp(initialCameraPosition, 0.05)
          controlsRef.current.target.lerp(initialTargetPosition, 0.05)

          const distanceToInitial = cameraRef.current.position.distanceTo(initialCameraPosition)
          if (distanceToInitial > 0.01) {
            animationFrameRef.current = requestAnimationFrame(animate)
          }
        }

        animate()
      }
    }
  }

  // Handle camera movement when a point is selected
  useEffect(() => {
    if (focusedPoint && controlsRef.current && cameraRef.current) {
      const point = convertLatLngToVector3(focusedPoint.lat, focusedPoint.lon, 1.8)
      const lookAtPoint = convertLatLngToVector3(focusedPoint.lat, focusedPoint.lon, 1)

      const targetPosition = new THREE.Vector3()
      targetPosition.copy(point)
      
      const animate = () => {
        if (!cameraRef.current) return

        cameraRef.current.position.lerp(targetPosition, 0.05)
        controlsRef.current.target.lerp(lookAtPoint, 0.05)
        
        const distance = cameraRef.current.position.distanceTo(targetPosition)
        if (distance > 0.01) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animate()
    }
  }, [focusedPoint])

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    onLoad?.()
  }, [onLoad])

  return (
    <group ref={groupRef} onClick={handleBackgroundClick}>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 2.5]} fov={45} />
      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={false}
        minDistance={1.5}
        maxDistance={4}
        rotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.1}
        onStart={() => {
          if (groupRef.current) {
            groupRef.current.userData.isDragging = true
          }
        }}
        onEnd={() => {
          if (groupRef.current) {
            groupRef.current.userData.isDragging = false
          }
        }}
      />
      <ErrorBoundary>
        <Suspense fallback={null}>
          <GlobeMesh />
        </Suspense>
      </ErrorBoundary>
    </group>
  )
}