import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: '1.19.5',
    buildTime: new Date().toISOString(),
  });
}
