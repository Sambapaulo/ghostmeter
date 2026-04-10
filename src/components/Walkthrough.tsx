'use client'

import { useState } from 'react'
import { Language } from '@/lib/translations'

interface WalkthroughProps {
  onComplete: () => void
  language: Language
}

export default function Walkthrough({ onComplete, language }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: language === 'fr' ? "Bienvenue sur GhostMeter ! 👻" : "Welcome to GhostMeter! 👻",
      description: language === 'fr' 
        ? "L'application qui détecte le ghosting avant qu'il ne soit trop tard."
        : "The app that detects ghosting before it's too late.",
      icon: "👻",
    },
    {
      title: language === 'fr' ? "Analyse tes conversations" : "Analyze your conversations",
      description: language === 'fr'
        ? "Colle n'importe quelle conversation et notre IA détectera les signes de ghosting."
        : "Paste any conversation and our AI will detect ghosting signs.",
      icon: "🔍",
    },
    {
      title: language === 'fr' ? "Génère les réponses parfaites" : "Generate perfect responses",
      description: language === 'fr'
        ? "Obtiens des suggestions de réponses adaptées à chaque situation."
        : "Get response suggestions tailored to each situation.",
      icon: "💬",
    },
    {
      title: language === 'fr' ? "Ton coach personnel" : "Your personal coach",
      description: language === 'fr'
        ? "Reçois des conseils personnalisés pour améliorer tes interactions."
        : "Get personalized advice to improve your interactions.",
      icon: "🎯",
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-2xl">
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${index === currentStep ? "bg-purple-500 w-8" : "bg-gray-300 dark:bg-gray-600 w-2"}`}
            />
          ))}
        </div>
        <div className="text-6xl mb-4">{steps[currentStep].icon}</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
          {steps[currentStep].title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{steps[currentStep].description}</p>
        <div className="flex gap-3">
          <button
            onClick={onComplete}
            className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {language === 'fr' ? 'Passer' : 'Skip'}
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors"
          >
            {currentStep < steps.length - 1 ? (language === 'fr' ? 'Suivant' : 'Next') : (language === 'fr' ? 'Commencer' : 'Start')}
          </button>
        </div>
      </div>
    </div>
  )
}