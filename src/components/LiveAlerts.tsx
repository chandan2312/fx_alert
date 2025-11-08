'use client'

import { useEffect, useState } from 'react'

interface DbAlert {
  id: string
  symbol: string
  price: number
  type: string
  status: string
  alertLabel?: string
  triggeredAt?: string
}

interface LiveAlertsProps {
  symbolValue: string
  onDelete: (id: string) => void
}

export default function LiveAlerts({ symbolValue, onDelete }: LiveAlertsProps) {
  const [activeAlerts, setActiveAlerts] = useState<DbAlert[]>([])
  const [triggeredAlerts, setTriggeredAlerts] = useState<DbAlert[]>([])

  const fetchAlerts = async () => {
    try {
      // Fetch active alerts
      const activeRes = await fetch('/api/alerts?status=active')
      const allActiveAlerts = await activeRes.json()
      const symbolActiveAlerts = allActiveAlerts.filter((a: DbAlert) => a.symbol === symbolValue)
      setActiveAlerts(symbolActiveAlerts)

      // Fetch triggered alerts
      const triggeredRes = await fetch('/api/alerts?status=triggered')
      const allTriggeredAlerts = await triggeredRes.json()
      const symbolTriggeredAlerts = allTriggeredAlerts
        .filter((a: DbAlert) => a.symbol === symbolValue)
        .slice(0, 5) // Show only last 5 triggered
      setTriggeredAlerts(symbolTriggeredAlerts)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 5000)
    return () => clearInterval(interval)
  }, [symbolValue])

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
      onDelete(id)
      fetchAlerts()
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (activeAlerts.length === 0 && triggeredAlerts.length === 0) {
    return null
  }

  return (
    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Active:</span>
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded text-xs"
            >
              <span className={alert.type === 'crossing_up' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                {alert.type === 'crossing_up' ? '↑' : '↓'}
              </span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{alert.price}</span>
              {alert.alertLabel && (
                <span className="text-gray-600 dark:text-gray-400 text-[10px] italic">({alert.alertLabel})</span>
              )}
              <button
                onClick={() => handleDelete(alert.id)}
                className="ml-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold"
                title="Delete alert"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Triggered:</span>
          {triggeredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded text-xs"
            >
              <span className={alert.type === 'crossing_up' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                {alert.type === 'crossing_up' ? '↑' : '↓'}
              </span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{alert.price}</span>
              {alert.alertLabel && (
                <span className="text-gray-600 dark:text-gray-400 text-[10px] italic">({alert.alertLabel})</span>
              )}
              <span className="text-gray-500 dark:text-gray-400 text-[10px] ml-1">
                {alert.triggeredAt && formatTime(alert.triggeredAt)}
              </span>
              <button
                onClick={() => handleDelete(alert.id)}
                className="ml-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold"
                title="Delete alert"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
