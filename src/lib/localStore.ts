// Stockage en memoire pour le developpement local (quand KV n'est pas disponible)
// Ce module est partage entre les differentes APIs d'authentification

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
  referralPremium?: boolean;
  sessionId?: string;
  sessionCreatedAt?: string;
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
  expiresAt: number | null;
}

interface AppSettings {
  freeAnalysesPerDay: number;
  pack1Month: number;
  pack3Months: number;
  pack12Months: number;
  premiumCurrency: string;
  adminPassword?: string;
}

// Maps pour le stockage local
export const localUserStore = new Map<string, User>();
export const localTokenStore = new Map<string, ResetToken>();
const localPromoStore = new Map<string, PromoCode>();

const defaultSettings: AppSettings = {
  freeAnalysesPerDay: 3,
  pack1Month: 1.99,
  pack3Months: 4.99,
  pack12Months: 14.99,
  premiumCurrency: '€'
};

// Fonction pour verifier si KV est disponible
export function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Fonction pour recuperer un utilisateur
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

// Fonction pour recuperer un token de reset
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

// Fonction pour recuperer un code promo
export async function getPromoCode(code: string): Promise<PromoCode | null> {
  if (!isKVAvailable()) {
    return localPromoStore.get(code.toUpperCase()) || null;
  }
  const { kv } = await import('@vercel/kv');
  return await kv.get<PromoCode>('promo:' + code.toUpperCase());
}

// Fonction pour sauvegarder un code promo
export async function setPromoCode(code: string, data: PromoCode): Promise<void> {
  if (!isKVAvailable()) {
    localPromoStore.set(code.toUpperCase(), data);
    return;
  }
  const { kv } = await import('@vercel/kv');
  await kv.set('promo:' + code.toUpperCase(), data);
}

