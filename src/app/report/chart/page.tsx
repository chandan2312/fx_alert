'use client'

import { useSearchParams } from 'next/navigation'
import TradingViewWidget from '@/components/TradingViewWidget'

export default function ChartReportPage() {
  const params = useSearchParams()
  const symbol = params.get('symbol') || 'OANDA:EURUSD'
  const dark = params.get('dark') === 'true'

  return (
    <div className="h-screen w-screen p-2">
      <div className="h-[600px] w-full">
        <TradingViewWidget symbol={symbol} darkMode={dark} />
      </div>
    </div>
  )
}