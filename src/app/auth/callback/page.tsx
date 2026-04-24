'use client'

import { useEffect } from 'react'

export default function AuthCallback() {
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
          // Save session server-side (works from any browser)
          fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'google',
              email: userInfo.email,
              name: userInfo.name,
              accessToken: accessToken,
            }),
          }).then(() => {
            // Redirect to APK via custom scheme
            window.location.href = 'ghostmeter://callback?email=' + encodeURIComponent(userInfo.email) + '&name=' + encodeURIComponent(userInfo.name || '')
          })
        })
        .catch(err => {
          console.error('Auth error:', err)
          window.location.href = 'ghostmeter://callback?error=1'
        })
    } else {
      window.location.href = 'ghostmeter://callback?error=1'
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0a2e]">
      <div className="text-center text-white">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p>Connexion en cours...</p>
      </div>
    </div>
  )
}
