import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const prisma = new PrismaClient()

// GET - Retrieve all bias sheets
export async function GET(request: Request) {
  try {
    const biasSheets = await prisma.biasSheet.findMany({
      orderBy: { symbol: 'asc' }
    })
    
    return NextResponse.json(biasSheets, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching bias sheets:', error)
    return NextResponse.json({ error: 'Failed to fetch bias sheets' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Update or create bias sheet
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { symbol, bias, usdBias, pdCandle, direction, htfTrend, ltfTrend } = body
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }
    
    const biasSheet = await prisma.biasSheet.upsert({
      where: { symbol },
      update: {
        bias: bias || 'neutral',
        usdBias: usdBias || 'neutral',
        pdCandle: pdCandle || 'neutral',
        direction: direction || 'neutral',
        htfTrend: htfTrend || 'neutral',
        ltfTrend: ltfTrend || 'neutral',
        updatedAt: new Date()
      },
      create: {
        symbol,
        bias: bias || 'neutral',
        usdBias: usdBias || 'neutral',
        pdCandle: pdCandle || 'neutral',
        direction: direction || 'neutral',
        htfTrend: htfTrend || 'neutral',
        ltfTrend: ltfTrend || 'neutral'
      }
    })
    
    await prisma.$disconnect()
    
    return NextResponse.json(biasSheet, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error saving bias sheet:', error)
    await prisma.$disconnect()
    return NextResponse.json(
      { error: 'Failed to save bias sheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
