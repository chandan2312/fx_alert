'use client'

import { useEffect, useState, useRef } from 'react'
import TradingViewWidget from './TradingViewWidget'

interface ChartWithAlertsProps {
  symbolValue: string
  tvSymbol: string
  darkMode?: boolean
  alerts: Array<{ price: number; type: string }>
  currentPrice?: number
}

export default function ChartWithAlerts({ symbolValue, tvSymbol, darkMode = false, alerts, currentPrice }: ChartWithAlertsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only render chart when it's in viewport or near it (100px margin)
          if (entry.isIntersecting) {
            setIsVisible(true)
          } else if (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight + 200) {
            // Unload chart if it's far below viewport to save memory
            setIsVisible(false)
          }
        })
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full">
      {isVisible ? (
        <TradingViewWidget 
          key={`${tvSymbol}-${darkMode}`} 
          symbol={tvSymbol} 
          alerts={alerts} 
          darkMode={darkMode}
          currentPrice={currentPrice}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-gray-500 dark:text-gray-400 text-sm">Loading chart...</div>
        </div>
      )}
    </div>
  )
}
