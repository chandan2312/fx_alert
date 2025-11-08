'use client'

import { useEffect, useState } from 'react'

interface DbAlert {
  id: string
  symbol: string
  tv_symbol: string
  api_symbol: string
  label: string
  price: number
  type: string
  status: string
  createdAt: string
  expirationDate?: string
  triggeredAt?: string
}

export default function AlertsSidebar() {
  const [activeAlerts, setActiveAlerts] = useState<DbAlert[]>([])
  const [triggeredAlerts, setTriggeredAlerts] = useState<DbAlert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    try {
      // Fetch active alerts
      const activeRes = await fetch('/api/alerts?status=active')
      const active = await activeRes.json()
      setActiveAlerts(active)

      // Fetch triggered alerts
      const triggeredRes = await fetch('/api/alerts?status=triggered')
      const triggered = await triggeredRes.json()
      setTriggeredAlerts(triggered.slice(0, 10)) // Show last 10 triggered
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching alerts:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // Refresh every 10 seconds
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const deleteAlert = async (id: string) => {
    try {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
      fetchAlerts()
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  if (loading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-sm">Loading alerts...</p>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* Active Alerts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Active Alerts</h3>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {activeAlerts.length}
            </span>
          </div>
          
          {activeAlerts.length === 0 ? (
            <p className="text-sm text-gray-500">No active alerts</p>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-gray-800">
                      {alert.symbol}
                    </span>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Price: {alert.price}</span>
                      <span className={alert.type === 'crossing_up' ? 'text-green-600' : 'text-red-600'}>
                        {alert.type === 'crossing_up' ? '↑' : '↓'}
                      </span>
                    </div>
                    <div className="text-gray-500 mt-1">
                      {formatDate(alert.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Triggered Alerts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Recent Triggers</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {triggeredAlerts.length}
            </span>
          </div>
          
          {triggeredAlerts.length === 0 ? (
            <p className="text-sm text-gray-500">No triggered alerts</p>
          ) : (
            <div className="space-y-2">
              {triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-gray-800">
                      {alert.symbol}
                    </span>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Price: {alert.price}</span>
                      <span className={alert.type === 'crossing_up' ? 'text-green-600' : 'text-red-600'}>
                        {alert.type === 'crossing_up' ? '↑' : '↓'}
                      </span>
                    </div>
                    {alert.triggeredAt && (
                      <div className="text-gray-500 mt-1">
                        Triggered: {formatDate(alert.triggeredAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
