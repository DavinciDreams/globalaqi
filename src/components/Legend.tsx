'use client'

import { motion } from 'framer-motion'

const legendItems = [
  { range: '0-50', label: 'Good', color: 'bg-green-400' },
  { range: '51-100', label: 'Moderate', color: 'bg-yellow-400' },
  { range: '101-150', label: 'Unhealthy for Sensitive Groups', color: 'bg-orange-400' },
  { range: '151-200', label: 'Unhealthy', color: 'bg-red-400' },
  { range: '201-300', label: 'Very Unhealthy', color: 'bg-purple-400' },
  { range: '300+', label: 'Hazardous', color: 'bg-red-900' },
]

export default function Legend() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="fixed left-4 top-4 bg-black/30 backdrop-blur-lg p-4 rounded-lg border border-white/10"
    >
      <h3 className="text-white text-sm font-bold mb-2">Air Quality Index</h3>
      <div className="space-y-1">
        {legendItems.map((item) => (
          <div key={item.range} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-white/70">{item.range}</span>
            <span className="text-white/90">{item.label}</span>
          </div>
        ))}
      </div>
      
      {/* Keyboard shortcuts help */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <h4 className="text-white text-xs font-bold mb-2">Keyboard Shortcuts</h4>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-white/90">ESC</kbd>
            <span className="text-white/70">Reset camera view</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}