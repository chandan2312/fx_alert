import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { GoogleGenAI } from '@google/genai'
import Jimp from 'jimp'
import prompts from '@/config/report-prompts'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

async function captureChart(symbol: string, darkMode: boolean) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: (puppeteer as any).executablePath(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 800 })
    const url = `http://localhost:3000/report/chart?symbol=${encodeURIComponent(symbol)}&dark=${darkMode}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector('.tradingview-widget-container', { timeout: 60000 })
    await page.waitForSelector('.tradingview-widget-container iframe', { timeout: 60000 })
    await page.waitForFunction(() => {
      const el = document.querySelector('.tradingview-widget-container iframe') as HTMLIFrameElement | null
      if (!el) return false
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }, { timeout: 60000 })
    await new Promise((r) => setTimeout(r, 5000))
    const iframeEl = await page.$('.tradingview-widget-container iframe')
    let buffer: Buffer | undefined
    if (iframeEl) {
      buffer = (await iframeEl.screenshot({ type: 'png' })) as Buffer
      if (buffer && buffer.length < 50000) {
        buffer = (await page.screenshot({ type: 'png', fullPage: false })) as Buffer
      }
    } else {
      buffer = (await page.screenshot({ type: 'png', fullPage: false })) as Buffer
    }
    return buffer as Buffer
  } finally {
    await browser.close()
  }
}

function bufferToBase64(buffer: Buffer) {
  return buffer.toString('base64')
}

export async function POST(request: Request) {
  try {
    const { symbol, darkMode = false } = await request.json()
    if (!symbol) {
      return NextResponse.json({ error: 'symbol is required' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 400 })
    }

    const imageBuffer = await captureChart(symbol, !!darkMode)
    const base64 = bufferToBase64(imageBuffer)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string })

    const imagePart = {
      inlineData: { data: base64, mimeType: 'image/png' }
    } as any

    const candidates = [
      process.env.GEMINI_MODEL,
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro-vision'
    ].filter(Boolean) as string[]

    const runPromptWithModel = async (modelName: string, prompt: string) => {
      try {
        const result: any = await ai.models.generateContent({
          model: modelName,
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              imagePart
            ]
          }]
        })
        const candidates = result?.candidates || []
        const parts = candidates?.[0]?.content?.parts || []
        const textParts = parts.map((p: any) => p?.text).filter(Boolean)
        const text = textParts.join('\n')
        return text || 'ERROR: Empty response'
      } catch (e: any) {
        return `ERROR: ${e?.message || 'Failed to analyze'}`
      }
    }

    let structure = ''
    let smc = ''
    let sr = ''
    let overlayJson = ''

    for (const name of candidates) {
      structure = await runPromptWithModel(name, prompts.structure)
      smc = await runPromptWithModel(name, prompts.smc)
      sr = await runPromptWithModel(name, prompts.sr)
      const overlayStructureJson = await runPromptWithModel(name, `${prompts.overlay} Section: MARKET STRUCTURE`)
      const overlaySmcJson = await runPromptWithModel(name, `${prompts.overlay} Section: SMC`)
      const overlaySrJson = await runPromptWithModel(name, `${prompts.overlay} Section: SUPPORT_RESISTANCE`)
      overlayJson = JSON.stringify({ structure: overlayStructureJson, smc: overlaySmcJson, sr: overlaySrJson })
      if (!String(structure).startsWith('ERROR:') && !String(smc).startsWith('ERROR:') && !String(sr).startsWith('ERROR:')) {
        break
      }
    }

    let annotatedBase64: string | null = null
    try {
      let combined: any = { structure: [], smc: [], sr: [] }
      const raw = JSON.parse(overlayJson)
      const parseBlock = (txt: string) => {
        let s = txt || ''
        s = s.replace(/```json/gi, '').replace(/```/g, '').trim()
        const st = s.indexOf('{')
        const en = s.lastIndexOf('}')
        if (st !== -1 && en !== -1) s = s.slice(st, en + 1)
        try { return JSON.parse(s) } catch { return { items: [] } }
      }
      const ovStructure = parseBlock(raw.structure)
      const ovSmc = parseBlock(raw.smc)
      const ovSr = parseBlock(raw.sr)
      const image = await Jimp.read(Buffer.from(base64, 'base64'))
      const W = image.getWidth()
      const H = image.getHeight()

      const drawLine = (p1: any, p2: any, color: string, width: number) => {
        const x1 = Math.round(p1.x * W), y1 = Math.round(p1.y * H)
        const x2 = Math.round(p2.x * W), y2 = Math.round(p2.y * H)
        const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1)
        const sx = x1 < x2 ? 1 : -1
        const sy = y1 < y2 ? 1 : -1
        let err = dx - dy
        let x = x1, y = y1
        for (;;) {
          for (let i = -Math.floor(width/2); i <= Math.floor(width/2); i++) {
            for (let j = -Math.floor(width/2); j <= Math.floor(width/2); j++) {
              image.setPixelColor(Jimp.cssColorToHex(color), x + i, y + j)
            }
          }
          if (x === x2 && y === y2) break
          const e2 = 2 * err
          if (e2 > -dy) { err -= dy; x += sx }
          if (e2 < dx) { err += dx; y += sy }
        }
      }

      const drawBox = (rect: any, color: string, width: number) => {
        const x = Math.round(rect.x * W), y = Math.round(rect.y * H)
        const w = Math.round(rect.w * W), h = Math.round(rect.h * H)
        for (let i = 0; i < w; i++) {
          for (let t = 0; t < width; t++) {
            image.setPixelColor(Jimp.cssColorToHex(color), x + i, y + t)
            image.setPixelColor(Jimp.cssColorToHex(color), x + i, y + h - 1 - t)
          }
        }
        for (let i = 0; i < h; i++) {
          for (let t = 0; t < width; t++) {
            image.setPixelColor(Jimp.cssColorToHex(color), x + t, y + i)
            image.setPixelColor(Jimp.cssColorToHex(color), x + w - 1 - t, y + i)
          }
        }
      }

      const drawLabel = async (pt: any, text: string, color: string) => {
        const x = Math.round(pt.x * W), y = Math.round(pt.y * H)
        const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
        const bg = Jimp.cssColorToHex(color)
        const label = new Jimp(200, 24, 0x00000080)
        image.composite(label, x, y)
        image.print(font, x + 6, y + 4, text)
      }

      const apply = async (items: any[]) => {
        for (const it of items || []) {
          const color = it.color || '#ffcc00'
          const width = it.width || 2
          if (it.type === 'line' && it.points && it.points.length >= 2) drawLine(it.points[0], it.points[1], color, width)
          if (it.type === 'arrow' && it.points && it.points.length >= 2) drawLine(it.points[0], it.points[1], color, width)
          if (it.type === 'box' && it.rect) drawBox(it.rect, color, width)
          if (it.type === 'label' && it.points && it.points[0] && it.text) await drawLabel(it.points[0], it.text, '#000000')
        }
      }

      const colorStructure = '#00ff88'
      const colorSmc = '#ff3366'
      const colorSr = '#3399ff'

      const applyWithColor = async (items: any[], color: string) => {
        for (const it of items || []) {
          const width = it.width || 3
          if (it.type === 'line' && it.points && it.points.length >= 2) drawLine(it.points[0], it.points[1], color, width)
          if (it.type === 'arrow' && it.points && it.points.length >= 2) drawLine(it.points[0], it.points[1], color, width)
          if (it.type === 'box' && it.rect) drawBox(it.rect, color, width)
          if (it.type === 'label' && it.points && it.points[0] && it.text) await drawLabel(it.points[0], it.text, color)
        }
      }

      await applyWithColor(ovStructure.structure || ovStructure.items || [], colorStructure)
      await applyWithColor(ovSmc.smc || ovSmc.items || [], colorSmc)
      await applyWithColor(ovSr.sr || ovSr.items || [], colorSr)

      const outBuf = await image.getBufferAsync(Jimp.MIME_PNG)
      annotatedBase64 = outBuf.toString('base64')
    } catch {
      annotatedBase64 = base64
    }

    return NextResponse.json({ structure, smc, sr, image: annotatedBase64 }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('generate-report error:', error?.message, error?.stack)
    return NextResponse.json({ error: error?.message || 'Failed to generate report' }, { status: 500 })
  }
}