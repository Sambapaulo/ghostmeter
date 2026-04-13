import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getAdminPassword } from '@/lib/kv';

export const dynamic = 'force-dynamic';

// POST - Send newsletter to users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, body: emailBody, recipients, adminPassword } = body;

    if (!subject || !emailBody || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Verify admin password
    const currentSettings = await getSettings();
    const envPassword = getAdminPassword();
    const storedPassword = envPassword !== 'ghostmeter2024' ? envPassword : null;
    const validPassword = currentSettings.adminPassword || storedPassword || 'ghostmeter2024';
    
    if (adminPassword !== validPassword) {
      return NextResponse.json({ error: 'Mot de passe admin incorrect' }, { status: 401 });
    }

    // Check if Resend is configured
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (!RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY non configuré dans Vercel',
        hint: 'Ajoutez RESEND_API_KEY dans les variables d\'environnement Vercel'
      }, { status: 500 });
    }

    // Prepare email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a855f7, #ec4899); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .logo { font-size: 40px; margin-bottom: 10px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
          a { color: #a855f7; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">👻</div>
          <h1>GhostMeter</h1>
        </div>
        <div class="content">
          <div class="message">
            ${emailBody.replace(/\n/g, '<br>')}
          </div>
          <p style="text-align: center; color: #666; font-size: 14px;">
            Vous recevez cet email car vous avez un compte sur GhostMeter.
          </p>
        </div>
        <div class="footer">
          <p>GhostMeter - Analyse tes conversations avec l'IA</p>
          <p><a href="https://ghostmeter.vercel.app">ghostmeter.vercel.app</a></p>
        </div>
      </body>
      </html>
    `;

    // Send emails in batches of 50 (Resend limit)
    const batchSize = 50;
    const batches: string[][] = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;

    for (const batch of batches) {
      try {
        // Send to each recipient individually (Resend batch format)
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: RESEND_FROM_EMAIL,
            to: batch, // Can be array of emails
            subject: subject,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          successCount += batch.length;
        } else {
          const error = await response.text();
          console.error('Resend batch error:', error);
          errorCount += batch.length;
        }
      } catch (e) {
        console.error('Batch send error:', e);
        errorCount += batch.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Email envoyé à ${successCount} destinataire(s)${errorCount > 0 ? ` (${errorCount} échecs)` : ''}`,
      sent: successCount,
      failed: errorCount
    });

  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
