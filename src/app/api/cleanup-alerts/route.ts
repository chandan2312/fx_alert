import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Disable caching for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return await performCleanup()
}

export async function POST() {
  return await performCleanup()
}

async function performCleanup() {
  try {
    console.log('🧹 Starting cleanup of old alerts...', new Date().toISOString())
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Delete all alerts older than 7 days based on their creation date
    const result = await prisma.alert.deleteMany({
      where: {
        createdAt: {
          lt: sevenDaysAgo
        }
      }
    })

    console.log(`✅ Cleanup finished. Deleted ${result.count} old alerts.`)

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully. Deleted ${result.count} alerts.`,
      deletedCount: result.count,
      deletedBefore: sevenDaysAgo.toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    )
  }
}
