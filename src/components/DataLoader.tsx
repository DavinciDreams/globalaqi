'use client'

import { useEffect, useState } from 'react'
import { useAQI } from '@/utils/AQIContext'
import ErrorDisplay from './ErrorDisplay'

export default function DataLoader() {
  const { setAqiData, setIsRefreshing } = useAQI()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Function to fetch AQI data
    const fetchAQIData = async () => {
      setIsRefreshing(true)
      setError(null) // Clear any previous errors
      
      try {
        console.log('Fetching AQI data...')
        const response = await fetch('/api/aqi-data')
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Failed to fetch data: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('AQI data received:', result)
        
        if (result.status === 'success' && Array.isArray(result.data)) {
          if (result.data.length === 0) {
            throw new Error('No air quality data available')
          }
          setAqiData(result.data)
        } else {
          throw new Error(result.message || 'Invalid data format received')
        }
      } catch (error) {
        console.error('Error fetching AQI data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load air quality data')
      } finally {
        setIsRefreshing(false)
      }
    }

    // Initial fetch
    fetchAQIData()
    
    // Set up interval for periodic updates - only if no error
    const intervalId = !error ? setInterval(fetchAQIData, 60000) : null // Update every minute
    
    // Clean up on unmount
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [setAqiData, setIsRefreshing, error])

  // Render error display if there's an error, otherwise nothing
  return error ? <ErrorDisplay message={error} /> : null
}
