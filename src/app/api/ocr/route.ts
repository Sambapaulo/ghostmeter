import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'OCR API is running' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;
    
    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided' });
    }

    // Extract base64 from data URL
    const base64Data = image.split(',')[1];
    const mimeType = image.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
    
    // Use Tesseract.js
    const Tesseract = await import('tesseract.js');
    
    const result = await Tesseract.recognize(
      image,
      'fra+eng',
      {}
    );

    const text = result.data.text
      .replace(/\s+/g, ' ')
      .replace(/[|]/g, ' ')
      .trim();

    if (!text || text.length < 5) {
      return NextResponse.json({ 
        success: false, 
        error: 'Pas de texte détecté' 
      });
    }

    return NextResponse.json({ success: true, text });
    
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur OCR',
      details: error instanceof Error ? error.message : 'Unknown'
    });
  }
}