// Fonction pour mettre a jour les utilisations d'un code promo
export async function incrementPromoUse(code: string): Promise<void> {
  if (!isKVAvailable()) {
    const promo = localPromoStore.get(code.toUpperCase());
    if (promo) {
      promo.currentUses++;
      localPromoStore.set(code.toUpperCase(), promo);
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

// Fonction pour recuperer les settings
export async function getSettings(): Promise<AppSettings> {
  if (!isKVAvailable()) {
    return defaultSettings;
  }
  const { kv } = await import('@vercel/kv');
  const settings = await kv.get<AppSettings>('settings:app');
  return settings || defaultSettings;
}

// Fonction pour mettre a jour les settings
export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  if (!isKVAvailable()) {
    return;
  }
  const { kv } = await import('@vercel/kv');
  const current = await getSettings();
  await kv.set('settings:app', { ...current, ...settings });
}

// Interfaces pour les logs
export interface AdminLog {
  id: string;
  timestamp: number;
  action: 'login' | 'logout' | 'change_password' | 'update_settings' | 'create_promo' | 'delete_promo' | 'grant_premium' | 'revoke_premium' | 'send_newsletter';
  details: string;
  ip?: string;
}

export interface UserActivityLog {
  id: string;
  timestamp: number;
  email: string;
  action: 'login' | 'register' | 'logout' | 'analyze' | 'coach_question' | 'payment' | 'promo_used';
  details: string;
  plan?: string;
  price?: number;
}

// Maps pour les logs
const localAdminLogs = new Map<string, AdminLog>();
const localUserLogs = new Map<string, UserActivityLog>();

// Fonctions pour les logs admin
export async function addAdminLog(action: AdminLog['action'], details: string, ip?: string): Promise<void> {
  const log: AdminLog = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: Date.now(),
    action,
    details,
    ip
  };
  
  if (!isKVAvailable()) {
    localAdminLogs.set(log.id, log);
    return;
  }
  const { kv } = await import('@vercel/kv');
  await kv.lpush('logs:admin', log);
  await kv.ltrim('logs:admin', 0, 999); // Garder les 1000 derniers
}

export async function getAdminLogs(limit: number = 100): Promise<AdminLog[]> {
  if (!isKVAvailable()) {
    return Array.from(localAdminLogs.values()).sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
  const { kv } = await import('@vercel/kv');
  return await kv.lrange('logs:admin', 0, limit - 1) as AdminLog[];
}

// Fonctions pour les logs utilisateur
export async function addUserLog(email: string, action: UserActivityLog['action'], details: string, extra?: { plan?: string; price?: number }): Promise<void> {
  const log: UserActivityLog = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: Date.now(),
    email: email.toLowerCase(),
    action,
    details,
    ...extra
  };
  
  if (!isKVAvailable()) {
    localUserLogs.set(log.id, log);
    return;
  }
  const { kv } = await import('@vercel/kv');
  await kv.lpush('logs:users', log);
  await kv.ltrim('logs:users', 0, 4999); // Garder les 5000 derniers
}

export async function getUserLogs(limit: number = 100, email?: string): Promise<UserActivityLog[]> {
  if (!isKVAvailable()) {
    let logs = Array.from(localUserLogs.values());
    if (email) logs = logs.filter(l => l.email === email.toLowerCase());
    return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
  const { kv } = await import('@vercel/kv');
  let logs = await kv.lrange('logs:users', 0, limit - 1) as UserActivityLog[];
  if (email) logs = logs.filter(l => l.email === email.toLowerCase());
  return logs;
}

// Stats rapides (version etendue pour le Journal Utilisateurs)
export async function getActivityStats(): Promise<{
  today: { analyses: number; coach: number; payments: number; signups: number; logins: number; promosUsed: number };
  total: { analyses: number; coach: number; payments: number; users: number; logins: number; promosUsed: number; premiumUsers: number; conversionRate: number };
  dailyLogins: { date: string; count: number }[];
  dailyAnalyses: { date: string; count: number }[];
  dailyCoach: { date: string; count: number }[];
  promoUsage: { code: string; count: number }[];
  recentConversions: { email: string; date: string; plan?: string }[];
}> {
  const logs = await getUserLogs(5000);
  const today = new Date().setHours(0,0,0,0);
  
  const todayLogs = logs.filter(l => l.timestamp >= today);

  // Logins par jour (7 derniers jours)
  const dailyLoginsMap = new Map<string, number>();
  const dailyAnalysesMap = new Map<string, number>();
  const dailyCoachMap = new Map<string, number>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyLoginsMap.set(key, 0);
    dailyAnalysesMap.set(key, 0);
    dailyCoachMap.set(key, 0);
  }

  logs.forEach(l => {
    const dateKey = new Date(l.timestamp).toISOString().split('T')[0];
    if (dailyLoginsMap.has(dateKey)) {
      if (l.action === 'login') dailyLoginsMap.set(dateKey, (dailyLoginsMap.get(dateKey) || 0) + 1);
      if (l.action === 'analyze') dailyAnalysesMap.set(dateKey, (dailyAnalysesMap.get(dateKey) || 0) + 1);
      if (l.action === 'coach_question') dailyCoachMap.set(dateKey, (dailyCoachMap.get(dateKey) || 0) + 1);
    }
  });

  // Utilisation des codes promo
  const promoUsageMap = new Map<string, number>();
  logs.filter(l => l.action === 'promo_used').forEach(l => {
    const code = l.details.replace('Code promo utilise: ', '').toUpperCase();
    promoUsageMap.set(code, (promoUsageMap.get(code) || 0) + 1);
  });

  // Conversions recentes (gratuit -> premium)
  const recentConversions = logs
    .filter(l => l.action === 'payment' || (l.action === 'promo_used' && l.details.includes('Premium active')))
    .slice(0, 20)
    .map(l => ({
      email: l.email,
      date: new Date(l.timestamp).toLocaleDateString('fr-FR'),
      plan: l.plan
    }));

  // Calcul du taux de conversion total
  const uniqueUsers = new Set(logs.map(l => l.email));
  const premiumPayments = new Set(
    logs.filter(l => l.action === 'payment').map(l => l.email)
  );
  const premiumPromos = new Set(
    logs.filter(l => l.action === 'promo_used').map(l => l.email)
  );
  const allPremiumUsers = new Set([...premiumPayments, ...premiumPromos]);

  return {
    today: {
      analyses: todayLogs.filter(l => l.action === 'analyze').length,
      coach: todayLogs.filter(l => l.action === 'coach_question').length,
      payments: todayLogs.filter(l => l.action === 'payment').length,
      signups: todayLogs.filter(l => l.action === 'register').length,
      logins: todayLogs.filter(l => l.action === 'login').length,
      promosUsed: todayLogs.filter(l => l.action === 'promo_used').length,
    },
    total: {
      analyses: logs.filter(l => l.action === 'analyze').length,
      coach: logs.filter(l => l.action === 'coach_question').length,
      payments: logs.filter(l => l.action === 'payment').length,
      users: uniqueUsers.size,
      logins: logs.filter(l => l.action === 'login').length,
      promosUsed: logs.filter(l => l.action === 'promo_used').length,
      premiumUsers: allPremiumUsers.size,
      conversionRate: uniqueUsers.size > 0 ? Math.round((allPremiumUsers.size / uniqueUsers.size) * 100) : 0,
    },
    dailyLogins: Array.from(dailyLoginsMap.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      count
    })),
    dailyAnalyses: Array.from(dailyAnalysesMap.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      count
    })),
    dailyCoach: Array.from(dailyCoachMap.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      count
    })),
    promoUsage: Array.from(promoUsageMap.entries()).map(([code, count]) => ({ code, count })),
    recentConversions
  };
}
