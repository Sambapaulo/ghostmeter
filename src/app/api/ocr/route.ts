import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received body keys:', Object.keys(body));
    console.log('imageBase64 length:', body.imageBase64?.length);
    
    const { imageBase64 } = body;

    if (!imageBase64) {
      console.log('ERROR: imageBase64 is missing');
      return NextResponse.json({ 
        success: false,
        error: 'Image requise',
        receivedKeys: Object.keys(body)
      }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    console.log('Buffer size:', buffer.length);

    const result = await Tesseract.recognize(buffer, 'fra+eng');

    const extractedText = result.data.text.trim();
    console.log('Extracted text length:', extractedText.length);

    if (extractedText.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Aucun texte detecte'
      });
    }

    const cleanedText = extractedText.replace(/\s+/g, ' ').trim();

    return NextResponse.json({ success: true, text: cleanedText });

  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}
