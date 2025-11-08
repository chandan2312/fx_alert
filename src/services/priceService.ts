export interface LivePrice {
  instrument: string
  price: number
  bid: number
  ask: number
  timestamp: number
}

const API_URL = 'https://mds-api.forexfactory.com/instruments'

export async function fetchLivePrices(instruments: string[]): Promise<Record<string, LivePrice>> {
  try {
    const instrumentsParam = instruments.join(',')
    const response = await fetch(`${API_URL}?instruments=${instrumentsParam}`)
    const data = await response.json()
    
    const prices: Record<string, LivePrice> = {}
    
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((item: any) => {
        if (item.instrument && item.metrics && item.metrics.M20) {
          const metric = item.metrics.M20
          prices[item.instrument.name] = {
            instrument: item.instrument.name,
            price: metric.price,
            bid: metric.low,
            ask: metric.high,
            timestamp: Date.now()
          }
        }
      })
    }
    
    return prices
  } catch (error) {
    console.error('Error fetching live prices:', error)
    return {}
  }
}
