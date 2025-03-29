'use client'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white text-lg">Loading Globe Data...</p>
      </div>
    </div>
  )
}