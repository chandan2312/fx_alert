'use client'

import { useEffect } from 'react'
import TradingViewWidget from './TradingViewWidget'

interface FullscreenChartProps {
  symbol: string
  symbolLabel: string
  tvSymbol: string
  alerts?: Array<{ price: number; type: string }>
  darkMode?: boolean
  onClose: () => void
}

export default function FullscreenChart({ 
  symbol, 
  symbolLabel, 
  tvSymbol, 
  alerts = [], 
  darkMode = false,
  onClose 
}: FullscreenChartProps) {
  useEffect(() => {
    // Prevent background scroll
    document.body.style.overflow = 'hidden'
    
    // ESC key to close
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Bottom Drawer */}
      <div className="relative w-full h-[90vh] bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{symbolLabel}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Chart */}
        <div className="h-[calc(100%-80px)] p-4">
          <div className="h-full">
            <TradingViewWidget symbol={tvSymbol} alerts={alerts} darkMode={darkMode} />
          </div>
        </div>

        {/* Cancel Button */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
