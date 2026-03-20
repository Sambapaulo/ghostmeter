import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Use Tesseract.js server-side
    const Tesseract = await import('tesseract.js');
    
    const result = await Tesseract.recognize(
      `data:${image.type};base64,${base64}`,
      'fra+eng',
      {}
    );

    const text = result.data.text
      .replace(/\s+/g, ' ')
      .replace(/[|]/g, ' ')
      .replace(/[}{\[\]]/g, '')
      .trim();

    return NextResponse.json({ success: true, text });
    
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ 
      error: 'OCR failed', 
      details: error instanceof Error ? error.message : 'Unknown' 
    }, { status: 500 });
  }
}
