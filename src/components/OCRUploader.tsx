'use client'

import { useState, useRef } from 'react'
import { Camera, X, Loader2, Image as ImageIcon } from 'lucide-react'
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
  const [status, setStatus] = useState('idle') // idle, loading, processing
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = (base64: string, maxWidth: number = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = base64
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setError('Aucun fichier selectionne')
      return
    }

    setStatus('loading')
    setError(null)
    setPreview(null)

    try {
      const reader = new FileReader()
      
      reader.onload = async (ev) => {
        try {
          let base64 = ev.target?.result as string
          
          if (!base64) {
            setError('Erreur lecture fichier')
            setStatus('idle')
            return
          }

          // Compresser l'image
          const compressed = await compressImage(base64)
          setPreview(compressed)
          setStatus('processing')
          
          await processImage(compressed)
        } catch (err) {
          setError('Erreur traitement image')
          setStatus('idle')
        }
      }
      
      reader.onerror = () => {
        setError('Erreur lecture fichier')
        setStatus('idle')
      }
      
      reader.readAsDataURL(file)
      
    } catch (err) {
      setError('Erreur inattendue')
      setStatus('idle')
    }
    
    // Reset input pour permettre de reselectionner
    e.target.value = ''
  }

  const processImage = async (base64: string) => {
    setIsProcessing(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress(p => p >= 90 ? p : p + 10)
    }, 300)

    try {
      const result = await recognizeText(base64)
      
      clearInterval(interval)
      setProgress(100)

      if (result.success && result.text) {
        setStatus('idle')
        onTextExtracted(result.text)
      } else {
        setError(result.error || 'Erreur analyse')
        setStatus('idle')
      }
    } catch (err) {
      clearInterval(interval)
      setError('Erreur analyse')
      setStatus('idle')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
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

          {status !== 'idle' ? (
            <div className="relative mb-4">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-48 object-contain rounded-xl border border-gray-200" />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                <p className="text-white text-sm">
                  {status === 'loading' ? 'Chargement...' : 'Analyse... ' + progress + '%'}
                </p>
              </div>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 active:bg-purple-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">Appuyez pour selectionner</p>
              <p className="text-gray-400 text-sm">JPG, PNG - Max 10MB</p>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button 
              onClick={onClose} 
              className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
              disabled={isProcessing}
            >
              Annuler
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isProcessing} 
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? 'Analyse...' : 'Importer'}
            </button>
          </div>
        </div>

        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/jpeg,image/png,image/jpg,image/*" 
          onChange={handleFileSelect} 
          className="hidden"
          
        />
      </div>
    </div>
  )
}
