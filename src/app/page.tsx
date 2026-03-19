'use client'

import { useState } from 'react'
import OCRUploader from '../components/OCRUploader'

export default function Page() {
  const [conversation, setConversation] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleAnalyze = async () => {
    if (!conversation.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation })
      })
      const data = await res.json()
      setResult(data.result || 'Aucun résultat')
    } catch (err) {
      console.error(err)
      setResult('Erreur lors de l’analyse')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">💬 Analyseur de conversation</h1>

      {/* Composant OCR pour importer des captures d'écran */}
      <OCRUploader
        onTextExtracted={(text) =>
          setConversation((prev) => (prev ? prev + '\n' : '') + text)
        }
      />

      {/* Zone texte pour coller la conversation */}
      <label className="block mb-2 font-medium">Coller votre conversation :</label>
      <textarea
        className="w-full border rounded p-2 mb-4 h-40"
        value={conversation}
        onChange={(e) => setConversation(e.target.value)}
      />

      <button
        onClick={handleAnalyze}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Analyse en cours…' : 'Analyser la conversation'}
      </button>

      {/* Affichage du résultat */}
      {result && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Résultat :</h2>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  )
}