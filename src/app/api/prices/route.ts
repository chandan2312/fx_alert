import { NextResponse } from 'next/server';

// Mock prices - in a real implementation, you would fetch from the Forex Factory API
const mockPrices: { [key: string]: number } = {
  'EURUSD': 1.0850,
  'GBPUSD': 1.2700,
  'USDJPY': 149.50,
  'AUDUSD': 0.6500,
  'USDCAD': 1.3600,
  'XAUUSD': 1950.00,
  'XAGUSD': 23.50
};

// GET current price for a symbol
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }
  
  const price = mockPrices[symbol] || null;
  
  if (price === null) {
    return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
  }
  
  return NextResponse.json({ symbol, price });
}