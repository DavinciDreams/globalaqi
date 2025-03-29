'use client'

import { useAQI } from '@/utils/AQIContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function InfoPanel() {
  const { selectedPoint, isRefreshing } = useAQI()

  const getAQIDescription = (value: number) => {
    if (value <= 50) return { text: 'Good', color: 'text-green-400' }
    if (value <= 100) return { text: 'Moderate', color: 'text-yellow-400' }
    if (value <= 150) return { text: 'Unhealthy for Sensitive Groups', color: 'text-orange-400' }
    if (value <= 200) return { text: 'Unhealthy', color: 'text-red-400' }
    if (value <= 300) return { text: 'Very Unhealthy', color: 'text-purple-400' }
    return { text: 'Hazardous', color: 'text-red-900' }
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="info-panel p-6 max-w-sm backdrop-blur-lg bg-black/30 border border-white/10 rounded-lg shadow-2xl"
        >
          {!selectedPoint ? (
            <p className="text-white/70">Hover over a point to see air quality details</p>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{selectedPoint.location}</h2>
                {isRefreshing && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                )}
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/70">AQI Value</p>
                    <motion.p 
                      className="text-2xl font-bold"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      {selectedPoint.value}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Status</p>
                    <p className={`font-bold ${getAQIDescription(selectedPoint.value).color}`}>
                      {getAQIDescription(selectedPoint.value).text}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/70">Coordinates</p>
                  <p className="font-mono text-sm">
                    {selectedPoint.lat.toFixed(4)}°, {selectedPoint.lon.toFixed(4)}°
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/70">Last Updated</p>
                  <p className="text-sm flex items-center gap-2">
                    {new Date(selectedPoint.timestamp).toLocaleTimeString()} - {new Date(selectedPoint.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Data refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full text-sm text-white/70 flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
            />
            Updating AQI data...
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}