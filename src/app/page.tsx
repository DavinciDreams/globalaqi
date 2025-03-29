'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import LoadingScreen from '@/components/LoadingScreen'
import { AQIProvider } from '@/utils/AQIContext'
import Legend from '@/components/Legend'
import DataLoader from '@/components/DataLoader'

// Dynamically import Three.js components to avoid SSR issues
const Earth = dynamic(() => import('@/components/Earth'), { ssr: false })
const InfoPanel = dynamic(() => import('@/components/InfoPanel'), { ssr: false })

export default function Home() {
  return (
    <AQIProvider>
      <DataLoader />
      <main className="w-screen h-screen relative bg-black overflow-hidden">
        <div className="absolute inset-0">
          <Canvas
            camera={{
              position: [0, 0, 2.5],
              fov: 45,
              near: 0.1,
              far: 1000
            }}
          >
            <color attach="background" args={['#000814']} />
            
            <Suspense fallback={null}>
              {/* Scene Setup */}
              <OrbitControls 
                enablePan={false}
                minDistance={1.5}
                maxDistance={4}
                rotateSpeed={0.5}
                zoomSpeed={0.5}
                enableDamping
                dampingFactor={0.05}
              />

              {/* Lighting */}
              <ambientLight intensity={0.1} />
              <directionalLight 
                position={[1, 1, 1]}
                intensity={1.5}
              />
              <hemisphereLight 
                intensity={1}
                groundColor="#000814"
              />

              {/* Earth with integrated AQI points */}
              <Earth />
            </Suspense>
          </Canvas>
        </div>

        {/* UI Overlays */}
        <div className="absolute inset-x-0 top-0 z-10">
          <Legend />
        </div>
        <div className="absolute right-0 top-0 bottom-0 z-10">
          <InfoPanel />
        </div>
      </main>
    </AQIProvider>
  )
}