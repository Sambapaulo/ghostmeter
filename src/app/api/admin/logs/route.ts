import { NextRequest, NextResponse } from 'next/server'
import { getAdminLogs, getUserLogs, getActivityStats } from '@/lib/localStore'
import { isAdminAuthenticated } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await isAdminAuthenticated()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'users'
    const limit = parseInt(searchParams.get('limit') || '100')
    const email = searchParams.get('email') || undefined

    if (type === 'stats') {
      const stats = await getActivityStats()
      return NextResponse.json({ success: true, stats })
    }

    if (type === 'admin') {
      const logs = await getAdminLogs(limit)
      return NextResponse.json({ success: true, logs })
    }

    const logs = await getUserLogs(limit, email || undefined)
    return NextResponse.json({ success: true, logs })
  } catch (error) {
    console.error('Logs error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
