'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { 
  Settings, Lock, DollarSign, Tag, Users, Plus, Trash2, 
  Check, X, Eye, EyeOff, LogOut, Save, RefreshCw, Copy,
  Percent, Euro, Clock, Gift, Key, Crown, Mail, Calendar,
  TrendingUp, AlertCircle, Search, ChevronDown, ChevronUp, MessageCircle, Reply, Send, Loader2, Download,
  Megaphone, Wrench, Pause, Play, BarChart3, ClipboardList
} from 'lucide-react'

// Import the stats chart component with SSR disabled
const StatsChart = dynamic(() => import('@/components/StatsChart'), { ssr: false })

interface PromoCode {
  code: string
  discount: number
  discountType: 'percent' | 'fixed'
  active: boolean
  maxUses: number
  currentUses: number
  createdAt: string
}

interface PremiumUser {
  email: string
  isPremium: boolean
  premiumSince: string | null
  premiumPlan: string | null
  premiumExpiresAt: string | null
  premiumSource: 'paypal' | 'admin' | null
  analysesCount: number
  createdAt: string
  lastActive: string
}

interface ContactMessage {
  id: string
  email: string
  subject: string
  message: string
  createdAt: string
  read: boolean
  replied?: boolean
  repliedAt?: string
  replyMessage?: string
}

interface AppSettings {
  premiumPrice: number
  premiumCurrency: string
  premiumPeriod: string
  freeAnalysesPerDay: number
  adminPassword: string
  promoCodes: PromoCode[]
  // Pack pricing
  pack1Month: number
  pack3Months: number
  pack12Months: number
  // Maintenance mode
  maintenanceMode: boolean
  maintenanceMessage: string
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'pricing' | 'promos' | 'users' | 'messages' | 'newsletter' | 'maintenance' | 'security' | 'logs' | 'journal' | 'referral'>('stats')
  
  const [settings, setSettings] = useState<AppSettings>({
    premiumPrice: 1.99,
    premiumCurrency: '€',
    premiumPeriod: 'mois',
    freeAnalysesPerDay: 3,
    adminPassword: '',
    promoCodes: [],
    pack1Month: 1.99,
    pack3Months: 4.99,
    pack12Months: 14.99,
    maintenanceMode: false,
    maintenanceMessage: 'Maintenance en cours. Veuillez réessayer dans quelques minutes.'
  })

