'use client'

import { useState, useEffect } from 'react'

interface BiasData {
  id: string
  symbol: string
  direction: string
  analysis: string
  justification: string
  updatedAt: string
}

interface BiasPopupProps {
  symbol: string
  onClose: () => void
}

export default function BiasPopup({ symbol, onClose }: BiasPopupProps) {
  const [bias, setBias] = useState<BiasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchBias = async () => {
    try {
      const response = await fetch(`/api/bias?symbol=${symbol}`)
      const data = await response.json()
      setBias(data)
    } catch (error) {
      console.error('Error fetching bias:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateBias = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/bias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      })
      const data = await response.json()
      setBias(data)
    } catch (error) {
      console.error('Error generating bias:', error)
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    fetchBias()
  }, [symbol])

  const getDirectionColor = (direction: string) => {
    switch (direction?.toUpperCase()) {
      case 'BULLISH':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
      case 'BEARISH':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900'
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{symbol} Bias Analysis</h2>
            {bias && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDirectionColor(bias.direction)}`}>
                {bias.direction}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : bias ? (
            <>
              {/* Justification */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Key Justification:</p>
                <p className="text-gray-800 dark:text-gray-200">{bias.justification}</p>
              </div>

              {/* Full Analysis */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Detailed Analysis</h3>
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                    {bias.analysis}
                  </pre>
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Last updated: {new Date(bias.updatedAt).toLocaleString()}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No bias analysis available for this symbol.</p>
              <button
                onClick={generateBias}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Generate Analysis
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {bias && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={generateBias}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Analysis
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
