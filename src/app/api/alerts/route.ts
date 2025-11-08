import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all alerts or filter by status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  try {
    const alerts = await prisma.alert.findMany({
      where: status ? { status } : {},
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    return NextResponse.json(alerts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// POST new alert
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { symbol, tv_symbol, api_symbol, label, price, type, alertLabel, expirationDate } = body
    
    const newAlert = await prisma.alert.create({
      data: {
        symbol,
        tv_symbol,
        api_symbol,
        label,
        alertLabel: alertLabel || '',
        price: parseFloat(price),
        type,
        status: 'active',
        expirationDate: expirationDate ? new Date(expirationDate) : null
      }
    })
    
    return NextResponse.json(newAlert, { status: 201 })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

// PUT update alert
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, triggeredAt } = body
    
    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: {
        status,
        triggeredAt: triggeredAt ? new Date(triggeredAt) : undefined
      }
    })
    
    return NextResponse.json(updatedAlert)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

// DELETE alert
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }
  
  try {
    await prisma.alert.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Alert deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}