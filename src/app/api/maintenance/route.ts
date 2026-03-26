import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/kv';

export const dynamic = 'force-dynamic';

// GET - Check if maintenance mode is active
export async function GET() {
  try {
    const settings = await getSettings();
    
    return NextResponse.json({
      maintenanceMode: settings.maintenanceMode || false,
      message: settings.maintenanceMessage || 'Maintenance en cours. Veuillez réessayer dans quelques minutes.'
    });
  } catch (error) {
    console.error('Maintenance check error:', error);
    return NextResponse.json({
      maintenanceMode: false,
      message: ''
    });
  }
}
