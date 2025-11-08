'use client'

import { useState, useEffect } from 'react'
import ChartWithAlerts from '../components/ChartWithAlerts'
import LiveAlerts from '../components/LiveAlerts'
import FullscreenChart from '../components/FullscreenChart'
import { Symbol, SymbolLabel } from '../types'
import { fetchLivePrices, LivePrice } from '../services/priceService'

interface SymbolAlert {
  id: number
  price: string
  type: 'crossing_up' | 'crossing_down'
  label: string
}

export default function Home() {
  const [symbols, setSymbols] = useState<Symbol[]>([
    { value: 'DXY', label: 'DXY/USD', api_symbol: 'DXY%2FUSD', tv_symbol: 'CAPITALCOM:DXY', category: 'Other' },
    { value: 'XAUUSD', label: 'Gold/USD', api_symbol: 'Gold%2FUSD', tv_symbol: 'OANDA:XAUUSD', category: 'Other' },
    { value: 'XAGUSD', label: 'Silver/USD', api_symbol: 'Silver%2FUSD', tv_symbol: 'OANDA:XAGUSD', category: 'Other' },
    { value: 'BTCUSD', label: 'BTC/USD', api_symbol: 'BTC%2FUSD', tv_symbol: 'COINBASE:BTCUSD', category: 'Other' },
    { value: 'ETHUSD', label: 'ETH/USD', api_symbol: 'ETH%2FUSD', tv_symbol: 'COINBASE:ETHUSD', category: 'Other' },
    { value: 'US30', label: 'Dow/USD', api_symbol: 'Dow%2FUSD', tv_symbol: 'CAPITALCOM:US30', category: 'Other' },
    { value: 'US100', label: 'NDX/USD', api_symbol: 'NDX%2FUSD', tv_symbol: 'CAPITALCOM:US100', category: 'Other' },
    { value: 'US500', label: 'SPX/USD', api_symbol: 'SPX%2FUSD', tv_symbol: 'CAPITALCOM:US500', category: 'Other' },
    { value: 'GER40', label: 'DAX/USD', api_symbol: 'DAX%2FUSD', tv_symbol: 'FOREXCOM:GER40', category: 'Other' },
    { value: 'JP225', label: 'Nikkei225/USD', api_symbol: 'Nikkei225%2FUSD', tv_symbol: 'FOREXCOM:JP225', category: 'Other' },
    { value: 'EURUSD', label: 'EUR/USD', api_symbol: 'EUR%2FUSD', tv_symbol: 'OANDA:EURUSD', category: 'Other' },
    { value: 'GBPUSD', label: 'GBP/USD', api_symbol: 'GBP%2FUSD', tv_symbol: 'OANDA:GBPUSD', category: 'Other' },
    { value: 'AUDUSD', label: 'AUD/USD', api_symbol: 'AUD%2FUSD', tv_symbol: 'OANDA:AUDUSD', category: 'Other' },
    { value: 'USDCHF', label: 'USD/CHF', api_symbol: 'USD%2FCHF', tv_symbol: 'OANDA:USDCHF', category: 'Other' },
    { value: 'USDJPY', label: 'USD/JPY', api_symbol: 'USD%2FJPY', tv_symbol: 'OANDA:USDJPY', category: 'Other' },
    { value: 'USDCAD', label: 'USD/CAD', api_symbol: 'USD%2FCAD', tv_symbol: 'OANDA:USDCAD', category: 'Other' },
    { value: 'CADJPY', label: 'CAD/JPY', api_symbol: 'CAD%2FJPY', tv_symbol: 'OANDA:CADJPY', category: 'Other' },
    { value: 'EURCAD', label: 'EUR/CAD', api_symbol: 'EUR%2FCAD', tv_symbol: 'OANDA:EURCAD', category: 'Other' },
    { value: 'GBPCAD', label: 'GBP/CAD', api_symbol: 'GBP%2FCAD', tv_symbol: 'OANDA:GBPCAD', category: 'Other' },
    { value: 'SOLUSD', label: 'SOL/USD', api_symbol: 'SOL%2FUSD', tv_symbol: 'COINBASE:SOLUSD', category: 'Other' },
    { value: 'ADAUSD', label: 'ADA/USD', api_symbol: 'ADA%2FUSD', tv_symbol: 'COINBASE:ADAUSD', category: 'Other' },
    { value: 'XRPUSD', label: 'XRP/USD', api_symbol: 'XRP%2FUSD', tv_symbol: 'COINBASE:XRPUSD', category: 'Other' }
  ])
  
  // Initialize alerts with 2 default fields for each symbol
  const initializeAlerts = () => {
    const initialAlerts: Record<string, SymbolAlert[]> = {}
    symbols.forEach(symbol => {
      initialAlerts[symbol.value] = [
        { id: Date.now() + Math.random(), price: '', type: 'crossing_up', label: '' },
        { id: Date.now() + Math.random() + 1, price: '', type: 'crossing_up', label: '' }
      ]
    })
    return initialAlerts
  }
  
  const [symbolAlerts, setSymbolAlerts] = useState<Record<string, SymbolAlert[]>>(initializeAlerts)
  const [refreshKey, setRefreshKey] = useState(0)
  const [fullscreenSymbol, setFullscreenSymbol] = useState<Symbol | null>(null)
  const [dbAlerts, setDbAlerts] = useState<Record<string, Array<{ price: number; type: string }>>>({})
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({})
  const [darkMode, setDarkMode] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Load symbol order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('symbolOrder')
    if (savedOrder) {
      try {
        const orderArray = JSON.parse(savedOrder)
        const reorderedSymbols = orderArray
          .map((value: string) => symbols.find(s => s.value === value))
          .filter((s: Symbol | undefined): s is Symbol => s !== undefined)
        
        // Add any new symbols that weren't in saved order
        const missingSymbols = symbols.filter(s => !orderArray.includes(s.value))
        setSymbols([...reorderedSymbols, ...missingSymbols])
      } catch (error) {
        console.error('Error loading symbol order:', error)
      }
    }
  }, [])

  // Save symbol order to localStorage whenever it changes
  const saveSymbolOrder = (newSymbols: Symbol[]) => {
    const orderArray = newSymbols.map(s => s.value)
    localStorage.setItem('symbolOrder', JSON.stringify(orderArray))
  }

  // Fetch live prices on mount and periodically
  useEffect(() => {
    const fetchPrices = async () => {
      const apiSymbols = symbols.map(s => s.api_symbol.replace('%2F', '/'))
      const prices = await fetchLivePrices(apiSymbols)
      setLivePrices(prices)
    }
    
    fetchPrices()
    const interval = setInterval(fetchPrices, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Apply dark mode to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  const getLivePrice = (apiSymbol: string): number | null => {
    const symbolKey = apiSymbol.replace('%2F', '/')
    return livePrices[symbolKey]?.price || null
  }

  const handleAlertFocus = (symbolValue: string, alertId: number) => {
    const symbol = symbols.find(s => s.value === symbolValue)
    if (!symbol) return
    
    const livePrice = getLivePrice(symbol.api_symbol)
    if (livePrice) {
      updateAlert(symbolValue, alertId, 'price', livePrice.toString())
    }
  }

  const moveSymbol = (fromIndex: number, direction: 'up' | 'down') => {
    const newSymbols = [...sortedSymbols]
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    
    if (toIndex < 0 || toIndex >= newSymbols.length) return
    
    // Swap
    [newSymbols[fromIndex], newSymbols[toIndex]] = [newSymbols[toIndex], newSymbols[fromIndex]]
    
    // Update the original symbols array with new order
    const reorderedSymbols = newSymbols.map(s => symbols.find(sym => sym.value === s.value)!)
    setSymbols(reorderedSymbols)
    saveSymbolOrder(reorderedSymbols)
    showToast(`${newSymbols[toIndex].label} moved ${direction}`, 'success')
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
    
    let lastY = e.clientY
    
    // Enable auto-scroll while dragging
    const scrollInterval = setInterval(() => {
      const container = document.querySelector('.flex-1.overflow-y-auto')
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      
      // Scroll up if near top (100px threshold)
      if (lastY < rect.top + 100) {
        container.scrollTop -= 15
      }
      // Scroll down if near bottom (100px threshold)
      else if (lastY > rect.bottom - 100) {
        container.scrollTop += 15
      }
    }, 50)
    
    // Store interval ID to clear later
    ;(window as any).dragScrollInterval = scrollInterval
    
    // Track mouse position for auto-scroll
    const trackMouse = (e: MouseEvent) => {
      lastY = e.clientY
    }
    window.addEventListener('mousemove', trackMouse)
    ;(window as any).dragMouseTracker = trackMouse
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDraggedIndex(null)
    
    // Clear auto-scroll interval
    if ((window as any).dragScrollInterval) {
      clearInterval((window as any).dragScrollInterval)
      delete (window as any).dragScrollInterval
    }
    
    // Remove mouse tracker
    if ((window as any).dragMouseTracker) {
      window.removeEventListener('mousemove', (window as any).dragMouseTracker)
      delete (window as any).dragMouseTracker
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) return
    
    const newSymbols = [...sortedSymbols]
    const draggedSymbol = newSymbols[draggedIndex]
    
    // Remove from old position
    newSymbols.splice(draggedIndex, 1)
    // Insert at new position
    newSymbols.splice(dropIndex, 0, draggedSymbol)
    
    // Update the original symbols array with new order
    const reorderedSymbols = newSymbols.map(s => symbols.find(sym => sym.value === s.value)!)
    setSymbols(reorderedSymbols)
    saveSymbolOrder(reorderedSymbols)
    showToast('Symbol order updated', 'success')
  }

  const handleLabelChange = (symbolValue: string, label: SymbolLabel) => {
    setSymbols(symbols.map(s => 
      s.value === symbolValue ? { ...s, category: label } : s
    ))
  }

  const getAlertsForSymbol = (symbolValue: string) => {
    return symbolAlerts[symbolValue] || []
  }

  const addAlert = (symbolValue: string) => {
    const currentAlerts = getAlertsForSymbol(symbolValue)
    setSymbolAlerts({
      ...symbolAlerts,
      [symbolValue]: [...currentAlerts, { id: Date.now(), price: '', type: 'crossing_up', label: '' }]
    })
  }

  const removeAlert = (symbolValue: string, id: number) => {
    const currentAlerts = getAlertsForSymbol(symbolValue)
    setSymbolAlerts({
      ...symbolAlerts,
      [symbolValue]: currentAlerts.filter(alert => alert.id !== id)
    })
  }

  const updateAlert = (symbolValue: string, id: number, field: string, value: string) => {
    const currentAlerts = getAlertsForSymbol(symbolValue)
    setSymbolAlerts({
      ...symbolAlerts,
      [symbolValue]: currentAlerts.map(alert => 
        alert.id === id ? { ...alert, [field]: value } : alert
      )
    })
  }

  const saveAlerts = async (symbolValue: string) => {
    const symbol = symbols.find(s => s.value === symbolValue)
    if (!symbol) return

    const alerts = getAlertsForSymbol(symbolValue)
    const validAlerts = alerts.filter(a => a.price && parseFloat(a.price) > 0)

    if (validAlerts.length === 0) {
      showToast('Please enter valid prices for alerts', 'error')
      return
    }

    try {
      // Save each alert to database
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 7) // Default 7 days
      
      const promises = validAlerts.map(alert =>
        fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: symbol.value,
            tv_symbol: symbol.tv_symbol,
            api_symbol: symbol.api_symbol,
            label: symbol.category || 'Other',
            price: alert.price,
            type: alert.type,
            alertLabel: alert.label || '',
            expirationDate: expirationDate.toISOString()
          })
        })
      )

      await Promise.all(promises)
      showToast(`${validAlerts.length} alert(s) saved for ${symbol.label}!`, 'success')
      
      // Clear the alerts after saving
      setSymbolAlerts({
        ...symbolAlerts,
        [symbolValue]: [
          { id: Date.now(), price: '', type: 'crossing_up', label: '' },
          { id: Date.now() + 1, price: '', type: 'crossing_up', label: '' }
        ]
      })
      
      // Trigger a refresh of live alerts
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error saving alerts:', error)
      showToast('Failed to save alerts', 'error')
    }
  }

  const handleAlertDelete = () => {
    // Trigger refresh after delete
    setRefreshKey(prev => prev + 1)
  }

  const handleFullscreen = (symbol: Symbol) => {
    setFullscreenSymbol(symbol)
  }

  const closeFullscreen = () => {
    setFullscreenSymbol(null)
  }

  // Sort symbols by label category
  const labelOrder: SymbolLabel[] = ['Live', 'Super', 'Good', 'Bad', 'Formation', 'Other']
  const sortedSymbols = [...symbols].sort((a, b) => {
    const aCategory = a.category || 'Other'
    const bCategory = b.category || 'Other'
    return labelOrder.indexOf(aCategory) - labelOrder.indexOf(bCategory)
  })

  const labelColors: Record<SymbolLabel, string> = {
    Live: 'bg-red-100 text-red-800 border-red-300',
    Super: 'bg-purple-100 text-purple-800 border-purple-300',
    Good: 'bg-green-100 text-green-800 border-green-300',
    Bad: 'bg-gray-100 text-gray-800 border-gray-300',
    Formation: 'bg-blue-100 text-blue-800 border-blue-300',
    Other: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">FX Alert System</h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Set price alerts for forex pairs and indices</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 md:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedSymbols.map((symbol, index) => {
              const category = symbol.category || 'Other'
              const alerts = getAlertsForSymbol(symbol.value)
              const livePrice = getLivePrice(symbol.api_symbol)
              
              return (
                <div 
                  key={symbol.value} 
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all ${
                    draggedIndex === index ? 'opacity-50 scale-95 ring-2 ring-blue-500' : 'opacity-100 scale-100'
                  } hover:shadow-lg`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        {/* Drag Handle */}
                        <div className="flex items-center gap-1">
                          <div className="cursor-grab active:cursor-grabbing p-1" title="Drag to reorder">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveSymbol(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveSymbol(index, 'down')}
                              disabled={index === sortedSymbols.length - 1}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">{symbol.label}</h2>
                          {livePrice && (
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">${livePrice.toFixed(4)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleFullscreen(symbol)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="View Fullscreen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </button>
                      </div>
                      <select
                        value={category}
                        onChange={(e) => handleLabelChange(symbol.value, e.target.value as SymbolLabel)}
                        className={`text-xs px-2 py-1 rounded border ${labelColors[category]} cursor-pointer`}
                      >
                        {labelOrder.map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="flex gap-2">
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="Price"
                            value={alert.price}
                            onFocus={() => handleAlertFocus(symbol.value, alert.id)}
                            onChange={(e) => updateAlert(symbol.value, alert.id, 'price', e.target.value)}
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Label (optional)"
                            value={alert.label}
                            onChange={(e) => updateAlert(symbol.value, alert.id, 'label', e.target.value)}
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <select
                            value={alert.type}
                            onChange={(e) => updateAlert(symbol.value, alert.id, 'type', e.target.value)}
                            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="crossing_up">↑ Up</option>
                            <option value="crossing_down">↓ Down</option>
                          </select>
                          <button
                            onClick={() => removeAlert(symbol.value, alert.id)}
                            className="px-2 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => addAlert(symbol.value)}
                        className="flex-1 text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        + Add Alert
                      </button>
                      <button
                        onClick={() => saveAlerts(symbol.value)}
                        className="flex-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-80 md:h-96">
                    <ChartWithAlerts 
                      symbolValue={symbol.value}
                      tvSymbol={symbol.tv_symbol}
                      darkMode={darkMode}
                    />
                  </div>
                  
                  {/* Live Alerts Display */}
                  <LiveAlerts 
                    key={`${symbol.value}-${refreshKey}`}
                    symbolValue={symbol.value} 
                    onDelete={handleAlertDelete}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Fullscreen Chart Modal */}
      {fullscreenSymbol && (
        <FullscreenChart
          symbol={fullscreenSymbol.value}
          symbolLabel={fullscreenSymbol.label}
          tvSymbol={fullscreenSymbol.tv_symbol}
          darkMode={darkMode}
          onClose={closeFullscreen}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
