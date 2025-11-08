'use client'

import { ChangeEvent } from 'react'

interface Alert {
  id: number
  price: string
  type: string
}

interface AlertFormProps {
  alerts: Alert[]
  onAddAlert: () => void
  onRemoveAlert: (id: number) => void
  onUpdateAlert: (id: number, field: string, value: string) => void
  onSaveAlerts: () => void
}

export default function AlertForm({
  alerts,
  onAddAlert,
  onRemoveAlert,
  onUpdateAlert,
  onSaveAlerts
}: AlertFormProps) {
  const handlePriceChange = (id: number, e: ChangeEvent<HTMLInputElement>) => {
    onUpdateAlert(id, 'price', e.target.value)
  }

  const handleTypeChange = (id: number, e: ChangeEvent<HTMLSelectElement>) => {
    onUpdateAlert(id, 'type', e.target.value)
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Price Alerts</h2>
      </div>
      
      <div className="space-y-4 mb-6">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="number"
              step="0.0001"
              placeholder="Price"
              value={alert.price}
              onChange={(e) => handlePriceChange(alert.id, e)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={alert.type}
              onChange={(e) => handleTypeChange(alert.id, e)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="crossing_up">Crossing Up</option>
              <option value="crossing_down">Crossing Down</option>
            </select>
            <button
              onClick={() => onRemoveAlert(alert.id)}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onAddAlert}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Add More Alerts
        </button>
        <button
          onClick={onSaveAlerts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Alerts
        </button>
      </div>
    </div>
  )
}