// ML Kit OCR - Native plugin or server API fallback

export async function recognizeText(base64Image: string): Promise<{ success: boolean; text?: string; error?: string }> {
  console.log('recognizeText called, image length:', base64Image?.length)
  
  // Fallback: use server API
  try {
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image })
    })

    const data = await response.json()
    console.log('OCR API response:', data)
    return data
  } catch (err: any) {
    console.error('OCR API error:', err)
    return { success: false, error: 'OCR failed: ' + err.message }
  }
}
