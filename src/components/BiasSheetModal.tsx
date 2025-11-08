'use client'

import { useState, useEffect } from 'react'

interface BiasSheetData {
  symbol: string
  bias: string
  usdBias: string
  pdCandle: string
  direction: string
  htfTrend: string
  ltfTrend: string
}

interface BiasSheetModalProps {
  symbols: Array<{ value: string; label: string }>
  onClose: () => void
}

const indicators = ['green', 'red', 'yellow'] as const
type Indicator = typeof indicators[number]

const getIndicatorEmoji = (value: string) => {
  switch (value) {
    case 'green': return '🟢'
    case 'red': return '🔴'
    case 'yellow': return '🟡'
    default: return '⚪'
  }
}

export default function BiasSheetModal({ symbols, onClose }: BiasSheetModalProps) {
  const [biasData, setBiasData] = useState<Record<string, BiasSheetData>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBiasSheets()
  }, [])

  const fetchBiasSheets = async () => {
    try {
      const response = await fetch('/api/bias-sheet')
      const data = await response.json()
      
      const dataMap: Record<string, BiasSheetData> = {}
      data.forEach((sheet: any) => {
        dataMap[sheet.symbol] = sheet
      })
      
      // Initialize missing symbols with defaults
      symbols.forEach(symbol => {
        if (!dataMap[symbol.value]) {
          dataMap[symbol.value] = {
            symbol: symbol.value,
            bias: 'neutral',
            usdBias: 'neutral',
            pdCandle: 'neutral',
            direction: 'neutral',
            htfTrend: 'neutral',
            ltfTrend: 'neutral'
          }
        }
      })
      
      setBiasData(dataMap)
    } catch (error) {
      console.error('Error fetching bias sheets:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateIndicator = (symbol: string, field: keyof Omit<BiasSheetData, 'symbol'>, value: Indicator) => {
    setBiasData(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const promises = Object.values(biasData).map(data =>
        fetch('/api/bias-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      )
      
      await Promise.all(promises)
      alert('Bias sheet saved successfully!')
    } catch (error) {
      console.error('Error saving bias sheets:', error)
      alert('Failed to save bias sheets')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Bias Sheet</h2>
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
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-xs md:text-sm">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs">Symbol</th>
                <th className="px-1.5 py-1.5 text-center font-semibold text-gray-700 dark:text-gray-300 text-xs">Bias</th>
                <th className="px-1.5 py-1.5 text-center font-semibold text-gray-700 dark:text-gray-300 text-xs">USD</th>
                <th className="px-1.5 py-1.5 text-center font-semibold text-gray-700 dark:text-gray-300 text-xs">PD</th>
                <th className="px-1.5 py-1.5 text-center font-semibold text-gray-700 dark:text-gray-300 text-xs">Dir</th>
                <th className="px-1.5 py-1.5 text-center font-semibold text-gray-700 dark:text-gray-300 text-xs">HTF</th>
                <th className="px-1.5 py-1.5 text-center font-semibold text-gray-700 dark:text-gray-300 text-xs">LTF</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((symbol) => {
                const data = biasData[symbol.value] || {
                  symbol: symbol.value,
                  bias: 'neutral',
                  usdBias: 'neutral',
                  pdCandle: 'neutral',
                  direction: 'neutral',
                  htfTrend: 'neutral',
                  ltfTrend: 'neutral'
                }
                
                return (
                  <tr key={symbol.value} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-2 py-1.5 font-medium text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap">{symbol.label}</td>
                    {(['bias', 'usdBias', 'pdCandle', 'direction', 'htfTrend', 'ltfTrend'] as const).map((field) => (
                      <td key={field} className="px-1 py-1.5">
                        <select
                          value={data[field]}
                          onChange={(e) => updateIndicator(symbol.value, field, e.target.value as Indicator)}
                          className="w-full px-1 py-0.5 text-center text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="neutral">⚪</option>
                          <option value="green">🟢</option>
                          <option value="red">🔴</option>
                          <option value="yellow">🟡</option>
                        </select>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
