'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')

    if (accessToken) {
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: 'Bearer ' + accessToken }
      })
        .then(res => res.json())
        .then(userInfo => {
          localStorage.setItem('ghostmeter_email', userInfo.email)
          localStorage.setItem('ghostmeter_user_name', userInfo.name || '')

          fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'google',
              email: userInfo.email,
              name: userInfo.name,
              accessToken: accessToken,
            }),
          })

          // Try closing Chrome Custom Tab, fallback to redirect
          try { window.close() } catch(e) {}
          window.location.href = '/?from=apk'
        })
        .catch(err => {
          console.error('Auth error:', err)
          try { window.close() } catch(e) {}
          window.location.href = '/?auth=error'
        })
    } else {
      try { window.close() } catch(e) {}
      window.location.href = '/?auth=error'
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0a2e]">
      <div className="text-center text-white">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p>Connexion en cours...</p>
      </div>
    </div>
  )
}
