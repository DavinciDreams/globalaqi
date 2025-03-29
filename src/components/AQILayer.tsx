'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useAQI } from '@/utils/AQIContext'
import { convertLatLngToVector3 } from '@/utils/helpers'
import { vertexShader, fragmentShader } from '@/utils/shaders'

export default function AQILayer() {
  const { aqiData, setAqiData, setSelectedPoint, setFocusedPoint, setIsRefreshing } = useAQI()
  const [isLoading, setIsLoading] = useState(true)
  const pointsRef = useRef<THREE.Points>(null)
  const raycaster = new THREE.Raycaster()
  const { camera, pointer } = useThree()
  const hoveredIndexRef = useRef(-1)
  const timeRef = useRef(0)

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
        hoverIndex: { value: -1 },
      },
    })
  }, [])

  useEffect(() => {
    const fetchAQIData = async () => {
      setIsLoading(true)
      setIsRefreshing(true)
      try {
        const response = await fetch('/api/aqi-data')
        const data = await response.json()
        setAqiData(data.data)
      } catch (error) {
        console.error('Error fetching AQI data:', error)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }

    fetchAQIData()
    const interval = setInterval(fetchAQIData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [setAqiData, setIsRefreshing])

  const getPointColor = (value: number) => {
    if (value <= 50) return new THREE.Color(0x00ff00)
    if (value <= 100) return new THREE.Color(0xffff00)
    if (value <= 150) return new THREE.Color(0xff9900)
    if (value <= 200) return new THREE.Color(0xff0000)
    if (value <= 300) return new THREE.Color(0x990066)
    return new THREE.Color(0x660000)
  }

  useEffect(() => {
    if (!pointsRef.current || !aqiData.length) return

    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const colors: number[] = []
    const sizes: number[] = []

    aqiData.forEach(({ lat, lon, value }) => {
      const point = convertLatLngToVector3(lat, lon, 1.02) // Moved slightly further from surface
      positions.push(point.x, point.y, point.z)
      
      const color = getPointColor(value)
      colors.push(color.r, color.g, color.b)
      
      // Adjusted size calculation for better proportions
      const size = 10 + (value / 500) * 10
      sizes.push(size)
    })

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

    pointsRef.current.geometry = geometry
  }, [aqiData])

  useFrame((_, delta) => {
    timeRef.current += delta

    if (pointsRef.current?.material) {
      (pointsRef.current.material as THREE.ShaderMaterial).uniforms.time.value = timeRef.current
    }

    if (!pointsRef.current || !aqiData.length) return

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObject(pointsRef.current)

    if (intersects.length > 0) {
      const index = intersects[0].index as number
      if (index !== undefined) {
        document.body.style.cursor = 'pointer'
        hoveredIndexRef.current = index
        if (pointsRef.current?.material) {
          (pointsRef.current.material as THREE.ShaderMaterial).uniforms.hoverIndex.value = index
        }
        if (pointer.x !== 0 && pointer.y !== 0) {
          setSelectedPoint(aqiData[index])
        }
      }
    } else {
      document.body.style.cursor = 'default'
      hoveredIndexRef.current = -1
      if (pointsRef.current?.material) {
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.hoverIndex.value = -1
      }
      if (pointer.x !== 0 && pointer.y !== 0) {
        setSelectedPoint(null)
      }
    }
  })

  return (
    <points 
      ref={pointsRef}
      onClick={(e) => {
        e.stopPropagation()
        if (hoveredIndexRef.current !== -1) {
          setFocusedPoint(aqiData[hoveredIndexRef.current])
        }
      }}
    >
      <primitive object={shaderMaterial} attach="material" />
    </points>
  )
}