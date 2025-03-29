// src/types/index.ts

export interface AQIData {
  lat: number
  lon: number
  value: number
  location: string
  timestamp: string
}

export interface AQIResponse {
  data: AQIData[]
  status: 'success' | 'error'
  message?: string
}