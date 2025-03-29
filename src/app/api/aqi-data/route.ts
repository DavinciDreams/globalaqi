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
    
    // Throw an error if we don't have enough data points
    if (aqiData.length < 10) {
      throw new Error('Insufficient data points from OpenAQ API')
    }
    
    const response: AQIResponse = {
      status: 'success',
      data: aqiData
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in AQI data API:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch AQI data',
      errorCode: 'DATA_FETCH_ERROR'
    }, { status: 500 })
  }
}