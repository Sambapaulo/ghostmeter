// Tesseract.js OCR - Works on client and server, no external API needed
import Tesseract from 'tesseract.js';

// Cache for the worker to avoid re-initializing
let workerPromise: Promise<Tesseract.Worker> | null = null;

// Supported languages
const LANGUAGES = 'fra+eng'; // French + English

/**
 * Get or create a Tesseract worker
 * Workers are cached for reuse
 */
async function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker('fra+eng', 1, {
      logger: m => {
        if (m.status) {
          console.log(`[Tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
  }
  return workerPromise;
}

/**
 * Recognize text from a base64 image using Tesseract.js
 * Works offline - no external API calls needed
 * 
 * @param base64Image - Base64 encoded image (with or without data URL prefix)
 * @param onProgress - Optional progress callback (0-100)
 * @returns Extracted text or error
 */
export async function recognizeTextWithTesseract(
  base64Image: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; text?: string; error?: string }> {
  console.log('[Tesseract] Starting OCR, image length:', base64Image?.length);
  
  try {
    // Remove data URL prefix if present (Tesseract handles both, but cleaner without)
    let imageData = base64Image;
    if (base64Image.includes(',')) {
      imageData = base64Image.split(',')[1];
    }
    
    // Create worker with progress tracking
    const worker = await Tesseract.createWorker('fra+eng', 1, {
      logger: m => {
        if (m.progress && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });
    
    // Recognize text
    const result = await worker.recognize(Buffer.from(imageData, 'base64'));
    
    // Terminate worker to free memory
    await worker.terminate();
    
    const text = result.data.text.trim();
    
    if (text) {
      console.log('[Tesseract] Success! Text length:', text.length);
      return { success: true, text };
    } else {
      console.log('[Tesseract] No text found');
      return { success: false, error: 'Aucun texte détecté dans l\'image' };
    }
    
  } catch (err: any) {
    console.error('[Tesseract] Error:', err);
    return { success: false, error: 'Erreur OCR: ' + err.message };
  }
}

/**
 * Client-side OCR using Tesseract.js
 * This runs directly in the browser/WebView
 */
export async function recognizeTextClient(
  base64Image: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const result = await Tesseract.recognize(
      base64Image,
      'fra+eng',
      {
        logger: m => {
          if (m.progress && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
          console.log(`[Tesseract Client] ${m.status || 'processing'}: ${Math.round((m.progress || 0) * 100)}%`);
        }
      }
    );
    
    const text = result.data.text.trim();
    
    if (text) {
      return { success: true, text };
    } else {
      return { success: false, error: 'Aucun texte détecté' };
    }
  } catch (err: any) {
    console.error('[Tesseract Client] Error:', err);
    return { success: false, error: 'Erreur OCR: ' + err.message };
  }
}

export default recognizeTextWithTesseract;
