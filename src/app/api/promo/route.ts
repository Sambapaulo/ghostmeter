import { NextRequest, NextResponse } from 'next/server';
import { getPromoCode, incrementPromoUse, isKVAvailable } from '@/lib/localStore';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ valid: false, message: 'Code requis' }, { status: 400 });
  }

  const promo = await getPromoCode(code);
  
  if (!promo) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Code promo invalide' 
    });
  }

  // Vérifier si le code a expiré
  if (promo.expiresAt && promo.expiresAt < Date.now()) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Code promo expiré' 
    });
  }

  // Vérifier si le code a atteint son nombre maximum d'utilisations
  if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Code promo épuisé' 
    });
  }

  return NextResponse.json({ 
    valid: true, 
    discount: promo.discountPercent,
    discountType: 'percent',
    message: `-${promo.discountPercent}% appliqué !`
  });
}

export async function POST(request: NextRequest) {
  // Créer un nouveau code promo (admin seulement)
  const body = await request.json();
  const { code, discountPercent, maxUses, expiresAt } = body;

  if (!code || !discountPercent) {
    return NextResponse.json({ error: 'Code et réduction requis' }, { status: 400 });
  }

  const { setPromoCode } = await import('@/lib/localStore');
  
  await setPromoCode(code, {
    code: code.toUpperCase(),
    discountPercent,
    maxUses: maxUses || 0,
    currentUses: 0,
    expiresAt: expiresAt || null
  });

  return NextResponse.json({ success: true, message: 'Code promo créé' });
}
