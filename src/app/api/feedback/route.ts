import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/kv'

const KV_FEEDBACK_KEY = 'ghostmeter:feedback'

export async function POST(request: NextRequest) {
  try {
    const redis = getRedis()
    if (!redis) return NextResponse.json({ success: false, error: 'No database' }, { status: 500 })
    const { type, scores } = await request.json()
    if (type !== 'up' && type !== 'down') {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
    }
    const entry = { type, scores: scores || {}, timestamp: new Date().toISOString() }
    await redis.lpush(KV_FEEDBACK_KEY, JSON.stringify(entry))
    await redis.ltrim(KV_FEEDBACK_KEY, 0, 999)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const redis = getRedis()
    if (!redis) return NextResponse.json({ success: true, stats: { totalUp: 0, totalDown: 0, total: 0, satisfaction: 0 }, recent: [] })
    const feedbacks = await redis.lrange(KV_FEEDBACK_KEY, 0, 99)
    const parsed = feedbacks.map((f: string) => JSON.parse(f))
    const totalUp = parsed.filter((f: any) => f.type === 'up').length
    const totalDown = parsed.filter((f: any) => f.type === 'down').length
    const total = parsed.length
    const satisfaction = total > 0 ? Math.round((totalUp / total) * 100) : 0
    return NextResponse.json({ success: true, stats: { totalUp, totalDown, total, satisfaction }, recent: parsed.slice(0, 20) })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}