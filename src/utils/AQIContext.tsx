'use client'

import React, { createContext, useContext, useState } from 'react'
import type { AQIData } from '@/types'

interface AQIContextType {
  selectedPoint: AQIData | null
  setSelectedPoint: (point: AQIData | null) => void
  focusedPoint: AQIData | null
  setFocusedPoint: (point: AQIData | null) => void
  aqiData: AQIData[]
  setAqiData: (data: AQIData[]) => void
  isRefreshing: boolean
  setIsRefreshing: (isRefreshing: boolean) => void
}

const AQIContext = createContext<AQIContextType | undefined>(undefined)

export function AQIProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoint, setSelectedPoint] = useState<AQIData | null>(null)
  const [focusedPoint, setFocusedPoint] = useState<AQIData | null>(null)
  const [aqiData, setAqiData] = useState<AQIData[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  return (
    <AQIContext.Provider value={{ 
      selectedPoint, 
      setSelectedPoint,
      focusedPoint,
      setFocusedPoint,
      aqiData, 
      setAqiData,
      isRefreshing,
      setIsRefreshing
    }}>
      {children}
    </AQIContext.Provider>
  )
}

export function useAQI() {
  const context = useContext(AQIContext)
  if (context === undefined) {
    throw new Error('useAQI must be used within an AQIProvider')
  }
  return context
}