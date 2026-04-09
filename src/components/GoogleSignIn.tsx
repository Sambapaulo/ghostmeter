'use client'

import { useState, useEffect } from 'react'

// Types for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => { requestAccessToken: (opts?: any) => void }
        }
      }
    }
  }
}

interface GoogleSignInProps {
  onSuccess: (email: string, name: string) => void
  onError: (error: string) => void
  language: 'fr' | 'en' | 'es' | 'de' | 'pt' | 'it'
}

export default function GoogleSignIn({ onSuccess, onError, language }: GoogleSignInProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    
    if (!clientId) {
      onError(language === 'fr' ? 'Configuration Google manquante' : 'Google configuration missing')
      return
    }

    if (!window.google?.accounts?.oauth2) {
      onError(language === 'fr' ? 'Google Sign-in non disponible. Vérifiez votre connexion.' : 'Google Sign-in unavailable. Check your connection.')
      return
    }

    setIsLoading(true)

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (response: any) => {
          if (response.access_token) {
            try {
              const userInfoResponse = await fetch(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: 'Bearer ' + response.access_token } }
              )

              if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json()
                onSuccess(userInfo.email, userInfo.name)
                
                // Send to backend
                await fetch('/api/auth', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'google',
                    email: userInfo.email,
                    name: userInfo.name,
                    accessToken: response.access_token,
                  }),
                })
              } else {
                onError(language === 'fr' ? 'Erreur lors de la récupération des infos' : 'Error fetching user info')
              }
            } catch (error) {
              onError(language === 'fr' ? 'Erreur de connexion' : 'Connection error')
            }
          } else {
            onError(language === 'fr' ? 'Connexion annulée' : 'Sign-in cancelled')
          }
          setIsLoading(false)
        },
        error_callback: (error: Error) => {
          onError(language === 'fr' ? 'Erreur Google' : 'Google error')
          setIsLoading(false)
        },
      })

      tokenClient.requestAccessToken({ prompt: 'consent' })
    } catch (error) {
      onError(language === 'fr' ? 'Erreur d\'initialisation' : 'Initialization error')
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
    >
      {isLoading ? (
        <span className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-purple-500 rounded-full" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      <span>{language === 'fr' ? 'Continuer avec Google' : 'Continue with Google'}</span>
    </button>
  )
}
