'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, Gift, Copy, Check, Share2, Users, Sparkles, Loader2 } from 'lucide-react'

interface ReferralModalProps {
  isOpen: boolean
  onClose: () => void
  language: string
  userEmail: string | null
  onRewardClaimed?: (reward: { type: 'free_analyses' | 'premium_days'; amount: number }) => void
}

interface ReferralConfig {
  enabled: boolean
  referrerRewardType: 'free_analyses' | 'premium_days'
  referrerRewardAmount: number
  referredRewardType: 'free_analyses' | 'premium_days'
  referredRewardAmount: number
}

const rewardText = (type: string, amount: number, language: string) => {
  if (type === 'premium_days') {
    if (language === 'fr') return `${amount} jour${amount > 1 ? 's' : ''} Premium`
    if (language === 'de') return `${amount} Premium-Tag${amount > 1 ? 'e' : ''}`
    if (language === 'es') return `${amount} dia${amount > 1 ? 's' : ''} Premium`
    return `${amount} Premium day${amount > 1 ? 's' : ''}`
  }
  if (language === 'fr') return `${amount} analyse${amount > 1 ? 's' : ''} gratuite${amount > 1 ? 's' : ''}`
  if (language === 'de') return `${amount} kostenlose Analyse${amount > 1 ? 'n' : ''}`
  if (language === 'es') return `${amount} analisi${amount > 1 ? 's' : ''} gratuita${amount > 1 ? 's' : ''}`
  return `${amount} free analys${amount > 1 ? 'es' : 'is'}`
}

const translations: Record<string, Record<string, string>> = {
  fr: {
    title: 'Parraine un ami',
    subtitle: 'Vous gagnez tous les deux une recompense !',
    your_code: 'Votre code de parrainage',
    copied: 'Copie !',
    copy_code: 'Copier le code',
    share_link: 'Partager le lien',
    how_it_works: 'Comment ca marche ?',
    step1: '1. Partagez votre code ou lien avec un ami',
    step2: '2. Il cree un compte sur GhostMeter',
    step3: '3. Vous recevez tous les deux votre recompense',
    you_win: 'Vous gagnez',
    friend_wins: 'Votre ami gagne',
    your_stats: 'Vos statistiques',
    invited: 'Amis invites',
    converted: 'Amis inscrits',
    bonus_analyses: 'Analyses bonus',
    bonus_premium: 'Jours Premium bonus',
    generate_code: 'Generer mon code',
    no_account: 'Connectez-vous pour acceder au parrainage',
    loading: 'Chargement...',
    close: 'Fermer',
    referral_disabled: 'Le parrainage est temporairement desactive.',
    generate_first: 'Generez votre code pour commencer a parrainer.',
  },
  en: {
    title: 'Refer a friend',
    subtitle: 'You both earn a reward!',
    your_code: 'Your referral code',
    copied: 'Copied!',
    copy_code: 'Copy code',
    share_link: 'Share link',
    how_it_works: 'How does it work?',
    step1: '1. Share your code or link with a friend',
    step2: '2. They create an account on GhostMeter',
    step3: '3. You both receive your reward',
    you_win: 'You earn',
    friend_wins: 'Your friend earns',
    your_stats: 'Your stats',
    invited: 'Friends invited',
    converted: 'Friends signed up',
    bonus_analyses: 'Bonus analyses',
    bonus_premium: 'Bonus Premium days',
    generate_code: 'Generate my code',
    no_account: 'Log in to access referrals',
    loading: 'Loading...',
    close: 'Close',
    referral_disabled: 'Referrals are temporarily disabled.',
    generate_first: 'Generate your code to start referring.',
  },
  de: {
    title: 'Freund einladen',
    subtitle: 'Ihr bekommt beide eine Belohnung!',
    your_code: 'Dein Einladungscode',
    copied: 'Kopiert!',
    copy_code: 'Code kopieren',
    share_link: 'Link teilen',
    how_it_works: 'Wie funktioniert es?',
    step1: '1. Teile deinen Code oder Link mit einem Freund',
    step2: '2. Er erstellt ein Konto bei GhostMeter',
    step3: '3. Ihr beide erhaltet eure Belohnung',
    you_win: 'Du bekommst',
    friend_wins: 'Dein Freund bekommt',
    your_stats: 'Deine Statistiken',
    invited: 'Freunde eingeladen',
    converted: 'Freunde angemeldet',
    bonus_analyses: 'Bonus-Analysen',
    bonus_premium: 'Bonus Premium-Tage',
    generate_code: 'Code generieren',
    no_account: 'Melde dich an, um Einladungen zu nutzen',
    loading: 'Laden...',
    close: 'Schliessen',
    referral_disabled: 'Einladungen sind vorubergehend deaktiviert.',
    generate_first: 'Generiere deinen Code, um einzuladen.',
  },
  es: {
    title: 'Invita a un amigo',
    subtitle: 'Ambos ganais una recompensa!',
    your_code: 'Tu codigo de invitacion',
    copied: 'Copiado!',
    copy_code: 'Copiar codigo',
    share_link: 'Compartir enlace',
    how_it_works: 'Como funciona?',
    step1: '1. Comparte tu codigo o enlace con un amigo',
    step2: '2. El crea una cuenta en GhostMeter',
    step3: '3. Ambos reciben su recompensa',
    you_win: 'Tu ganas',
    friend_wins: 'Tu amigo gana',
    your_stats: 'Tus estadisticas',
    invited: 'Amigos invitados',
    converted: 'Amigos registrados',
    bonus_analyses: 'Analisis extra',
    bonus_premium: 'Dias Premium extra',
    generate_code: 'Generar mi codigo',
    no_account: 'Inicia sesion para acceder a las invitaciones',
    loading: 'Cargando...',
    close: 'Cerrar',
    referral_disabled: 'Las invitaciones estan temporalmente desactivadas.',
    generate_first: 'Genera tu codigo para empezar a invitar.',
  }
}

