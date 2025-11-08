require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const https = require('https')

const prisma = new PrismaClient()

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const API_URL = 'https://mds-api.forexfactory.com/instruments'

// Fetch live prices from Forex Factory
async function fetchLivePrices(instruments) {
  return new Promise((resolve, reject) => {
    const instrumentsParam = instruments.join(',')
    const urlPath = `${API_URL}?instruments=${instrumentsParam}`
    
    console.log('📡 Fetching prices from:', urlPath)
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    }
    
    https.get(urlPath, options, (res) => {
      let data = ''
      
      // Check if response is ok
      if (res.statusCode !== 200) {
        console.error(`❌ HTTP Error: ${res.statusCode}`)
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          const prices = {}
          
          if (jsonData.data && Array.isArray(jsonData.data)) {
            jsonData.data.forEach((item) => {
              if (item.instrument && item.metrics && item.metrics.M20) {
                const metric = item.metrics.M20
                prices[item.instrument.name] = metric.price
              }
            })
          }
          
          resolve(prices)
        } catch (error) {
          console.error('❌ JSON Parse Error:', error.message)
          console.error('Response data:', data.substring(0, 500))
          reject(error)
        }
      })
    }).on('error', (error) => {
      console.error('❌ Request Error:', error.message)
      reject(error)
    })
  })
}

// Send Telegram notification
async function sendTelegramNotification(message) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const postData = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
    
    console.log('📤 Sending to Telegram:', TELEGRAM_CHAT_ID)
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Telegram response: Success')
          resolve(data)
        } else {
          console.error('❌ Telegram error:', res.statusCode, data)
          reject(new Error(`Telegram API error: ${res.statusCode}`))
        }
      })
    })
    
    req.on('error', (error) => {
      console.error('❌ Telegram request error:', error.message)
      reject(error)
    })
    
    req.write(postData)
    req.end()
  })
}

// Check alerts and trigger notifications
async function checkAlerts() {
  try {
    console.log('🔍 Checking alerts...', new Date().toISOString())
    
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
      console.log('✅ No active alerts to check')
      return
    }
    
    console.log(`📊 Found ${activeAlerts.length} active alerts`)
    
    // Get unique API symbols
    const uniqueApiSymbols = [...new Set(activeAlerts.map(alert => alert.api_symbol.replace('%2F', '/')))]
    
    // Fetch live prices
    const livePrices = await fetchLivePrices(uniqueApiSymbols)
    console.log('💰 Fetched live prices:', Object.keys(livePrices).length, 'symbols')
    
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
        const direction = alert.type === 'crossing_up' ? '🟢 UP' : '🔴 DOWN'
        const labelText = alert.alertLabel ? ` - ${alert.alertLabel}` : ''
        
        const message = `🚨 <b>ALERT TRIGGERED</b>\n\n` +
          `Symbol: <b>${alert.symbol}</b>${labelText}\n` +
          `Price: <b>${alert.price}</b> ${direction}\n` +
          `Current: <b>${currentPrice.toFixed(4)}</b>\n` +
          `Category: <i>${alert.label}</i>\n` +
          `Time: ${time}`
        
        console.log('📝 Message to send:', message)
        
        // Send Telegram notification
        await sendTelegramNotification(message)
        console.log(`📱 Telegram notification sent for ${alert.symbol}`)
        
      } catch (error) {
        console.error(`❌ Error processing alert ${alert.id}:`, error.message)
      }
    }
    
    if (triggeredAlerts.length > 0) {
      console.log(`✅ Processed ${triggeredAlerts.length} triggered alerts`)
    }
    
  } catch (error) {
    console.error('❌ Error in checkAlerts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkAlerts()
  .then(() => {
    console.log('✅ Alert check completed\\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
