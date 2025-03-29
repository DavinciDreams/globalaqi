import { NextResponse } from 'next/server'
import type { AQIResponse } from '@/types'

// This is a mock implementation. Replace with actual API calls to your AQI data provider
export async function GET() {
  try {
    // Mock data - replace with actual API call
    const mockData = Array.from({ length: 100 }, (_, i) => ({
      lat: (Math.random() * 180) - 90,
      lon: (Math.random() * 360) - 180,
      value: Math.floor(Math.random() * 500),
      location: `Location ${i}`,
      timestamp: new Date().toISOString()
    }))

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