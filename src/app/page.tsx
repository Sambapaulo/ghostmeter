'use client'

import { useState, useEffect } from 'react'
import { App } from '@capacitor/app'
import { 
  Sparkles, Crown, RefreshCw, Share2, Menu, X, History, 
  Trash2, ChevronRight, Check, Ghost, Tag, Camera, ClipboardPaste, LogOut, Mail
} from 'lucide-react'
import dynamic from 'next/dynamic'

const OCRUploader = dynamic(() => import('@/components/OCRUploader'), { ssr: false })

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

interface AppSettings {
  premiumPrice: number
  premiumCurrency: string
  premiumPeriod: string
  freeAnalysesPerDay: number
}

type AppState = 'home' | 'analyzing' | 'results'

// Context options
const contexts = [
  { id: 'crush', name: 'Crush secret', icon: '😍' },
  { id: 'ex', name: 'Ex', icon: '💔' },
  { id: 'new', name: 'Début de relation', icon: '✨' },
  { id: 'talking', name: 'Talking stage', icon: '💬' },
  { id: 'situationship', name: 'Situationship', icon: '🤷' },
]

// Ghost Logo
function GhostLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
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
function AuthModal({ isOpen, onClose, onPremiumActivated }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onPremiumActivated: (email: string) => void 
}) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleActivate = async () => {
    if (!email || !email.includes('@')) {
      setError('Email invalide')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), action: 'login' })
      })
      const data = await res.json()

      if (data.success) {
        const premRes = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase(), action: 'activatePremium' })
        })
        
        if (premRes.ok) {
          localStorage.setItem('ghostmeter_email', email.toLowerCase())
          setSuccess(true)
          setTimeout(() => {
            onPremiumActivated(email.toLowerCase())
            onClose()
          }, 1500)
        }
      }
    } catch (e) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            <h3 className="font-semibold">Sauvegarder Premium</h3>
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
              <p className="font-medium text-green-600">Premium sauvegardé !</p>
              <p className="text-sm text-gray-400 mt-1">Votre compte est lié à {email}</p>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-500 text-sm mb-4">
                Liez votre email à votre compte Premium pour le récupérer sur n'importe quel appareil.
              </p>
              
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />

              <button
                onClick={handleActivate}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder mon compte'}
              </button>
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
    premiumPrice: 4,
    premiumCurrency: '€',
    premiumPeriod: 'mois',
    freeAnalysesPerDay: 3
  })
  
  const [showMenu, setShowMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<{
    valid: boolean
    discountedPrice: number
    discount: number
    discountType: string
    message: string
  } | null>(null)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])
  const [pasteSuccess, setPasteSuccess] = useState(false)

  // Handle back button on Android
  useEffect(() => {
    const setupBackButton = async () => {
      try {
        App.addListener('backButton', ({ canGoBack }) => {
          if (appState === 'results') {
            setAnalysis(null)
            setAppState('home')
          } else if (showOCR) {
            setShowOCR(false)
          } else if (showMenu || showHistory || showPremium || showAuth) {
            setShowMenu(false)
            setShowHistory(false)
            setShowPremium(false)
            setShowAuth(false)
          } else if (appState === 'home') {
            if (confirm('Quitter GhostMeter ?')) {
              App.exitApp()
            }
          }
        })
      } catch (e) {
        // Not running in Capacitor
      }
    }
    setupBackButton()
    return () => { App.removeAllListeners().catch(() => {}) }
  }, [appState, showOCR, showMenu, showHistory, showPremium, showAuth])

  // Load saved data and settings on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings({
            premiumPrice: data.settings.premiumPrice,
            premiumCurrency: data.settings.premiumCurrency,
            premiumPeriod: data.settings.premiumPeriod,
            freeAnalysesPerDay: data.settings.freeAnalysesPerDay
          })
          setRemaining(data.settings.freeAnalysesPerDay)
        }
      })
      .catch(() => {})

    const saved = localStorage.getItem('ghostmeter_history')
    if (saved) setSavedConversations(JSON.parse(saved))
    
    const premium = localStorage.getItem('ghostmeter_premium')
    if (premium === 'true') {
      setIsPremium(true)
      setRemaining(999)
    }
    
    const email = localStorage.getItem('ghostmeter_email')
    if (email) setUserEmail(email)
  }, [])

  // Check premium status from server if email exists
  useEffect(() => {
    if (userEmail) {
      fetch('/api/auth?email=' + encodeURIComponent(userEmail))
        .then(res => res.json())
        .then(data => {
          if (data.isPremium) {
            setIsPremium(true)
            setRemaining(999)
            localStorage.setItem('ghostmeter_premium', 'true')
          }
        })
        .catch(() => {})
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

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return
    setIsValidatingPromo(true)
    setPromoResult(null)

    try {
      const response = await fetch('/api/admin/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      })
      const data = await response.json()

      if (data.success) {
        setPromoResult({
          valid: true,
          discountedPrice: data.discountedPrice,
          discount: data.discount,
          discountType: data.discountType,
          message: data.message
        })
      } else {
        setPromoResult({
          valid: false,
          discountedPrice: settings.premiumPrice,
          discount: 0,
          discountType: 'percent',
          message: data.error || 'Code invalide'
        })
      }
    } catch (error) {
      setPromoResult({
        valid: false,
        discountedPrice: settings.premiumPrice,
        discount: 0,
        discountType: 'percent',
        message: 'Erreur de validation'
      })
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const activatePremium = () => {
    setIsPremium(true)
    setRemaining(999)
    localStorage.setItem('ghostmeter_premium', 'true')
    setShowPremium(false)
    setPromoCode('')
    setPromoResult(null)
    setShowAuth(true)
  }

  const handlePremiumFromServer = (email: string) => {
    setIsPremium(true)
    setRemaining(999)
    localStorage.setItem('ghostmeter_premium', 'true')
    localStorage.setItem('ghostmeter_email', email.toLowerCase())
    setUserEmail(email.toLowerCase())
  }

  const logout = () => {
    localStorage.removeItem('ghostmeter_email')
    localStorage.removeItem('ghostmeter_premium')
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
    'situationship': 'Situationship'
  }

  // MENU DRAWER
  const MenuDrawer = () => (
    <div className={`fixed inset-0 z-50 transition-all ${showMenu ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
      <div className={`absolute left-0 top-0 h-full w-72 bg-white shadow-2xl transition-transform ${showMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3"><GhostLogo size={40} /><span className="font-bold text-lg">GhostMeter</span></div>
          <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
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
              onClick={() => { setShowAuth(true); setShowMenu(false) }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2"
            >
              <Mail className="w-5 h-5 text-purple-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">Sauvegarder mon compte</p>
                <p className="text-xs text-gray-400">Lier un email</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ) : null}
          
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
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mt-1"
            >
              <Crown className="w-5 h-5 text-yellow-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">Premium</p>
                <p className="text-xs text-gray-400">{settings.premiumPrice}{settings.premiumCurrency}/{settings.premiumPeriod}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 text-xs text-gray-400">Version 1.2.0</div>
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
  const PremiumModal = () => (
    <div className={`fixed inset-0 z-50 transition-all ${showPremium ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowPremium(false)} />
      <div className="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 p-6 text-white text-center relative">
          <button onClick={() => setShowPremium(false)} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          <Crown className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">GhostMeter Premium</h2>
          <p className="text-white/80 mt-1">Analyses illimitées + sauvegarde compte</p>
        </div>
        
        <div className="p-6 text-center border-b border-gray-100">
          {promoResult?.valid && <p className="text-sm text-gray-400 line-through mb-1">{settings.premiumPrice}{settings.premiumCurrency}/{settings.premiumPeriod}</p>}
          <div className="flex items-center justify-center gap-1">
            <span className="text-4xl font-bold">{promoResult?.valid ? promoResult.discountedPrice : settings.premiumPrice}{settings.premiumCurrency}</span>
            <span className="text-gray-400">/{settings.premiumPeriod}</span>
          </div>
          {promoResult?.valid && <p className="text-green-500 text-sm font-medium mt-1">{promoResult.message}</p>}
          <p className="text-xs text-gray-400 mt-1">Annule à tout moments</p>
        </div>
        
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }} placeholder="Code promo" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <button onClick={validatePromoCode} disabled={isValidatingPromo || !promoCode.trim()} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 disabled:opacity-50">{isValidatingPromo ? '...' : 'OK'}</button>
          </div>
          {promoResult && !promoResult.valid && <p className="text-red-500 text-xs mt-2">{promoResult.message}</p>}
        </div>
        
        <div className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span>Analyses illimitées</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span>Compte sauvegardé dans le cloud</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span>Historique illimité</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span>Récupérable sur tout appareil</span></div>
          </div>
        </div>
        
        <div className="p-4 flex gap-2">
          <button onClick={() => setShowPremium(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Fermer</button>
          <button onClick={activatePremium} className="flex-1 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 text-white rounded-xl font-semibold hover:opacity-90">Activer Premium</button>
        </div>
      </div>
    </div>
  )

  // HOME PAGE
  if (appState === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <MenuDrawer />
        <HistoryModal />
        <PremiumModal />
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onPremiumActivated={handlePremiumFromServer} />
        
        {showOCR && <OCRUploader onTextExtracted={(t) => { setConversation(t); setShowOCR(false) }} onClose={() => setShowOCR(false)} />}
        
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setShowMenu(true)} className="p-2 hover:bg-gray-100 rounded-full"><Menu className="w-5 h-5" /></button>
            <div className="flex items-center gap-2"><GhostLogo size={32} /><span className="font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">GhostMeter</span></div>
            {isPremium ? <Crown className="w-5 h-5 text-yellow-500" /> : <div className="w-5" />}
          </div>
        </div>
        
        <div className="pt-20 pb-8 px-4 flex flex-col items-center justify-center min-h-screen">
          <div className="text-center mb-6">
            <GhostLogo size={80} />
            <h1 className="text-3xl font-bold mt-4 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">GhostMeter</h1>
            <p className="text-gray-500 mt-1">Découvre si ton crush t'aime vraiment</p>
          </div>

          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-200">
            <h2 className="text-lg font-semibold text-center mb-4 flex items-center justify-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />Colle ta conversation</h2>

            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Type de relation :</p>
              <div className="flex gap-2 overflow-x-auto pb-2">{contexts.map(c => (
                <button key={c.id} onClick={() => setSelectedContext(c.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedContext === c.id ? 'bg-pink-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{c.icon} {c.name}</button>
              ))}</div>
            </div>

            <div className="relative">
              <textarea value={conversation} onChange={(e) => setConversation(e.target.value)} placeholder="Colle ta conversation ici...&#10;&#10;Exemple:&#10;Toi: Hey ! Tu fais quoi ? :)&#10;Lui/Elle: Rien de spécial, et toi ?&#10;Toi: Je pensais aller au ciné ?" className="w-full h-48 p-3 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2" />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button onClick={handlePaste} className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${pasteSuccess ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} title="Coller"><ClipboardPaste className="w-4 h-4" /><span className="hidden sm:inline">{pasteSuccess ? 'Collé !' : 'Coller'}</span></button>
                <button onClick={() => setShowOCR(true)} className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 text-xs font-medium" title="Importer une capture d'écran"><Camera className="w-4 h-4" /><span className="hidden sm:inline">Screenshot</span></button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4 text-center">Utilise le bouton Coller ou importe une capture d'écran</p>

            <button onClick={handleAnalyze} disabled={conversation.trim().length < 20 || isLoading || (!isPremium && remaining <= 0)} className="w-full py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 hover:opacity-90 disabled:opacity-50 transition-all">{isLoading ? 'Analyse en cours...' : 'Analyser'}</button>

            <p className="text-center text-sm text-gray-400 mt-3">{isPremium ? <span className="text-purple-500 font-medium">Analyses illimitées</span> : `${remaining}/${settings.freeAnalysesPerDay} analyses gratuites`}</p>
            
            {!isPremium && remaining <= 0 && (
              <button onClick={() => setShowPremium(true)} className="w-full mt-2 py-2 border border-purple-200 text-purple-500 rounded-xl text-sm font-medium hover:bg-purple-50">Obtenir Premium pour plus d'analyses</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ANALYZING PAGE
  if (appState === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center p-8">
        <div className="animate-bounce"><GhostLogo size={100} /></div>
        <p className="text-xl mt-6 text-gray-500">Le fantôme analyse...</p>
      </div>
    )
  }

  // RESULTS PAGE
  if (appState === 'results' && analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <MenuDrawer />
        <HistoryModal />
        <PremiumModal />
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onPremiumActivated={handlePremiumFromServer} />
        
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setShowMenu(true)} className="p-2 hover:bg-gray-100 rounded-full"><Menu className="w-5 h-5" /></button>
            <span className="font-bold">Résultats</span>
            {isPremium ? <Crown className="w-5 h-5 text-yellow-500" /> : <div className="w-5" />}
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

            <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
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

            <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
              <h3 className="font-semibold mb-2">Conseil</h3>
              <p className="text-gray-600">{analysis.advice}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Positif</h4>
                  <ul className="text-sm text-gray-600 space-y-1">{analysis.highlights.positive.map((p, i) => <li key={i}>• {p}</li>)}{analysis.highlights.positive.length === 0 && <li>Aucun</li>}</ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Négatif</h4>
                  <ul className="text-sm text-gray-600 space-y-1">{analysis.highlights.negative.map((p, i) => <li key={i}>• {p}</li>)}{analysis.highlights.negative.length === 0 && <li>Aucun</li>}</ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { setAnalysis(null); setAppState('home') }} className="py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"><RefreshCw className="w-4 h-4 mx-auto mb-1" />Nouveau</button>
              <button onClick={handleShare} className="py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"><Share2 className="w-4 h-4 mx-auto mb-1" />Partager</button>
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

  return null
}
