import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: '1.24.0',
    buildTime: new Date().toISOString(),
  });
}
