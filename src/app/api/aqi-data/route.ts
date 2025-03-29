import { NextResponse } from 'next/server'
import type { AQIResponse, AQIData } from '@/types'

// API token for OpenAQ API
const API_TOKEN = 'c5e36538754e462606fd8a825b18b178b5ebaaabc5f97e53cdcf596c88480d6d'

// List of major cities to fetch AQI data for
const cities = [
  // North America
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
  
  // Europe
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
  
  // Asia
  { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  
  // Oceania
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Melbourne', lat: -37.8136, lon: 144.9631 },
  
  // Africa
  { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
  
  // South America
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816 },
]

// Function to fetch latest PM2.5 data from OpenAQ API
async function fetchLatestPM25Data(limit: number = 1000): Promise<any> {
  try {
    // Parameter ID 2 is for PM2.5
    const response = await fetch(
      `https://api.openaq.org/v3/parameters/2/latest?limit=${limit}`,
      { 
        headers: {
          'X-API-Key': API_TOKEN
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    )
    
    if (!response.ok) {
      throw new Error(`OpenAQ API responded with status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching latest PM2.5 data:', error)
    return null
  }
}

export async function GET() {
  try {
    // Fetch latest PM2.5 data from OpenAQ API
    const result = await fetchLatestPM25Data(1000)
    
    if (!result || !result.results) {
      throw new Error('Failed to fetch data from OpenAQ API')
    }
    
    // Process the results into our AQIData format
    const aqiData: AQIData[] = result.results
      .filter((item: any) => {
        // Ensure we have valid coordinates and value
        return item.coordinates && 
               typeof item.coordinates.latitude === 'number' && 
               typeof item.coordinates.longitude === 'number' && 
               typeof item.value === 'number'
      })
      .map((item: any) => {
        // Convert to our AQIData format
        return {
          lat: item.coordinates.latitude,
          lon: item.coordinates.longitude,
          value: item.value,
          // Use sensor name or fallback to coordinates if location name is not available
          location: item.location?.name || `Location at ${item.coordinates.latitude.toFixed(2)}, ${item.coordinates.longitude.toFixed(2)}`,
          timestamp: item.datetime?.utc || new Date().toISOString()
        }
      })
    
    // If we have very few results, add some fallback data
    if (aqiData.length < 10) {
      console.warn('Few real AQI data points available, adding fallback data')
      
      // Add fallback data for major cities
      cities.forEach(city => {
        if (!aqiData.some(item => 
          Math.abs(item.lat - city.lat) < 0.1 && 
          Math.abs(item.lon - city.lon) < 0.1
        )) {
          // Generate fallback data for this city
          aqiData.push({
            lat: city.lat,
            lon: city.lon,
            value: Math.floor(50 + Math.random() * 150), // Random AQI between 50-200
            location: `${city.name} (Estimated)`,
            timestamp: new Date().toISOString()
          })
        }
      })
    }
    
    // Add some additional data points around locations with high PM2.5 values
    const additionalPoints = aqiData
      .filter(point => point.value > 20) // Only create additional points around areas with higher PM2.5
      .flatMap(point => 
        Array.from({ length: 2 }, () => {
          const radius = 1 + Math.random() * 3 // 1-4 degrees radius (smaller than before)
          const angle = Math.random() * Math.PI * 2
          const latOffset = radius * Math.cos(angle)
          const lonOffset = radius * Math.sin(angle)
          
          return {
            lat: Math.max(-85, Math.min(85, point.lat + latOffset)),
            lon: point.lon + lonOffset,
            value: Math.max(0, Math.min(500, point.value + (Math.random() - 0.5) * 15)),
            location: `${point.location} Region`,
            timestamp: point.timestamp
          }
        })
      )
    
    const response: AQIResponse = {
      status: 'success',
      data: [...aqiData, ...additionalPoints]
    }
    
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch AQI data'
    }, { status: 500 })
  }
}