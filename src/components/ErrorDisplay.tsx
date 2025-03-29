'use client'

import { motion } from 'framer-motion'

interface ErrorDisplayProps {
  message: string
}

export default function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 z-50 p-6 text-center"
    >
      <motion.div 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1.2 }}
        transition={{ 
          repeat: Infinity,
          repeatType: "reverse",
          duration: 2
        }}
        className="text-9xl mb-8"
      >
        😢
      </motion.div>
      
      <h2 className="text-3xl font-bold text-white mb-4">Data Fetch Error</h2>
      <p className="text-xl text-white/80 max-w-md mb-8">{message}</p>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
      >
        Try Again
      </motion.button>
    </motion.div>
  )
}
