import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const result = await Tesseract.recognize(buffer, 'fra+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log('OCR Progress: ' + Math.round(m.progress * 100) + '%');
        }
      },
    });

    const extractedText = result.data.text.trim();

    if (extractedText.length < 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'Aucun texte détecté dans l\'image.' 
      });
    }

    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[|]/g, ' ')
      .replace(/[}{\[\]]/g, '')
      .trim();

    return NextResponse.json({ success: true, text: cleanedText });

  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}