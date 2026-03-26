'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles, Crown, RefreshCw, Share2, Menu, X, History,
  Trash2, ChevronRight, ChevronLeft, Check, Ghost, Tag, Camera, ClipboardPaste, LogOut, Mail, Info, FileText, CreditCard, Loader2, MessageCircle, Send, MessageSquare, Copy, Heart, Sun, Moon, Plus, Bell, BellOff, AlertCircle
} from 'lucide-react'
import dynamic from 'next/dynamic'

const OCRUploader = dynamic(() => import('@/components/OCRUploader'), { ssr: false })

// Dynamic imports for Capacitor - only loaded on client side
let App: any = null
let LocalNotifications: any = null
let Capacitor: any = null

// Load Capacitor modules only on client side
if (typeof window !== 'undefined') {
  try {
    App = require('@capacitor/app').App
  } catch (e) {}
  try {
    LocalNotifications = require('@capacitor/local-notifications').LocalNotifications
  } catch (e) {}
  try {
    Capacitor = require('@capacitor/core').Capacitor
  } catch (e) {}
}

// Global flag to track if we're in APK - set after initial detection
let _isAPK: boolean | null = null

// SYNCHRONOUS check - must work on first render
const checkIsAPKSync = (): boolean => {
  if (typeof window === 'undefined') return false
  if (_isAPK !== null) return _isAPK
  
  // Check URL parameter FIRST (most reliable)
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('from') === 'apk') {
    console.log('✅ APK detected via URL ?from=apk')
    _isAPK = true
    try { localStorage.setItem('ghostmeter_apk_mode', 'true') } catch(e) {}
    return true
  }
  
  // Check localStorage
  try {
    if (localStorage.getItem('ghostmeter_apk_mode') === 'true') {
      console.log('✅ APK detected via localStorage')
      _isAPK = true
      return true
    }
  } catch(e) {}
  
  // Check window marker
  if ((window as any).__GHOSTMETER_APK__ === true) {
    console.log('✅ APK detected via window marker')
    _isAPK = true
    return true
  }
  
  // Check User Agent for WebView
  const ua = navigator.userAgent
  const isAndroid = /Android/i.test(ua)
  if (isAndroid) {
    // Check for WebView indicators
    const hasWv = ua.indexOf('wv') > -1
    const hasWebView = ua.toLowerCase().indexOf('webview') > -1
    const hasVersion = /Version\/\d/i.test(ua)
    
    if (hasWv || hasWebView || hasVersion) {
      console.log('✅ APK detected via User Agent:', ua)
      _isAPK = true
      try { localStorage.setItem('ghostmeter_apk_mode', 'true') } catch(e) {}
      return true
    }
  }
  
  console.log('❌ Not APK mode. UA:', ua)
  _isAPK = false
  return false
}

// Helper to detect if running in APK (even when loading from external URL)
// Must be called after component mount (in useEffect)
const checkIsRunningInAPK = async (): Promise<boolean> => {
  return checkIsAPKSync()
}

// Separate component for promo code input to prevent focus loss
function PromoCodeInput({ 
  onValidate, 
  isValidating,
  currency
}: { 
  onValidate: (code: string) => void
  isValidating: boolean
  currency: string
}) {
  const [code, setCode] = useState('')
  
  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Code promo" 
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck="false"
          inputMode="text"
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
        />
      </div>
      <button 
        onClick={() => onValidate(code)} 
        disabled={isValidating || !code.trim()} 
        className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
      >
        {isValidating ? '...' : 'OK'}
      </button>
    </div>
  )
}

// Motivational messages bank
const motivationalMessages = [
  // Compliments personnels
  "Tu es incroyable de continuer à avancer 💪",
  "Quelqu'un quelque part a de la chance de te connaître",
  "Ta valeur ne dépend pas de sa réponse",
  "Tu as un cœur en or, ne laisse personne t'en douter",
  "Tu mérites l'amour, le vrai, le respectueux",
  "Ton énergie est précieuse, ne la gaspille pas",
  "Tu es assez, exactement comme tu es",
  "Tu es plus fort(e) que tu ne le penses",
  "Ta présence est un cadeau pour ceux qui savent l'apprécier",
  "Tu mérites d'être une priorité, pas une option",
  // Motivation
  "Nouveau jour = nouvelle opportunité de penser à TOI",
  "Aujourd'hui, sois gentil(le) avec toi-même",
  "Respire. Tu vas gérer cette journée comme un(e) champion(ne)",
  "Un petit pas vers toi, c'est un grand pas",
  "Chaque jour est une nouvelle chance",
  "Tu n'as pas besoin de validation pour être extraordinaire",
  "Continue d'avancer, même si c'est lentement",
  "Tu es en train de te reconstruire, et c'est beau",
  "Aujourd'hui, choisis TOI",
  "Progression, pas perfection",
  // Rappels de valeur
  "Tu vaux mieux qu'un message laissé sans réponse",
  "S'il voulait vraiment, il le ferait. Point.",
  "Tu es l'électricité, ne cherche pas quelqu'un pour t'allumer ⚡",
  "Ne laisse pas son silence définir ton bruit",
  "Tu es le/la roi/reine de ta vie 👑",
  "Tu mérites une réponse, pas du silence",
  "Ton temps est précieux, ne le donne pas à qui l'ignore",
  "Tu n'es pas une option de secours",
  "La bonne personne n'hésitera jamais",
  "Tu mérites la réciprocité, pas le questionnement",
  // Perspectives
  "Dans 6 mois, cette situation ne sera qu'un souvenir",
  "Le meilleur est devant toi, pas derrière",
  "Tu te reconstruis, brique par brique 🏗️",
  "La personne qui te mérite n'hésitera pas",
  "Chaque jour passé est un jour de plus vers le bonheur",
  "Tu es sur le bon chemin, continue",
  "Cette épreuve te rendra plus fort(e)",
  "Ton futur 'moi' te remercie de tenir bon",
  "Les meilleures choses prennent du temps",
  "Tu écris ton histoire, pas lui/elle",
  // Bonus
  "☀️ Bonjour ! N'oublie pas ta valeur aujourd'hui",
  "💜 Tu es aimé(e) et apprécié(e), même si tu ne le vois pas",
  "🌟 Brille de ton propre lumière aujourd'hui",
  "💪 Tes cicatrices sont la preuve de ta force",
  "🎯 Aujourd'hui, fais une chose juste pour TOI",
  "🌈 Après la pluie vient le beau temps",
  "✨ Tu es exactement où tu dois être",
  "🦋 Tu es en train de devenir qui tu dois être",
  "💫 Le bonheur t'attend au tournant",
  "🔥 Tu as survécu à 100% de tes mauvais jours"
]

// Types
interface AnalysisResult {
  interestScore: number
  manipulationScore: number
  ghostingScore: number
  overallScore: number
  advice: string
  punchline: string
  highlights: {
    positive: string[]
    negative: string[]
    neutral: string[]
  }
  vibe: string
  badges: string[]
}

interface SavedConversation {
  id: string
  date: string
  context: string
  preview: string
  analysis: AnalysisResult
  conversation: string
}

interface SavedCoachConversation {
  id: string
  date: string
  title: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  preview: string
}

interface AppSettings {
  premiumCurrency: string
  premiumPeriod: string
  freeAnalysesPerDay: number
  pack1Month: number
  pack3Months: number
  pack12Months: number
}

type AppState = 'home' | 'analyzing' | 'results' | 'reply' | 'coach'

// Context options
const contexts = [
  { id: 'crush', name: 'Crush secret', icon: '😍' },
  { id: 'ex', name: 'Ex', icon: '💔' },
  { id: 'new', name: 'Début de relation', icon: '✨' },
  { id: 'talking', name: 'Talking stage', icon: '💬' },
  { id: 'situationship', name: 'Situationship', icon: '🤷' },
  { id: 'friend', name: 'Ami(e)', icon: '👫' },
  { id: 'other', name: 'Autre', icon: '👤' },
]

// Reply type options
const replyTypes = [
  { id: 'interested_warm', name: 'Intéressé(e) & chaleureux', icon: '😊', description: 'Enthousiaste et accueillant(e)' },
  { id: 'interested_mysterious', name: 'Intéressé(e) mais mystérieux', icon: '😏', description: 'Intriguant(e) sans tout dévoiler' },
  { id: 'distant_polite', name: 'Distant & poli', icon: '🎩', description: 'Courtois mais pas trop dispo' },
  { id: 'evasive', name: 'Évasif', icon: '🌫️', description: 'Flou, sans s\'engager' },
  { id: 'direct_honest', name: 'Direct & honnête', icon: '🎯', description: 'Franc(e) et clair(e)' },
  { id: 'flirty_playful', name: 'Joueur / Flirty', icon: '😉', description: 'Taquin et charmeur' },
  { id: 'indifferent', name: 'Indifférent', icon: '😐', description: 'Désintéressé(e)' },
  { id: 'soft_ghost', name: 'Ghosting doux', icon: '👻', description: 'Réponse courte pour disparaître' },
]

// Ghost Logo
function GhostLogo({ size = 80, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <div className={animate ? 'w-full overflow-hidden' : ''}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`drop-shadow-lg ${animate ? 'ghost-slide' : ''}`}
        style={animate ? { animation: 'ghost-dance 8s linear infinite' } : {}}
      >
        <defs>
          <linearGradient id="ghostGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <path d="M50 10 C25 10 15 35 15 55 L15 85 C15 85 20 80 25 85 C30 90 35 85 40 85 C45 85 45 90 50 85 C55 80 55 85 60 85 C65 85 70 90 75 85 C80 80 85 85 85 85 L85 55 C85 35 75 10 50 10 Z" fill="url(#ghostGradient)" />
        <ellipse cx="35" cy="45" rx="8" ry="10" fill="white" />
        <ellipse cx="65" cy="45" rx="8" ry="10" fill="white" />
        <circle cx="37" cy="47" r="4" fill="#1a1a2e" />
        <circle cx="67" cy="47" r="4" fill="#1a1a2e" />
        <ellipse cx="25" cy="60" rx="6" ry="3" fill="#f472b6" opacity="0.6" />
        <ellipse cx="75" cy="60" rx="6" ry="3" fill="#f472b6" opacity="0.6" />
        <path d="M40 65 Q50 75 60 65" stroke="#1a1a2e" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// Score Circle
function ScoreCircle({ score, label, icon, color }: { score: number; label: string; icon: string; color: string }) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="45" fill="none" stroke="#e5e5e5" strokeWidth="8" />
          <circle cx="48" cy="48" r="45" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{Math.round(score)}%</span>
          <span className="text-base">{icon}</span>
        </div>
      </div>
      <span className="mt-1 text-sm text-gray-500">{label}</span>
    </div>
  )
}

