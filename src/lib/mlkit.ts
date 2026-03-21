// ML Kit OCR - utilise le plugin natif si disponible, sinon fallback API

declare global {
  interface Window {
    MLKitOCR?: {
      recognizeText: (options: { image: string }) => Promise<{ success: boolean; text: string }>
    }
    Capacitor?: {
      isNative: () => boolean
      Plugins: {
        MLKitOCR?: {
          recognizeText: (options: { image: string }) => Promise<{ success: boolean; text: string }>
        }
      }
    }
  }
}

export async function recognizeText(base64Image: string): Promise<{ success: boolean; text?: string; error?: string }> {
  // Check if running in Capacitor native app
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNative?.()
  
  if (isNative && window.Capacitor?.Plugins?.MLKitOCR) {
    try {
      const result = await window.Capacitor.Plugins.MLKitOCR.recognizeText({ image: base64Image })
      return { success: true, text: result.text }
    } catch (err: any) {
      console.error('ML Kit error:', err)
      return { success: false, error: err.message || 'ML Kit failed' }
    }
  }
  
  // Fallback: use server API
  try {
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image })
    })
    
    const data = await response.json()
    return data
  } catch (err: any) {
    console.error('OCR API error:', err)
    return { success: false, error: 'OCR failed' }
  }
}
