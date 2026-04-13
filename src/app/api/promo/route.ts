import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/kv';
import { getPromoCode, incrementPromoUse, isKVAvailable } from '@/lib/localStore';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ valid: false, message: 'Code requis' }, { status: 400 });
  }

  const upperCode = code.toUpperCase();

  // D'abord chercher dans les settings (codes de l'admin)
  try {
    const settings = await getSettings();
    const settingsPromo = settings.promoCodes?.find((p: any) => p.code === upperCode && p.active);
    
    if (settingsPromo) {
      // Verifier si le code a atteint son nombre max d'utilisations
      if (settingsPromo.maxUses > 0 && settingsPromo.currentUses >= settingsPromo.maxUses) {
        return NextResponse.json({ 
          valid: false, 
          message: 'Code promo epuise' 
        });
      }

      return NextResponse.json({ 
        valid: true, 
        discount: settingsPromo.discount,
        discountType: settingsPromo.discountType || 'percent',
        message: settingsPromo.discountType === 'percent' 
          ? `-${settingsPromo.discount}% applique !` 
          : `-${settingsPromo.discount}${settings.premiumCurrency} applique !`
      });
    }
  } catch (e) {
    console.error('Error checking settings promo:', e);
  }

  // Ensuite chercher dans localStore (codes crees via API)
  const promo = await getPromoCode(code);
  
  if (!promo) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Code promo invalide' 
    });
  }

  // Verifier si le code a expire
  if (promo.expiresAt && promo.expiresAt < Date.now()) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Code promo expire' 
    });
  }

  // Verifier si le code a atteint son nombre maximum d'utilisations
  if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Code promo epuise' 
    });
  }

  return NextResponse.json({ 
    valid: true, 
    discount: promo.discountPercent,
    discountType: 'percent',
    message: `-${promo.discountPercent}% applique !`
  });
}

export async function POST(request: NextRequest) {
  // Creer un nouveau code promo (admin seulement)
  const body = await request.json();
  const { code, discountPercent, maxUses, expiresAt } = body;

  if (!code || !discountPercent) {
    return NextResponse.json({ error: 'Code et reduction requis' }, { status: 400 });
  }

  const { setPromoCode } = await import('@/lib/localStore');
  
  await setPromoCode(code, {
    code: code.toUpperCase(),
    discountPercent,
    maxUses: maxUses || 0,
    currentUses: 0,
    expiresAt: expiresAt || null
  });

  return NextResponse.json({ success: true, message: 'Code promo cree' });
}
