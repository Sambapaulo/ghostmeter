// Stockage en mémoire pour le développement local (quand KV n'est pas disponible)
// Ce module est partagé entre les différentes APIs d'authentification

export interface User {
  email: string;
  password: string;
  isPremium: boolean;
  premiumSince: string | null;
  analysesCount: number;
  createdAt: string;
  lastActive: string;
  paypalOrderId?: string;
  adminGranted?: boolean;
  sessionId?: string;
  sessionCreatedAt?: string;
}

interface ResetToken {
  email: string;
  expires: number;
}

// Maps pour le stockage local
export const localUserStore = new Map<string, User>();
export const localTokenStore = new Map<string, ResetToken>();

// Fonction pour vérifier si KV est disponible
export function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Fonction pour récupérer un utilisateur
export async function getUser(email: string): Promise<User | null> {
  const key = email.toLowerCase();
  
  if (!isKVAvailable()) {
    return localUserStore.get(key) || null;
  }
  
  const { kv } = await import('@vercel/kv');
  return await kv.get<User>('user:' + key);
}

// Fonction pour sauvegarder un utilisateur
export async function setUser(email: string, user: User): Promise<void> {
  const key = email.toLowerCase();
  
  if (!isKVAvailable()) {
    localUserStore.set(key, user);
    return;
  }
  
  const { kv } = await import('@vercel/kv');
  await kv.set('user:' + key, user);
}

// Fonction pour récupérer un token de reset
export async function getResetToken(token: string): Promise<ResetToken | null> {
  if (!isKVAvailable()) {
    return localTokenStore.get(token) || null;
  }
  
  const { kv } = await import('@vercel/kv');
  return await kv.get<ResetToken>('reset:' + token);
}

// Fonction pour sauvegarder un token de reset
export async function setResetToken(token: string, data: ResetToken, ttlSeconds?: number): Promise<void> {
  if (!isKVAvailable()) {
    localTokenStore.set(token, data);
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
    localTokenStore.delete(token);
    return;
  }
  
  const { kv } = await import('@vercel/kv');
  await kv.del('reset:' + token);
}