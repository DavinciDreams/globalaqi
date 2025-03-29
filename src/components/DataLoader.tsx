'use client'

import { useEffect } from 'react'
import { useAQI } from '@/utils/AQIContext'

export default function DataLoader() {
  const { setAqiData, setIsRefreshing } = useAQI()

  useEffect(() => {
    // Function to fetch AQI data
    const fetchAQIData = async () => {
      setIsRefreshing(true)
      try {
        console.log('Fetching AQI data...')
        const response = await fetch('/api/aqi-data')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('AQI data received:', result)
        
        if (result.status === 'success' && Array.isArray(result.data)) {
          setAqiData(result.data)
        } else {
          console.error('Invalid data format:', result)
        }
      } catch (error) {
        console.error('Error fetching AQI data:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    // Initial fetch
    fetchAQIData()
    
    // Set up interval for periodic updates
    const intervalId = setInterval(fetchAQIData, 60000) // Update every minute
    
    // Clean up on unmount
    return () => clearInterval(intervalId)
  }, [setAqiData, setIsRefreshing])

  // This component doesn't render anything visible
  return null
}