// Auth Modal
function AuthModal({ isOpen, onClose, onPremiumActivated, mode }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onPremiumActivated: (email: string) => void;
  mode: 'save' | 'login'
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess(false)
      setIsRegisterMode(false)
    }
  }, [isOpen, mode])

  if (!isOpen) return null

  const handleRegister = async () => {
    if (!email || !email.includes('@')) {
      setError('Email invalide')
      return
    }
    if (!password || password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password, action: 'register' })
      })
      const data = await res.json()

      if (data.success) {
        // Compte créé, mais Premium nécessite un paiement
        localStorage.setItem('ghostmeter_email', email.toLowerCase())
        if (data.sessionId) localStorage.setItem('ghostmeter_session', data.sessionId)
        setSuccessMessage('Compte créé ! Activez Premium pour profiter de toutes les fonctionnalités.')
        setSuccess(true)
        setTimeout(() => {
          onPremiumActivated(email.toLowerCase())
          onClose()
        }, 4000)
      } else {
        setError(data.error || 'Erreur lors de l\'inscription')
      }
    } catch (e) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      setError('Email invalide')
      return
    }
    if (!password) {
      setError('Mot de passe requis')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password, action: 'login' })
      })
      const data = await res.json()

      if (data.success) {
        if (data.user.isPremium) {
          localStorage.setItem('ghostmeter_email', email.toLowerCase())
          localStorage.setItem('ghostmeter_premium', 'true')
        } else {
          localStorage.setItem('ghostmeter_email', email.toLowerCase())
        }
        if (data.sessionId) localStorage.setItem('ghostmeter_session', data.sessionId)
        setSuccessMessage('Connexion réussie !')
        setSuccess(true)
        setTimeout(() => {
          onPremiumActivated(email.toLowerCase())
          onClose()
        }, 4000)
      } else {
        setError(data.error || 'Erreur de connexion')
      }
    } catch (e) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!email || !email.includes('@')) {
      setError('Email invalide')
      return
    }
    if (!password) {
      setError('Mot de passe requis')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // First check if user exists
      const checkRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password, action: 'login' })
      })
      const checkData = await checkRes.json()

      if (checkData.success) {
        // User exists and password is correct
        localStorage.setItem('ghostmeter_email', email.toLowerCase())
        if (checkData.sessionId) localStorage.setItem('ghostmeter_session', checkData.sessionId)
        if (checkData.user.isPremium) {
          localStorage.setItem('ghostmeter_premium', 'true')
          setSuccessMessage('Connexion réussie ! Premium actif.')
        } else {
          setSuccessMessage('Compte récupéré ! Activez Premium pour plus de fonctionnalités.')
        }
        setSuccess(true)
        setTimeout(() => {
          onPremiumActivated(email.toLowerCase())
          onClose()
        }, 4000)
      } else {
        setError(checkData.error || 'Erreur lors de la sauvegarde')
      }
    } catch (e) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = () => {
    if (mode === 'save') {
      handleSave()
    } else if (isRegisterMode) {
      handleRegister()
    } else {
      handleLogin()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <h3 className="font-semibold">
              {mode === 'save' ? 'Sauvegarder Premium' : isRegisterMode ? 'Créer un compte' : 'Connexion'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-medium text-green-600">{successMessage}</p>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-500 text-sm mb-4">
                {mode === 'save' 
                  ? 'Lie ton email et mot de passe pour récupérer ton compte Premium.'
                  : isRegisterMode
                    ? 'Crée un compte pour sauvegarder ton Premium.'
                    : 'Connecte-toi pour récupérer ton compte Premium.'
                }
              </p>
              
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
              />

              {isRegisterMode && mode !== 'save' && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                />
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 mb-3"
              >
                {isLoading ? 'Chargement...' : mode === 'save' ? 'Sauvegarder' : isRegisterMode ? 'Créer un compte' : 'Se connecter'}
              </button>
              
              {mode === 'login' && (
                <div className="text-center">
                  <button 
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="text-sm text-purple-500 font-medium"
                  >
                    {isRegisterMode ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Main App
export default function Home() {
  const [appState, setAppState] = useState<AppState>('home')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [conversation, setConversation] = useState('')
  const [selectedContext, setSelectedContext] = useState('crush')
  const [remaining, setRemaining] = useState(3)
  const [isPremium, setIsPremium] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
  const [settings, setSettings] = useState<AppSettings>({
    premiumCurrency: '€',
    premiumPeriod: 'mois',
    freeAnalysesPerDay: 3,
    pack1Month: 1.99,
    pack3Months: 4.99,
    pack12Months: 14.99
  })
  
  const [showMenu, setShowMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showCGU, setShowCGU] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [authMode, setAuthMode] = useState<'save' | 'login'>('login')
  
  // Theme states
  const [darkMode, setDarkMode] = useState(false)
  
  // APK detection state - initialize with SYNC detection
  const [isAPKMode, setIsAPKMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return checkIsAPKSync()
  })
  
  // Debug info for APK detection
  const [apkDebugInfo, setApkDebugInfo] = useState('')
  const [backButtonStatus, setBackButtonStatus] = useState('')
  const [notificationPermission, setNotificationPermission] = useState('')
  
  // Notifications states
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  
  // Maintenance mode state
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  
  // Check maintenance mode on load and re-verify APK mode
  useEffect(() => {
    // Gather debug info
    const ua = navigator.userAgent
    const urlParams = new URLSearchParams(window.location.search)
    const urlFromApk = urlParams.get('from')
    const localStorageApk = localStorage.getItem('ghostmeter_apk_mode')
    const windowMarker = (window as any).__GHOSTMETER_APK__
    const cap = (window as any).Capacitor
    const capPlugins = cap?.Plugins ? Object.keys(cap.Plugins) : []
    
    const debugLines = [
      `UA: ${ua.substring(0, 80)}...`,
      `URL ?from=apk: ${urlFromApk}`,
      `localStorage apk: ${localStorageApk}`,
      `Window marker: ${windowMarker}`,
      `Capacitor: ${!!cap}`,
      `Plugins: ${capPlugins.join(', ') || 'none'}`,
      `isAPKMode: ${isAPKMode}`
    ]
    setApkDebugInfo(debugLines.join(' | '))
    console.log('APK Debug:', debugLines.join('\n'))
    
    // Re-check APK mode in case it wasn't detected on first render
    const isAPK = checkIsAPKSync()
    if (isAPK !== isAPKMode) {
      setIsAPKMode(isAPK)
    }
    console.log('APK Mode verified:', isAPK)
    
    // Request notification permission on Android 13+ (including Android 15)
    const requestNotificationPermissionAsync = async () => {
      if (isAPK && cap?.Plugins?.LocalNotifications) {
        try {
          console.log('Requesting notification permission...')
          const result = await LocalNotifications.requestPermissions()
          console.log('Notification permission result:', result)
          setNotificationPermission(`Permission: ${result.display}`)
        } catch (e: any) {
          console.log('Notification permission error:', e)
          setNotificationPermission(`Error: ${e?.message || e}`)
        }
      }
    }
    requestNotificationPermissionAsync()
    
    // Maintenance mode disabled - not needed for this app
    // const checkMaintenance = async () => {
    //   try {
    //     const res = await fetch('/api/maintenance')
    //     const data = await res.json()
    //     if (data.maintenanceMode) {
    //       setMaintenanceMode(true)
    //       setMaintenanceMessage(data.message)
    //     }
    //   } catch (e) {
    //     console.log('Maintenance check failed, continuing normally')
    //   }
    // }
    // checkMaintenance()
  }, [])
  
  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('ghostmeter_darkmode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
    }
  }, [])
  
  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('ghostmeter_darkmode', String(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Load notifications preference
  useEffect(() => {
    const savedNotifications = localStorage.getItem('ghostmeter_notifications')
    if (savedNotifications === 'true') {
      setNotificationsEnabled(true)
    }
  }, [])

  // Notification functions
  const requestNotificationPermission = async () => {
    try {
      // Check if we're in a native app context
      if (!isAPKMode) {
        console.log('Not in native app context')
        return false
      }
      
      const result = await LocalNotifications.requestPermissions()
      return result.display === 'granted'
    } catch (e) {
      console.log('Notifications not available:', e)
      return false
    }
  }

  const scheduleDailyNotification = async () => {
    try {
      // Check if we're in a native app context
      if (!isAPKMode) {
        console.log('Not in native app context - notifications not available')
        return false
      }
      
      // Cancel existing notifications first
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] })

      // Get a random message
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

      // Calculate next 9 AM
      const now = new Date()
      const notificationTime = new Date()
      notificationTime.setHours(9, 0, 0, 0)
      
      // If it's already past 9 AM today, schedule for tomorrow
      if (now.getHours() >= 9) {
        notificationTime.setDate(notificationTime.getDate() + 1)
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: '👻 GhostMeter',
            body: randomMessage,
            schedule: { 
              at: notificationTime,
              repeats: true,
              every: 'day'
            },
            sound: undefined,
            attachments: undefined,
            actionTypeId: undefined,
            extra: null
          }
        ]
      })

      return true
    } catch (e) {
      console.log('Error scheduling notification:', e)
      return false
    }
  }

  const cancelNotifications = async () => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] })
      return true
    } catch (e) {
      return false
    }
  }

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      // Disable notifications
      await cancelNotifications()
      setNotificationsEnabled(false)
      localStorage.setItem('ghostmeter_notifications', 'false')
    } else {
      // Check if we're in native context first
      if (!isAPKMode) {
        alert('Les notifications ne sont disponibles que dans l\'application mobile (APK).')
        return
      }
      
      // Enable notifications
      const hasPermission = await requestNotificationPermission()
      if (hasPermission) {
        const scheduled = await scheduleDailyNotification()
        if (scheduled) {
          setNotificationsEnabled(true)
          localStorage.setItem('ghostmeter_notifications', 'true')
          alert('✅ Notifications activées ! Vous recevrez un message motivant chaque matin à 9h.')
        } else {
          alert('❌ Erreur lors de la programmation des notifications. Réessayez.')
        }
      } else {
        alert('❌ Permission refusée. Autorisez les notifications dans les paramètres de votre appareil.')
      }
    }
  }

  const testNotification = async () => {
    try {
      // Check if we're in native context first
      if (!isAPKMode) {
        alert('Les notifications ne sont disponibles que dans l\'application mobile (APK).')
        return
      }
      
      const hasPermission = await requestNotificationPermission()
      if (hasPermission) {
        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 999,
              title: '👻 GhostMeter',
              body: randomMessage,
              schedule: { at: new Date(Date.now() + 2000) }, // 2 seconds from now
              sound: undefined,
              attachments: undefined,
              actionTypeId: undefined,
              extra: null
            }
          ]
        })
        alert('✅ Notification de test programmée ! Regardez dans 2 secondes...')
      } else {
        alert('❌ Permission de notification non accordée.')
      }
    } catch (e) {
      console.error('Test notification error:', e)
      alert('❌ Erreur lors de l\'envoi de la notification de test.')
    }
  }
  
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<{
    valid: boolean
    discountedPrice: number
    discount: number
    discountType: string
    message: string
  } | null>(null)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  
  // Handler pour le changement de code promo (sans re-render du parent)
  const handlePromoCodeChange = (value: string) => {
    setPromoCode(value)
  }
  
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const [pasteSuccess, setPasteSuccess] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null)
  const [selectedPack, setSelectedPack] = useState<'1month' | '3months' | '12months'>('3months')

  // Reply generator states
  const [receivedMessage, setReceivedMessage] = useState('')
  const [selectedReplyType, setSelectedReplyType] = useState('interested_warm')
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([])
  const [currentReplyIndex, setCurrentReplyIndex] = useState(0)
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)
  const [replyCopied, setReplyCopied] = useState(false)

  // Coach states
  const [coachMessages, setCoachMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [coachInput, setCoachInput] = useState('')
  const [isCoachLoading, setIsCoachLoading] = useState(false)
  const [coachQuestionsRemaining, setCoachQuestionsRemaining] = useState(3)
  const [savedCoachConversations, setSavedCoachConversations] = useState<SavedCoachConversation[]>([])
  const [currentCoachConversationId, setCurrentCoachConversationId] = useState<string | null>(null)
  const [showCoachHistory, setShowCoachHistory] = useState(false)

  // Charger l'usage du coach depuis localStorage (côté client uniquement)
  useEffect(() => {
    const today = new Date().toDateString()
    const saved = localStorage.getItem('ghostmeter_coach_usage')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.date === today) {
          setCoachQuestionsRemaining(data.questionsRemaining)
        } else {
          // Nouveau jour - réinitialiser
          localStorage.setItem('ghostmeter_coach_usage', JSON.stringify({
            date: today,
            questionsRemaining: 3
          }))
        }
      } catch (e) {
        localStorage.setItem('ghostmeter_coach_usage', JSON.stringify({
          date: today,
          questionsRemaining: 3
        }))
      }
    } else {
      localStorage.setItem('ghostmeter_coach_usage', JSON.stringify({
        date: today,
        questionsRemaining: 3
      }))
    }

    // Charger les conversations du coach sauvegardées
    const savedCoach = localStorage.getItem('ghostmeter_coach_conversations')
    if (savedCoach) {
      try {
        setSavedCoachConversations(JSON.parse(savedCoach))
      } catch (e) {}
    }
  }, [])

  // Sauvegarder l'usage du coach dans localStorage
  useEffect(() => {
    const today = new Date().toDateString()
    localStorage.setItem('ghostmeter_coach_usage', JSON.stringify({
      date: today,
      questionsRemaining: coachQuestionsRemaining
    }))
  }, [coachQuestionsRemaining])

  // Sauvegarder automatiquement les conversations du coach pour les Premium
  useEffect(() => {
    if (isPremium && coachMessages.length > 0) {
      const existingConversationIndex = savedCoachConversations.findIndex(c => c.id === currentCoachConversationId)
      
      if (existingConversationIndex >= 0) {
        // Mettre à jour la conversation existante
        const updated = [...savedCoachConversations]
        updated[existingConversationIndex] = {
          ...updated[existingConversationIndex],
          messages: coachMessages,
          preview: coachMessages[coachMessages.length - 1]?.content.substring(0, 50) + '...',
          date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        }
        setSavedCoachConversations(updated)
        localStorage.setItem('ghostmeter_coach_conversations', JSON.stringify(updated))
      } else {
        // Créer une nouvelle conversation
        const newConversation: SavedCoachConversation = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          title: coachMessages[0]?.content.substring(0, 30) + '...' || 'Nouvelle conversation',
          messages: coachMessages,
          preview: coachMessages[coachMessages.length - 1]?.content.substring(0, 50) + '...'
        }
        const updated = [newConversation, ...savedCoachConversations].slice(0, 20) // Max 20 conversations
        setSavedCoachConversations(updated)
        setCurrentCoachConversationId(newConversation.id)
        localStorage.setItem('ghostmeter_coach_conversations', JSON.stringify(updated))
      }
    }
  }, [coachMessages, isPremium])

  // Charger une conversation sauvegardée
  const loadCoachConversation = (conversation: SavedCoachConversation) => {
    setCoachMessages(conversation.messages)
    setCurrentCoachConversationId(conversation.id)
    setShowCoachHistory(false)
  }

  // Supprimer une conversation sauvegardée
  const deleteCoachConversation = (id: string) => {
    const updated = savedCoachConversations.filter(c => c.id !== id)
    setSavedCoachConversations(updated)
    localStorage.setItem('ghostmeter_coach_conversations', JSON.stringify(updated))
  }

  // Nouvelle conversation
  const startNewCoachConversation = () => {
    setCoachMessages([])
    setCurrentCoachConversationId(null)
    setShowCoachHistory(false)
  }

  // Handle back button on Android - use history API + Capacitor
  useEffect(() => {
    console.log('Back button useEffect - isAPKMode:', isAPKMode)
    
    // Only set up back button in APK mode
    if (!isAPKMode) {
      console.log('Not in APK mode, skipping back button setup')
      setBackButtonStatus('Skipped - not APK mode')
      return
    }
    
    console.log('Setting up back button handlers...')
    
    // Function to exit the app - use native Android interface
    const exitApp = () => {
      console.log('Attempting to exit app...')
      
      // Method 1: Use native Android interface (works in hybrid mode)
      try {
        const androidApp = (window as any).AndroidApp
        if (androidApp && typeof androidApp.exitApp === 'function') {
          console.log('✅ Using AndroidApp.exitApp() native interface')
          androidApp.exitApp()
          return
        }
      } catch (e) {
        console.log('AndroidApp.exitApp failed:', e)
      }
      
      // Method 2: Capacitor App.exitApp() (backup)
      try {
        const cap = (window as any).Capacitor
        if (cap?.Plugins?.App) {
          App.exitApp()
          return
        }
      } catch (e) {
        console.log('App.exitApp failed:', e)
      }
      
      // Method 3: Try to close window (may work in some WebView configs)
      try {
        window.close()
      } catch (e) {
        console.log('window.close failed:', e)
      }
      
      console.log('All exit methods failed - native back handler will show toast')
    }

    // Create a global handler for native Android back button
    const handleNativeBackButton = () => {
      console.log('Back button pressed! appState:', appState)
      if (appState === 'results') {
        setAnalysis(null)
        setAppState('home')
        return true
      } else if (appState === 'reply') {
        setAppState('home')
        setReceivedMessage('')
        setSuggestedReplies([])
        setCurrentReplyIndex(0)
        return true
      } else if (appState === 'coach') {
        setAppState('home')
        return true
      } else if (showOCR) {
        setShowOCR(false)
        return true
      } else if (showMenu) {
        setShowMenu(false)
        return true
      } else if (showHistory) {
        setShowHistory(false)
        return true
      } else if (showCoachHistory) {
        setShowCoachHistory(false)
        return true
      } else if (showPremium) {
        setShowPremium(false)
        return true
      } else if (showAuth) {
        setShowAuth(false)
        return true
      } else if (showAbout) {
        setShowAbout(false)
        return true
      } else if (showCGU) {
        setShowCGU(false)
        return true
      } else if (showContact) {
        setShowContact(false)
        return true
      } else if (showNotificationSettings) {
        setShowNotificationSettings(false)
        return true
      }
      // Return false to let native show exit dialog
      return false
    }

    // Register global handler for native Android
    ;(window as any).handleNativeBackButton = handleNativeBackButton
    ;(window as any).exitGhostMeterApp = exitApp

    // Method 1: Capacitor App plugin
    const setupCapacitorBackButton = async () => {
      try {
        const cap = (window as any).Capacitor
        if (cap?.Plugins?.App) {
          await App.addListener('backButton', ({ canGoBack }) => {
            console.log('Capacitor backButton event fired')
            const handled = handleNativeBackButton()
            if (!handled) {
              exitApp()
            }
          })
          console.log('✅ Capacitor back button registered')
        }
      } catch (e: any) {
        console.log('Capacitor back button error:', e)
      }
    }
    setupCapacitorBackButton()

    // Method 2: History API - push state and listen for popstate
    // This works in WebView when user presses back button
    const handlePopState = (e: PopStateEvent) => {
      console.log('Popstate event fired')
      e.preventDefault()
      const handled = handleNativeBackButton()
      if (!handled) {
        // Push state back so we stay on the page
        window.history.pushState({ app: 'ghostmeter' }, '')
        exitApp()
      } else {
        // Push new state so back button works again
        window.history.pushState({ app: 'ghostmeter' }, '')
      }
    }
    
    // Push initial state IMMEDIATELY - this is critical for back button to work from the start
    window.history.pushState({ app: 'ghostmeter' }, '')
    window.addEventListener('popstate', handlePopState)
    
    // Method 3: document backbutton event
    const handleDocumentBackButton = (e: Event) => {
      console.log('Document backbutton event fired')
      e.preventDefault()
      const handled = handleNativeBackButton()
      if (!handled) {
        exitApp()
      }
    }
    document.addEventListener('backbutton', handleDocumentBackButton)

    setBackButtonStatus('✅ Registered')

    return () => {
      App.removeAllListeners().catch(() => {})
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('backbutton', handleDocumentBackButton)
      delete (window as any).handleNativeBackButton
      delete (window as any).exitGhostMeterApp
    }
  }, [appState, showOCR, showMenu, showHistory, showCoachHistory, showPremium, showAuth, showAbout, showCGU, showContact, showNotificationSettings, isAPKMode])

  // Check for app updates on mount
  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const res = await fetch('/api/version')
        const data = await res.json()
        const storedVersion = localStorage.getItem('ghostmeter_version')
        
        if (storedVersion && storedVersion !== data.version) {
          // New version available - reload to get latest
          console.log('New version available:', data.version, '(was:', storedVersion, ')')
          localStorage.setItem('ghostmeter_version', data.version)
          window.location.reload()
        } else {
          localStorage.setItem('ghostmeter_version', data.version)
        }
      } catch (e) {
        // Ignore errors
      }
    }
    checkForUpdate()
  }, [])

  // Load saved data and settings on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings({
            premiumCurrency: data.settings.premiumCurrency || '€',
            premiumPeriod: data.settings.premiumPeriod || 'mois',
            freeAnalysesPerDay: data.settings.freeAnalysesPerDay || 3,
            pack1Month: data.settings.pack1Month || 1.99,
            pack3Months: data.settings.pack3Months || 4.99,
            pack12Months: data.settings.pack12Months || 14.99
          })
          setRemaining(data.settings.freeAnalysesPerDay)
        }
      })
      .catch(() => {})

    const saved = localStorage.getItem('ghostmeter_history')
    if (saved) setSavedConversations(JSON.parse(saved))
    
    // Get email but DON'T trust localStorage for premium - verify with server
    const email = localStorage.getItem('ghostmeter_email')
    if (email) setUserEmail(email)
    
    // Note: Premium status is verified from server in the useEffect below
  }, [])

  // Check premium status from server if email exists
  useEffect(() => {
    if (userEmail) {
      const sessionId = localStorage.getItem('ghostmeter_session')
      fetch('/api/auth?email=' + encodeURIComponent(userEmail) + '&sessionId=' + (sessionId || ''))
        .then(res => res.json())
        .then(data => {
          // Si session invalide = connecté ailleurs
          if (data.error === 'SESSION_INVALID' || data.sessionValid === false) {
            // Déconnecter automatiquement
            localStorage.removeItem('ghostmeter_email')
            localStorage.removeItem('ghostmeter_session')
            localStorage.removeItem('ghostmeter_premium')
            setUserEmail(null)
            setIsPremium(false)
            setRemaining(settings.freeAnalysesPerDay)
            alert('⚠️ Votre compte a été connecté sur un autre appareil. Vous avez été déconnecté.')
            return
          }
          
          if (data.isPremium) {
            setIsPremium(true)
            setRemaining(999)
            localStorage.setItem('ghostmeter_premium', 'true')
          } else {
            // User is NOT premium on server - remove local premium
            setIsPremium(false)
            setRemaining(settings.freeAnalysesPerDay)
            localStorage.removeItem('ghostmeter_premium')
          }
        })
        .catch(() => {})
    }
  }, [userEmail, settings.freeAnalysesPerDay])

  // Vérification périodique de la session (toutes les 30 secondes)
  useEffect(() => {
    if (!userEmail) return

    const checkSession = () => {
      const sessionId = localStorage.getItem('ghostmeter_session')
      if (!sessionId) return

      fetch('/api/auth?email=' + encodeURIComponent(userEmail) + '&sessionId=' + sessionId)
        .then(res => res.json())
        .then(data => {
          if (data.error === 'SESSION_INVALID' || data.sessionValid === false) {
            localStorage.removeItem('ghostmeter_email')
            localStorage.removeItem('ghostmeter_session')
            localStorage.removeItem('ghostmeter_premium')
            setUserEmail(null)
            setIsPremium(false)
            setRemaining(settings.freeAnalysesPerDay)
            alert('⚠️ Votre compte a été connecté sur un autre appareil. Vous avez été déconnecté.')
          }
        })
        .catch(() => {})
    }

    // Vérifier toutes les 5 secondes
    const interval = setInterval(checkSession, 5000)

    return () => clearInterval(interval)
  }, [userEmail, settings.freeAnalysesPerDay])

  // Handle payment return from PayPal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const payment = urlParams.get('payment')
    const token = urlParams.get('token') // PayPal order ID
    const payerId = urlParams.get('PayerID') // PayPal payer ID
    
    if (payment === 'success' && token) {
      setPaymentStatus('success')
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
      
      // Capture the PayPal payment
      const email = localStorage.getItem('ghostmeter_email')
      if (email && token) {
        fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: token, email })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.isPremium) {
              setIsPremium(true)
              setRemaining(999)
              localStorage.setItem('ghostmeter_premium', 'true')
            }
          })
          .catch(() => {})
      }
      // Auto-hide success message after 5 seconds
      setTimeout(() => setPaymentStatus(null), 5000)
    } else if (payment === 'canceled') {
      setPaymentStatus('canceled')
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setPaymentStatus(null), 5000)
    }
  }, [userEmail])

  const saveToHistory = (conv: string, ctx: string, result: AnalysisResult) => {
    const newEntry: SavedConversation = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      context: ctx,
      preview: conv.substring(0, 50) + '...',
      analysis: result,
      conversation: conv
    }
    const updated = [newEntry, ...savedConversations].slice(0, isPremium ? 100 : 10)
    setSavedConversations(updated)
    localStorage.setItem('ghostmeter_history', JSON.stringify(updated))
  }

  const deleteFromHistory = (id: string) => {
    const updated = savedConversations.filter(c => c.id !== id)
    setSavedConversations(updated)
    localStorage.setItem('ghostmeter_history', JSON.stringify(updated))
  }

  const loadFromHistory = (saved: SavedConversation) => {
    setConversation(saved.conversation)
    setSelectedContext(saved.context)
    setAnalysis(saved.analysis)
    setShowHistory(false)
    setShowMenu(false)
    setAppState('results')
  }

  const handleAnalyze = async () => {
    if (conversation.trim().length < 20) return
    
    setIsLoading(true)
    setAppState('analyzing')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation, context: selectedContext })
      })
      const data = await response.json()

      if (data.success && data.analysis) {
        setAnalysis(data.analysis)
        saveToHistory(conversation, selectedContext, data.analysis)
        if (!isPremium) {
          setRemaining(prev => Math.max(0, prev - 1))
        }
        setAppState('results')
      } else {
        alert('Erreur: ' + (data.error || 'Inconnue'))
        setAppState('home')
      }
    } catch (error) {
      alert('Erreur réseau')
      setAppState('home')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (!analysis) return
    const text = `GhostMeter:\n"${analysis.punchline}"\n❤️ ${Math.round(analysis.interestScore)}% | ⚠️ ${Math.round(analysis.manipulationScore)}% | 👻 ${Math.round(analysis.ghostingScore)}%`
    await navigator.clipboard.writeText(text)
    alert('Copié !')
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setConversation(text)
        setPasteSuccess(true)
        setTimeout(() => setPasteSuccess(false), 2000)
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  const generateReply = async () => {
    if (!receivedMessage.trim() || receivedMessage.trim().length < 5) {
      alert('Message trop court')
      return
    }

    if (!isPremium) {
      setShowPremium(true)
      return
    }

    setIsGeneratingReply(true)
    setSuggestedReplies([])
    setCurrentReplyIndex(0)

    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivedMessage: receivedMessage.trim(),
          replyType: selectedReplyType,
          context: selectedContext
        })
      })
      const data = await res.json()

      if (data.success && data.replies && data.replies.length > 0) {
        setSuggestedReplies(data.replies)
        setCurrentReplyIndex(0)
      } else {
        alert(data.error || 'Erreur lors de la génération')
      }
    } catch (err) {
      alert('Erreur de connexion')
    } finally {
      setIsGeneratingReply(false)
    }
  }

  const copyReply = async () => {
    if (suggestedReplies.length === 0) return
    const currentReply = suggestedReplies[currentReplyIndex]
    await navigator.clipboard.writeText(currentReply)
    setReplyCopied(true)
    setTimeout(() => setReplyCopied(false), 2000)
  }

  const nextReply = () => {
    if (suggestedReplies.length === 0) return
    setCurrentReplyIndex((prev) => (prev + 1) % suggestedReplies.length)
  }

  const prevReply = () => {
    if (suggestedReplies.length === 0) return
    setCurrentReplyIndex((prev) => (prev - 1 + suggestedReplies.length) % suggestedReplies.length)
  }

  // Coach functions
  const sendCoachMessage = async () => {
    if (!coachInput.trim() || isCoachLoading) return

    // Vérifier la limite pour les utilisateurs gratuits
    if (!isPremium && coachQuestionsRemaining <= 0) {
      setShowPremium(true)
      return
    }

    const userMessage = coachInput.trim()
    setCoachInput('')
    setCoachMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsCoachLoading(true)

    // Décrémenter le compteur pour les gratuits
    if (!isPremium) {
      setCoachQuestionsRemaining(prev => prev - 1)
    }

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: coachMessages,
          context: {
            relationshipType: selectedContext,
            analysisScore: analysis?.overallScore
          }
        })
      })
      const data = await res.json()

      if (data.success) {
        setCoachMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setCoachMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai eu un souci. Peux-tu reformuler ?" }])
      }
    } catch (err) {
      setCoachMessages(prev => [...prev, { role: 'assistant', content: "Oups, erreur de connexion. Réessaie !" }])
    } finally {
      setIsCoachLoading(false)
    }
  }

  const clearCoachChat = () => {
    setCoachMessages([])
  }

  const pasteReceivedMessage = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setReceivedMessage(text)
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  const validatePromoCode = async (code?: string) => {
    const codeToUse = code || promoCode
    if (!codeToUse.trim()) return
    setIsValidatingPromo(true)
    setPromoResult(null)

    try {
      // Get the selected pack price for validation
      let basePrice: number
      switch (selectedPack) {
        case '1month':
          basePrice = settings.pack1Month
          break
        case '3months':
          basePrice = settings.pack3Months
          break
        case '12months':
          basePrice = settings.pack12Months
          break
        default:
          basePrice = settings.pack3Months
      }

      const response = await fetch('/api/admin/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToUse, originalPrice: basePrice })
      })
      const data = await response.json()

      if (data.success) {
        // Calculate discounted price based on current pack
        let discountedPrice: number
        if (data.discountType === 'percent') {
          discountedPrice = basePrice * (1 - data.discount / 100)
        } else {
          discountedPrice = Math.max(0, basePrice - data.discount)
        }
        
        setPromoResult({
          valid: true,
          discountedPrice: Math.round(discountedPrice * 100) / 100,
          discount: data.discount,
          discountType: data.discountType,
          message: data.message
        })
      } else {
        setPromoResult({
          valid: false,
          discountedPrice: basePrice,
          discount: 0,
          discountType: 'percent',
          message: data.error || 'Code invalide'
        })
      }
    } catch (error) {
      // Get current pack price for error case
      let basePrice: number
      switch (selectedPack) {
        case '1month':
          basePrice = settings.pack1Month
          break
        case '3months':
          basePrice = settings.pack3Months
          break
        case '12months':
          basePrice = settings.pack12Months
          break
        default:
          basePrice = settings.pack3Months
      }
      setPromoResult({
        valid: false,
        discountedPrice: basePrice,
        discount: 0,
        discountType: 'percent',
        message: 'Erreur de validation'
      })
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const activatePremium = async () => {
    // User must be logged in to purchase Premium
    if (!userEmail) {
      // Show auth modal first to create/login account
      setAuthMode('login')
      setShowPremium(false)
      setPromoCode('')
      setPromoResult(null)
      setShowAuth(true)
      return
    }

    // User is logged in, proceed with PayPal checkout
    setIsProcessingPayment(true)
    
    try {
      // Get the selected pack price
      let basePrice: number
      switch (selectedPack) {
        case '1month':
          basePrice = settings.pack1Month
          break
        case '3months':
          basePrice = settings.pack3Months
          break
        case '12months':
          basePrice = settings.pack12Months
          break
        default:
          basePrice = settings.pack3Months
      }

      // Determine the price to charge (promo price or pack price)
      // Calculate discounted price dynamically based on current pack
      let priceToCharge: number
      if (promoResult?.valid) {
        if (promoResult.discountType === 'percent') {
          priceToCharge = basePrice * (1 - promoResult.discount / 100)
        } else {
          priceToCharge = Math.max(0, basePrice - promoResult.discount)
        }
      } else {
        priceToCharge = basePrice
      }
      
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userEmail,
          price: priceToCharge
        })
      })
      const data = await res.json()

      if (data.approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = data.approvalUrl
      } else {
        alert(data.error || 'Erreur lors de la création du paiement')
        setIsProcessingPayment(false)
      }
    } catch (e) {
      alert('Erreur de connexion au service de paiement')
      setIsProcessingPayment(false)
    }
  }

  const handlePremiumFromServer = (email: string) => {
    // Just set the email - premium is activated only after payment
    localStorage.setItem('ghostmeter_email', email.toLowerCase())
    setUserEmail(email.toLowerCase())
    
    // Check if user has premium from server (don't trust localStorage)
    const sessionId = localStorage.getItem('ghostmeter_session')
    fetch('/api/auth?email=' + encodeURIComponent(email) + '&sessionId=' + (sessionId || ''))
      .then(res => res.json())
      .then(data => {
        // Si session invalide = connecté ailleurs
        if (data.error === 'SESSION_INVALID' || data.sessionValid === false) {
          localStorage.removeItem('ghostmeter_email')
          localStorage.removeItem('ghostmeter_session')
          localStorage.removeItem('ghostmeter_premium')
          setUserEmail(null)
          setIsPremium(false)
          setRemaining(settings.freeAnalysesPerDay)
          return
        }
        
        if (data.isPremium) {
          setIsPremium(true)
          setRemaining(999)
          localStorage.setItem('ghostmeter_premium', 'true')
        } else {
          // NOT premium on server
          setIsPremium(false)
          setRemaining(settings.freeAnalysesPerDay)
          localStorage.removeItem('ghostmeter_premium')
        }
      })
      .catch(() => {})
  }

  const logout = () => {
    localStorage.removeItem('ghostmeter_email')
    localStorage.removeItem('ghostmeter_premium')
    localStorage.removeItem('ghostmeter_session')
    setUserEmail(null)
    setIsPremium(false)
    setRemaining(settings.freeAnalysesPerDay)
    setShowMenu(false)
  }

  const getScoreColor = (score: number, type: 'good' | 'bad') => {
    if (type === 'good') return score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444'
    return score >= 70 ? '#ef4444' : score >= 40 ? '#eab308' : '#22c55e'
  }

  const contextLabels: Record<string, string> = {
    'crush': 'Crush',
    'ex': 'Ex',
    'new': 'Nouvelle relation',
    'talking': 'Talking stage',
    'situationship': 'Situationship',
    'friend': 'Ami(e)',
    'other': 'Autre'
  }

  // MENU DRAWER
  const MenuDrawer = () => (
    <div className={`fixed inset-0 z-50 transition-all ${showMenu ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
      <div className={`absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl transition-transform ${showMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3"><GhostLogo size={40} /><span className="font-bold text-lg text-gray-800 dark:text-white">GhostMeter</span></div>
          <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
        </div>
        
        <div className="p-4">
          {isPremium && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-3 mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5" /><span className="font-semibold">Premium Actif</span>
            </div>
          )}
          
          {/* Compte / Identification */}
          {userEmail ? (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{userEmail}</span>
              </div>
              <button onClick={logout} className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <LogOut className="w-3 h-3" /> Déconnexion
              </button>
            </div>
          ) : isPremium && !userEmail ? (
            <button 
              onClick={() => { setAuthMode('save'); setShowAuth(true); setShowMenu(false) }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2"
            >
              <Mail className="w-5 h-5 text-purple-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">Sauvegarder mon compte</p>
                <p className="text-xs text-gray-400">Lier un email</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ) : (
            <button 
              onClick={() => { setAuthMode('login'); setShowAuth(true); setShowMenu(false) }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2"
            >
              <Mail className="w-5 h-5 text-purple-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">Connexion</p>
                <p className="text-xs text-gray-400">Récupérer mon compte Premium</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          )}
          
          <button 
            onClick={() => { setShowHistory(true); setShowMenu(false) }}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <History className="w-5 h-5 text-purple-500" />
            <div className="flex-1 text-left">
              <p className="font-medium">Historique</p>
              <p className="text-xs text-gray-400">{savedConversations.length} conversation{savedConversations.length > 1 ? 's' : ''}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
          
          {!isPremium && (
            <button 
              onClick={() => { setShowPremium(true); setShowMenu(false) }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors mt-1"
            >
              <Crown className="w-5 h-5 text-yellow-500" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-800 dark:text-white">Premium</p>
                <p className="text-xs text-gray-400">Dès {(settings.pack12Months / 12).toFixed(2)}{settings.premiumCurrency}/mois</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          )}
          
          <div className="border-t border-gray-100 mt-4 pt-4">
            <button 
              onClick={() => { setShowContact(true); setShowMenu(false) }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">Contact</p>
                <p className="text-xs text-gray-400">Une question ? Un bug ?</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            
            <button 
              onClick={() => { setShowAbout(true); setShowMenu(false) }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Info className="w-5 h-5 text-blue-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">À propos</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            
            <button 
              onClick={() => { setShowCGU(true); setShowMenu(false) }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mt-1"
            >
              <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div className="flex-1 text-left">
                <p className="font-medium">CGU</p>
                <p className="text-xs text-gray-400">Conditions Générales d'Utilisation</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
          
          {/* Dark Mode Toggle */}
          <div className="border-t border-gray-100 dark:border-gray-700 mt-4 pt-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-purple-500" />
              )}
              <div className="flex-1 text-left">
                <p className="font-medium">{darkMode ? 'Mode clair' : 'Mode sombre'}</p>
                <p className="text-xs text-gray-400">{darkMode ? 'Désactiver le thème sombre' : 'Activer le thème sombre'}</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-purple-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform mt-1 ${darkMode ? 'translate-x-5 ml-0.5' : 'translate-x-1'}`} />
              </div>
            </button>
          </div>

          {/* Notifications Toggle - Only show in web version, not in APK */}
          {!isAPKMode && (
            <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-4">
              <button 
                onClick={toggleNotifications}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-pink-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs text-gray-400">{notificationsEnabled ? 'Message motivant chaque matin à 9h' : 'Activer les rappels quotidiens'}</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors ${notificationsEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform mt-1 ${notificationsEnabled ? 'translate-x-5 ml-0.5' : 'translate-x-1'}`} />
                </div>
              </button>
              
              {notificationsEnabled && (
                <button 
                  onClick={testNotification}
                  className="w-full mt-2 py-2 text-xs text-purple-500 hover:text-purple-600 transition-colors"
                >
                  🔔 Tester une notification
                </button>
              )}
            </div>
          )}
          
          {/* APK info - Show in APK mode only */}
          {isAPKMode && (
            <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  📱 Application GhostMeter v1.18.0
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✅ Notifications natives activées
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 text-xs text-gray-400 dark:text-gray-500">Version 1.18.0</div>
      </div>
    </div>
  )

  // HISTORY MODAL
  const HistoryModal = () => (
    <div className={`fixed inset-0 z-50 transition-all ${showHistory ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistory(false)} />
      <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2"><History className="w-5 h-5 text-purple-500" />Historique</h2>
          <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {savedConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Ghost className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune conversation enregistrée</p></div>
          ) : (
            <div className="space-y-3">
              {savedConversations.map((saved) => (
                <div key={saved.id} className="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => loadFromHistory(saved)}>
                      <p className="text-xs text-gray-400 mb-1">{saved.date}</p>
                      <p className="text-sm font-medium line-clamp-2">{saved.preview}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-semibold text-green-600">❤️ {Math.round(saved.analysis.interestScore)}%</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteFromHistory(saved.id) }} className="p-2 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // PREMIUM MODAL
  const PremiumModal = () => {
    const getPackPrice = () => {
      switch (selectedPack) {
        case '1month': return settings.pack1Month
        case '3months': return settings.pack3Months
        case '12months': return settings.pack12Months
        default: return settings.pack3Months
      }
    }

    // Calculate discounted price dynamically based on current pack
    const getCurrentDiscountedPrice = () => {
      const basePrice = getPackPrice()
      if (!promoResult?.valid) return basePrice
      if (promoResult.discountType === 'percent') {
        return basePrice * (1 - promoResult.discount / 100)
      } else {
        return Math.max(0, basePrice - promoResult.discount)
      }
    }

    const getPackMonths = () => {
      switch (selectedPack) {
        case '1month': return 1
        case '3months': return 3
        case '12months': return 12
        default: return 3
      }
    }

    return (
      <div className={`fixed inset-0 z-50 transition-all ${showPremium ? 'visible' : 'invisible'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowPremium(false)} />
        <div className="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 p-6 text-white text-center relative">
            <button onClick={() => setShowPremium(false)} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
            <Crown className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">GhostMeter Premium</h2>
            <p className="text-white/80 mt-1">Analyses illimitées + sauvegarde compte</p>
          </div>
          
          {/* Pack Selection */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">Choisis ton forfait :</p>
            <div className="grid grid-cols-3 gap-2">
              {/* 1 Month */}
              <button
                onClick={() => setSelectedPack('1month')}
                className={`p-3 rounded-xl text-center transition-all ${
                  selectedPack === '1month' 
                    ? 'bg-purple-100 dark:bg-purple-900/50 border-2 border-purple-500' 
                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-purple-300'
                }`}
              >
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{settings.pack1Month.toFixed(2)}{settings.premiumCurrency}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 mois</p>
                <p className="text-[10px] text-gray-400">{settings.pack1Month.toFixed(2)}{settings.premiumCurrency}/mois</p>
              </button>

              {/* 3 Months */}
              <button
                onClick={() => setSelectedPack('3months')}
                className={`p-3 rounded-xl text-center transition-all relative ${
                  selectedPack === '3months' 
                    ? 'bg-purple-100 dark:bg-purple-900/50 border-2 border-purple-500' 
                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-purple-300'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  ⭐ Populaire
                </span>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{settings.pack3Months.toFixed(2)}{settings.premiumCurrency}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">3 mois</p>
                <p className="text-[10px] text-purple-500 font-medium">{(settings.pack3Months / 3).toFixed(2)}{settings.premiumCurrency}/mois</p>
              </button>

              {/* 12 Months */}
              <button
                onClick={() => setSelectedPack('12months')}
                className={`p-3 rounded-xl text-center transition-all relative ${
                  selectedPack === '12months' 
                    ? 'bg-purple-100 dark:bg-purple-900/50 border-2 border-purple-500' 
                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-purple-300'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  🔥 Économie
                </span>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{settings.pack12Months.toFixed(2)}{settings.premiumCurrency}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">12 mois</p>
                <p className="text-[10px] text-orange-500 font-medium">{(settings.pack12Months / 12).toFixed(2)}{settings.premiumCurrency}/mois</p>
              </button>
            </div>
          </div>
          
          {/* Promo Code */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <PromoCodeInput 
              onValidate={(code) => {
                setPromoCode(code)
                validatePromoCode(code)
              }}
              isValidating={isValidatingPromo}
              currency={settings.premiumCurrency}
            />
            {promoResult && promoResult.valid && (
              <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-xs font-medium">✅ {promoResult.message}</p>
                <p className="text-green-700 dark:text-green-300 text-xs">
                  {promoResult.discountType === 'percent' 
                    ? `-${promoResult.discount}% de réduction !` 
                    : `-${promoResult.discount}${settings.premiumCurrency} de réduction !`}
                </p>
              </div>
            )}
            {promoResult && !promoResult.valid && <p className="text-red-500 text-xs mt-2">❌ {promoResult.message}</p>}
          </div>
          
          {/* Features */}
          <div className="p-4">
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span>Analyses illimitées</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span>Coach IA illimité + historique</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span>Générateur de réponses illimité</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span>Compte sauvegardé dans le cloud</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span>Récupérable sur tout appareil</span></div>
            </div>
          </div>
          
          {/* Payment Button */}
          <div className="p-4 flex gap-2">
            <button onClick={() => setShowPremium(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Fermer</button>
            <button 
              onClick={() => activatePremium()} 
              disabled={isProcessingPayment}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {userEmail ? (
                    promoResult?.valid ? (
                      <span className="flex items-center gap-2">
                        <span className="line-through text-white/50 text-sm">{getPackPrice().toFixed(2)}{settings.premiumCurrency}</span>
                        <span>{getCurrentDiscountedPrice().toFixed(2)}{settings.premiumCurrency}</span>
                      </span>
                    ) : (
                      `Payer ${getPackPrice().toFixed(2)}${settings.premiumCurrency}`
                    )
                  ) : 'Créer un compte'}
                </>
              )}
            </button>
          </div>
          
          <p className="text-center text-xs text-gray-400 pb-4">Annule à tout moment • Paiement sécurisé PayPal</p>
        </div>
      </div>
    )
  }

  // ABOUT MODAL
  const AboutModal = () => (
    <div className={`fixed inset-0 z-50 transition-all ${showAbout ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowAbout(false)} />
      <div className="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white text-center relative">
          <button onClick={() => setShowAbout(false)} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          <GhostLogo size={60} />
          <h2 className="text-xl font-bold mt-3">GhostMeter</h2>
          <p className="text-white/80 text-sm">Version 1.18.0</p>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6">
            GhostMeter est votre assistant IA pour décrypter vos conversations sentimentales et obtenir des conseils personnalisés.
          </p>
          
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-purple-700 mb-2">🔍 Analyse de conversation</h3>
              <p className="text-sm text-gray-600">
                Collez votre conversation et notre IA analyse le ton, la fréquence, les émotions pour évaluer l'intérêt, le risque de ghosting et de manipulation.
              </p>
            </div>
            
            <div className="bg-pink-50 rounded-xl p-4">
              <h3 className="font-semibold text-pink-700 mb-2">💬 Générateur de réponses</h3>
              <p className="text-sm text-gray-600">
                Recevez 3 suggestions de réponses personnalisées selon votre style (chaleureux, mystérieux, direct, flirty...). Naviguez entre les propositions pour choisir la meilleure !
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-pink-700 mb-2">💜 Coach Relationnel IA</h3>
              <p className="text-sm text-gray-600">
                Discutez avec un coach IA qui vous donne des conseils personnalisés sur votre situation sentimentale. Questions sur le ghosting, les signaux d'intérêt, les ex...
              </p>
              <p className="text-xs text-gray-500 mt-2">🆓 Gratuit : 3 questions/jour • 👑 Premium : illimité + historique</p>
            </div>
            
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-2">🌙 Mode Sombre</h3>
              <p className="text-sm text-gray-600">
                Activez le mode sombre pour un confort visuel optimal le soir. Le bouton 🌙/☀️ en haut à droite permet de basculer facilement entre les modes.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-pink-700 mb-2">🔔 Notifications Motivantes</h3>
              <p className="text-sm text-gray-600">
                Recevez chaque matin à 9h un message motivant pour bien commencer la journée. Compliments, rappels de valeur et perspectives positives !
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-700 mb-2">🔒 Confidentialité</h3>
              <p className="text-sm text-gray-600">
                Vos conversations sont analysées de manière anonyme et ne sont jamais stockées. Votre vie privée est notre priorité.
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-xl p-4">
              <h3 className="font-semibold text-yellow-700 mb-2">👑 Version Premium</h3>
              <p className="text-sm text-gray-600">
                Analyses illimitées, réponses illimitées et coaching illimité pour les membres Premium.
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Fait avec ❤️ par l'équipe GhostMeter</p>
            <p className="text-xs text-gray-400 mt-1">© 2024-2025 GhostMeter. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  )

  // CGU MODAL
  const CGUModal = () => (
    <div className={`fixed inset-0 z-50 transition-all ${showCGU ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowCGU(false)} />
      <div className="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 text-white relative">
          <button onClick={() => setShowCGU(false)} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          <h2 className="text-xl font-bold">Conditions Générales d'Utilisation</h2>
          <p className="text-white/60 text-sm mt-1">Dernière mise à jour : Janvier 2025</p>
        </div>
        
        <div className="p-6 text-sm text-gray-700 space-y-4">
          <section>
            <h3 className="font-bold text-gray-900 mb-2">1. Acceptation des conditions</h3>
            <p>
              En utilisant GhostMeter, vous acceptez ces conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
            </p>
          </section>
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2">2. Description du service</h3>
            <p>
              GhostMeter est un outil d'analyse de conversations basé sur l'intelligence artificielle. Le service fournit des analyses à titre indicatif uniquement et ne constitue en aucun cas un conseil professionnel (psychologique, relationnel ou juridique).
            </p>
          </section>
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2">3. Utilisation de l'application</h3>
            <p>
              Vous vous engagez à utiliser GhostMeter de manière légale et éthique. Il est interdit d'utiliser l'application pour :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Analyser des conversations sans le consentement des parties concernées</li>
              <li>Harceler, intimider ou nuire à autrui</li>
              <li>Violer la vie privée d'autrui</li>
              <li>Toute activité illégale</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2">4. Compte Premium</h3>
            <p>
              L'abonnement Premium offre des fonctionnalités supplémentaires. Les paiements sont sécurisés et vous pouvez annuler votre abonnement à tout moment. Aucun remboursement n'est prévu pour les périodes d'abonnement en cours.
            </p>
          </section>
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2">5. Confidentialité</h3>
            <p>
              Nous respectons votre vie privée. Les conversations analysées ne sont pas stockées sur nos serveurs. Seules les informations de compte (email, statut premium) sont conservées de manière sécurisée. Pour plus de détails, consultez notre Politique de Confidentialité.
            </p>
          </section>
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2">6. Limitation de responsabilité</h3>
            <p>
              GhostMeter fournit des analyses basées sur l'IA à titre indicatif uniquement. Nous ne garantissons pas l'exactitude des résultats. L'utilisateur est seul responsable des décisions prises sur la base de ces analyses. En aucun cas GhostMeter ne pourra être tenu responsable des dommages directs ou indirects résultant de l'utilisation de l'application.
            </p>
          </section>
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2">7. Propriété intellectuelle</h3>
            <p>
              GhostMeter, son logo, son design et son contenu sont protégés par le droit d'auteur. Toute reproduction, distribution ou modification sans autorisation est interdite.
            </p>
          </section>
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2">8. Modifications</h3>
            <p>
              Nous nous réservons le droit de modifier ces CGU à tout moment. Les modifications prendront effet dès leur publication dans l'application. L'utilisation continue de l'application après modification vaut acceptation des nouvelles conditions.
            </p>
          </section>
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2">9. Résiliation</h3>
            <p>
              Nous nous réservons le droit de suspendre ou résilier votre accès à l'application en cas de violation de ces CGU, sans préavis ni remboursement.
            </p>
          </section>
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2">10. Contact</h3>
            <p>
              Pour toute question concernant ces CGU, vous pouvez nous contacter à : <span className="text-purple-600">contact@ghostmeter.app</span>
            </p>
          </section>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              En utilisant GhostMeter, vous reconnaissez avoir lu, compris et accepté ces conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // CONTACT MODAL
  const ContactModal = () => {
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [contactEmail, setContactEmail] = useState(userEmail || '')
    const [isSending, setIsSending] = useState(false)
    const [sendSuccess, setSendSuccess] = useState(false)
    const [sendError, setSendError] = useState('')

    const handleSubmit = async () => {
      if (!subject.trim() || !message.trim()) {
        setSendError('Veuillez remplir tous les champs')
        return
      }

      setIsSending(true)
      setSendError('')

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: contactEmail || 'Non renseigné',
            subject: subject,
            message: message
          })
        })
        const data = await res.json()

        if (data.success) {
          setSendSuccess(true)
          setSubject('')
          setMessage('')
          setTimeout(() => {
            setShowContact(false)
            setSendSuccess(false)
          }, 2000)
        } else {
          setSendError(data.error || 'Erreur lors de l\'envoi')
        }
      } catch (e) {
        setSendError('Erreur de connexion')
      } finally {
        setIsSending(false)
      }
    }

    return (
      <div className={`fixed inset-0 z-50 transition-all ${showContact ? 'visible' : 'invisible'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowContact(false)} />
        <div className="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white relative">
            <button onClick={() => setShowContact(false)} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Contact</h2>
                <p className="text-white/80 text-sm">Une question ? Un bug ? Contactez-nous !</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {sendSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="font-semibold text-green-600">Message envoyé !</p>
                <p className="text-sm text-gray-500 mt-1">Nous vous répondrons dans les plus brefs délais.</p>
              </div>
            ) : (
              <>
                {sendError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {sendError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email (optionnel)</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Pour recevoir une réponse</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Sujet *</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Sélectionner un sujet</option>
                      <option value="bug">🐛 Signaler un bug</option>
                      <option value="feature">💡 Suggestion de fonctionnalité</option>
                      <option value="premium">👑 Question sur Premium</option>
                      <option value="other">❓ Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Message *</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décrivez votre question ou problème..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSending || !subject || !message.trim()}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // MAINTENANCE MODE PAGE - DISABLED
  // if (maintenanceMode) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
  //       <div className="text-center max-w-md">
  //         <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
  //           <span className="text-4xl">👻</span>
  //         </div>
  //         <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">GhostMeter</h1>
  //         <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-6 rounded-full"></div>
  //         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
  //           <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
  //             <AlertCircle className="w-6 h-6 text-orange-500" />
  //           </div>
  //           <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Maintenance en cours</h2>
  //           <p className="text-gray-600 dark:text-gray-300">{maintenanceMessage}</p>
  //         </div>
  //         <p className="text-sm text-gray-400 dark:text-gray-500 mt-6">
  //           Merci de votre patience 🙏
  //         </p>
  //       </div>
  //     </div>
  //   )
  // }

  // HOME PAGE
  if (appState === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <MenuDrawer />
        <HistoryModal />
        <PremiumModal />
        <AboutModal />
        <CGUModal />
        <ContactModal />
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onPremiumActivated={handlePremiumFromServer} mode={authMode} />
        
        {showOCR && <OCRUploader onTextExtracted={(t) => { setConversation(t); setShowOCR(false) }} onClose={() => setShowOCR(false)} />}
        
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setShowMenu(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" /></button>
            <div className="flex items-center gap-2"><GhostLogo size={32} /><span className="font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">GhostMeter</span></div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              {isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
            </div>
          </div>
        </div>
        
        {/* Payment Status Banner */}
        {paymentStatus && (
          <div className={`fixed top-14 left-0 right-0 z-30 p-3 text-center text-sm font-medium ${paymentStatus === 'success' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
            {paymentStatus === 'success' 
              ? '✅ Paiement réussi ! Votre compte Premium est maintenant actif.' 
              : '❌ Paiement annulé. Vous pouvez réessayer à tout moment.'}
          </div>
        )}
        
        <div className="pt-20 pb-8 px-4 flex flex-col items-center justify-center min-h-screen">
          {/* Animated Ghost Logo that slides across the screen */}
          <div className="absolute top-20 left-0 right-0 h-24 overflow-hidden pointer-events-none">
            <div className="ghost-slide" style={{ animation: 'ghost-dance 8s linear infinite' }}>
              <GhostLogo size={80} />
            </div>
          </div>
          <div className="text-center mb-6 flex flex-col items-center mt-16">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">GhostMeter</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Analyse tes conversations avec l'IA</p>
          </div>

          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-purple-200 dark:border-purple-800">
            {/* Quick access buttons at the top */}
            <div className="mb-4 space-y-3">
              {/* Quick access to Coach */}
              <button 
                onClick={() => setAppState('coach')}
                className="w-full p-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 dark:text-white">Coach Relationnel</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Conseils personnalisés pour ta situation</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
                </div>
              </button>

              {/* Quick access to Reply Generator */}
              <button 
                onClick={() => setAppState('reply')}
                className="w-full p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 dark:text-white">Générer une réponse</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Obtiens la réponse parfaite</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                </div>
              </button>
            </div>

            <h2 className="text-lg font-semibold text-center mb-4 flex items-center justify-center gap-2 text-gray-800 dark:text-white"><Sparkles className="w-5 h-5 text-purple-500" />Colle ta conversation</h2>

            <div className="mb-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Type de relation :</p>
              <div className="flex gap-2 overflow-x-auto pb-2">{contexts.map(c => (
                <button key={c.id} onClick={() => setSelectedContext(c.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedContext === c.id ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{c.icon} {c.name}</button>
              ))}</div>
            </div>

            <div className="relative">
              <textarea value={conversation} onChange={(e) => setConversation(e.target.value)} placeholder="Colle ta conversation ici...&#10;&#10;Exemple:&#10;Toi: Hey ! Tu fais quoi ? :)&#10;Lui/Elle: Rien de spécial, et toi ?&#10;Toi: Je pensais aller au ciné ?" className="w-full h-48 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2" />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button onClick={handlePaste} className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${pasteSuccess ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`} title="Coller"><ClipboardPaste className="w-4 h-4" /><span className="hidden sm:inline">{pasteSuccess ? 'Collé !' : 'Coller'}</span></button>
                <button onClick={() => setShowOCR(true)} className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 text-xs font-medium" title="Importer une capture d'écran"><Camera className="w-4 h-4" /><span className="hidden sm:inline">Screenshot</span></button>
              </div>
            </div>
            
            <div className="flex gap-2 mb-3">
              <button 
                onClick={() => setConversation(prev => prev + (prev && !prev.endsWith('\n') ? '\n' : '') + 'Toi: ')} 
                className="flex-1 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
              >
                + Toi
              </button>
              <button 
                onClick={() => setConversation(prev => prev + (prev && !prev.endsWith('\n') ? '\n' : '') + 'Lui/Elle: ')} 
                className="flex-1 py-2 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 rounded-lg text-sm font-medium hover:bg-pink-200 dark:hover:bg-pink-800/50 transition-colors"
              >
                + Lui/Elle
              </button>
            </div>
            
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-center">Utilise le bouton Coller ou importe une capture d'écran</p>

            <button onClick={handleAnalyze} disabled={conversation.trim().length < 20 || isLoading || (!isPremium && remaining <= 0)} className="w-full py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 hover:opacity-90 disabled:opacity-50 transition-all">{isLoading ? 'Analyse en cours...' : 'Analyser'}</button>

            <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-3">{isPremium ? <span className="text-purple-500 font-medium">Analyses illimitées</span> : `${remaining}/${settings.freeAnalysesPerDay} analyses gratuites`}</p>
            
            {!isPremium && remaining <= 0 && (
              <button onClick={() => setShowPremium(true)} className="w-full mt-2 py-2 border border-purple-200 dark:border-purple-700 text-purple-500 rounded-xl text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/30">Obtenir Premium pour plus d'analyses</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ANALYZING PAGE
  if (appState === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-8">
        <div className="animate-bounce"><GhostLogo size={100} /></div>
        <p className="text-xl mt-6 text-gray-500 dark:text-gray-400">Le fantôme analyse...</p>
      </div>
    )
  }

  // RESULTS PAGE
  if (appState === 'results' && analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <MenuDrawer />
        <HistoryModal />
        <PremiumModal />
        <AboutModal />
        <CGUModal />
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onPremiumActivated={handlePremiumFromServer} mode={authMode} />
        
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setShowMenu(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" /></button>
            <span className="font-bold text-gray-800 dark:text-white">Résultats</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              {isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
            </div>
          </div>
        </div>
        
        <div className="pt-20 pb-8 p-4">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">"{analysis.punchline}"</div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {analysis.badges.map((badge, i) => <span key={i} className="px-3 py-1 bg-purple-100 rounded-full text-sm">{badge}</span>)}
              {isPremium && <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm flex items-center gap-1"><Crown className="w-3 h-3" />Premium</span>}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4">
              <div className="grid grid-cols-3 gap-4 justify-items-center">
                <ScoreCircle score={analysis.interestScore} label="Intérêt" icon="❤️" color={getScoreColor(analysis.interestScore, 'good')} />
                <ScoreCircle score={analysis.manipulationScore} label="Manipulation" icon="⚠️" color={getScoreColor(analysis.manipulationScore, 'bad')} />
                <ScoreCircle score={analysis.ghostingScore} label="Ghosting" icon="👻" color={getScoreColor(analysis.ghostingScore, 'bad')} />
              </div>
              <div className="text-center mt-6">
                <p className="text-sm text-gray-400">Score Global</p>
                <span className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">{analysis.overallScore}</span>
                <span className="text-xl text-gray-400">/100</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4">
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">Conseil</h3>
              <p className="text-gray-600 dark:text-gray-300">{analysis.advice}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Positif</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">{analysis.highlights.positive.map((p, i) => <li key={i}>• {p}</li>)}{analysis.highlights.positive.length === 0 && <li>Aucun</li>}</ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Négatif</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">{analysis.highlights.negative.map((p, i) => <li key={i}>• {p}</li>)}{analysis.highlights.negative.length === 0 && <li>Aucun</li>}</ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { setAnalysis(null); setAppState('home') }} className="py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><RefreshCw className="w-4 h-4 mx-auto mb-1" />Nouveau</button>
              <button onClick={handleShare} className="py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><Share2 className="w-4 h-4 mx-auto mb-1" />Partager</button>
              {!isPremium ? (
                <button onClick={() => setShowPremium(true)} className="py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90"><Crown className="w-4 h-4 mx-auto mb-1" />Premium</button>
              ) : (
                <div className="py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-1"><Crown className="w-4 h-4" />Actif</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // REPLY GENERATOR PAGE
  if (appState === 'reply') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <MenuDrawer />
        <PremiumModal />
        
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => { setAppState('home'); setReceivedMessage(''); setSuggestedReplies([]) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>
            <span className="font-bold text-gray-800 dark:text-white">Générer une réponse</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              {isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
            </div>
          </div>
        </div>
        
        <div className="pt-20 pb-8 p-4">
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Obtiens la réponse parfaite</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Colle le message reçu et choisis ton style</p>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4">
              {/* Received Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📩 Message reçu
                </label>
                <div className="relative">
                  <textarea 
                    value={receivedMessage}
                    onChange={(e) => setReceivedMessage(e.target.value)}
                    placeholder="Colle ici le message que tu as reçu..."
                    className="w-full h-32 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button 
                    onClick={pasteReceivedMessage}
                    className="absolute bottom-2 right-2 p-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
                    title="Coller"
                  >
                    <ClipboardPaste className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Context selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  💕 Type de relation
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {contexts.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => setSelectedContext(c.id)} 
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedContext === c.id 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {c.icon} {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🎯 Style de réponse
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {replyTypes.map(rt => (
                    <button
                      key={rt.id}
                      onClick={() => setSelectedReplyType(rt.id)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        selectedReplyType === rt.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{rt.icon}</span>
                        <div>
                          <p className={`text-xs font-medium ${selectedReplyType === rt.id ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                            {rt.name}
                          </p>
                          <p className={`text-xs ${selectedReplyType === rt.id ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                            {rt.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button 
                onClick={generateReply}
                disabled={receivedMessage.trim().length < 5 || isGeneratingReply}
                className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingReply ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Générer la réponse
                  </>
                )}
              </button>

              {!isPremium && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  🔒 Premium requis pour générer des réponses
                </p>
              )}
            </div>

            {/* Suggested Replies */}
            {suggestedReplies.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4 border-2 border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-purple-500" />
                    Réponse suggérée
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {replyTypes.find(r => r.id === selectedReplyType)?.icon} {replyTypes.find(r => r.id === selectedReplyType)?.name}
                  </span>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 mb-3">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{suggestedReplies[currentReplyIndex]}</p>
                </div>

                {/* Navigation between replies */}
                {suggestedReplies.length > 1 && (
                  <div className="flex items-center justify-between mb-3">
                    <button 
                      onClick={prevReply}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {suggestedReplies.map((_, index) => (
                        <div 
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentReplyIndex ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {currentReplyIndex + 1}/{suggestedReplies.length}
                      </span>
                    </div>
                    
                    <button 
                      onClick={nextReply}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                )}

                <button 
                  onClick={copyReply}
                  className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    replyCopied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {replyCopied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copier la réponse
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tips */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 <strong className="text-gray-700 dark:text-gray-300">Astuce :</strong> Plus ton message reçu est détaillé, meilleure sera la réponse suggérée !
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // COACH PAGE
  if (appState === 'coach') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <PremiumModal />
        
        {/* Coach History Modal */}
        {showCoachHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-white">
                  <History className="w-5 h-5 text-purple-500" />
                  Historique des conversations
                </h3>
                <button onClick={() => setShowCoachHistory(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {savedCoachConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aucune conversation sauvegardée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedCoachConversations.map((conv) => (
                      <div key={conv.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1" onClick={() => loadCoachConversation(conv)}>
                            <p className="text-xs text-gray-400 mb-1">{conv.date}</p>
                            <p className="font-medium text-sm text-gray-800 dark:text-white line-clamp-1">{conv.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{conv.preview}</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteCoachConversation(conv.id) }} 
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => { setAppState('home'); clearCoachChat() }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>
            <span className="font-bold flex items-center gap-2 text-gray-800 dark:text-white">
              <Heart className="w-5 h-5 text-pink-500" />
              Coach Relationnel
            </span>
            <div className="flex items-center gap-1">
              {isPremium && (
                <>
                  <button 
                    onClick={startNewCoachConversation}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title="Nouvelle conversation"
                  >
                    <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button 
                    onClick={() => setShowCoachHistory(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors relative"
                    title="Historique des conversations"
                  >
                    <History className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    {savedCoachConversations.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {savedCoachConversations.length}
                      </span>
                    )}
                  </button>
                </>
              )}
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              {isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="pt-16 pb-24 px-4 max-w-lg mx-auto">
          {/* Welcome Message */}
          {coachMessages.length === 0 && (
            <div className="mt-8 text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Salut ! Je suis ton coach 💜</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                Dis-moi ce qui se passe dans ta vie sentimentale. Je suis là pour t'aider !
              </p>
              
              {/* Quick Start Suggestions */}
              <div className="space-y-2">
                <button 
                  onClick={() => { setCoachInput("J'ai besoin de conseils sur ma situation"); }}
                  className="w-full py-3 px-4 bg-white dark:bg-gray-800 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-200">💡 J'ai besoin de conseils sur ma situation</span>
                </button>
                <button 
                  onClick={() => { setCoachInput("Comment savoir si il/elle est intéressé(e) ?"); }}
                  className="w-full py-3 px-4 bg-white dark:bg-gray-800 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-200">🔍 Comment savoir si il/elle est intéressé(e) ?</span>
                </button>
                <button 
                  onClick={() => { setCoachInput("J'ai été ghosté, qu'est-ce que je dois faire ?"); }}
                  className="w-full py-3 px-4 bg-white dark:bg-gray-800 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-200">👻 J'ai été ghosté, qu'est-ce que je dois faire ?</span>
                </button>
                <button 
                  onClick={() => { setCoachInput("Qu'est-ce que je dois répondre à ce message ?"); }}
                  className="w-full py-3 px-4 bg-white dark:bg-gray-800 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-200">💬 Qu'est-ce que je dois répondre à ce message ?</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4 mt-4">
            {coachMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isCoachLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Le coach réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-lg mx-auto flex gap-2">
            <input
              type="text"
              value={coachInput}
              onChange={(e) => setCoachInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendCoachMessage()}
              placeholder="Pose ta question..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={sendCoachMessage}
              disabled={!coachInput.trim() || isCoachLoading}
              className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {!isPremium && (
            <p className="text-center text-xs mt-2">
              {coachQuestionsRemaining > 0 
                ? <span className="text-gray-400">{coachQuestionsRemaining} question{coachQuestionsRemaining > 1 ? 's' : ''} restante{coachQuestionsRemaining > 1 ? 's' : ''} /jour</span>
                : <span className="text-pink-500">🔒 Premium requis pour continuer</span>
              }
            </p>
          )}
        </div>
      </div>
    )
  }

  return null
}