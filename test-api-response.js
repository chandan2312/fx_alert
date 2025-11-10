// Test script to fetch Forex Factory API response
const API_URL = 'https://mds-api.forexfactory.com/instruments'

async function testAPI() {
  try {
    const instruments = 'EUR/USD,GBP/USD,Gold/USD'
    const url = `${API_URL}?instruments=${instruments}`
    
    console.log('Fetching from:', url)
    console.log('---\n')
    
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
    
    // Save to file
    const fs = require('fs')
    fs.writeFileSync(
      'api-response.json',
      JSON.stringify(data, null, 2),
      'utf8'
    )
    
    console.log('✅ API Response saved to: api-response.json')
    console.log('\nAvailable timeframes in metrics:')
    
    if (data.data && data.data[0] && data.data[0].metrics) {
      const metrics = data.data[0].metrics
      Object.keys(metrics).forEach(key => {
        const m = metrics[key]
        console.log(`  ${key}: { price: ${m.price}, high: ${m.high}, low: ${m.low}, spread: ${m.spread} }`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testAPI()
