import { createHash, randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface User {
  email: string;
  password: string;
  isPremium: boolean;
  premiumSince: string | null;
  premiumPlan?: '1month' | '3months' | '12months' | null;
  premiumExpiresAt?: string | null;
  analysesCount: number;
  createdAt: string;
  lastActive: string;
  paypalOrderId?: string;
  adminGranted?: boolean;
  sessionId?: string;
  sessionCreatedAt?: string;
  name?: string;
}

interface ResetToken {
  email: string;
  expires: number;
}

interface PromoCode {
  code: string;
  discountPercent: number;
  maxUses: number;
  currentUses: number;
  expiresAt: number;
}

// Chemin du fichier de stockage
const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

// Stockage en memoire (charge au demarrage)
let localUserStore = new Map<string, User>();
let localTokenStore = new Map<string, ResetToken>();
let localPromoStore = new Map<string, PromoCode>();
let isLoaded = false;

// Charger les donnees depuis le fichier
function loadData() {
  if (isLoaded) return;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (data.users) {
        localUserStore = new Map(Object.entries(data.users));
      }
      if (data.tokens) {
        localTokenStore = new Map(Object.entries(data.tokens));
      }
      if (data.promos) {
        localPromoStore = new Map(Object.entries(data.promos));
      }
      console.log('Donnees chargees:', localUserStore.size, 'utilisateurs');
    }
  } catch (e) {
    console.error('Erreur chargement donnees:', e);
  }
  isLoaded = true;
}

// Sauvegarder les donnees dans le fichier
function saveData() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = {
      users: Object.fromEntries(localUserStore),
      tokens: Object.fromEntries(localTokenStore),
      promos: Object.fromEntries(localPromoStore)
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Erreur sauvegarde donnees:', e);
  }
}

// Fonction pour verifier si KV est disponible
export function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Fonction pour recuperer un utilisateur
export async function getUser(email: string): Promise<User | null> {
  if (!isKVAvailable()) {
    loadData();
    return localUserStore.get(email.toLowerCase()) || null;
  }
  const { kv } = await import('@vercel/kv');
  return await kv.get<User>('user:' + email.toLowerCase());
}

// Fonction pour sauvegarder un utilisateur
export async function setUser(email: string, user: User): Promise<void> {
  if (!isKVAvailable()) {
    loadData();
    localUserStore.set(email.toLowerCase(), user);
    saveData();
    return;
  }
  const { kv } = await import('@vercel/kv');
  await kv.set('user:' + email.toLowerCase(), user);
}

// Fonction pour recuperer un token de reset
export async function getResetToken(token: string): Promise<ResetToken | null> {
  if (!isKVAvailable()) {
    loadData();
    return localTokenStore.get(token) || null;
  }
  const { kv } = await import('@vercel/kv');
  return await kv.get<ResetToken>('reset:' + token);
}

// Fonction pour sauvegarder un token de reset
export async function setResetToken(token: string, data: ResetToken, ttlSeconds?: number): Promise<void> {
  if (!isKVAvailable()) {
    loadData();
    localTokenStore.set(token, data);
    saveData();
    return;
  }
  const { kv } = await import('@vercel/kv');
  if (ttlSeconds) {
    await kv.set('reset:' + token, data, { ex: ttlSeconds });
  } else {
    await kv.set('reset:' + token, data);
  }
}

// Fonction pour supprimer un token de reset
export async function deleteResetToken(token: string): Promise<void> {
  if (!isKVAvailable()) {
    loadData();
    localTokenStore.delete(token);
    saveData();
    return;
  }
  const { kv } = await import('@vercel/kv');
  await kv.del('reset:' + token);
}

// Fonction pour recuperer un code promo
export async function getPromoCode(code: string): Promise<PromoCode | null> {
  if (!isKVAvailable()) {
    loadData();
    return localPromoStore.get(code.toUpperCase()) || null;
  }
  const { kv } = await import('@vercel/kv');
  return await kv.get<PromoCode>('promo:' + code.toUpperCase());
}

// Fonction pour sauvegarder un code promo
export async function setPromoCode(code: string, data: PromoCode): Promise<void> {
  if (!isKVAvailable()) {
    loadData();
    localPromoStore.set(code.toUpperCase(), data);
    saveData();
    return;
  }
  const { kv } = await import('@vercel/kv');
  await kv.set('promo:' + code.toUpperCase(), data);
}

// Fonction pour mettre a jour les utilisations d'un code promo
export async function incrementPromoUse(code: string): Promise<void> {
  if (!isKVAvailable()) {
    loadData();
    const promo = localPromoStore.get(code.toUpperCase());
    if (promo) {
      promo.currentUses++;
      localPromoStore.set(code.toUpperCase(), promo);
      saveData();
    }
    return;
  }
  const { kv } = await import('@vercel/kv');
  const promo = await kv.get<PromoCode>('promo:' + code.toUpperCase());
  if (promo) {
    promo.currentUses++;
    await kv.set('promo:' + code.toUpperCase(), promo);
  }
}

// Settings interface
interface AppSettings {
  freeAnalysesPerDay: number;
  pack1Month: number;
  pack3Months: number;
  pack12Months: number;
  premiumCurrency: string;
}

// Default settings
const defaultSettings: AppSettings = {
  freeAnalysesPerDay: 3,
  pack1Month: 1.99,
  pack3Months: 4.99,
  pack12Months: 14.99,
  premiumCurrency: '€'
};

// Get application settings
export async function getSettings(): Promise<AppSettings> {
  if (!isKVAvailable()) {
    loadData();
    return defaultSettings;
  }
  const { kv } = await import('@vercel/kv');
  const settings = await kv.get<AppSettings>('settings:app');
  return settings || defaultSettings;
}

// Update application settings
export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  if (!isKVAvailable()) {
    return;
  }
  const { kv } = await import('@vercel/kv');
  const current = await getSettings();
  await kv.set('settings:app', { ...current, ...settings });
}
