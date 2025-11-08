import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDxYLzXzmwoRRc3qXcdFMRahR0NH_Q-nO4')

function generatePrompt(symbol: string): string {
  const now = new Date()
  const hour = now.getUTCHours()
  
  // Determine session
  let session = 'Today\'s London Session (08:00 - 12:00 GMT)'
  if (hour >= 12) {
    session = 'Today\'s New York Session (12:30 - 17:00 GMT)'
  } else if (hour >= 17 || hour < 8) {
    session = 'Today\'s Asian Session (22:00 - 08:00 GMT)'
  }
  
  return `Please conduct a purely fundamental and sentiment-driven directional analysis for the specified trading symbol, focusing on the immediate effects of current market positioning and upcoming high-impact news within the specified trading session. Please use easy english words & sentence. Dont confuse, just talk straightforward

Input Parameters:
SYMBOL: ${symbol}
TARGET SESSION: ${session}

Analysis Requirements (Strictly No Technical Analysis):
1. Short-Term Direction & Trend
What is the current, immediate directional bias established by the end of the previous major session or the start of the current session?
What is the single most important fundamental headline driving this short-term trend (e.g., anticipation of a rate cut, risk-off sentiment due to geopolitical news, oil price surge)?

2. News Events (Deciding Factors)
Past Decisive Event: Identify the most recent high-impact news event (within the last 24 hours) that fundamentally established the current short-term market direction. Describe its outcome vs. forecast and its sustained directional effect on the SYMBOL.
Upcoming Decisive Event (Intraday Focus): Identify the most crucial high-impact economic release or policy speech scheduled within or immediately before the TARGET SESSION. State the market's forecast.
Contingency/Forecast: Provide a clear directional forecast for the SYMBOL based on two contingencies: a Major Beat vs. a Major Miss of the upcoming event's consensus forecast.

3. Correlation and Similarity
Identify a highly correlated or inverse asset/pair relevant to the SYMBOL (e.g., DXY for FX, S&P 500 for BTC/SOL).
What is the current fundamental reason driving the correlated asset?
Alignment Check (Similarity): Do the fundamental reasons driving the SYMBOL and the correlated asset align logically? (e.g., EUR/USD is Bullish because the ECB is hawkish, and DXY is Bearish because the US jobs report was weak—both confirming a flow away from the USD).

4. Market Sentiment & Positioning
What is the immediate, prevailing market sentiment as the TARGET SESSION opens? (e.g., Cautious, Fearful, Complacent).
What is the current dominant retail/speculative positioning? (Are market participants heavily Net-Long or Net-Short?).
Sentiment Forecast: Does this positioning suggest potential for a short-term liquidity squeeze (a move against the crowd) during the high-volatility window?

✅ FINAL BIAS (REQUIRED OUTPUT)
Direction (Forecast): [BULLISH / BEARISH / NEUTRAL]
Decisive Justification: A single sentence summarizing the most powerful fundamental event/sentiment that will decide the symbol's direction during the TARGET SESSION.`
}

// GET - Retrieve bias for a symbol
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }
    
    const bias = await prisma.biasAnalysis.findUnique({
      where: { symbol }
    })
    
    return NextResponse.json(bias || null, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching bias:', error)
    return NextResponse.json({ error: 'Failed to fetch bias' }, { status: 500 })
  }
}

// POST - Generate new bias analysis
export async function POST(request: Request) {
  try {
    const { symbol } = await request.json()
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }
    
    // Generate analysis using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    const prompt = generatePrompt(symbol)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text()
    
    // Extract direction and justification from the response
    let direction = 'NEUTRAL'
    let justification = 'Analysis in progress'
    
    // Try to parse the final bias section
    const directionMatch = analysisText.match(/Direction.*?:\s*\[?(BULLISH|BEARISH|NEUTRAL)\]?/i)
    if (directionMatch) {
      direction = directionMatch[1].toUpperCase()
    }
    
    const justificationMatch = analysisText.match(/Decisive Justification.*?:\s*(.+?)(?:\n|$)/i)
    if (justificationMatch) {
      justification = justificationMatch[1].trim()
    }
    
    // Save to database (upsert)
    const bias = await prisma.biasAnalysis.upsert({
      where: { symbol },
      update: {
        direction,
        analysis: analysisText,
        justification,
        updatedAt: new Date()
      },
      create: {
        symbol,
        direction,
        analysis: analysisText,
        justification
      }
    })
    
    await prisma.$disconnect()
    
    return NextResponse.json(bias, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error generating bias:', error)
    await prisma.$disconnect()
    return NextResponse.json(
      { error: 'Failed to generate bias', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
