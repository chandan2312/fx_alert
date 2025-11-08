'use client'

interface ActiveAlert {
  id: number
  symbol: string
  price: number
  type: string
}

interface ActiveAlertsProps {
  alerts: ActiveAlert[]
  onDeleteAlert: (id: number) => void
}

export default function ActiveAlerts({ alerts, onDeleteAlert }: ActiveAlertsProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Alerts</h2>
      <div className="bg-gray-50 rounded-lg p-4">
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No active alerts</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md">
                <div>
                  <div className="font-medium">{alert.symbol}</div>
                  <div className="text-sm text-gray-600">
                    Price: {alert.price} | Type: {alert.type.replace('_', ' ')}
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteAlert(alert.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}