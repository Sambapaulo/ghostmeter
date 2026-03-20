import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = image.type || 'image/jpeg';
    
    // Use Tesseract.js server-side
    const Tesseract = await import('tesseract.js');
    
    const result = await Tesseract.recognize(
      `data:${mimeType};base64,${base64}`,
      'fra+eng',
      {
        logger: (m: any) => console.log(`OCR: ${m.status} - ${Math.round(m.progress * 100)}%`)
      }
    );

    const text = result.data.text
      .replace(/\s+/g, ' ')
      .replace(/[|]/g, ' ')
      .replace(/[}{\[\]]/g, '')
      .trim();

    if (!text || text.length < 5) {
      return NextResponse.json({ 
        success: false, 
        error: 'No text detected in image',
        text: '' 
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, text });
    
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'OCR failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