const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose, language, userEmail, onRewardClaimed }) => {
  const lang = (['fr', 'en', 'de', 'es'].includes(language) ? language : 'fr') as 'fr' | 'en' | 'de' | 'es'
  const t = translations[lang]
  
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [config, setConfig] = useState<ReferralConfig | null>(null)
  const [stats, setStats] = useState<{ usedCount: number; convertedCount: number; bonusAnalyses: number; premiumDays: number }>({ usedCount: 0, convertedCount: 0, bonusAnalyses: 0, premiumDays: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [inputCode, setInputCode] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimMessage, setClaimMessage] = useState<{ success: boolean; text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchConfig()
      if (userEmail) {
        fetchBonus()
      }
      setCodeCopied(false)
      setLinkCopied(false)
      setInputCode('')
      setClaimMessage(null)
    }
  }, [isOpen, userEmail])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/referral/config')
      const data = await res.json()
      setConfig(data)
    } catch (e) {
      console.error('Failed to fetch referral config:', e)
    }
  }

  const fetchBonus = async () => {
    if (!userEmail) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/referral/bonus?email=${encodeURIComponent(userEmail)}`)
      const data = await res.json()
      setStats({
        usedCount: data.referralStats?.usedCount || 0,
        convertedCount: data.referralStats?.convertedCount || 0,
        bonusAnalyses: data.bonusAnalyses || 0,
        premiumDays: data.premiumDays || 0,
      })
      if (data.referralCode) {
        setReferralCode(data.referralCode)
        localStorage.setItem('ghostmeter_referral_code', data.referralCode)
      }
    } catch (e) {
      console.error('Failed to fetch referral bonus:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const generateCode = async () => {
    if (!userEmail || isGenerating) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })
      const data = await res.json()
      if (data.success) {
        setReferralCode(data.code)
        localStorage.setItem('ghostmeter_referral_code', data.code)
      }
    } catch (e) {
      console.error('Failed to generate referral code:', e)
    } finally {
      setIsGenerating(false)
    }
  }

  const claimCode = async () => {
    if (!inputCode.trim() || !userEmail || isClaiming) return
    setIsClaiming(true)
    setClaimMessage(null)
    try {
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inputCode.trim().toUpperCase(), email: userEmail })
      })
      const data = await res.json()
      if (data.success) {
        const rewardTextClaim = lang === 'fr'
          ? (data.referredReward?.type === 'premium_days'
            ? `${data.referredReward.amount} jour${data.referredReward.amount > 1 ? 's' : ''} Premium`
            : `${data.referredReward.amount} analyse${data.referredReward.amount > 1 ? 's' : ''} gratuite${data.referredReward.amount > 1 ? 's' : ''}`)
          : (data.referredReward?.type === 'premium_days'
            ? `${data.referredReward.amount} Premium day${data.referredReward.amount > 1 ? 's' : ''}`
            : `${data.referredReward.amount} free analys${data.referredReward.amount > 1 ? 'es' : 'is'}`)
        setClaimMessage({ success: true, text: `+${rewardTextClaim} !` })
        setInputCode('')
        fetchBonus()
        if (onRewardClaimed && data.referredReward) {
          onRewardClaimed({ type: data.referredReward.type, amount: data.referredReward.amount })
        }
      } else {
        setClaimMessage({ success: false, text: data.error || (lang === 'fr' ? 'Code invalide' : 'Invalid code') })
      }
    } catch (e) {
      setClaimMessage({ success: false, text: lang === 'fr' ? 'Erreur serveur' : 'Server error' })
    } finally {
      setIsClaiming(false)
    }
  }

  const copyCode = async () => {
    if (!referralCode) return
    try {
      await navigator.clipboard.writeText(referralCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (e) {
      // Fallback
      const input = document.createElement('input')
      input.value = referralCode
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const shareLink = async () => {
    if (!referralCode) return
    const shareUrl = `https://ghostmeter.vercel.app/?ref=${referralCode}`
    const shareText = lang === 'fr' 
      ? `Decouvre GhostMeter - l'IA qui analyse tes conversations ! Utilise mon code ${referralCode} pour recevoir ${config ? rewardText(config.referredRewardType, config.referredRewardAmount, lang) : 'un bonus'} !`
      : lang === 'de'
        ? `Entdecke GhostMeter - die KI, die deine Gespraeche analysiert! Nutze meinen Code ${referralCode} fuer ${config ? rewardText(config.referredRewardType, config.referredRewardAmount, lang) : 'einen Bonus'}!`
        : lang === 'es'
          ? `Descubre GhostMeter - la IA que analiza tus conversaciones! Usa mi codigo ${referralCode} para recibir ${config ? rewardText(config.referredRewardType, config.referredRewardAmount, lang) : 'un bonus'}!`
          : `Discover GhostMeter - AI that analyzes your conversations! Use my code ${referralCode} to get ${config ? rewardText(config.referredRewardType, config.referredRewardAmount, lang) : 'a bonus'}!`

    // Try native share API first (mobile)
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'GhostMeter',
          text: shareText,
          url: shareUrl
        })
        return
      } catch (e) {
        // User cancelled or not supported
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (e) {
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-purple-500/30 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-500/20">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
          <X className="w-6 h-6" />
        </button>
        
        {/* Header */}
        <div className="pt-8 pb-4 px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{t.title}</h3>
          <p className="text-gray-400 text-sm">{t.subtitle}</p>
        </div>

        {config && !config.enabled ? (
          <div className="px-6 pb-8 text-center">
            <p className="text-yellow-400 text-sm">{t.referral_disabled}</p>
          </div>
        ) : !userEmail ? (
          <div className="px-6 pb-8 text-center">
            <p className="text-gray-400 text-sm">{t.no_account}</p>
          </div>
        ) : (
          <>
            {/* Referral Code Section */}
            <div className="px-6 mb-6">
              {referralCode ? (
                <>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{t.your_code}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center">
                      <span className="text-xl font-bold tracking-wider text-white">{referralCode}</span>
                    </div>
                    <button 
                      onClick={copyCode}
                      className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                        codeCopied 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {codeCopied ? t.copied : t.copy_code}
                    </button>
                  </div>
                  
                  <button 
                    onClick={shareLink}
                    className={`w-full mt-3 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      linkCopied
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                    }`}
                  >
                    {linkCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                    {linkCopied ? t.copied : t.share_link}
                  </button>
                </>
              ) : (
                <button 
                  onClick={generateCode}
                  disabled={isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {t.generate_code}
                </button>
              )}
            </div>

            {/* Reward Preview */}
            {config && referralCode && (
              <div className="px-6 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                        <Gift className="w-5 h-5 text-purple-400" />
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{t.you_win}</p>
                      <p className="text-sm font-bold text-purple-400">
                        {rewardText(config.referrerRewardType, config.referrerRewardAmount, lang)}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-full bg-pink-500/20 flex items-center justify-center mb-2">
                        <Users className="w-5 h-5 text-pink-400" />
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{t.friend_wins}</p>
                      <p className="text-sm font-bold text-pink-400">
                        {rewardText(config.referredRewardType, config.referredRewardAmount, lang)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            {referralCode && (
              <div className="px-6 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{t.your_stats}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-lg font-bold text-white">{stats.usedCount}</p>
                    <p className="text-[10px] text-gray-500">{t.invited}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-lg font-bold text-white">{stats.convertedCount}</p>
                    <p className="text-[10px] text-gray-500">{t.converted}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-lg font-bold text-white">{stats.bonusAnalyses > 0 ? stats.bonusAnalyses : stats.premiumDays > 0 ? `${stats.premiumDays}j` : '0'}</p>
                    <p className="text-[10px] text-gray-500">{stats.bonusAnalyses > 0 ? t.bonus_analyses : t.bonus_premium}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enter referral code */}
            <div className="px-6 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{lang === 'fr' ? 'Vous avez un code ?' : lang === 'de' ? 'Hast du einen Code?' : lang === 'es' ? 'Tienes un codigo?' : 'Have a code?'}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => { setInputCode(e.target.value.toUpperCase()); setClaimMessage(null) }}
                  placeholder="GHOST-XXXX"
                  maxLength={10}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-center font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={claimCode}
                  disabled={isClaiming || !inputCode.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isClaiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
              </div>
              {claimMessage && (
                <p className={`mt-2 text-sm text-center font-medium ${claimMessage.success ? 'text-green-400' : 'text-red-400'}`}>
                  {claimMessage.success ? '\u2713 ' : '\u2717 '}{claimMessage.text}
                </p>
              )}
            </div>

            {/* How it works */}
            <div className="px-6 pb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{t.how_it_works}</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-purple-400 font-bold">1.</span>
                  {t.step1.substring(2)}
                </p>
                <p className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-purple-400 font-bold">2.</span>
                  {t.step2.substring(2)}
                </p>
                <p className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-purple-400 font-bold">3.</span>
                  {t.step3.substring(2)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Close button */}
        <div className="px-6 pb-6">
          <button 
            onClick={onClose} 
            className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReferralModal
