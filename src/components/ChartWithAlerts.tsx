'use client'

import { useEffect, useState, useRef } from 'react'
import TradingViewWidget from './TradingViewWidget'

interface ChartWithAlertsProps {
  symbolValue: string
  tvSymbol: string
  darkMode?: boolean
}

interface DbAlert {
  id: string
  symbol: string
  price: number
  type: string
  status: string
}

export default function ChartWithAlerts({ symbolValue, tvSymbol, darkMode = false }: ChartWithAlertsProps) {
  const [alerts, setAlerts] = useState<Array<{ price: number; type: string }>>([])
  const hasRendered = useRef(false)

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts?status=active')
      const allAlerts: DbAlert[] = await res.json()
      const symbolAlerts = allAlerts
        .filter((a) => a.symbol === symbolValue)
        .map((a) => ({ price: a.price, type: a.type }))
      setAlerts(symbolAlerts)
    } catch (error) {
      console.error('Error fetching alerts for chart:', error)
    }
  }

  useEffect(() => {
    if (!hasRendered.current) {
      hasRendered.current = true
      fetchAlerts()
    }
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [])

  return <TradingViewWidget symbol={tvSymbol} alerts={alerts} darkMode={darkMode} />
}
