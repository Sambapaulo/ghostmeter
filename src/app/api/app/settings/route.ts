import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/kv'

// GET - Public endpoint for app settings (no auth required)
// Returns only what the client needs: freeAnalysesPerDay, pack prices, currency
export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json({
      success: true,
      settings: {
        premiumCurrency: settings.premiumCurrency || '\u20ac',
        premiumPeriod: settings.premiumPeriod || 'mois',
        freeAnalysesPerDay: settings.freeAnalysesPerDay || 3,
        pack1Month: settings.pack1Month || 1.99,
        pack3Months: settings.pack3Months || 4.99,
        pack12Months: settings.pack12Months || 14.99,
        maintenanceMode: settings.maintenanceMode || false,
        maintenanceMessage: settings.maintenanceMessage || ''
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 })
  }
}
