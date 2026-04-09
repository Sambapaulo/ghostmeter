import { NextRequest, NextResponse } from 'next/server';

async function verifyGoogleToken(accessToken: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
    );
    if (!response.ok) return null;
    const tokenInfo = await response.json();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (tokenInfo.aud !== clientId) return null;
    return {
      email: tokenInfo.email,
      emailVerified: tokenInfo.email_verified,
      expiresAt: tokenInfo.exp,
    };
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, name, accessToken } = body;

    if (action === 'google') {
      if (!accessToken) {
        return NextResponse.json({ error: 'Access token required' }, { status: 400 });
      }
      const tokenInfo = await verifyGoogleToken(accessToken);
      if (!tokenInfo) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
      return NextResponse.json({
        success: true,
        user: { email: tokenInfo.email, name, emailVerified: tokenInfo.emailVerified },
      });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
