'use client'

import { useState, useEffect } from 'react'
import { App } from '@capacitor/app'
import { 
  Sparkles, Crown, RefreshCw, Share2, Menu, X, History, 
  Trash2, ChevronRight, Check, Ghost, Tag, Camera, ClipboardPaste
} from 'lucide-react'
import dynamic from 'next/dynamic'

const OCRUploader = dynamic(() => import('@/components/OCRUploader'), { ssr: false })

interface AnalysisResult {
  interestScore: number
  manipulationScore: number
  ghostingScore: number
  overallScore: number
  advice: string
  punchline: string
  highlights: { positive: string[]; negative: string[]; neutral: string[] }
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

const contexts = [
  { id: 'crush', name: 'Crush', icon: '😍' },
  { id: 'ex', name: 'Ex', icon: '💔' },
  { id: 'new', name: 'Début', icon: '✨' },
  { id: 'talking', name: 'Talking', icon: '💬' },
]

const premiumFeatures = [
  { icon: '♾️', title: 'Analyses illimitées', desc: 'Plus de limite' },
  { icon: '📊', title: 'Analyse détaillée', desc: 'Message par message' },
  { icon: '📁', title: 'Historique illimité', desc: 'Sauvegarde totale' },
]

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

function ScoreCircle({ score, label, icon, color }: { score: number; label: string; icon: string; color: string }) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e5e5" strokeWidth="6" />
          <circle cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{Math.round(score)}%</span>
          <span className="text-sm">{icon}</span>
        </div>
      </div>
      <span className="mt-1 text-xs text-gray-500">{label}</span>
    </div>
  )
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('home')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [conversation, setConversation] = useState('')
  const [selectedContext, setSelectedContext] = useState('crush')
  const [remaining, setRemaining] = useState(3)
  const [isPremium, setIsPremium] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({ premiumPrice: 4, premiumCurrency: '€', premiumPeriod: 'mois', freeAnalysesPerDay: 3 })
  const [showMenu, setShowMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<any>(null)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([])

  useEffect(() => {
    fetch('/api/admin/settings').then(res => res.json()).then(data => {
      if (data.success) {
        setSettings(data.settings)
        setRemaining(data.settings.freeAnalysesPerDay)
      }
    }).catch(() => {})
    const saved = localStorage.getItem('ghostmeter_history')
    if (saved) setSavedConversations(JSON.parse(saved))
    if (localStorage.getItem('ghostmeter_premium') === 'true') { setIsPremium(true); setRemaining(999) }
  }, [])

  const saveToHistory = (conv: string, ctx: string, result: AnalysisResult) => {
    const newEntry: SavedConversation = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      context: ctx, preview: conv.substring(0, 50) + '...', analysis: result, conversation: conv
    }
    const updated = [newEntry, ...savedConversations].slice(0, isPremium ? 100 : 10)
    setSavedConversations(updated)
    localStorage.setItem('ghostmeter_history', JSON.stringify(updated))
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setConversation(prev => prev ? prev + '\n' + text : text)
    } catch { alert('Impossible de coller. Utilisez le menu contextuel.') }
  }

  const handleAnalyze = async () => {
    if (conversation.trim().length < 20) return
    setIsLoading(true)
    setAppState('analyzing')
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation, platform: 'sms', context: selectedContext })
      })
      const data = await response.json()
      if (data.success && data.analysis) {
        setAnalysis(data.analysis)
        saveToHistory(conversation, selectedContext, data.analysis)
        if (!isPremium) setRemaining(prev => Math.max(0, prev - 1))
        setAppState('results')
      } else { alert('Erreur: ' + (data.error || 'Inconnue')); setAppState('home') }
    } catch { alert('Erreur réseau'); setAppState('home') }
    finally { setIsLoading(false) }
  }

  const getScoreColor = (score: number, type: 'good' | 'bad') => {
    if (type === 'good') return score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444'
    return score >= 70 ? '#ef4444' : score >= 40 ? '#eab308' : '#22c55e'
  }

  // Modals...
  const MenuDrawer = () => (
    <div className={`fixed inset-0 z-50 transition-all ${showMenu ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
      <div className={`absolute left-0 top-0 h-full w-72 bg-white shadow-2xl transition-transform ${showMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3"><GhostLogo size={36} /><span className="font-bold">GhostMeter</span></div>
          <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          {isPremium && <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-3 mb-4 flex items-center gap-2"><Crown className="w-5 h-5" /><span className="font-semibold">Premium Actif</span></div>}
          <button onClick={() => { setShowHistory(true); setShowMenu(false) }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl">
            <History className="w-5 h-5 text-purple-500" />
            <div className="flex-1 text-left"><p className="font-medium">Historique</p><p className="text-xs text-gray-400">{savedConversations.length} conversation{savedConversations.length > 1 ? 's' : ''}</p></div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
          {!isPremium && <button onClick={() => { setShowPremium(true); setShowMenu(false) }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl mt-1">
            <Crown className="w-5 h-5 text-yellow-500" />
            <div className="flex-1 text-left"><p className="font-medium">Premium</p><p className="text-xs text-gray-400">{settings.premiumPrice}{settings.premiumCurrency}/{settings.premiumPeriod}</p></div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>}
        </div>
      </div>
    </div>
  )

  const HistoryModal = () => (
    <div className={`fixed inset-0 z-50 transition-all ${showHistory ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistory(false)} />
      <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2"><History className="w-5 h-5 text-purple-500" />Historique</h2>
          <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {savedConversations.length === 0 ? <div className="text-center py-12 text-gray-400"><Ghost className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune conversation</p></div> :
            <div className="space-y-3">{savedConversations.map((s) => (
              <div key={s.id} className="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => { setConversation(s.conversation); setSelectedContext(s.context); setAnalysis(s.analysis); setShowHistory(false); setShowMenu(false); setAppState('results') }}>
                    <p className="text-xs text-gray-400">{s.date}</p>
                    <p className="text-sm font-medium line-clamp-2">{s.preview}</p>
                    <p className="text-xs text-green-600 mt-1">❤️ {Math.round(s.analysis.interestScore)}%</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); const u = savedConversations.filter(c => c.id !== s.id); setSavedConversations(u); localStorage.setItem('ghostmeter_history', JSON.stringify(u)) }} className="p-2 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}</div>}
        </div>
      </div>
    </div>
  )

  const PremiumModal = () => (
    <div className={`fixed inset-0 z-50 transition-all ${showPremium ? 'visible' : 'invisible'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowPremium(false)} />
      <div className="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 p-6 text-white text-center relative">
          <button onClick={() => setShowPremium(false)} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          <Crown className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Premium</h2>
        </div>
        <div className="p-6 text-center border-b"><span className="text-4xl font-bold">{settings.premiumPrice}{settings.premiumCurrency}</span><span className="text-gray-400">/{settings.premiumPeriod}</span></div>
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-2">
            <div className="flex-1 relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }} placeholder="Code promo" className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm" /></div>
            <button onClick={async () => { const r = await fetch('/api/admin/validate-promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoCode }) }); const d = await r.json(); setPromoResult(d) }} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm">OK</button>
          </div>
          {promoResult && !promoResult.success && <p className="text-red-500 text-xs mt-2">{promoResult.error}</p>}
        </div>
        <div className="p-4">{premiumFeatures.map((f, i) => <div key={i} className="flex items-center gap-3 py-2"><span className="text-xl">{f.icon}</span><div className="flex-1"><p className="font-medium text-sm">{f.title}</p><p className="text-xs text-gray-400">{f.desc}</p></div><Check className="w-4 h-4 text-green-500" /></div>)}</div>
        <div className="p-4 flex gap-2">
          <button onClick={() => setShowPremium(false)} className="flex-1 py-3 border rounded-xl">Fermer</button>
          <button onClick={() => { setIsPremium(true); setRemaining(999); localStorage.setItem('ghostmeter_premium', 'true'); setShowPremium(false) }} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold">Activer</button>
        </div>
      </div>
    </div>
  )

  if (appState === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <MenuDrawer /><HistoryModal /><PremiumModal />
        {showOCR && <OCRUploader onTextExtracted={(t) => { setConversation(t); setShowOCR(false) }} onClose={() => setShowOCR(false)} />}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setShowMenu(true)} className="p-2 hover:bg-gray-100 rounded-full"><Menu className="w-5 h-5" /></button>
            <div className="flex items-center gap-2"><GhostLogo size={32} /><span className="font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">GhostMeter</span></div>
            {isPremium ? <Crown className="w-5 h-5 text-yellow-500" /> : <div className="w-5" />}
          </div>
        </div>
        <div className="pt-20 pb-8 px-4 flex flex-col items-center min-h-screen">
          <div className="text-center mb-4">
            <GhostLogo size={70} />
            <h1 className="text-2xl font-bold mt-3 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">GhostMeter</h1>
            <p className="text-gray-500 text-sm">Analyse ton crush 👻</p>
          </div>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 border-2 border-purple-200">
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">Contexte :</p>
              <div className="flex gap-2">{contexts.map(c => (
                <button key={c.id} onClick={() => setSelectedContext(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${selectedContext === c.id ? 'bg-pink-500 text-white' : 'bg-gray-100'}`}>{c.icon} {c.name}</button>
              ))}</div>
            </div>
            <div className="relative">
              <textarea value={conversation} onChange={(e) => setConversation(e.target.value)} placeholder="Colle ta conversation ici...&#10;&#10;Exemple:&#10;Toi: Salut ! Tu fais quoi ? 😊&#10;Lui/Elle: Rien de spécial" className="w-full h-48 p-3 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button onClick={handlePaste} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Coller"><ClipboardPaste className="w-4 h-4 text-gray-600" /></button>
                <button onClick={() => setShowOCR(true)} className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600" title="Screenshot"><Camera className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-xs text-gray-400 my-3 text-center">💡 Collez votre texte ou importez une capture</p>
            <button onClick={handleAnalyze} disabled={conversation.trim().length < 20 || isLoading || (!isPremium && remaining <= 0)} className="w-full py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 hover:opacity-90 disabled:opacity-50">{isLoading ? '⏳ Analyse...' : '✨ Analyser'}</button>
            <p className="text-center text-sm text-gray-400 mt-2">{isPremium ? <span className="text-purple-500 font-medium">♾️ Illimité</span> : `🎁 ${remaining}/${settings.freeAnalysesPerDay} gratuites`}</p>
          </div>
        </div>
      </div>
    )
  }

  if (appState === 'analyzing') {
    return <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center"><div className="animate-bounce"><GhostLogo size={100} /></div><p className="text-xl mt-6 text-gray-500">Analyse... 👻</p></div>
  }

  if (appState === 'results' && analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <MenuDrawer /><HistoryModal /><PremiumModal />
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setShowMenu(true)} className="p-2 hover:bg-gray-100 rounded-full"><Menu className="w-5 h-5" /></button>
            <span className="font-bold">Résultats</span>
            {isPremium ? <Crown className="w-5 h-5 text-yellow-500" /> : <div className="w-5" />}
          </div>
        </div>
        <div className="pt-20 pb-8 p-4">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-4"><div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">"{analysis.punchline}"</div></div>
            <div className="flex flex-wrap gap-2 justify-center mb-4">{analysis.badges.map((b, i) => <span key={i} className="px-3 py-1 bg-purple-100 rounded-full text-sm">{b}</span>)}{isPremium && <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm flex items-center gap-1"><Crown className="w-3 h-3" />Premium</span>}</div>
            <div className="bg-white rounded-2xl shadow-xl p-5 mb-3">
              <div className="grid grid-cols-3 gap-2 justify-items-center">
                <ScoreCircle score={analysis.interestScore} label="Intérêt" icon="❤️" color={getScoreColor(analysis.interestScore, 'good')} />
                <ScoreCircle score={analysis.manipulationScore} label="Manipulation" icon="⚠️" color={getScoreColor(analysis.manipulationScore, 'bad')} />
                <ScoreCircle score={analysis.ghostingScore} label="Ghosting" icon="👻" color={getScoreColor(analysis.ghostingScore, 'bad')} />
              </div>
              <div className="text-center mt-4"><span className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">{analysis.overallScore}</span><span className="text-xl text-gray-400">/100</span></div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-5 mb-3"><h3 className="font-semibold mb-2">💬 Conseil</h3><p className="text-gray-600 text-sm">{analysis.advice}</p></div>
            <div className="bg-white rounded-2xl shadow-xl p-5 mb-3">
              <div className="grid grid-cols-2 gap-3">
                <div><h4 className="font-medium text-green-600 mb-1 text-sm">✅ Positif</h4><ul className="text-xs text-gray-600 space-y-0.5">{analysis.highlights.positive.map((p, i) => <li key={i}>• {p}</li>)}{analysis.highlights.positive.length === 0 && <li>Aucun</li>}</ul></div>
                <div><h4 className="font-medium text-red-600 mb-1 text-sm">🚩 Négatif</h4><ul className="text-xs text-gray-600 space-y-0.5">{analysis.highlights.negative.map((p, i) => <li key={i}>• {p}</li>)}{analysis.highlights.negative.length === 0 && <li>Aucun</li>}</ul></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { setAnalysis(null); setAppState('home') }} className="py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"><RefreshCw className="w-4 h-4 mx-auto mb-1" />Nouveau</button>
              <button onClick={async () => { await navigator.clipboard.writeText(`"${analysis.punchline}" ❤️${Math.round(analysis.interestScore)}% ⚠️${Math.round(analysis.manipulationScore)}% 👻${Math.round(analysis.ghostingScore)}%`); alert('Copié!') }} className="py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"><Share2 className="w-4 h-4 mx-auto mb-1" />Partager</button>
              {!isPremium ? <button onClick={() => setShowPremium(true)} className="py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"><Crown className="w-4 h-4 mx-auto mb-1" />Premium</button> : <div className="py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-1"><Crown className="w-4 h-4" />Actif</div>}
            </div>
          </div>
        </div>
      </div>
    )
  }
  return null
}

