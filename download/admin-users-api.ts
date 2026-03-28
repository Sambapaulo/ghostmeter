import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

interface UserData {
  email: string
  isPremium: boolean
  analysesCount: number
  createdAt: string
  lastActive: string
}

export async function GET() {
  try {
    // Check if KV is available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return NextResponse.json({
        success: true,
        users: [],
        message: 'KV not configured'
      })
    }

    // Get all user keys
    const keys = await kv.keys('user:*')
    
    if (!keys || keys.length === 0) {
      return NextResponse.json({
        success: true,
        users: []
      })
    }

    // Fetch all users
    const users: UserData[] = []
    
    for (const key of keys) {
      const userData = await kv.get(key) as any
      if (userData && userData.isPremium) {
        users.push({
          email: key.replace('user:', ''),
          isPremium: userData.isPremium || false,
          analysesCount: userData.analysesCount || 0,
          createdAt: userData.createdAt || 'N/A',
          lastActive: userData.lastActive || 'N/A'
        })
      }
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => {
      if (a.createdAt === 'N/A') return 1
      if (b.createdAt === 'N/A') return -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}
