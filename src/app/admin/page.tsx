'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, Lock, DollarSign, Tag, Users, Plus, Trash2, 
  Check, X, Eye, EyeOff, LogOut, Save, RefreshCw, Copy,
  Percent, Euro, Clock, Gift
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

interface Settings {
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
  
  const [settings, setSettings] = useState<Settings>({
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings()
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
  }

  const saveSettings = async (newSettings: Settings) => {
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
              {isLoading ? '⏳ Connexion...' : '🔓 Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Mot de passe par défaut: ghostmeter2024
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Tarification Premium</h2>
                <p className="text-xs text-gray-400">Configurez le prix de l'abonnement</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Prix</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.premiumPrice}
                    onChange={(e) => setSettings({ ...settings, premiumPrice: Number(e.target.value) })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.5"
                  />
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Période</label>
                <select
                  value={settings.premiumPeriod}
                  onChange={(e) => setSettings({ ...settings, premiumPeriod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="mois">Par mois</option>
                  <option value="trimestre">Par trimestre</option>
                  <option value="année">Par an</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Analyses gratuites/jour</label>
                <input
                  type="number"
                  value={settings.freeAnalysesPerDay}
                  onChange={(e) => setSettings({ ...settings, freeAnalysesPerDay: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="100"
                />
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mt-4">
                <p className="text-sm text-gray-500 mb-2">Aperçu du prix:</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-purple-600">{settings.premiumPrice}{settings.premiumCurrency}</span>
                  <span className="text-gray-400">/{settings.premiumPeriod}</span>
                </div>
              </div>

              <button
                onClick={() => saveSettings(settings)}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Codes Promo</h2>
                <p className="text-xs text-gray-400">Gérez les codes promotionnels</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-600 mb-3">Créer un nouveau code</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
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
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
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
                Ajouter
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {settings.promoCodes.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun code promo</p>
              ) : (
                settings.promoCodes.map((promo, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      promo.active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyPromoCode(promo.code)}
                        className="font-mono font-bold text-purple-600 hover:text-purple-800"
                      >
                        {promo.code}
                      </button>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        promo.active ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {promo.active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {promo.discountType === 'percent' ? `${promo.discount}%` : `${promo.discount}${settings.premiumCurrency}`}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({promo.currentUses}/{promo.maxUses})
                      </span>
                      <button
                        onClick={() => togglePromoCode(index)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {promo.active ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-400" />}
                      </button>
                      <button
                        onClick={() => deletePromoCode(index)}
                        className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Statistiques</h2>
                <p className="text-xs text-gray-400">Vue d'ensemble</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                <p className="text-sm text-purple-600">Prix Premium</p>
                <p className="text-2xl font-bold text-purple-800">{settings.premiumPrice}{settings.premiumCurrency}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <p className="text-sm text-green-600">Codes actifs</p>
                <p className="text-2xl font-bold text-green-800">{settings.promoCodes.filter(p => p.active).length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-600">Analyses gratuites/jour</p>
                <p className="text-2xl font-bold text-blue-800">{settings.freeAnalysesPerDay}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4">
                <p className="text-sm text-pink-600">Total codes promo</p>
                <p className="text-2xl font-bold text-pink-800">{settings.promoCodes.length}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}