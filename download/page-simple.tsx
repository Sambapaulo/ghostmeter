'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Ghost, Crown, RefreshCw, Share2, Check } from 'lucide-react'

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

type AppState = 'home' | 'analyzing' | 'results'

// Platform options
const platforms = [
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  { id: 'messenger', name: 'Messenger', icon: '💙' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻' },
  { id: 'other', name: 'Autre', icon: '📱' },
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

// Main App
export default function Home() {
  const [appState, setAppState] = useState<AppState>('home')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [conversation, setConversation] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp')
  const [remaining, setRemaining] = useState(3)

  const handleAnalyze = async () => {
    if (conversation.trim().length < 20) return
    
    setIsLoading(true)
    setAppState('analyzing')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation, platform: selectedPlatform })
      })
      const data = await response.json()

      if (data.success && data.analysis) {
        setAnalysis(data.analysis)
        setRemaining(prev => Math.max(0, prev - 1))
        setAppState('results')
      } else {
        throw new Error(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de l\'analyse. Réessaie !')
      setAppState('home')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (!analysis) return
    const text = `👻 GhostMeter:\n"${analysis.punchline}"\n❤️ ${Math.round(analysis.interestScore)}% | ⚠️ ${Math.round(analysis.manipulationScore)}% | 👻 ${Math.round(analysis.ghostingScore)}%`
    await navigator.clipboard.writeText(text)
    alert('Copié !')
  }

  const getScoreColor = (score: number, type: 'good' | 'bad') => {
    if (type === 'good') return score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444'
    return score >= 70 ? '#ef4444' : score >= 40 ? '#eab308' : '#22c55e'
  }

  // HOME PAGE
  if (appState === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <GhostLogo size={80} />
          <h1 className="text-3xl font-bold mt-4 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
            GhostMeter
          </h1>
          <p className="text-gray-500 mt-1">Découvre si ton crush t'aime vraiment 👻</p>
        </motion.div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-200">
          <h2 className="text-lg font-semibold text-center mb-4 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Colle ta conversation
          </h2>

          {/* Platform selector */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {platforms.map(p => (
              <button key={p.id} onClick={() => setSelectedPlatform(p.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${selectedPlatform === p.id ? 'bg-purple-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                {p.icon} {p.name}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={conversation}
            onChange={(e) => setConversation(e.target.value)}
            placeholder="Colle ta conversation ici...

Exemple:
Toi: Hey ! Tu fais quoi ? 😊
Lui/Elle: Rien de spécial, et toi ?
Toi: Je pensais aller au ciné ?"
            className="w-full h-40 p-3 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
          />

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={conversation.trim().length < 20 || isLoading}
            className="w-full py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isLoading ? '⏳ Analyse en cours...' : '✨ Analyser'}
          </button>

          <p className="text-center text-sm text-gray-400 mt-3">
            🎁 {remaining}/3 analyses gratuites aujourd'hui
          </p>
        </div>
      </div>
    )
  }

  // ANALYZING PAGE
  if (appState === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center p-8">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <GhostLogo size={100} />
        </motion.div>
        <p className="text-xl mt-6 text-gray-500">Le fantôme analyse... 👻</p>
      </div>
    )
  }

  // RESULTS PAGE
  if (appState === 'results' && analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-lg mx-auto">
          {/* Punchline */}
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
              "{analysis.punchline}"
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {analysis.badges.map((badge, i) => (
              <span key={i} className="px-3 py-1 bg-purple-100 rounded-full text-sm">{badge}</span>
            ))}
          </div>

          {/* Scores */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <div className="grid grid-cols-3 gap-4 justify-items-center">
              <ScoreCircle score={analysis.interestScore} label="Intérêt" icon="❤️" color={getScoreColor(analysis.interestScore, 'good')} />
              <ScoreCircle score={analysis.manipulationScore} label="Manipulation" icon="⚠️" color={getScoreColor(analysis.manipulationScore, 'bad')} />
              <ScoreCircle score={analysis.ghostingScore} label="Ghosting" icon="👻" color={getScoreColor(analysis.ghostingScore, 'bad')} />
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-gray-400">Score Global</p>
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {analysis.overallScore}
              </span>
              <span className="text-xl text-gray-400">/100</span>
            </div>
          </div>

          {/* Advice */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <h3 className="font-semibold mb-2">💬 Conseil</h3>
            <p className="text-gray-600">{analysis.advice}</p>
          </div>

          {/* Highlights */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">✅ Positif</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {analysis.highlights.positive.map((p, i) => <li key={i}>• {p}</li>)}
                  {analysis.highlights.positive.length === 0 && <li>Aucun</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-red-600 mb-2">🚩 Négatif</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {analysis.highlights.negative.map((p, i) => <li key={i}>• {p}</li>)}
                  {analysis.highlights.negative.length === 0 && <li>Aucun</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => { setAnalysis(null); setAppState('home') }} className="py-3 bg-gray-100 rounded-xl font-medium">
              <RefreshCw className="w-4 h-4 mx-auto mb-1" /> Nouveau
            </button>
            <button onClick={handleShare} className="py-3 bg-gray-100 rounded-xl font-medium">
              <Share2 className="w-4 h-4 mx-auto mb-1" /> Partager
            </button>
            <button className="py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium">
              <Crown className="w-4 h-4 mx-auto mb-1" /> Premium
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
