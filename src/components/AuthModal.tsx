'use client'

import { useState } from 'react'
import { X, Mail, Crown, Check } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onPremiumActivated: () => void
}

export default function AuthModal({ isOpen, onClose, onPremiumActivated }: AuthModalProps) {
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
      // Créer/connecter l'utilisateur
      const loginRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'login' })
      })

      // Activer le premium
      const premRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'activatePremium' })
      })
      const data = await premRes.json()

      if (data.success) {
        localStorage.setItem('ghostmeter_email', email.toLowerCase())
        localStorage.setItem('ghostmeter_premium', 'true')
        setSuccess(true)
        setTimeout(() => {
          onPremiumActivated()
          onClose()
        }, 1500)
      } else {
        setError('Erreur activation')
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
            <h3 className="font-semibold">Activer Premium</h3>
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
              <p className="font-medium text-green-600">Premium activé !</p>
              <p className="text-sm text-gray-400 mt-1">Votre compte est sauvegardé</p>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-500 text-sm mb-4">
                Entrez votre email pour sauvegarder votre compte Premium.<br/>
                Vous pourrez le récupérer sur n'importe quel appareil.
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
                {isLoading ? 'Activation...' : 'Activer et sauvegarder'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
