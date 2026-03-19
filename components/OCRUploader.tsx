'use client'

import { useState } from 'react'
import OCRUploader from '@/components/OCRUploader'

export default function HomePage() {
  const [extractedText, setExtractedText] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">GhostMeter OCR</h1>

      <OCRUploader onExtract={setExtractedText} />

      {extractedText && (
        <div className="mt-6 w-full max-w-lg p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Texte extrait :</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{extractedText}</p>
        </div>
      )}
    </div>
  )
}