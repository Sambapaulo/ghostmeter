'use client'

import { useState } from 'react'
import Tesseract from 'tesseract.js'

export default function OCRUploader({ onExtract }: { onExtract: (text: string) => void }) {
  const [loading, setLoading] = useState(false)

  const handleImage = async (file: File) => {
    setLoading(true)

    try {
      const { data } = await Tesseract.recognize(file, 'eng+fra', {
        logger: m => console.log(m)
      })

      onExtract(data.text)
    } catch (err) {
      alert('Erreur OCR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-2 border-dashed border-purple-300 rounded-xl p-4 text-center mb-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) handleImage(e.target.files[0])
        }}
        className="hidden"
        id="ocr-upload"
      />

      <label htmlFor="ocr-upload" className="cursor-pointer">
        <p className="text-sm text-gray-500">
          📸 Upload screenshot
        </p>
        <p className="text-xs text-gray-400 mt-1">
          WhatsApp, Insta, Snap...
        </p>
      </label>

      {loading && (
        <p className="text-purple-500 text-sm mt-2">
          🔍 Lecture de la conversation...
        </p>
      )}
    </div>
  )
}