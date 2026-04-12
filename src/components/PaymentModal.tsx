import React, { useState } from 'react'
import { X, Crown, Check, CreditCard, Loader2 } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  language?: string
  settings: {
    pack1Month: number
    pack3Months: number
    pack12Months: number
    premiumCurrency: string
  }
  onPayment: (planId: string) => void
  isProcessing?: boolean
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  language = 'fr',
  settings,
  onPayment,
  isProcessing = false
}) => {
  const [selectedPack, setSelectedPack] = useState<'1month' | '3months' | '12months'>('3months')
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<{ valid: boolean; discount: number; discountType: string; message: string } | null>(null)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)

  if (!isOpen) return null

  const validatePromoCode = async (code: string) => {
    if (!code.trim()) return
    setIsValidatingPromo(true)
    try {
      const res = await fetch('/api/promo?code=' + encodeURIComponent(code))
      const data = await res.json()
      setPromoResult(data)
    } catch (e) {
      setPromoResult({ valid: false, discount: 0, discountType: 'percent', message: 'Erreur de validation' })
    }
    setIsValidatingPromo(false)
  }

  const getPackPrice = () => {
    switch (selectedPack) {
      case '1month': return settings.pack1Month
      case '3months': return settings.pack3Months
      case '12months': return settings.pack12Months
      default: return settings.pack3Months
    }
  }

  const getCurrentDiscountedPrice = () => {
    const basePrice = getPackPrice()
    if (!promoResult?.valid) return basePrice
    if (promoResult.discountType === 'percent') {
      return basePrice * (1 - promoResult.discount / 100)
    }
    return Math.max(0, basePrice - promoResult.discount)
  }

  const features = language === 'fr' ? [
    'Analyses illimitées',
    'Coach relationnel illimité',
    'Sauvegarde cloud',
    'Multi-appareils'
  ] : [
    'Unlimited analyses',
    'Unlimited relationship coach',
    'Cloud backup',
    'Multi-device'
  ]

  const plans = [
    { id: '1month' as const, name: language === 'fr' ? '1 Mois' : '1 Month', price: settings.pack1Month, perMonth: settings.pack1Month },
    { id: '3months' as const, name: language === 'fr' ? '3 Mois' : '3 Months', price: settings.pack3Months, perMonth: settings.pack3Months / 3, popular: true },
    { id: '12months' as const, name: language === 'fr' ? '1 An' : '1 Year', price: settings.pack12Months, perMonth: settings.pack12Months / 12 }
  ]

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-purple-500/30 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 p-6 text-white text-center rounded-t-2xl">
          <Crown className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">{language === 'fr' ? 'Devenir Premium' : 'Go Premium'}</h2>
          <p className="text-white/80 mt-1">{language === 'fr' ? 'Débloquez toutes les fonctionnalités' : 'Unlock all features'}</p>
        </div>

        <div className="p-4 border-b border-gray-700">
          <p className="text-sm text-gray-400 mb-3 text-center">{language === 'fr' ? 'Choisissez votre plan' : 'Choose your plan'}</p>
          <div className="grid grid-cols-3 gap-2">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPack(plan.id)}
                className={`p-3 rounded-xl text-center transition-all relative ${
                  selectedPack === plan.id
                    ? 'bg-purple-500/20 border-2 border-purple-500'
                    : 'bg-gray-800 border-2 border-gray-700 hover:border-purple-400'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                    ⭐ {language === 'fr' ? 'Populaire' : 'Popular'}
                  </span>
                )}
                <p className="text-lg font-bold text-purple-400">{plan.price.toFixed(2)}{settings.premiumCurrency}</p>
                <p className="text-xs text-gray-400">{plan.name}</p>
                <p className="text-[10px] text-gray-500">{plan.perMonth.toFixed(2)}{settings.premiumCurrency}{language === 'fr' ? '/mois' : '/mo'}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-gray-700 bg-gray-900">
          <p className="text-xs text-gray-400 mb-2">{language === 'fr' ? 'Code promo (optionnel)' : 'Promo code (optional)'}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder={language === 'fr' ? 'Entrez votre code' : 'Enter your code'}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => validatePromoCode(promoCode)}
              disabled={isValidatingPromo || !promoCode.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isValidatingPromo ? '...' : language === 'fr' ? 'OK' : 'OK'}
            </button>
          </div>
          {promoResult && (
            <p className={`text-xs mt-2 ${promoResult.valid ? 'text-green-400' : 'text-red-400'}`}>
              {promoResult.valid ? '✓ ' : '✗ '}{promoResult.message}
            </p>
          )}
        </div>

        <div className="p-4">
          <div className="space-y-2 text-sm text-gray-300">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-xl font-medium hover:bg-gray-800">
            {language === 'fr' ? 'Fermer' : 'Close'}
          </button>
          <button
            onClick={() => onPayment(selectedPack)}
            disabled={isProcessing}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'fr' ? 'Redirection...' : 'Redirecting...'}
              </>
            ) : promoResult?.valid ? (
              <span className="flex items-center gap-2">
                <span className="line-through text-white/50 text-sm">{getPackPrice().toFixed(2)}{settings.premiumCurrency}</span>
                <span>{getCurrentDiscountedPrice().toFixed(2)}{settings.premiumCurrency}</span>
              </span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                {language === 'fr' ? `Payer ${getPackPrice().toFixed(2)}${settings.premiumCurrency}` : `Pay ${getPackPrice().toFixed(2)}${settings.premiumCurrency}`}
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 pb-4">{language === 'fr' ? 'Paiement sécurisé via PayPal' : 'Secure payment via PayPal'}</p>
      </div>
    </div>
  )
}

export default PaymentModal
