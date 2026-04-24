// Unified Payment Service - PayPal for Web, Google Play Billing for APK
// In APK mode: uses native bridge (window.AndroidApp) for Play Billing
// In web mode: uses PayPal

// Product IDs for Google Play Store (must match Play Console)
export const PLAY_STORE_PRODUCTS = {
  '1month': 'ghostmeter_premium_1month',
  '3months': 'ghostmeter_premium_3months',
  '12months': 'ghostmeter_premium_12months',
};

// Product info for PayPal (web)
export const PAYPAL_PRODUCTS = {
  '1month': { price: 1.99, name: '1 mois Premium' },
  '3months': { price: 4.99, name: '3 mois Premium' },
  '12months': { price: 14.99, name: '12 mois Premium' },
};

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Check if running in native APK
export const isNativeApp = (): boolean => {
  return !!(typeof window !== 'undefined' && (window as any).__GHOSTMETER_APK__);
};

// Check if Google Play Billing is available via native bridge
export const canUsePlayBilling = async (): Promise<boolean> => {
  const androidApp = (window as any).AndroidApp;
  return !!(androidApp && typeof androidApp.purchaseProduct === 'function');
};

// Purchase via Google Play Billing (native bridge)
export const purchaseWithPlayBilling = async (
  packId: '1month' | '3months' | '12months',
  userId?: string
): Promise<PaymentResult> => {
  return new Promise((resolve) => {
    const androidApp = (window as any).AndroidApp;

    if (!androidApp || typeof androidApp.purchaseProduct !== 'function') {
      resolve({ success: false, error: 'Play Billing non disponible' });
      return;
    }

    const productId = PLAY_STORE_PRODUCTS[packId];
    console.log('[Payment] Starting Play Billing purchase:', productId);

    // Clear previous result
    (window as any).__purchaseResult__ = null;

    // Poll for result from native
    const checkInterval = setInterval(() => {
      const result = (window as any).__purchaseResult__;
      if (result) {
        clearInterval(checkInterval);
        (window as any).__purchaseResult__ = null;
        if (result.success) {
          console.log('[Payment] Purchase successful:', result.transactionId);
          activatePremiumAfterPurchase(packId, result.transactionId, 'playstore');
          resolve({ success: true, transactionId: result.transactionId });
        } else if (result.error === 'cancelled') {
          resolve({ success: false, error: 'Achat annule' });
        } else {
          console.error('[Payment] Purchase error:', result.error);
          resolve({ success: false, error: "Erreur lors de l'achat" });
        }
      }
    }, 300);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      (window as any).__purchaseResult__ = null;
      resolve({ success: false, error: 'Delai depasse' });
    }, 300000);

    // Start native purchase
    androidApp.purchaseProduct(productId);
  });
};

// Purchase via PayPal (web)
export const purchaseWithPayPal = async (
  packId: '1month' | '3months' | '12months',
  email: string
): Promise<{ success: boolean; approvalUrl?: string; error?: string }> => {
  try {
    const packInfo = PAYPAL_PRODUCTS[packId];
    console.log('[Payment] Starting PayPal purchase:', packId, packInfo.price);

    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, price: packInfo.price })
    });

    const data = await response.json();

    if (data.approvalUrl) {
      return { success: true, approvalUrl: data.approvalUrl };
    }

    return { success: false, error: data.error || 'Erreur PayPal' };
  } catch (e: any) {
    console.error('[Payment] PayPal error:', e);
    return { success: false, error: e.message || 'Erreur PayPal' };
  }
};

// Restore purchases from Google Play
export const restorePlayStorePurchases = async (userId?: string): Promise<PaymentResult> => {
  return new Promise((resolve) => {
    const androidApp = (window as any).AndroidApp;

    if (!androidApp || typeof androidApp.restorePurchases !== 'function') {
      resolve({ success: false, error: 'Restauration non disponible' });
      return;
    }

    console.log('[Payment] Restoring purchases...');

    (window as any).__restoreResult__ = null;

    const checkInterval = setInterval(() => {
      const result = (window as any).__restoreResult__;
      if (result) {
        clearInterval(checkInterval);
        (window as any).__restoreResult__ = null;
        if (result.success) {
          const packId = getPackIdFromProductId(result.productId);
          activatePremiumAfterPurchase(packId, result.transactionId, 'playstore');
          resolve({ success: true, transactionId: result.transactionId });
        } else {
          resolve({ success: false, error: 'Aucun achat trouve' });
        }
      }
    }, 300);

    setTimeout(() => {
      clearInterval(checkInterval);
      (window as any).__restoreResult__ = null;
      resolve({ success: false, error: 'Delai depasse' });
    }, 30000);

    androidApp.restorePurchases();
  });
};

// Helper: Get pack ID from product ID
const getPackIdFromProductId = (productId: string): '1month' | '3months' | '12months' => {
  for (const [packId, pId] of Object.entries(PLAY_STORE_PRODUCTS)) {
    if (pId === productId) return packId as any;
  }
  return '1month';
};

// Notify backend to activate premium
const activatePremiumAfterPurchase = async (
  packId: string,
  transactionId: string,
  provider: 'playstore' | 'paypal'
): Promise<void> => {
  try {
    const email = localStorage.getItem('ghostmeter_email');
    await fetch('/api/payment/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, packId, transactionId, provider })
    });
  } catch (e) {
    console.error('[Payment] Error activating premium:', e);
  }
};

// Main purchase function
export const purchasePremium = async (
  packId: '1month' | '3months' | '12months',
  email: string
): Promise<{ success: boolean; approvalUrl?: string; transactionId?: string; error?: string; useWeb?: boolean }> => {
  const native = isNativeApp();
  console.log('[Payment] purchasePremium, isNative:', native, 'packId:', packId);

  if (native) {
    const canUse = await canUsePlayBilling();
    if (canUse) {
      return await purchaseWithPlayBilling(packId, email);
    }
    console.log('[Payment] Play Billing not available, fallback to PayPal web');
    const result = await purchaseWithPayPal(packId, email);
    return { ...result, useWeb: true };
  }

  return await purchaseWithPayPal(packId, email);
};

const PaymentManager = {
  isNativeApp,
  canUsePlayBilling,
  purchaseWithPlayBilling,
  purchaseWithPayPal,
  restorePlayStorePurchases,
  purchasePremium,
  PLAY_STORE_PRODUCTS,
  PAYPAL_PRODUCTS
};

export default PaymentManager;
