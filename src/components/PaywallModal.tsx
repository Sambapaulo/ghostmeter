import React from 'react'
import { X, Crown, Check, Zap, Shield, Star } from 'lucide-react'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenPayment: () => void
  language?: string
}

const PaywallModal: React.FC<PaywallModalProps> = ({ 
  isOpen, 
  onClose, 
  onOpenPayment,
  language = 'fr'
}) => {
  if (!isOpen) return null

  const features = language === 'fr' ? [
    'Analyses illimitées',
    'Accès prioritaire aux nouveautés',
    'Support prioritaire',
    'Sans publicité'
  ] : [
    'Unlimited analyses',
    'Early access to new features',
    'Priority support',
    'Ad-free experience'
  ]

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
        
        <div className="pt-8 pb-4 px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {language === 'fr' ? 'Analyses gratuites épuisées !' : 'Free analyses exhausted!'}
          </h3>
          <p className="text-gray-400 text-sm">
            {language === 'fr' 
              ? 'Passez Premium pour continuer a utiliser GhostMeter sans limite'
              : 'Go Premium to continue using GhostMeter without limits'}
          </p>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-gray-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 mb-4">
          <button
            onClick={() => { onClose(); onOpenPayment(); }}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            {language === 'fr' ? 'Devenir Premium' : 'Become Premium'}
          </button>
        </div>

        <div className="px-6 mb-4">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              {language === 'fr' ? 'Sécurisé' : 'Secure'}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {language === 'fr' ? 'Instantané' : 'Instant'}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {language === 'fr' ? 'Satisfait ou remboursé' : 'Money back'}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-500 mb-2">
            {language === 'fr' 
              ? 'Paiement sécurisé via PayPal • Annulation a tout moment'
              : 'Secure payment via PayPal • Cancel anytime'}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm underline transition-colors">
            {language === 'fr' ? 'Continuer avec les limitations' : 'Continue with limitations'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaywallModal
