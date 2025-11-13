'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import ChartWithAlerts from '../components/ChartWithAlerts'
import LiveAlerts from '../components/LiveAlerts'
import FullscreenChart from '../components/FullscreenChart'
import BiasPopup from '../components/BiasPopup'
import BiasSheetModal from '../components/BiasSheetModal'
import { Symbol, SymbolLabel } from '../types'
import { fetchLivePrices, LivePrice } from '../services/priceService'

interface SymbolAlert {
  id: number
  price: string
  type: 'crossing_up' | 'crossing_down'
  label: string
}

interface DbAlert {
  id: string
  symbol: string
  price: number
  type: string
  status: string
  alertLabel?: string
  triggeredAt?: string
}

export default function Home() {
  const [symbols, setSymbols] = useState<Symbol[]>([
    { value: 'XAUUSD', label: 'Gold/USD', api_symbol: 'Gold%2FUSD', tv_symbol: 'OANDA:XAUUSD', category: 'Other' },
    { value: 'BTCUSD', label: 'BTC/USD', api_symbol: 'BTC%2FUSD', tv_symbol: 'COINBASE:BTCUSD', category: 'Other' },
    { value: 'US30', label: 'Dow/USD', api_symbol: 'Dow%2FUSD', tv_symbol: 'CAPITALCOM:US30', category: 'Other' },
    { value: 'US100', label: 'NDX/USD', api_symbol: 'NDX%2FUSD', tv_symbol: 'CAPITALCOM:US100', category: 'Other' },
    { value: 'US500', label: 'SPX/USD', api_symbol: 'SPX%2FUSD', tv_symbol: 'CAPITALCOM:US500', category: 'Other' },
    { value: 'GER40', label: 'DAX/USD', api_symbol: 'DAX%2FUSD', tv_symbol: 'FOREXCOM:GER40', category: 'Other' },
    { value: 'JP225', label: 'Nikkei225/USD', api_symbol: 'Nikkei225%2FUSD', tv_symbol: 'FOREXCOM:JP225', category: 'Other' },
    { value: 'EURUSD', label: 'EUR/USD', api_symbol: 'EUR%2FUSD', tv_symbol: 'OANDA:EURUSD', category: 'Other' },
    { value: 'GBPUSD', label: 'GBP/USD', api_symbol: 'GBP%2FUSD', tv_symbol: 'OANDA:GBPUSD', category: 'Other' },
    { value: 'USDJPY', label: 'USD/JPY', api_symbol: 'USD%2FJPY', tv_symbol: 'OANDA:USDJPY', category: 'Other' },
    { value: 'CADJPY', label: 'CAD/JPY', api_symbol: 'CAD%2FJPY', tv_symbol: 'OANDA:CADJPY', category: 'Other' },
    { value: 'SOLUSD', label: 'SOL/USD', api_symbol: 'SOL%2FUSD', tv_symbol: 'COINBASE:SOLUSD', category: 'Other' },
    { value: 'ADAUSD', label: 'ADA/USD', api_symbol: 'ADA%2FUSD', tv_symbol: 'COINBASE:ADAUSD', category: 'Other' },
    { value: 'XRPUSD', label: 'XRP/USD', api_symbol: 'XRP%2FUSD', tv_symbol: 'COINBASE:XRPUSD', category: 'Other' }
  ])
  
  // Initialize alerts with 1 default field for each symbol
  const initializeAlerts = () => {
    const initialAlerts: Record<string, SymbolAlert[]> = {}
    symbols.forEach(symbol => {
      initialAlerts[symbol.value] = [
        { id: Date.now() + Math.random(), price: '', type: 'crossing_up', label: '' }
      ]
    })
    return initialAlerts
  }
  
  const [symbolAlerts, setSymbolAlerts] = useState<Record<string, SymbolAlert[]>>(initializeAlerts)
  const [refreshKey, setRefreshKey] = useState(0)
  const [fullscreenSymbol, setFullscreenSymbol] = useState<Symbol | null>(null)
  const [dbAlerts, setDbAlerts] = useState<Record<string, Array<{ price: number; type: string }>>>({})
  const [activeDbAlerts, setActiveDbAlerts] = useState<DbAlert[]>([])
  const [triggeredDbAlerts, setTriggeredDbAlerts] = useState<DbAlert[]>([])
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({})
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      return saved === 'true'
    }
    return false
  })
  const [expandedSymbols, setExpandedSymbols] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [biasSymbol, setBiasSymbol] = useState<string | null>(null)
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)
  const [refreshingBias, setRefreshingBias] = useState(false)
  const [biasProgress, setBiasProgress] = useState({ current: 0, total: 0 })
  const [showBiasSheet, setShowBiasSheet] = useState(false)
  const [biasSheetData, setBiasSheetData] = useState<Record<string, any>>({})
  const [focusMode, setFocusMode] = useState(false)
  const [timeframe, setTimeframe] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const tf = localStorage.getItem('tvInterval')
      return tf || '60'
    }
    return '60'
  })
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [selectedSymbolValue, setSelectedSymbolValue] = useState<string>(() => symbols[0]?.value || '')

  // Load symbol order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('symbolOrder')
    const savedCategories = localStorage.getItem('symbolCategories')
    
    let updatedSymbols = [...symbols]
    
    // Load saved categories
    if (savedCategories) {
      try {
        const categoriesMap = JSON.parse(savedCategories)
        updatedSymbols = updatedSymbols.map(s => ({
          ...s,
          category: categoriesMap[s.value] || s.category
        }))
      } catch (error) {
        console.error('Error loading symbol categories:', error)
      }
    }
    
    // Load saved order
    if (savedOrder) {
      try {
        const orderArray = JSON.parse(savedOrder)
        const reorderedSymbols = orderArray
          .map((value: string) => updatedSymbols.find(s => s.value === value))
          .filter((s: Symbol | undefined): s is Symbol => s !== undefined)
        
        // Add any new symbols that weren't in saved order
        const missingSymbols = updatedSymbols.filter(s => !orderArray.includes(s.value))
        updatedSymbols = [...reorderedSymbols, ...missingSymbols]
      } catch (error) {
        console.error('Error loading symbol order:', error)
      }
    }
    
    setSymbols(updatedSymbols)
  }, [])

  // Save symbol order to localStorage whenever it changes
  const saveSymbolOrder = (newSymbols: Symbol[]) => {
    const orderArray = newSymbols.map(s => s.value)
    localStorage.setItem('symbolOrder', JSON.stringify(orderArray))
  }

  // Save symbol categories to localStorage
  const saveSymbolCategories = (updatedSymbols: Symbol[]) => {
    const categoriesMap: Record<string, SymbolLabel> = {}
    updatedSymbols.forEach(s => {
      categoriesMap[s.value] = s.category || 'Other'
    })
    localStorage.setItem('symbolCategories', JSON.stringify(categoriesMap))
  }

  // Fetch live prices ONLY on initial mount - use stale prices from localStorage
  useEffect(() => {
    const fetchPrices = async () => {
      // Check if we have cached prices from localStorage
      const cachedPrices = localStorage.getItem('livePrices')
      const cacheTimestamp = localStorage.getItem('pricesCacheTime')
      const now = Date.now()
      
      // Use cache if less than 5 minutes old
      if (cachedPrices && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 5 * 60 * 1000) {
        setLivePrices(JSON.parse(cachedPrices))
        return
      }
      
      // Fetch fresh prices only if cache is stale or missing
      const apiSymbols = symbols.map(s => s.api_symbol.replace('%2F', '/'))
      const prices = await fetchLivePrices(apiSymbols)
      
      if (Object.keys(prices).length > 0) {
        setLivePrices(prices)
        // Cache the prices and timestamp
        localStorage.setItem('livePrices', JSON.stringify(prices))
        localStorage.setItem('pricesCacheTime', now.toString())
      }
    }
    
    fetchPrices()
    // DO NOT set interval - only fetch once on mount
  }, [])

  // Fetch all alerts centrally (active and triggered) - SINGLE API CALL
  useEffect(() => {
    const fetchAllAlerts = async () => {
      try {
        const [activeRes, triggeredRes] = await Promise.all([
          fetch('/api/alerts?status=active'),
          fetch('/api/alerts?status=triggered')
        ])

        let activeAlerts: DbAlert[] = []
        let triggeredAlerts: DbAlert[] = []

        if (activeRes.ok) {
          const json = await activeRes.json()
          activeAlerts = Array.isArray(json) ? json : []
        }
        if (triggeredRes.ok) {
          const json = await triggeredRes.json()
          triggeredAlerts = Array.isArray(json) ? json : []
        }

        setActiveDbAlerts(activeAlerts)
        setTriggeredDbAlerts(triggeredAlerts)
      } catch (error) {
        console.error('Error fetching alerts:', error)
        setActiveDbAlerts([])
        setTriggeredDbAlerts([])
      }
    }
    
    fetchAllAlerts()
    const interval = setInterval(fetchAllAlerts, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [refreshKey])

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Apply dark mode to document element and save to localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }, [darkMode])

  // Fetch bias sheet data
  useEffect(() => {
    const fetchBiasSheet = async () => {
      try {
        const response = await fetch('/api/bias-sheet')
        const data = await response.json()
        const dataMap: Record<string, any> = {}
        data.forEach((sheet: any) => {
          dataMap[sheet.symbol] = sheet
        })
        setBiasSheetData(dataMap)
      } catch (error) {
        console.error('Error fetching bias sheet:', error)
      }
    }
    fetchBiasSheet()
  }, [showBiasSheet])

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

  const handleDragStart = (e: React.DragEvent | React.TouchEvent, index: number) => {
    setDraggedIndex(index)
    
    if ('dataTransfer' in e) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    }
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
    
    let lastY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    // Enable auto-scroll while dragging
    const scrollInterval = setInterval(() => {
      const container = document.querySelector('.main-scroll-container')
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      const scrollThreshold = 150
      
      // Scroll up if near top
      if (lastY < rect.top + scrollThreshold) {
        container.scrollTop -= 20
      }
      // Scroll down if near bottom
      else if (lastY > rect.bottom - scrollThreshold) {
        container.scrollTop += 20
      }
    }, 30)
    
    // Store interval ID to clear later
    ;(window as any).dragScrollInterval = scrollInterval
    
    // Track mouse/touch position for auto-scroll
    const trackPosition = (e: MouseEvent | TouchEvent) => {
      lastY = 'touches' in e ? e.touches[0].clientY : e.clientY
    }
    window.addEventListener('mousemove', trackPosition)
    window.addEventListener('touchmove', trackPosition)
    ;(window as any).dragPositionTracker = trackPosition
  }

  const handleDragEnd = (e: React.DragEvent | React.TouchEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDraggedIndex(null)
    
    // Clear auto-scroll interval
    if ((window as any).dragScrollInterval) {
      clearInterval((window as any).dragScrollInterval)
      delete (window as any).dragScrollInterval
    }
    
    // Remove position tracker
    if ((window as any).dragPositionTracker) {
      window.removeEventListener('mousemove', (window as any).dragPositionTracker)
      window.removeEventListener('touchmove', (window as any).dragPositionTracker)
      delete (window as any).dragPositionTracker
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent | React.TouchEvent, dropIndex: number) => {
    if ('preventDefault' in e) {
      e.preventDefault()
    }
    
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

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0]
    ;(window as any).touchStartY = touch.clientY
    ;(window as any).touchStartTime = Date.now()
    
    // Trigger drag after 200ms hold
    ;(window as any).longPressTimer = setTimeout(() => {
      handleDragStart(e, index)
    }, 200)
  }

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    if ((window as any).longPressTimer) {
      const touch = e.touches[0]
      const deltaY = Math.abs(touch.clientY - (window as any).touchStartY)
      
      // Cancel long press if moved too much before timer
      if (deltaY > 10 && draggedIndex === null) {
        clearTimeout((window as any).longPressTimer)
        delete (window as any).longPressTimer
        return
      }
    }
    
    // If dragging is active, find the drop target
    if (draggedIndex !== null) {
      e.preventDefault()
      const touch = e.touches[0]
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
      const cardElement = elements.find(el => el.classList.contains('symbol-card'))
      
      if (cardElement) {
        const dropIndex = parseInt(cardElement.getAttribute('data-index') || '-1')
        if (dropIndex >= 0 && dropIndex !== draggedIndex) {
          ;(window as any).currentDropIndex = dropIndex
        }
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if ((window as any).longPressTimer) {
      clearTimeout((window as any).longPressTimer)
      delete (window as any).longPressTimer
    }
    
    if (draggedIndex !== null) {
      const dropIndex = (window as any).currentDropIndex
      if (dropIndex !== undefined && dropIndex >= 0) {
        handleDrop(e, dropIndex)
      }
      handleDragEnd(e)
      delete (window as any).currentDropIndex
    }
  }

  const handleLabelChange = (symbolValue: string, label: SymbolLabel) => {
    const updatedSymbols = symbols.map(s => 
      s.value === symbolValue ? { ...s, category: label } : s
    )
    setSymbols(updatedSymbols)
    saveSymbolCategories(updatedSymbols)
    showToast(`${symbolValue} category updated to ${label}`, 'success')
  }

  const getAlertsForSymbol = (symbolValue: string) => {
    return symbolAlerts[symbolValue] || []
  }

  const addAlert = (symbolValue: string) => {
    const currentAlerts = getAlertsForSymbol(symbolValue)
    setSymbolAlerts({
      ...symbolAlerts,
      [symbolValue]: [...currentAlerts, { id: Date.now() + Math.random(), price: '', type: 'crossing_up', label: '' }]
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
          { id: Date.now() + Math.random(), price: '', type: 'crossing_up', label: '' }
        ]
      })
      
      // Trigger a refresh of live alerts
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error saving alerts:', error)
      showToast('Failed to save alerts', 'error')
    }
  }

  const handleAlertDelete = useCallback(() => {
    // Trigger refresh after delete
    setRefreshKey(prev => prev + 1)
  }, [])

  const handleFullscreen = useCallback((symbol: Symbol) => {
    setFullscreenSymbol(symbol)
  }, [])

  const closeFullscreen = useCallback(() => {
    setFullscreenSymbol(null)
  }, [])

  // Memoize sorted symbols with fixed order
  const sortedSymbols = useMemo(() => {
    const order = ['US30','US100','US500','GER40','XAUUSD','BTCUSD','EURUSD','GBPUSD','USDJPY','GBPJPY']
    const byOrder = [...symbols].sort((a, b) => {
      const ai = order.indexOf(a.value)
      const bi = order.indexOf(b.value)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    return byOrder
  }, [symbols])

  const selectedSymbol = useMemo(() => {
    return sortedSymbols.find(s => s.value === selectedSymbolValue) || sortedSymbols[0]
  }, [sortedSymbols, selectedSymbolValue])

  const selectedAlerts = useMemo(() => {
    return selectedSymbol ? getAlertsForSymbol(selectedSymbol.value) : []
  }, [selectedSymbol, symbolAlerts])

  const selectedLivePrice = useMemo(() => {
    return selectedSymbol ? getLivePrice(selectedSymbol.api_symbol) : null
  }, [selectedSymbol, livePrices])

  const [reportLoading, setReportLoading] = useState(false)
  const [reportResults, setReportResults] = useState<{structure?: string; smc?: string; sr?: string; image?: string | null} | null>(null)
  const [reportError, setReportError] = useState<string>('')

  const generateReport = async () => {
    if (!selectedSymbol) return
    setReportLoading(true)
    setReportError('')
    setReportResults(null)
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedSymbol.value, darkMode })
      })
      if (!res.ok) {
        let msg = 'Failed to generate report'
        try {
          const err = await res.json()
          if (err?.error) msg = err.error
        } catch {}
        throw new Error(msg)
      }
      const data = await res.json()
      const sanitize = (s: any) => {
        const t = String(s || '')
        return t.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
      }
      setReportResults({
        structure: sanitize(data.structure),
        smc: sanitize(data.smc),
        sr: sanitize(data.sr),
        image: data.image || null
      })
    } catch (e: any) {
      setReportError(e.message || 'Error generating report')
    } finally {
      setReportLoading(false)
    }
  }

  const labelColors: Record<SymbolLabel, string> = {
    Live: 'bg-red-100 text-red-800 border-red-300',
    Super: 'bg-purple-100 text-purple-800 border-purple-300',
    Good: 'bg-green-100 text-green-800 border-green-300',
    Bad: 'bg-gray-100 text-gray-800 border-gray-300',
    Formation: 'bg-blue-100 text-blue-800 border-blue-300',
    Other: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }

  // Manual refresh prices function
  const refreshPrices = useCallback(async () => {
    const apiSymbols = symbols.map(s => s.api_symbol.replace('%2F', '/'))
    const prices = await fetchLivePrices(apiSymbols)
    
    if (Object.keys(prices).length > 0) {
      setLivePrices(prices)
      localStorage.setItem('livePrices', JSON.stringify(prices))
      localStorage.setItem('pricesCacheTime', Date.now().toString())
      showToast('Prices refreshed!', 'success')
    } else {
      showToast('Failed to refresh prices', 'error')
    }
  }, [symbols])

  // Scroll to specific symbol
  const scrollToSymbol = (symbolValue: string) => {
    const element = document.getElementById(`symbol-${symbolValue}`)
    if (element) {
      const headerHeight = 60 // Fixed header height
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      setShowSymbolDropdown(false)
    }
  }

  // Helper function to get indicator emoji
  const getIndicatorEmoji = (value: string) => {
    switch (value) {
      case 'green': return '🟢'
      case 'red': return '🔴'
      case 'yellow': return '🟡'
      default: return '⚪'
    }
  }

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Refresh all bias analyses
  const refreshAllBiasAnalyses = async () => {
    if (refreshingBias) return
    
    setRefreshingBias(true)
    const total = symbols.length
    setBiasProgress({ current: 0, total })
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i]
      setBiasProgress({ current: i + 1, total })
      
      try {
        const response = await fetch('/api/bias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: symbol.value })
        })
        
        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        console.error(`Error updating bias for ${symbol.value}:`, error)
        failCount++
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setRefreshingBias(false)
    setBiasProgress({ current: 0, total: 0 })
    
    if (successCount > 0) {
      showToast(`✅ Updated ${successCount} bias analyses!`, 'success')
    }
    if (failCount > 0) {
      showToast(`⚠️ Failed to update ${failCount} analyses`, 'error')
    }
  }

  // Reset symbols to default order and categories
  const resetSymbols = () => {
    const confirmed = window.confirm('Are you sure you want to reset all symbols to default order and category (Other)?')
    if (!confirmed) return
    
    const defaultSymbols: Symbol[] = [
      { value: 'XAUUSD', label: 'Gold/USD', api_symbol: 'Gold%2FUSD', tv_symbol: 'OANDA:XAUUSD', category: 'Other' },
      { value: 'BTCUSD', label: 'BTC/USD', api_symbol: 'BTC%2FUSD', tv_symbol: 'COINBASE:BTCUSD', category: 'Other' },
      { value: 'US30', label: 'Dow/USD', api_symbol: 'Dow%2FUSD', tv_symbol: 'CAPITALCOM:US30', category: 'Other' },
      { value: 'US100', label: 'NDX/USD', api_symbol: 'NDX%2FUSD', tv_symbol: 'CAPITALCOM:US100', category: 'Other' },
      { value: 'US500', label: 'SPX/USD', api_symbol: 'SPX%2FUSD', tv_symbol: 'CAPITALCOM:US500', category: 'Other' },
      { value: 'GER40', label: 'DAX/USD', api_symbol: 'DAX%2FUSD', tv_symbol: 'FOREXCOM:GER40', category: 'Other' },
      { value: 'JP225', label: 'Nikkei225/USD', api_symbol: 'Nikkei225%2FUSD', tv_symbol: 'FOREXCOM:JP225', category: 'Other' },
      { value: 'EURUSD', label: 'EUR/USD', api_symbol: 'EUR%2FUSD', tv_symbol: 'OANDA:EURUSD', category: 'Other' },
      { value: 'GBPUSD', label: 'GBP/USD', api_symbol: 'GBP%2FUSD', tv_symbol: 'OANDA:GBPUSD', category: 'Other' },
      { value: 'USDJPY', label: 'USD/JPY', api_symbol: 'USD%2FJPY', tv_symbol: 'OANDA:USDJPY', category: 'Other' },
      { value: 'CADJPY', label: 'CAD/JPY', api_symbol: 'CAD%2FJPY', tv_symbol: 'OANDA:CADJPY', category: 'Other' },
      { value: 'SOLUSD', label: 'SOL/USD', api_symbol: 'SOL%2FUSD', tv_symbol: 'COINBASE:SOLUSD', category: 'Other' },
      { value: 'ADAUSD', label: 'ADA/USD', api_symbol: 'ADA%2FUSD', tv_symbol: 'COINBASE:ADAUSD', category: 'Other' },
      { value: 'XRPUSD', label: 'XRP/USD', api_symbol: 'XRP%2FUSD', tv_symbol: 'COINBASE:XRPUSD', category: 'Other' }
    ]
    
    setSymbols(defaultSymbols)
    localStorage.removeItem('symbolOrder')
    localStorage.removeItem('symbolCategories')
    showToast('✅ Symbols reset to default!', 'success')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Symbol Navigation Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Navigate to Symbol"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {showSymbolDropdown && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowSymbolDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto w-48 z-50">
                    {sortedSymbols.map((symbol) => (
                      <button
                        key={symbol.value}
                        onClick={() => scrollToSymbol(symbol.value)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 transition-colors"
                      >
                        {symbol.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <a
              href="https://www.forexfactory.com/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="Forex Calendar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </a>
            <a
              href="https://www.forexfactory.com/news"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900 hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
              title="Forex News"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={timeframe}
                onChange={(e) => { setTimeframe(e.target.value); if (typeof window !== 'undefined') localStorage.setItem('tvInterval', e.target.value) }}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                title="Timeframe"
              >
                <option value="5">5M</option>
                <option value="15">15M</option>
                <option value="30">30M</option>
                <option value="60">1H</option>
                <option value="240">4H</option>
                <option value="D">1D</option>
              </select>
            </div>
            <button
              onClick={resetSymbols}
              className="p-2 rounded-lg bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              title="Reset Symbols to Default"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setShowBiasSheet(true)}
              className="p-2 rounded-lg bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              title="Bias Sheet"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
            <button
              onClick={refreshAllBiasAnalyses}
              disabled={refreshingBias}
              className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              title="Refresh All Bias Analyses"
            >
              {refreshingBias ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {biasProgress.total > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {biasProgress.current}
                    </span>
                  )}
                </>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
            </button>
            <button
              onClick={refreshPrices}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="Refresh Prices"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden mt-14">
        <div className="flex-1 overflow-y-auto p-2 md:p-4 main-scroll-container">
          <div className="flex gap-2 overflow-x-auto p-2 border-b border-gray-200 dark:border-gray-700 symbol-scroll scroll-smooth">
            {sortedSymbols.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedSymbolValue(s.value)}
                className={`px-2 py-1 text-xs sm:text-sm rounded-full border snap-start ${
                  selectedSymbol?.value === s.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                }`}
              >
                {s.value}
              </button>
            ))}
          </div>
          {selectedSymbol && (
            <div className="p-3 md:p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">{selectedSymbol.label}</h2>
                {selectedLivePrice && (
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">${selectedLivePrice.toFixed(4)}</span>
                )}
              </div>

              <div className="space-y-2 mb-3">
                {selectedAlerts.map((alert) => (
                  <div key={alert.id} className="flex gap-1 md:gap-2 items-center">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Price"
                      value={alert.price}
                      onChange={(e) => updateAlert(selectedSymbol.value, alert.id, 'price', e.target.value)}
                      className="flex-1 md:flex-1 px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Label"
                      value={alert.label}
                      onChange={(e) => updateAlert(selectedSymbol.value, alert.id, 'label', e.target.value)}
                      className="flex-1 min-w-0 px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateAlert(selectedSymbol.value, alert.id, 'type', 'crossing_up')}
                        className={`${alert.type === 'crossing_up' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'} px-2 py-1.5 text-xs sm:text-sm rounded`}
                        title="Up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => updateAlert(selectedSymbol.value, alert.id, 'type', 'crossing_down')}
                        className={`${alert.type === 'crossing_down' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'} px-2 py-1.5 text-xs sm:text-sm rounded`}
                        title="Down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => addAlert(selectedSymbol.value)}
                  className="flex-1 text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  + Add Alert
                </button>
                <button
                  onClick={() => saveAlerts(selectedSymbol.value)}
                  className="flex-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>

              <div className="h-[350px] mb-3">
                <ChartWithAlerts
                  symbolValue={selectedSymbol.value}
                  tvSymbol={selectedSymbol.tv_symbol}
                  darkMode={darkMode}
                  interval={timeframe}
                  alerts={(Array.isArray(activeDbAlerts) ? activeDbAlerts : [])
                    .filter(a => a.symbol === selectedSymbol.value)
                    .map(a => ({ price: a.price, type: a.type }))}
                  currentPrice={selectedLivePrice || undefined}
                />
              </div>

              <div className="mb-3">
                <button
                  onClick={generateReport}
                  className="w-full text-sm px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700"
                  disabled={reportLoading}
                >
                  {reportLoading ? 'Generating Report...' : 'Generate Report'}
                </button>
                {reportError && (
                  <div className="mt-2 text-xs text-red-600">{reportError}</div>
                )}
                {reportResults && (
                  <div className="mt-3 space-y-3">
                    {reportResults.image && (
                      <div>
                        <img
                          src={`data:image/png;base64,${reportResults.image}`}
                          alt="Annotated chart"
                          className="w-full max-w-[1000px] border rounded"
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="font-semibold">Market Structure</div>
                        <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{reportResults.structure}</div>
                      </div>
                      <div>
                        <div className="font-semibold">SMC</div>
                        <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{reportResults.smc}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Support & Resistance</div>
                        <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{reportResults.sr}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <LiveAlerts
                symbolValue={selectedSymbol.value}
                activeAlerts={(Array.isArray(activeDbAlerts) ? activeDbAlerts : [])}
                triggeredAlerts={(Array.isArray(triggeredDbAlerts) ? triggeredDbAlerts : [])}
                onDelete={handleAlertDelete}
                currentPrice={selectedLivePrice || undefined}
              />
            </div>
          )}
        </div>
        <aside className="w-64 md:w-72 border-l border-gray-200 dark:border-gray-700 p-2 overflow-y-auto hidden md:block">
          <div className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Triggered Alerts</div>
          <div className="space-y-2">
            {(Array.isArray(triggeredDbAlerts) ? triggeredDbAlerts : []).map((a) => (
              <div key={`${a.id}`} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{a.symbol}</span>
                  <button onClick={() => setSelectedSymbolValue(a.symbol)} className="text-xs text-blue-600">Go</button>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{a.type} @ {a.price}</div>
                {a.alertLabel && (
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{a.alertLabel}</div>
                )}
                {a.triggeredAt && (
                  <div className="text-[10px] text-gray-400">{new Date(a.triggeredAt).toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        </aside>
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

      {/* Bias Analysis Popup */}
      {biasSymbol && (
        <BiasPopup
          symbol={biasSymbol}
          onClose={() => setBiasSymbol(null)}
        />
      )}

      {/* Bias Sheet Modal */}
      {showBiasSheet && (
        <BiasSheetModal
          symbols={symbols}
          onClose={() => setShowBiasSheet(false)}
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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-gray-900/20 dark:bg-white/20 hover:bg-gray-900/40 dark:hover:bg-white/40 backdrop-blur-sm rounded-full shadow-lg transition-all duration-300 z-40"
          title="Scroll to Top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
      <style jsx>{`
        .symbol-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(100,100,120,0.5) transparent;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain;
        }
        .symbol-scroll::-webkit-scrollbar {
          height: 10px;
        }
        .symbol-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .symbol-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, rgba(59,130,246,0.6), rgba(147,51,234,0.6));
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .dark .symbol-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, rgba(96,165,250,0.7), rgba(147,51,234,0.7));
        }
      `}</style>
    </div>
  )
}
