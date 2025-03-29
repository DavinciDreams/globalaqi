import { useEffect } from 'react'
import { useAQI } from './AQIContext'

export function useKeyboardControls() {
  const { setFocusedPoint } = useAQI()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          // Reset camera to default view
          setFocusedPoint(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setFocusedPoint])
}