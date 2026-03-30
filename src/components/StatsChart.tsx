'use client'

import { useEffect, useState } from 'react'

export default function StatsChart({ data }: { data: { date: string; users: number; premium: number }[] }) {
  const [Chart, setChart] = useState<React.ReactNode>(null)

  useEffect(() => {
    // Only load recharts on client side
    import('recharts').then((mod) => {
      const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod
      
      setChart(
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" allowDecimals={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelStyle={{ color: '#374151' }}
            />
            <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="url(#colorUsers)" name="Nouveaux utilisateurs" />
            <Area type="monotone" dataKey="premium" stroke="#22c55e" fill="url(#colorPremium)" name="Nouveaux Premium" />
          </AreaChart>
        </ResponsiveContainer>
      )
    })
  }, [data])

  return (
    <div className="h-64">
      {Chart || (
        <div className="h-full flex items-center justify-center text-gray-400">
          Chargement du graphique...
        </div>
      )}
    </div>
  )
}
