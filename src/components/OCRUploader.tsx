'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, X, Loader2, Image as ImageIcon } from 'lucide-react'

interface OCRUploaderProps {
  onTextExtracted: (text: string) => void
  onClose: () => void
}

export default function OCRUploader({ onTextExtracted, onClose }: OCRUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetAll = useCallback(() => {
    setIsProcessing(false)
    setProgress(0)
    setError(null)
    setPreview(null)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Sélectionnez une image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop grande (max 5MB)')
      return
    }

    setError(null)
    setProgress(0)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setPreview(dataUrl)
      processImage(dataUrl)
    }
    reader.onerror = () => setError('Erreur lecture image')
    reader.readAsDataURL(file)
  }

  const processImage = async (dataUrl: string) => {
    setIsProcessing(true)
    setProgress(10)

    try {
      setProgress(20)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl })
      })

      setProgress(50)

      const data = await response.json()
      
      setProgress(80)

      if (!data.success) {
        throw new Error(data.error || 'Erreur serveur')
      }

      setProgress(100)
      setIsProcessing(false)
      onTextExtracted(data.text)
      
    } catch (err: any) {
      console.error('OCR error:', err)
      setError(err.message || 'Erreur analyse')
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <span className="font-semibold">Importer une capture</span>
          </div>
          <button onClick={() => { resetAll(); onClose(); }} className="p-1 hover:bg-white/20 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {preview ? (
            <div className="relative mb-4">
              <img src={preview} alt="" className="w-full h-48 object-contain rounded-xl border" />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                  <span className="text-white text-sm">{progress}%</span>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Cliquez pour importer</p>
            </div>
          )}

          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <p>1️⃣ Capturez votre conversation</p>
            <p>2️⃣ Importez l'image</p>
            <p>3️⃣ Le texte sera extrait</p>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={() => { resetAll(); onClose(); }} className="flex-1 py-3 border rounded-xl hover:bg-gray-50">Annuler</button>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isProcessing} 
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin"/>Analyse...</> : <><Upload className="w-4 h-4"/>Importer</>}
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  )
}
