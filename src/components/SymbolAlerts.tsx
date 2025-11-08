'use client'

import { ChangeEvent } from 'react'

interface SymbolAlert {
  id: number
  price: string
  type: 'crossing_up' | 'crossing_down'
}

interface SymbolAlertsProps {
  symbol: string
  symbolLabel: string
  alerts: SymbolAlert[]
  onAddAlert: () => void
  onRemoveAlert: (id: number) => void
  onUpdateAlert: (id: number, field: string, value: string) => void
  onSaveAlerts: () => void
}

export default function SymbolAlerts({
  symbol,
  symbolLabel,
  alerts,
  onAddAlert,
  onRemoveAlert,
  onUpdateAlert,
  onSaveAlerts
}: SymbolAlertsProps) {
  const handlePriceChange = (id: number, e: ChangeEvent<HTMLInputElement>) => {
    onUpdateAlert(id, 'price', e.target.value)
  }

  const handleTypeChange = (id: number, e: ChangeEvent<HTMLSelectElement>) => {
    onUpdateAlert(id, 'type', e.target.value)
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Alerts for {symbolLabel}
        </h3>
      </div>
      
      {alerts.length === 0 ? (
        <p className="text-xs text-gray-500 mb-3">No alerts set for this symbol</p>
      ) : (
        <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex gap-2 p-2 bg-gray-50 rounded">
              <input
                type="number"
                step="0.0001"
                placeholder="Price"
                value={alert.price}
                onChange={(e) => handlePriceChange(alert.id, e)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={alert.type}
                onChange={(e) => handleTypeChange(alert.id, e)}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="crossing_up">↑ Up</option>
                <option value="crossing_down">↓ Down</option>
              </select>
              <button
                onClick={() => onRemoveAlert(alert.id)}
                className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={onAddAlert}
          className="flex-1 text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Add Alert
        </button>
        {alerts.length > 0 && (
          <button
            onClick={onSaveAlerts}
            className="flex-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save All
          </button>
        )}
      </div>
    </div>
  )
}
