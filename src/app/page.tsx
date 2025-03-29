'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import LoadingScreen from '@/components/LoadingScreen'
import { AQIProvider } from '@/utils/AQIContext'
import Legend from '@/components/Legend'

// Dynamically import Three.js components to avoid SSR issues
const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })
const AQILayer = dynamic(() => import('@/components/AQILayer'), { ssr: false })
const InfoPanel = dynamic(() => import('@/components/InfoPanel'), { ssr: false })
const StarField = dynamic(() => import('@/components/StarField'), { ssr: false })

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <AQIProvider>
      <main className="w-screen h-screen relative bg-black">
        {isLoading && <LoadingScreen />}
        <div className="absolute inset-0">
          <Canvas>
            <color attach="background" args={['#000']} />
            <fog attach="fog" args={['#000', 1, 5]} />
            
            <Suspense fallback={null}>
              <StarField />
              <Globe onLoad={() => setIsLoading(false)} />
              <AQILayer />
            </Suspense>

            {/* Lighting setup */}
            <ambientLight intensity={0.1} />
            <directionalLight 
              position={[5, 3, 5]} 
              intensity={0.5}
              castShadow
            />
            <hemisphereLight
              args={['#fff', '#000', 0.5]}
              position={[0, 50, 0]}
            />
          </Canvas>
        </div>
        <Legend />
        <InfoPanel />
      </main>
    </AQIProvider>
  )
}