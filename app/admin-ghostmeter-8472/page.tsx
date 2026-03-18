"use client"

import { useEffect, useState } from "react"

type Promo = {
  id: string
  code: string
  discount: number
  active: boolean
}

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [price, setPrice] = useState("")
  const [promos, setPromos] = useState<Promo[]>([])
  const [code, setCode] = useState("")
  const [discount, setDiscount] = useState("")

  const fetchData = async () => {
    const res = await fetch("/api/admin/get", {
      method: "POST",
      body: JSON.stringify({ password })
    })
    const data = await res.json()
    setPrice(data.price?.toString() || "")
    setPromos(data.promos || [])
  }

  const updatePrice = async () => {
    await fetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        password,
        type: "price",
        price: parseFloat(price)
      })
    })
    fetchData()
  }

  const createPromo = async () => {
    await fetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        password,
        type: "promo",
        code,
        discount: parseInt(discount)
      })
    })
    setCode("")
    setDiscount("")
    fetchData()
  }

  const togglePromo = async (id: string) => {
    await fetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        password,
        type: "toggle",
        id
      })
    })
    fetchData()
  }

  const deletePromo = async (id: string) => {
    await fetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        password,
        type: "delete",
        id
      })
    })
    fetchData()
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1>Admin GhostMeter</h1>

      <input
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: 20 }}
      />

      <button onClick={fetchData}>Connexion</button>

      <h2>Prix</h2>
      <input
        placeholder="Prix"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <button onClick={updatePrice}>Mettre à jour</button>

      <h2>Créer code promo</h2>
      <input
        placeholder="Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <input
        placeholder="Discount %"
        value={discount}
        onChange={(e) => setDiscount(e.target.value)}
      />
      <button onClick={createPromo}>Créer</button>

      <h2>Liste des codes</h2>
      {promos.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
          <strong>{p.code}</strong> - {p.discount}% - {p.active ? "✅ actif" : "❌ off"}
          <br />
          <button onClick={() => togglePromo(p.id)}>Activer / Désactiver</button>
          <button onClick={() => deletePromo(p.id)}>Supprimer</button>
        </div>
      ))}
    </div>
  )
}
