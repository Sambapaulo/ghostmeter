'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, Lock, DollarSign, Tag, Users, Plus, Trash2, 
  Check, X, Eye, EyeOff, LogOut, Save, RefreshCw, Copy,
  Percent, Euro, Clock, Gift, Key, Crown, Mail, Calendar,
  TrendingUp, AlertCircle, Search, ChevronDown, ChevronUp
} from 'lucide-react'

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
  analysesCount: number
  createdAt: string
  lastActive: string
}

interface AppSettings {
  premiumPrice: number
  premiumCurrency: string
  premiumPeriod: string
  freeAnalysesPerDay: number
  adminPassword: string
  promoCodes: PromoCode[]
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'pricing' | 'promos' | 'users' | 'security'>('pricing')
  
  const [settings, setSettings] = useState<AppSettings>({
    premiumPrice: 4,
    premiumCurrency: '€',
    premiumPeriod: 'mois',
    freeAnalysesPerDay: 3,
    adminPassword: '',
    promoCodes: []
  })
  
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
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Load settings on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings()
      fetchUsers()
    }
  }, [isAuthenticated])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
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
    setIsAuthenticated(false)
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
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
        setPasswordSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError('Erreur lors du changement de mot de passe')
      }
    } catch (e) {
      setPasswordError('Erreur serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = premiumUsers.filter(user => 
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin GhostMeter</h1>
            <p className="text-gray-500 text-sm mt-1">Connectez-vous pour accéder au panneau</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe admin"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Mot de passe par défaut: ghostmeter2024
          </p>
        </div>
      </div>
    )
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
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Utilisateurs Premium</p>
                <p className="text-xl font-bold text-gray-800">{premiumUsers.length}</p>
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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Analyses gratuites/jour</p>
                <p className="text-xl font-bold text-gray-800">{settings.freeAnalysesPerDay}</p>
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
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
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
          </div>

          <div className="p-6">
            {/* PRICING TAB */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Tarification Premium</h2>
                    <p className="text-xs text-gray-400">Configurez le prix de l'abonnement</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Prix</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.premiumPrice}
                        onChange={(e) => setSettings({ ...settings, premiumPrice: Number(e.target.value) })}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                        step="0.5"
                      />
                      <select
                        value={settings.premiumCurrency}
                        onChange={(e) => setSettings({ ...settings, premiumCurrency: e.target.value })}
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="€">€ EUR</option>
                        <option value="$">$ USD</option>
                        <option value="£">£ GBP</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Période de facturation</label>
                    <select
                      value={settings.premiumPeriod}
                      onChange={(e) => setSettings({ ...settings, premiumPeriod: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="mois">Par mois</option>
                      <option value="trimestre">Par trimestre</option>
                      <option value="année">Par an</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
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
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <p className="text-sm text-gray-500 mb-2">Aperçu du prix dans l'application:</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-purple-600">{settings.premiumPrice}{settings.premiumCurrency}</span>
                    <span className="text-gray-400 text-lg">/{settings.premiumPeriod}</span>
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
                      <h2 className="font-semibold text-lg">Utilisateurs Premium</h2>
                      <p className="text-xs text-gray-400">{premiumUsers.length} utilisateur(s) premium</p>
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
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.email}</p>
                            <p className="text-xs text-gray-400">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Inscrit le {user.createdAt}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <Crown className="w-3 h-3" />
                            Premium
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {user.analysesCount} analyses
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retapez le mot de passe"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
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
          </div>
        </div>
      </div>
    </div>
  )
}
