import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'Image requise' }, { status: 400 });
    }

    // Utiliser OCR.space API (gratuit, 25k requetes/mois)
    const formData = new URLSearchParams();
    formData.append('base64Image', imageBase64);
    formData.append('language', 'fre');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'K88889378888957', // Cle publique de demo
      },
      body: formData
    });

    const data = await response.json();
    
    if (data.OCRExitCode === 1 && data.ParsedResults?.[0]?.ParsedText) {
      const text = data.ParsedResults[0].ParsedText.trim();
      return NextResponse.json({ success: true, text });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: data.ErrorMessage?.[0] || 'Aucun texte detecte' 
      });
    }

  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}
