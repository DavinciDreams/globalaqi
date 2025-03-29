import { NextResponse } from 'next/server'
import type { AQIResponse } from '@/types'

const cities = [
  // North America
  { name: 'New York', lat: 40.7128, lon: -74.0060, baseAQI: 75 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, baseAQI: 90 },
  { name: 'Mexico City', lat: 19.4326, lon: -99.1332, baseAQI: 110 },
  
  // Europe
  { name: 'London', lat: 51.5074, lon: -0.1278, baseAQI: 60 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, baseAQI: 65 },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173, baseAQI: 85 },
  
  // Asia
  { name: 'Beijing', lat: 39.9042, lon: 116.4074, baseAQI: 150 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, baseAQI: 70 },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090, baseAQI: 180 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, baseAQI: 140 },
  
  // Oceania
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, baseAQI: 45 },
  { name: 'Melbourne', lat: -37.8136, lon: 144.9631, baseAQI: 40 },
  
  // Africa
  { name: 'Cairo', lat: 30.0444, lon: 31.2357, baseAQI: 120 },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792, baseAQI: 95 },
  
  // South America
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, baseAQI: 80 },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, baseAQI: 70 },
]

export async function GET() {
  try {
    const mockData = [
      // Main cities with realistic but slightly randomized AQI values
      ...cities.map(city => ({
        lat: city.lat,
        lon: city.lon,
        value: Math.max(0, Math.min(500, city.baseAQI + (Math.random() - 0.5) * 40)),
        location: city.name,
        timestamp: new Date().toISOString()
      })),
      
      // Additional data points around major cities
      ...cities.flatMap(city => 
        Array.from({ length: 3 }, () => {
          const radius = 5 + Math.random() * 10 // 5-15 degrees radius
          const angle = Math.random() * Math.PI * 2
          const latOffset = radius * Math.cos(angle)
          const lonOffset = radius * Math.sin(angle)
          
          return {
            lat: Math.max(-85, Math.min(85, city.lat + latOffset)),
            lon: city.lon + lonOffset,
            value: Math.max(0, Math.min(500, city.baseAQI + (Math.random() - 0.5) * 60)),
            location: `${city.name} Region`,
            timestamp: new Date().toISOString()
          }
        })
      )
    ]

    const response: AQIResponse = {
      status: 'success',
      data: mockData
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch AQI data'
    }, { status: 500 })
  }
}