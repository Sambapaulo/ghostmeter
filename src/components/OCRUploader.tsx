'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { recognizeText } from '@/lib/mlkit'

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
    if (!file.type.startsWith('image/')) { setError('Image requise'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Max 10MB'); return }
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setPreview(base64)
      processImage(base64)
    }
    reader.readAsDataURL(file)
  }

  const processImage = async (base64: string) => {
    setIsProcessing(true)
    setProgress(0)
    const interval = setInterval(() => setProgress(p => p >= 90 ? p : p + 15), 200)
    try {
      const result = await recognizeText(base64)
      clearInterval(interval)
      setProgress(100)
      if (result.success && result.text) onTextExtracted(result.text)
      else setError(result.error || 'Erreur')
    } catch (err) {
      clearInterval(interval)
      setError('Erreur analyse')
    } finally { setIsProcessing(false) }
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
          reader.onload = (ev) => {
            const base64 = ev.target?.result as string
            setPreview(base64)
            processImage(base64)
          }
          reader.readAsDataURL(file)
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
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        setPreview(base64)
        processImage(base64)
      }
      reader.readAsDataURL(file)
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
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
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
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">Cliquez ou glissez une image</p>
              <p className="text-gray-400 text-sm">Capture d'ecran</p>
            </div>
          )}
          <div className="mt-6 flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Annuler</button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50">
              {isProcessing ? 'Analyse...' : 'Importer'}
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  )
}
