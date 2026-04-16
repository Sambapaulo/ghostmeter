// Unified Payment Service - PayPal for Web, Google Play Billing for APK
import { InAppPurchase } from 'capacitor-plugin-purchase';
import { Capacitor } from '@capacitor/core';

// Product IDs for Google Play Store (must match Play Console)
export const PLAY_STORE_PRODUCTS = {
  '1month': 'ghostmeter_premium_1month',
  '3months': 'ghostmeter_premium_3months',
  '12months': 'ghostmeter_premium_12months',
};

// Product IDs for PayPal (existing)
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

export interface ProductInfo {
  id: string;
  title: string;
  description: string;
  price: string;
  priceValue: number;
  currency: string;
}

// Check if running in native APK
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Check if Google Play Billing is available
export const canUsePlayBilling = async (): Promise<boolean> => {
  if (!isNativeApp()) return false;

  try {
    const { allowed } = await InAppPurchase.canMakePurchases();
    return allowed;
  } catch (e) {
    console.error('[Payment] Error checking Play Billing:', e);
    return false;
  }
};

// Get products from Google Play Store
export const getPlayStoreProducts = async (): Promise<ProductInfo[]> => {
  try {
    const result = await InAppPurchase.getProducts({
      productIds: Object.values(PLAY_STORE_PRODUCTS),
      productType: 'non-consumable'
    });

    return result.products.map((p: any) => ({
      id: p.productId,
      title: p.title,
      description: p.description,
      price: p.price,
      priceValue: parseFloat(p.priceAmountMicros) / 1000000,
      currency: p.priceCurrencyCode || 'EUR'
    }));
  } catch (e) {
    console.error('[Payment] Error getting Play Store products:', e);
    return [];
  }
};

// Purchase via Google Play Billing
export const purchaseWithPlayBilling = async (
  packId: '1month' | '3months' | '12months',
  userId?: string
): Promise<PaymentResult> => {
  try {
    const productId = PLAY_STORE_PRODUCTS[packId];

    console.log('[Payment] Starting Play Billing purchase:', productId);

    const result = await InAppPurchase.purchaseProduct({
      productId,
      productType: 'non-consumable',
      userId
    });

    if (result.transactionId) {
      console.log('[Payment] Purchase successful:', result.transactionId);

      // Notify backend to activate premium
      await activatePremiumAfterPurchase(packId, result.transactionId, 'playstore');

      return {
        success: true,
        transactionId: result.transactionId
      };
    }

    return { success: false, error: 'Pas de transaction retournée' };
  } catch (e: any) {
    console.error('[Payment] Play Billing error:', e);

    // User cancelled
    if (e.code === 'PURCHASE_CANCELLED') {
      return { success: false, error: 'Achat annulé' };
    }

    return { success: false, error: e.message || 'Erreur lors de l\'achat' };
  }
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
      body: JSON.stringify({
        email,
        price: packInfo.price
      })
    });

    const data = await response.json();

    if (data.approvalUrl) {
      return {
        success: true,
        approvalUrl: data.approvalUrl
      };
    }

    return { success: false, error: data.error || 'Erreur PayPal' };
  } catch (e: any) {
    console.error('[Payment] PayPal error:', e);
    return { success: false, error: e.message || 'Erreur PayPal' };
  }
};

// Restore purchases from Google Play
export const restorePlayStorePurchases = async (userId?: string): Promise<PaymentResult> => {
  try {
    const result = await InAppPurchase.restorePurchases({ userId });

    if (result.purchases && result.purchases.length > 0) {
      console.log('[Payment] Restored purchases:', result.purchases);

      // Activate premium for restored purchases
      for (const purchase of result.purchases) {
        await activatePremiumAfterPurchase(
          getPackIdFromProductId(purchase.productId),
          purchase.transactionId,
          'playstore'
        );
      }

      return { success: true, transactionId: result.purchases[0].transactionId };
    }

    return { success: false, error: 'Aucun achat trouvé' };
  } catch (e: any) {
    console.error('[Payment] Restore error:', e);
    return { success: false, error: e.message || 'Erreur lors de la restauration' };
  }
};

// Helper: Get pack ID from Play Store product ID
const getPackIdFromProductId = (productId: string): '1month' | '3months' | '12months' => {
  for (const [packId, pId] of Object.entries(PLAY_STORE_PRODUCTS)) {
    if (pId === productId) {
      return packId as '1month' | '3months' | '12months';
    }
  }
  return '1month'; // Default
};

// Notify backend to activate premium after successful purchase
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
      body: JSON.stringify({
        email,
        packId,
        transactionId,
        provider
      })
    });
  } catch (e) {
    console.error('[Payment] Error activating premium:', e);
  }
};

// Main purchase function - auto-detects platform
export const purchasePremium = async (
  packId: '1month' | '3months' | '12months',
  email: string
): Promise<{ success: boolean; approvalUrl?: string; transactionId?: string; error?: string; useWeb?: boolean }> => {
  const isNative = isNativeApp();

  console.log('[Payment] purchasePremium called, isNative:', isNative, 'packId:', packId);

  if (isNative) {
    // Try Play Billing first
    const canUseBilling = await canUsePlayBilling();

    if (canUseBilling) {
      const result = await purchaseWithPlayBilling(packId, email);
      return result;
    }

    // Fallback: redirect to web PayPal
    console.log('[Payment] Play Billing not available, redirecting to PayPal web');
    const result = await purchaseWithPayPal(packId, email);
    return { ...result, useWeb: true };
  }

  // Web: use PayPal
  return await purchaseWithPayPal(packId, email);
};

const PaymentManager = {
  isNativeApp,
  canUsePlayBilling,
  getPlayStoreProducts,
  purchaseWithPlayBilling,
  purchaseWithPayPal,
  restorePlayStorePurchases,
  purchasePremium,
  PLAY_STORE_PRODUCTS,
  PAYPAL_PRODUCTS
};

export default PaymentManager;
