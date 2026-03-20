'use client'

import { useState, useRef } from 'react'
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('L''image est trop volumineuse (max 10MB)')
      return
    }

    setError(null)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    processImage(file)
  }

  const processImage = async (file: File) => {
    setIsProcessing(true)
    setProgress(10)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      setProgress(30)
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      })

      setProgress(70)
      
      const data = await response.json()

      setProgress(90)

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Erreur OCR')
      }

      const text = data.text.trim()
      
      if (text.length < 10) {
        setError('Aucun texte détecté dans l''image. Essayez une capture plus claire.')
        setIsProcessing(false)
        return
      }

      setProgress(100)
      onTextExtracted(text)
      setIsProcessing(false)
    } catch (err) {
      console.error('OCR Error:', err)
      setError('Erreur lors de l''analyse: ' + (err instanceof Error ? err.message : 'Réessayez'))
      setIsProcessing(false)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          setError(null)
          const reader = new FileReader()
          reader.onload = (ev) => setPreview(ev.target?.result as string)
          reader.readAsDataURL(file)
          processImage(file)
        }
        break
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setError(null)
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
      processImage(file)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-semibold">Importer une capture</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
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
              <img src={preview} alt="Preview" className="w-full h-48 object-contain rounded-xl border border-gray-200" />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                  <p className="text-white text-sm">Analyse... {progress}%</p>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">Cliquez ou glissez une image</p>
              <p className="text-gray-400 text-sm">Capture d'écran de conversation</p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Prenez une capture de votre conversation
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Importez-la ici (ou Ctrl+V pour coller)
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Le texte sera extrait automatiquement
            </p>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Annuler</button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {isProcessing ? (<><Loader2 className="w-4 h-4 animate-spin" />Analyse...</>) : (<><Upload className="w-4 h-4" />Importer</>)}
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  )
}