  // Newsletter state
  const [newsletterSubject, setNewsletterSubject] = useState('')
  const [newsletterBody, setNewsletterBody] = useState('')
  const [newsletterTarget, setNewsletterTarget] = useState<'all' | 'premium'>('all')
  const [newsletterSending, setNewsletterSending] = useState(false)
  const [newsletterHistory, setNewsletterHistory] = useState<{date: string, subject: string, recipients: number}[]>([])
  
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount: 10,
    discountType: 'percent' as 'percent' | 'fixed',
    maxUses: 100
  })

  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null)
  const [migrateLoading, setMigrateLoading] = useState(false)
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [replyModal, setReplyModal] = useState<{ open: boolean; message: ContactMessage | null }>({ open: false, message: null })
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)

  // Journal Utilisateurs state
  const [journalStats, setJournalStats] = useState<any>(null)
  const [journalLoading, setJournalLoading] = useState(false)

  // Referral config state
  const [referralConfig, setReferralConfig] = useState({
    enabled: true,
    referrerRewardType: 'free_analyses' as 'free_analyses' | 'premium_days',
    referrerRewardAmount: 2,
    referredRewardType: 'free_analyses' as 'free_analyses' | 'premium_days',
    referredRewardAmount: 1
  })
  const [referralStats, setReferralStats] = useState({ totalReferrals: 0, totalConverted: 0 })
  const [referralSaving, setReferralSaving] = useState(false)
  const [referralLoaded, setReferralLoaded] = useState(false)

  // Prepare chart data from users
  const getChartData = () => {
    const last30Days: { [key: string]: { users: number, premium: number } } = {}
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      last30Days[key] = { users: 0, premium: 0 }
    }
    
    // Count users per day
    premiumUsers.forEach(user => {
      if (user.createdAt && user.createdAt !== 'N/A') {
        const key = user.createdAt.split('T')[0]
        if (last30Days[key]) {
          last30Days[key].users++
          if (user.isPremium) {
            last30Days[key].premium++
          }
        }
      }
    })
    
    return Object.entries(last30Days).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      users: data.users,
      premium: data.premium
    }))
  }

  // Check if already authenticated (session persistence)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    try {
      const savedPassword = sessionStorage.getItem('admin_auth')
      if (savedPassword) {
        // Verify the saved password is still valid
        verifyAndRestoreSession(savedPassword)
      } else {
        // No session, redirect to login page
        router.push('/admin/login')
      }
    } catch (e) {
      console.error('Session restore error:', e)
      router.push('/admin/login')
    }
  }, [])

  const verifyAndRestoreSession = async (savedPassword: string) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password: savedPassword })
      })
      const data = await res.json()
      if (data.success) {
        setPassword(savedPassword)
        setIsAuthenticated(true)
        setSettings(data.settings)
      } else {
        // Password changed, clear session
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('admin_auth')
        }
      }
    } catch (e) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('admin_auth')
      }
    }
  }

  // Load settings on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings()
      fetchUsers()
      fetchMessages()
      fetchJournalStats()
    }
  }, [isAuthenticated])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings?t=' + Date.now())
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (e) {
      console.error('Failed to load settings')
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.success) {
        setPremiumUsers(data.users || [])
      }
    } catch (e) {
      console.error('Failed to load users')
    }
  }

  const fetchMessages = async () => {
    setMessagesLoading(true)
    try {
      const res = await fetch('/api/contact')
      const data = await res.json()
      if (data.success) {
        setContactMessages(data.messages || [])
      }
    } catch (e) {
      console.error('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }

  const fetchJournalStats = async () => {
    setJournalLoading(true)
    try {
      const res = await fetch('/api/admin/logs?type=stats')
      const data = await res.json()
      if (data.success) {
        setJournalStats(data.stats)
      }
    } catch (e) {
      console.error('Failed to load journal stats')
    } finally {
      setJournalLoading(false)
    }
  }

  const fetchReferralConfig = async () => {
    if (referralLoaded) return
    try {
      const res = await fetch('/api/referral/config')
      const data = await res.json()
      if (data.enabled !== undefined) {
        setReferralConfig({
          enabled: data.enabled,
          referrerRewardType: data.referrerRewardType || 'free_analyses',
          referrerRewardAmount: data.referrerRewardAmount || 2,
          referredRewardType: data.referredRewardType || 'free_analyses',
          referredRewardAmount: data.referredRewardAmount || 1
        })
        setReferralStats({
          totalReferrals: data.totalReferrals || 0,
          totalConverted: data.totalConverted || 0
        })
        setReferralLoaded(true)
      }
    } catch (e) {
      console.error('Failed to load referral config')
    }
  }

  const saveReferralConfig = async () => {
    setReferralSaving(true)
    try {
      const res = await fetch('/api/referral/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referralConfig)
      })
      const data = await res.json()
      if (data.success) {
        alert('Configuration du parrainage sauvegardee !')
      }
    } catch (e) {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setReferralSaving(false)
    }
  }

  const markMessageAsRead = async (id: string) => {
    try {
      await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      setContactMessages(prev => 
        prev.map(msg => msg.id === id ? { ...msg, read: true } : msg)
      )
    } catch (e) {
      console.error('Failed to mark message as read')
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return
    try {
      await fetch(`/api/contact?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setContactMessages(prev => prev.filter(msg => msg.id !== id))
    } catch (e) {
      console.error('Failed to delete message')
    }
  }

  const sendReply = async () => {
    if (!replyModal.message || !replyText.trim()) return
    
    setReplySending(true)
    try {
      const res = await fetch('/api/contact/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: replyModal.message.id,
          replyMessage: replyText,
          adminPassword: password,
        })
      })
      const data = await res.json()
      
      if (data.success) {
        alert('✅ ' + data.message)
        // Update the message in the list
        setContactMessages(prev => 
          prev.map(msg => msg.id === replyModal.message?.id 
            ? { ...msg, replied: true, repliedAt: new Date().toISOString(), replyMessage: replyText }
            : msg
          )
        )
        setReplyModal({ open: false, message: null })
        setReplyText('')
      } else {
        alert('❌ ' + (data.error || 'Erreur'))
      }
    } catch (e) {
      alert('❌ Erreur de connexion')
    } finally {
      setReplySending(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password })
      })
      const data = await res.json()

      if (data.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('admin_auth', password)
        }
        setIsAuthenticated(true)
        setSettings(data.settings)
      } else {
        setError('Mot de passe incorrect')
      }
    } catch (e) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_auth')
    }
    setIsAuthenticated(false)
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    router.push('/admin/login')
  }

  const saveSettings = async (newSettings: AppSettings) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', settings: newSettings })
      })
      const data = await res.json()
      if (data.success) {
        setSettings(newSettings)
        alert('✅ Paramètres sauvegardés !')
      }
    } catch (e) {
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const sendNewsletter = async () => {
    if (!newsletterSubject.trim() || !newsletterBody.trim()) {
      alert('Veuillez remplir le sujet et le message')
      return
    }

    const recipients = newsletterTarget === 'all' 
      ? premiumUsers.map(u => u.email)
      : premiumUsers.filter(u => u.isPremium).map(u => u.email)

    if (recipients.length === 0) {
      alert('Aucun destinataire trouvé')
      return
    }

    if (!confirm(`Envoyer l'email à ${recipients.length} destinataire(s) ?`)) return

    setNewsletterSending(true)
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newsletterSubject,
          body: newsletterBody,
          recipients,
          adminPassword: password,
        })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`✅ ${data.message}`)
        setNewsletterHistory(prev => [{
          date: new Date().toISOString(),
          subject: newsletterSubject,
          recipients: recipients.length
        }, ...prev])
        setNewsletterSubject('')
        setNewsletterBody('')
      } else {
        alert(`❌ ${data.error || 'Erreur'}`)
      }
    } catch (e) {
      alert('❌ Erreur de connexion')
    } finally {
      setNewsletterSending(false)
    }
  }

  const toggleMaintenanceMode = async () => {
    const newSettings = {
      ...settings,
      maintenanceMode: !settings.maintenanceMode
    }
    await saveSettings(newSettings)
  }

  const addPromoCode = async () => {
    if (!newPromo.code.trim()) return

    const promo: PromoCode = {
      code: newPromo.code.toUpperCase(),
      discount: newPromo.discount,
      discountType: newPromo.discountType,
      active: true,
      maxUses: newPromo.maxUses,
      currentUses: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }

    const updated = {
      ...settings,
      promoCodes: [...settings.promoCodes, promo]
    }
    await saveSettings(updated)
    setNewPromo({ code: '', discount: 10, discountType: 'percent', maxUses: 100 })
  }

  const togglePromoCode = async (index: number) => {
    const updated = {
      ...settings,
      promoCodes: settings.promoCodes.map((p, i) => 
        i === index ? { ...p, active: !p.active } : p
      )
    }
    await saveSettings(updated)
  }

  const deletePromoCode = async (index: number) => {
    if (!confirm('Supprimer ce code promo ?')) return
    const updated = {
      ...settings,
      promoCodes: settings.promoCodes.filter((_, i) => i !== index)
    }
    await saveSettings(updated)
  }

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('Code copié !')
  }

  const changePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'changePassword', 
          currentPassword: password,
          newPassword 
        })
      })
      const data = await res.json()
      
      if (data.success) {
        // Mettre a jour le password state ET sessionStorage avec le nouveau mot de passe
        setPassword(newPassword)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('admin_auth', newPassword)
        }
        setPasswordSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(data.error || 'Erreur lors du changement de mot de passe')
      }
    } catch (e) {
      setPasswordError('Erreur serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserAction = async (email: string, action: 'addPremium' | 'removePremium' | 'deleteUser' | 'simulateExpiration' | 'testPremium', plan?: string) => {
    if (action === 'deleteUser') {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte ${email} ?`)) {
        return
      }
    }

    setUserActionLoading(email)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          action, 
          adminPassword: password,
            plan
        })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`✅ ${data.message}`)
        fetchUsers() // Refresh the list
      } else {
        alert(`❌ ${data.error || 'Erreur'}`)
      }
    } catch (e) {
      alert('❌ Erreur serveur')
    } finally {
      setUserActionLoading(null)
    }
  }

  const migrateOldAccounts = async () => {
    if (!confirm('Cela va réinitialiser le statut Premium des comptes sans preuve de paiement. Continuer ?')) {
      return
    }

    setMigrateLoading(true)
    try {
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: password })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`✅ ${data.message}\n\nComptes corrigés: ${data.fixedUsers.join(', ') || 'Aucun'}`)
        fetchUsers()
      } else {
        alert(`❌ ${data.error || 'Erreur'}`)
      }
    } catch (e) {
      alert('❌ Erreur serveur')
    } finally {
      setMigrateLoading(false)
    }
  }

  const filteredUsers = premiumUsers.filter(user => 
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  // LOGIN SCREEN - redirect to /admin/login
  if (!isAuthenticated) {
    return null
  }

  // ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">GhostMeter Admin</h1>
              <p className="text-xs text-gray-400">Panneau de configuration</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Utilisateurs</p>
                <p className="text-xl font-bold text-gray-800">{premiumUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Utilisateurs Premium</p>
                <p className="text-xl font-bold text-gray-800">{premiumUsers.filter(u => u.isPremium).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Codes Actifs</p>
                <p className="text-xl font-bold text-gray-800">{settings.promoCodes.filter(p => p.active).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Prix Premium</p>
                <p className="text-xl font-bold text-gray-800">{settings.premiumPrice}{settings.premiumCurrency}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === 'stats' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Statistiques
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === 'pricing' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Tarification
            </button>
            <button
              onClick={() => setActiveTab('promos')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'promos' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Gift className="w-4 h-4" />
              Codes Promo
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'users' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'messages' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Messages
              {contactMessages.filter(m => !m.read).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {contactMessages.filter(m => !m.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('newsletter')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === 'newsletter' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              Newsletter
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === 'maintenance' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Maintenance
              {settings.maintenanceMode && (
                <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  ON
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('journal'); fetchJournalStats(); }}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'journal' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Journal
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'security' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Key className="w-4 h-4" />
              Sécurité
            </button>
            <button
              onClick={() => { setActiveTab('referral'); fetchReferralConfig(); }}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'referral' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Gift className="w-4 h-4" />
              Parrainage
            </button>
          </div>

          <div className="p-6">
            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Statistiques</h2>
                    <p className="text-xs text-gray-400">Vue d'ensemble de votre application</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">Total Utilisateurs</p>
                    <p className="text-3xl font-bold text-blue-700">{premiumUsers.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <p className="text-xs text-green-600 font-medium">Utilisateurs Premium</p>
                    <p className="text-3xl font-bold text-green-700">{premiumUsers.filter(u => u.isPremium).length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium">Taux de Conversion</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {premiumUsers.length > 0 
                        ? Math.round((premiumUsers.filter(u => u.isPremium).length / premiumUsers.length) * 100) 
                        : 0}%
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <p className="text-xs text-orange-600 font-medium">Analyses Totales</p>
                    <p className="text-3xl font-bold text-orange-700">
                      {premiumUsers.reduce((sum, u) => sum + u.analysesCount, 0)}
                    </p>
                  </div>
                </div>

                {/* Revenue Estimation */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-green-800">Estimation Revenus Mensuels</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Abonnements actifs</p>
                      <p className="text-2xl font-bold text-green-700">
                        {premiumUsers.filter(u => u.isPremium).length} users
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Revenus potentiels/mois</p>
                      <p className="text-2xl font-bold text-green-700">
                        {((premiumUsers.filter(u => u.isPremium).length * (settings.pack1Month || 1.99)) || 0).toFixed(2)}{settings.premiumCurrency || '€'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Revenus potentiels/an</p>
                      <p className="text-2xl font-bold text-green-700">
                        {((premiumUsers.filter(u => u.isPremium).length * (settings.pack1Month || 1.99) * 12) || 0).toFixed(2)}{settings.premiumCurrency || '€'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">Utilisateurs récents (par activité)</h3>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {premiumUsers
                      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
                      .slice(0, 10)
                      .map((user, index) => (
                        <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              user.isPremium ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-400'
                            }`}>
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{user.email}</p>
                              <p className="text-xs text-gray-400">
                                {user.lastActive !== 'N/A' 
                                  ? `Actif ${new Date(user.lastActive).toLocaleDateString('fr-FR')}` 
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.isPremium && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                Premium
                                {user.premiumPlan && user.premiumPlan !== 'admin' && (
                                  <span className="ml-1">({user.premiumPlan === '1month' ? '1 mois' : user.premiumPlan === '3months' ? '3 mois' : '12 mois'})</span>
                                )}
                                {user.premiumExpiresAt && user.premiumPlan !== 'admin' && (
                                  <span className="ml-1 text-green-500 text-[10px]">- Exp: {new Date(user.premiumExpiresAt).toLocaleDateString('fr-FR')}</span>
                                )}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{user.analysesCount} analyses</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Export Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-700">Exporter les données</h3>
                      <p className="text-xs text-gray-400">Télécharger la liste des utilisateurs en CSV</p>
                    </div>
                    <button
                      onClick={() => {
                        const csvContent = [
                          ['Email', 'Premium', 'Source', 'Date inscription', 'Dernière activité', 'Analyses'].join(','),
                          ...premiumUsers.map(u => [
                            u.email,
                            u.isPremium ? 'Oui' : 'Non',
                            u.premiumSource || 'N/A',
                            u.createdAt !== 'N/A' ? new Date(u.createdAt).toLocaleDateString('fr-FR') : 'N/A',
                            u.lastActive !== 'N/A' ? new Date(u.lastActive).toLocaleDateString('fr-FR') : 'N/A',
                            u.analysesCount
                          ].join(','))
                        ].join('\n')
                        
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                        const link = document.createElement('a')
                        link.href = URL.createObjectURL(blob)
                        link.download = `ghostmeter_users_${new Date().toISOString().split('T')[0]}.csv`
                        link.click()
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Exporter CSV
                    </button>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <h3 className="font-medium text-gray-700">Évolution des inscriptions (30 derniers jours)</h3>
                  </div>
                  <div className="p-4">
                    <StatsChart data={getChartData()} />
                    <div className="flex justify-center gap-6 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-xs text-gray-500">Nouveaux utilisateurs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-500">Nouveaux Premium</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NEWSLETTER TAB */}
            {activeTab === 'newsletter' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Newsletter</h2>
                    <p className="text-xs text-gray-400">Envoyez des emails à vos utilisateurs</p>
                  </div>
                </div>

                {/* Warning if no domain */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Configuration requise</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Pour envoyer des emails, vous devez configurer BREVO_API_KEY dans Vercel. 
                      L'API Brevo est utilisée pour l'envoi d'emails.
                    </p>
                  </div>
                </div>

                {/* Newsletter Form */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="all"
                          checked={newsletterTarget === 'all'}
                          onChange={() => setNewsletterTarget('all')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">Tous les utilisateurs ({premiumUsers.length})</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="premium"
                          checked={newsletterTarget === 'premium'}
                          onChange={() => setNewsletterTarget('premium')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">Premium uniquement ({premiumUsers.filter(u => u.isPremium).length})</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sujet de l&apos;email</label>
                    <input
                      type="text"
                      value={newsletterSubject}
                      onChange={(e) => setNewsletterSubject(e.target.value)}
                      placeholder="Ex: Nouveautés GhostMeter !"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={newsletterBody}
                      onChange={(e) => setNewsletterBody(e.target.value)}
                      placeholder="Bonjour à tous,

Nous avons une grande nouvelle à vous annoncer..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={sendNewsletter}
                    disabled={newsletterSending || !newsletterSubject.trim() || !newsletterBody.trim()}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {newsletterSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Envoyer la newsletter
                      </>
                    )}
                  </button>
                </div>

                {/* Newsletter History */}
                {newsletterHistory.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-medium text-gray-700">Historique des envois</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {newsletterHistory.map((item, index) => (
                        <div key={index} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.subject}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(item.date).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {item.recipients} destinataires
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MAINTENANCE TAB */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Mode Maintenance</h2>
                    <p className="text-xs text-gray-400">Désactivez temporairement l&apos;application</p>
                  </div>
                </div>

                {/* Maintenance Status */}
                <div className={`rounded-xl p-6 border-2 ${
                  settings.maintenanceMode 
                    ? 'bg-orange-50 border-orange-300' 
                    : 'bg-green-50 border-green-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {settings.maintenanceMode ? (
                        <>
                          <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                            <Pause className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-orange-800">Mode Maintenance ACTIF</h3>
                            <p className="text-sm text-orange-600">L&apos;application est actuellement désactivée</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-green-800">Application EN LIGNE</h3>
                            <p className="text-sm text-green-600">Tout fonctionne normalement</p>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={toggleMaintenanceMode}
                      disabled={isLoading}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        settings.maintenanceMode
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : settings.maintenanceMode ? (
                        '🔴 Désactiver la maintenance'
                      ) : (
                        '🟠 Activer la maintenance'
                      )}
                    </button>
                  </div>
                </div>

                {/* Maintenance Message */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message affiché aux utilisateurs
                  </label>
                  <textarea
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => saveSettings(settings)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
                    >
                      Sauvegarder le message
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">Aperçu de la page maintenance</h3>
                  </div>
                  <div className="p-6">
                    <div className="max-w-md mx-auto text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">👻</span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">GhostMeter</h2>
                      <p className="text-gray-600">{settings.maintenanceMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRICING TAB */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Tarification Premium - Packs</h2>
                    <p className="text-xs text-gray-400">Configurez les prix des 3 packs d'abonnement</p>
                  </div>
                </div>

                {/* Pack pricing */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* 1 Month */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                    <div className="text-center mb-4">
                      <span className="text-2xl">📱</span>
                      <h3 className="font-semibold mt-2">1 mois</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.pack1Month || 1.99}
                        onChange={(e) => setSettings({ ...settings, pack1Month: Number(e.target.value) || 1.99 })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                        step="0.01"
                      />
                      <span className="text-gray-500">{settings.premiumCurrency || '€'}</span>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      {(settings.pack1Month || 1.99).toFixed(2)}{settings.premiumCurrency || '€'}/mois
                    </p>
                  </div>

                  {/* 3 Months */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      ⭐ Populaire
                    </div>
                    <div className="text-center mb-4">
                      <span className="text-2xl">🎁</span>
                      <h3 className="font-semibold mt-2">3 mois</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.pack3Months || 4.99}
                        onChange={(e) => setSettings({ ...settings, pack3Months: Number(e.target.value) || 4.99 })}
                        className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                        step="0.01"
                      />
                      <span className="text-gray-500">{settings.premiumCurrency || '€'}</span>
                    </div>
                    <p className="text-center text-xs text-purple-600 font-medium mt-2">
                      {((settings.pack3Months || 4.99) / 3).toFixed(2)}{settings.premiumCurrency || '€'}/mois
                    </p>
                  </div>

                  {/* 12 Months */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      🔥 Meilleur prix
                    </div>
                    <div className="text-center mb-4">
                      <span className="text-2xl">👑</span>
                      <h3 className="font-semibold mt-2">12 mois</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.pack12Months || 14.99}
                        onChange={(e) => setSettings({ ...settings, pack12Months: Number(e.target.value) || 14.99 })}
                        className="flex-1 px-3 py-2 border border-yellow-200 rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                        step="0.01"
                      />
                      <span className="text-gray-500">{settings.premiumCurrency || '€'}</span>
                    </div>
                    <p className="text-center text-xs text-orange-600 font-medium mt-2">
                      {((settings.pack12Months || 14.99) / 12).toFixed(2)}{settings.premiumCurrency || '€'}/mois
                    </p>
                  </div>
                </div>

                {/* Currency */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-600">Devise:</label>
                  <select
                    value={settings.premiumCurrency}
                    onChange={(e) => setSettings({ ...settings, premiumCurrency: e.target.value })}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="€">€ EUR</option>
                    <option value="$">$ USD</option>
                    <option value="£">£ GBP</option>
                  </select>
                </div>

                {/* Free analyses */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Analyses gratuites par jour</label>
                  <input
                    type="number"
                    value={settings.freeAnalysesPerDay}
                    onChange={(e) => setSettings({ ...settings, freeAnalysesPerDay: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                    max="100"
                  />
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <p className="text-sm text-gray-500 mb-3">Aperçu dans l'application:</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{settings.pack1Month.toFixed(2)}{settings.premiumCurrency}</p>
                      <p className="text-xs text-gray-400">1 mois</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="text-2xl font-bold text-purple-600">{settings.pack3Months.toFixed(2)}{settings.premiumCurrency}</p>
                      <p className="text-xs text-purple-500 font-medium">⭐ 3 mois</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{settings.pack12Months.toFixed(2)}{settings.premiumCurrency}</p>
                      <p className="text-xs text-gray-400">12 mois 🔥</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => saveSettings(settings)}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Sauvegarder les tarifs
                </button>
              </div>
            )}

            {/* PROMOS TAB */}
            {activeTab === 'promos' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Codes Promo</h2>
                    <p className="text-xs text-gray-400">Gérez les codes promotionnels</p>
                  </div>
                </div>

                {/* Add new promo */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Créer un nouveau code</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <input
                      type="text"
                      value={newPromo.code}
                      onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                      placeholder="CODE123"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      value={newPromo.discount}
                      onChange={(e) => setNewPromo({ ...newPromo, discount: Number(e.target.value) })}
                      placeholder="Réduction"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                      max="100"
                    />
                    <select
                      value={newPromo.discountType}
                      onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value as 'percent' | 'fixed' })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="percent">% Pourcentage</option>
                      <option value="fixed">{settings.premiumCurrency} Montant fixe</option>
                    </select>
                    <input
                      type="number"
                      value={newPromo.maxUses}
                      onChange={(e) => setNewPromo({ ...newPromo, maxUses: Number(e.target.value) })}
                      placeholder="Max utilisations"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                    />
                  </div>
                  <button
                    onClick={addPromoCode}
                    disabled={!newPromo.code.trim()}
                    className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter le code
                  </button>
                </div>

                {/* Promo list */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {settings.promoCodes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Aucun code promo</p>
                    </div>
                  ) : (
                    settings.promoCodes.map((promo, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          promo.active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => copyPromoCode(promo.code)}
                            className="font-mono font-bold text-purple-600 hover:text-purple-800 text-lg"
                          >
                            {promo.code}
                          </button>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            promo.active ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {promo.active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-sm font-semibold">
                              {promo.discountType === 'percent' ? `${promo.discount}%` : `${promo.discount}${settings.premiumCurrency}`}
                            </span>
                            <span className="text-xs text-gray-400 block">
                              {promo.currentUses}/{promo.maxUses} utilisations
                            </span>
                          </div>
                          <button
                            onClick={() => togglePromoCode(index)}
                            className={`p-2 rounded-lg transition-colors ${
                              promo.active ? 'bg-green-200 hover:bg-green-300' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            {promo.active ? <Check className="w-4 h-4 text-green-700" /> : <X className="w-4 h-4 text-gray-500" />}
                          </button>
                          <button
                            onClick={() => deletePromoCode(index)}
                            className="p-2 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Gestion des Utilisateurs</h2>
                      <p className="text-xs text-gray-400">{premiumUsers.length} utilisateur(s) • {premiumUsers.filter(u => u.isPremium).length} Premium</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Actualiser
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Rechercher par email..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Users list */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Aucun utilisateur trouvé</p>
                    </div>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            user.isPremium ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-400'
                          }`}>
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.email}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {user.createdAt !== 'N/A' ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                              </span>
                              <span>•</span>
                              <span>{user.analysesCount} analyses</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Premium Status */}
                          <div className="text-right">
                            {user.isPremium ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  <Crown className="w-3 h-3" />
                                  Premium
                                </span>
                                <p className="text-xs text-gray-400 mt-1">
                                  {user.premiumSource === 'paypal' ? '💳 PayPal' : user.premiumSource === 'admin' ? '👤 Admin' : '❓ Inconnu'}
                                  {user.premiumPlan && (
                                    <p className="text-xs text-purple-600 mt-0.5">
                                      📦 {user.premiumPlan === '1month' ? '1 mois' : user.premiumPlan === '3months' ? '3 mois' : '12 mois'}
                                    </p>
                                  )}
                                  {user.premiumExpiresAt && (
                                    <p className="text-xs text-orange-600 mt-0.5">
                                      ⏰ Expire: {new Date(user.premiumExpiresAt).toLocaleDateString('fr-FR')}
                                    </p>
                                  )}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                                Gratuit
                              </span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            {user.isPremium ? (
                              <button
                                onClick={() => handleUserAction(user.email, 'removePremium')}
                                disabled={userActionLoading === user.email}
                                className="p-2 hover:bg-orange-100 rounded-lg text-orange-600 transition-colors disabled:opacity-50"
                                title="Retirer Premium"
                              >
                                {userActionLoading === user.email ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user.email, 'addPremium')}
                                disabled={userActionLoading === user.email}
                                className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors disabled:opacity-50"
                                title="Activer Premium"
                              >
                                {userActionLoading === user.email ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Crown className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {!user.isPremium && (
                              <>
                                <button
                                  onClick={() => handleUserAction(user.email, 'testPremium', '1month')}
                                  disabled={userActionLoading === user.email}
                                  className="p-2 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors disabled:opacity-50 text-[10px] font-medium"
                                  title="Test 1 mois"
                                >
                                  1M
                                </button>
                                <button
                                  onClick={() => handleUserAction(user.email, 'testPremium', '3months')}
                                  disabled={userActionLoading === user.email}
                                  className="p-2 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors disabled:opacity-50 text-[10px] font-medium"
                                  title="Test 3 mois"
                                >
                                  3M
                                </button>
                                <button
                                  onClick={() => handleUserAction(user.email, 'testPremium', '12months')}
                                  disabled={userActionLoading === user.email}
                                  className="p-2 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors disabled:opacity-50 text-[10px] font-medium"
                                  title="Test 12 mois"
                                >
                                  12M
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleUserAction(user.email, 'deleteUser')}
                              disabled={userActionLoading === user.email}
                              className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors disabled:opacity-50"
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-6 text-xs text-gray-500">
                    <span>💳 PayPal = Payé via PayPal</span>
                    <span>👤 Admin = Accordé par l'admin</span>
                  </div>
                  
                  {/* Migrate old accounts button */}
                  <button
                    onClick={migrateOldAccounts}
                    disabled={migrateLoading}
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {migrateLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    Corriger anciens comptes
                  </button>
                </div>
              </div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Boîte de réception</h2>
                      <p className="text-xs text-gray-400">{contactMessages.length} message{contactMessages.length > 1 ? 's' : ''} • {contactMessages.filter(m => !m.read).length} non lu{contactMessages.filter(m => !m.read).length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={fetchMessages}
                    disabled={messagesLoading}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${messagesLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </button>
                </div>

                {messagesLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                    <p className="text-gray-400 mt-3">Chargement des messages...</p>
                  </div>
                ) : contactMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun message</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {contactMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`p-4 rounded-xl border ${msg.read ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {!msg.read && (
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Nouveau</span>
                              )}
                              {msg.replied && (
                                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Répondu ✓</span>
                              )}
                              <span className="text-xs text-gray-400">
                                {new Date(msg.createdAt).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Mail className="w-3 h-3" />
                              <span>{msg.email}</span>
                              {msg.email === 'Non renseigné' && (
                                <span className="text-xs text-orange-500">(⚠️ pas d'email)</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
                              <Tag className="w-3 h-3" />
                              <span>{msg.subject === 'bug' ? '🐛 Bug' : msg.subject === 'feature' ? '💡 Suggestion' : msg.subject === 'premium' ? '👑 Premium' : '❓ Autre'}</span>
                            </div>
                            
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.message}</p>
                            
                            {/* Show reply if exists */}
                            {msg.replied && msg.replyMessage && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                                  <Reply className="w-3 h-3" />
                                  <span>Votre réponse ({msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString('fr-FR') : ''})</span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.replyMessage}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 ml-4">
                            {/* Reply button - only if email is valid */}
                            {msg.email && msg.email !== 'Non renseigné' && !msg.replied && (
                              <button
                                onClick={() => setReplyModal({ open: true, message: msg })}
                                className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                title="Répondre"
                              >
                                <Reply className="w-4 h-4" />
                              </button>
                            )}
                            {!msg.read && (
                              <button
                                onClick={() => markMessageAsRead(msg.id)}
                                className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                                title="Marquer comme lu"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Sécurité</h2>
                    <p className="text-xs text-gray-400">Changez votre mot de passe admin</p>
                  </div>
                </div>

                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <p className="text-green-700 font-medium">Mot de passe changé avec succès !</p>
                  </div>
                )}

                {passwordError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700">{passwordError}</p>
                  </div>
                )}

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 caractères"
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Confirmer le mot de passe</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retapez le mot de passe"
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={changePassword}
                    disabled={isLoading || !newPassword || !confirmPassword}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Changer le mot de passe
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ Attention :</strong> Le changement de mot de passe prend effet immédiatement. 
                    Assurez-vous de mémoriser le nouveau mot de passe.
                  </p>
                </div>
              </div>
            )}

            {/* JOURNAL UTILISATEURS TAB */}
            {activeTab === 'journal' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Journal Utilisateurs</h2>
                      <p className="text-xs text-gray-400">Activite des utilisateurs sur l&apos;application</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchJournalStats}
                    disabled={journalLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${journalLoading ? 'animate-spin' : ''}`} />
                    Rafraichir
                  </button>
                </div>

                {journalLoading && !journalStats ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
                    <p className="text-gray-500">Chargement du journal...</p>
                  </div>
                ) : journalStats ? (
                  <>
                    {/* Aujourd'hui - KPI Cards */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Aujourd&apos;hui</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-blue-500" />
                            <p className="text-xs text-blue-600 font-medium">Connexions</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-700">{journalStats.today?.logins || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-4 h-4 text-green-500" />
                            <p className="text-xs text-green-600 font-medium">Analyses</p>
                          </div>
                          <p className="text-2xl font-bold text-green-700">{journalStats.today?.analyses || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-4 h-4 text-purple-500" />
                            <p className="text-xs text-purple-600 font-medium">Coach</p>
                          </div>
                          <p className="text-2xl font-bold text-purple-700">{journalStats.today?.coach || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Crown className="w-4 h-4 text-orange-500" />
                            <p className="text-xs text-orange-600 font-medium">Paiements</p>
                          </div>
                          <p className="text-2xl font-bold text-orange-700">{journalStats.today?.payments || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Gift className="w-4 h-4 text-pink-500" />
                            <p className="text-xs text-pink-600 font-medium">Promos</p>
                          </div>
                          <p className="text-2xl font-bold text-pink-700">{journalStats.today?.promosUsed || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-4 h-4 text-indigo-500" />
                            <p className="text-xs text-indigo-600 font-medium">Inscriptions</p>
                          </div>
                          <p className="text-2xl font-bold text-indigo-700">{journalStats.today?.signups || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Totaux + Taux de Conversion */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Totaux</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <p className="text-xs text-gray-500">Utilisateurs uniques</p>
                          <p className="text-2xl font-bold text-gray-800">{journalStats.total?.users || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <p className="text-xs text-gray-500">Total connexions</p>
                          <p className="text-2xl font-bold text-gray-800">{journalStats.total?.logins || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <p className="text-xs text-gray-500">Utilisateurs Premium</p>
                          <p className="text-2xl font-bold text-gray-800">{journalStats.total?.premiumUsers || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-300">
                          <p className="text-xs text-emerald-600 font-medium">Taux de Conversion</p>
                          <p className="text-2xl font-bold text-emerald-700">{journalStats.total?.conversionRate || 0}%</p>
                          <p className="text-[10px] text-emerald-500 mt-1">gratuit vers premium</p>
                        </div>
                      </div>
                    </div>

                    {/* Graphique Connexions par jour (7 jours) */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        <h3 className="font-medium text-gray-700">Connexions par jour (7 derniers jours)</h3>
                      </div>
                      <div className="p-4">
                        <div className="flex items-end gap-2 h-40">
                          {journalStats.dailyLogins?.map((d: { date: string; count: number }, i: number) => {
                            const maxCount = Math.max(...(journalStats.dailyLogins?.map((x: { count: number }) => x.count) || [1]), 1)
                            const height = Math.max((d.count / maxCount) * 100, 4)
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs font-bold text-blue-700">{d.count}</span>
                                <div
                                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 min-h-[4px]"
                                  style={{ height: `${height}%` }}
                                />
                                <span className="text-[10px] text-gray-400 text-center leading-tight">{d.date}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Graphiques Analyses + Coach (cote a cote) */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-green-600" />
                          <h3 className="font-medium text-gray-700">Analyses / jour</h3>
                        </div>
                        <div className="p-4">
                          <div className="flex items-end gap-2 h-32">
                            {journalStats.dailyAnalyses?.map((d: { date: string; count: number }, i: number) => {
                              const maxCount = Math.max(...(journalStats.dailyAnalyses?.map((x: { count: number }) => x.count) || [1]), 1)
                              const height = Math.max((d.count / maxCount) * 100, 4)
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-xs font-bold text-green-700">{d.count}</span>
                                  <div
                                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 min-h-[4px]"
                                    style={{ height: `${height}%` }}
                                  />
                                  <span className="text-[10px] text-gray-400 text-center leading-tight">{d.date}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-purple-600" />
                          <h3 className="font-medium text-gray-700">Questions Coach / jour</h3>
                        </div>
                        <div className="p-4">
                          <div className="flex items-end gap-2 h-32">
                            {journalStats.dailyCoach?.map((d: { date: string; count: number }, i: number) => {
                              const maxCount = Math.max(...(journalStats.dailyCoach?.map((x: { count: number }) => x.count) || [1]), 1)
                              const height = Math.max((d.count / maxCount) * 100, 4)
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-xs font-bold text-purple-700">{d.count}</span>
                                  <div
                                    className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 min-h-[4px]"
                                    style={{ height: `${height}%` }}
                                  />
                                  <span className="text-[10px] text-gray-400 text-center leading-tight">{d.date}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Utilisation des codes promo */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-pink-600" />
                        <h3 className="font-medium text-gray-700">Utilisation des codes promo</h3>
                      </div>
                      <div className="p-4">
                        {journalStats.promoUsage?.length > 0 ? (
                          <div className="space-y-2">
                            {journalStats.promoUsage.map((p: { code: string; count: number }, i: number) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                                    <Tag className="w-4 h-4 text-pink-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800 font-mono">{p.code}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-gray-800">{p.count}</span>
                                  <span className="text-xs text-gray-400">utilisation{p.count > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Gift className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Aucune utilisation de code promo enregistree</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conversions recentes */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-600" />
                        <h3 className="font-medium text-gray-700">Conversions recentes (gratuit vers premium)</h3>
                      </div>
                      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                        {journalStats.recentConversions?.length > 0 ? (
                          journalStats.recentConversions.map((c: { email: string; date: string; plan?: string }, i: number) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                                  <Crown className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{c.email}</p>
                                  <p className="text-xs text-gray-400">{c.date}</p>
                                </div>
                              </div>
                              {c.plan && (
                                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                  {c.plan === '1month' ? '1 mois' : c.plan === '3months' ? '3 mois' : c.plan === '12months' ? '12 mois' : c.plan}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Crown className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Aucune conversion enregistree</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune donnee disponible</p>
                    <p className="text-xs text-gray-400 mt-1">Les donnees apparaitront une fois que les utilisateurs commenceront a utiliser l&apos;app</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {replyModal.open && replyModal.message && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Reply className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">Répondre au message</h3>
                  <p className="text-white/70 text-xs">À : {replyModal.message.email}</p>
                </div>
              </div>
              <button 
                onClick={() => { setReplyModal({ open: false, message: null }); setReplyText('') }}
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Original message */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Message original :</p>
                <p className="text-sm text-gray-700 line-clamp-3">{replyModal.message.message}</p>
              </div>

              {/* Reply textarea */}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Écrivez votre réponse..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setReplyModal({ open: false, message: null }); setReplyText('') }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={sendReply}
                  disabled={replySending || !replyText.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {replySending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-3">
                💡 Configurez BREVO_API_KEY dans Vercel pour activer l'envoi d'emails
              </p>
            </div>
          </div>
        </div>
      )}

            {/* REFERRAL TAB */}
            {activeTab === 'referral' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Gift className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Parrainage</h2>
                    <p className="text-xs text-gray-400">Configurez le systeme de parrainage et les recompenses</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
                    <p className="text-xs text-pink-600 font-medium">Total parrainages</p>
                    <p className="text-3xl font-bold text-pink-700">{referralStats.totalReferrals}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium">Conversions</p>
                    <p className="text-3xl font-bold text-purple-700">{referralStats.totalConverted}</p>
                  </div>
                </div>

                {/* Enable/Disable */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${referralConfig.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {referralConfig.enabled ? <Play className="w-5 h-5 text-green-600" /> : <Pause className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Systeme de parrainage</p>
                        <p className="text-xs text-gray-400">{referralConfig.enabled ? 'Actif - les utilisateurs peuvent parrainer' : 'Desactive'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setReferralConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className={`px-4 py-2 rounded-xl font-medium text-sm ${referralConfig.enabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {referralConfig.enabled ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                </div>

                {/* Referrer Reward */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-500" />
                    Recompense du Parrain
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Type de recompense</label>
                      <select
                        value={referralConfig.referrerRewardType}
                        onChange={(e) => setReferralConfig(prev => ({ ...prev, referrerRewardType: e.target.value as 'free_analyses' | 'premium_days' }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="free_analyses">Analyses gratuites</option>
                        <option value="premium_days">Jours Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Quantite</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={referralConfig.referrerRewardAmount}
                        onChange={(e) => setReferralConfig(prev => ({ ...prev, referrerRewardAmount: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                    Le parrain recevra : <strong>{referralConfig.referrerRewardAmount} {referralConfig.referrerRewardType === 'free_analyses' ? 'analyse(s) gratuite(s)' : 'jour(s) Premium'}</strong> pour chaque ami qui utilise son code
                  </p>
                </div>

                {/* Referred Reward */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-pink-500" />
                    Recompense du Filleul
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Type de recompense</label>
                      <select
                        value={referralConfig.referredRewardType}
                        onChange={(e) => setReferralConfig(prev => ({ ...prev, referredRewardType: e.target.value as 'free_analyses' | 'premium_days' }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="free_analyses">Analyses gratuites</option>
                        <option value="premium_days">Jours Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Quantite</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={referralConfig.referredRewardAmount}
                        onChange={(e) => setReferralConfig(prev => ({ ...prev, referredRewardAmount: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                    Le filleul recevra : <strong>{referralConfig.referredRewardAmount} {referralConfig.referredRewardType === 'free_analyses' ? 'analyse(s) gratuite(s)' : 'jour(s) Premium'}</strong> en utilisant le code de parrainage
                  </p>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveReferralConfig}
                  disabled={referralSaving}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {referralSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Sauvegarder la configuration
                </button>
              </div>
            )}
    </div>
  )
}
