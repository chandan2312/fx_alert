import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Disable caching for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

const prisma = new PrismaClient()

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const API_URL = 'https://mds-api.forexfactory.com/instruments'

// Fetch live prices from Forex Factory
async function fetchLivePrices(instruments: string[]): Promise<Record<string, number>> {
  try {
    const instrumentsParam = instruments.join(',')
    const url = `${API_URL}?instruments=${instrumentsParam}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const prices: Record<string, number> = {}
    
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((item: any) => {
        if (item.instrument && item.metrics && item.metrics.M20) {
          const metric = item.metrics.M20
          prices[item.instrument.name] = metric.price
        }
      })
    }
    
    return prices
  } catch (error) {
    console.error('Error fetching prices:', error)
    return {}
  }
}

// Send Telegram notification
async function sendTelegramNotification(message: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return false
  }
}

export async function GET() {
  try {
    console.log('🔍 Starting alert check...', new Date().toISOString())
    
    // Get all active alerts
    const activeAlerts = await prisma.alert.findMany({
      where: {
        status: 'active',
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } }
        ]
      }
    })
    
    if (activeAlerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active alerts to check',
        triggered: 0
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
    console.log(`📊 Found ${activeAlerts.length} active alerts`)
    
    // Get unique API symbols
    const uniqueApiSymbols = Array.from(new Set(activeAlerts.map(alert => alert.api_symbol.replace('%2F', '/'))))
    
    // Fetch live prices
    const livePrices = await fetchLivePrices(uniqueApiSymbols)
    console.log('💰 Fetched prices for', Object.keys(livePrices).length, 'symbols')
    
    // Check each alert
    const triggeredAlerts = []
    
    for (const alert of activeAlerts) {
      const apiSymbolKey = alert.api_symbol.replace('%2F', '/')
      const currentPrice = livePrices[apiSymbolKey]
      
      if (!currentPrice) {
        console.log(`⚠️  No price data for ${alert.symbol}`)
        continue
      }
      
      let isTriggered = false
      
      if (alert.type === 'crossing_up' && currentPrice >= alert.price) {
        isTriggered = true
      } else if (alert.type === 'crossing_down' && currentPrice <= alert.price) {
        isTriggered = true
      }
      
      if (isTriggered) {
        triggeredAlerts.push({ alert, currentPrice })
        console.log(`🎯 Alert triggered! ${alert.symbol} - ${alert.type} @ ${alert.price}`)
      }
    }
    
    // Update triggered alerts and send notifications
    const results = []
    
    for (const { alert, currentPrice } of triggeredAlerts) {
      try {
        // Update alert status in database
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: 'triggered',
            triggeredAt: new Date()
          }
        })
        
        // Format time
        const time = new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        
        // Create notification message
        const direction = alert.type === 'crossing_up' ? '⬆️ UP' : '⬇️ DOWN'
        const labelText = alert.alertLabel || '-'
        const category = alert.label || '-'
        
        const message = `${alert.symbol} - ${labelText} - ${direction} - ${alert.price} - ${category}`
        
        // Send Telegram notification
        const sent = await sendTelegramNotification(message)
        
        results.push({
          symbol: alert.symbol,
          price: alert.price,
          currentPrice,
          type: alert.type,
          notificationSent: sent
        })
        
        console.log(`📱 Notification ${sent ? 'sent' : 'failed'} for ${alert.symbol}`)
        
      } catch (error) {
        console.error(`❌ Error processing alert ${alert.id}:`, error)
        results.push({
          symbol: alert.symbol,
          error: 'Failed to process'
        })
      }
    }
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Alert check completed',
      totalAlerts: activeAlerts.length,
      triggered: triggeredAlerts.length,
      results
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('❌ Error in checkAlerts:', error)
    await prisma.$disconnect()
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}
