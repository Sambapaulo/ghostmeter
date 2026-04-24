import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface ContactMessage {
  id: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
  replied: boolean;
  repliedAt?: string;
  replyMessage?: string;
}

// POST - Envoyer une réponse par email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, replyMessage, adminPassword } = body;

    if (!messageId || !replyMessage) {
      return NextResponse.json({ error: 'ID message et réponse requis' }, { status: 400 });
    }

    // Vérifier le mot de passe admin
    const { getSettings, getAdminPassword } = await import('@/lib/kv');
    const currentSettings = await getSettings();
    const envPassword = getAdminPassword();
    const storedPassword = envPassword !== 'ghostmeter2024' ? envPassword : null;
    const validPassword = currentSettings.adminPassword || storedPassword || 'ghostmeter2024';

    if (adminPassword !== validPassword) {
      return NextResponse.json({ error: 'Mot de passe admin incorrect' }, { status: 401 });
    }

    // Récupérer le message original
    const msg = await kv.get<ContactMessage>(messageId);
    if (!msg) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });
    }

    if (msg.email === 'Non renseigné') {
      return NextResponse.json({ error: 'Cet utilisateur n\'a pas fourni d\'email' }, { status: 400 });
    }

    // Préparer l'email
    const subjectLabel = msg.subject === 'bug' ? 'Bug' :
                         msg.subject === 'feature' ? 'Suggestion' :
                         msg.subject === 'premium' ? 'Premium' : 'Autre';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a855f7, #ec4899); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .original { background: white; padding: 15px; border-left: 4px solid #a855f7; margin: 15px 0; }
          .reply { background: white; padding: 15px; border-left: 4px solid #22c55e; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
          .logo { font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">👻</div>
          <h1>GhostMeter</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Merci d'avoir contacté l'équipe GhostMeter. Voici notre réponse à votre message :</p>

          <div class="reply">
            <strong>Notre réponse :</strong><br><br>
            ${replyMessage.replace(/\n/g, '<br>')}
          </div>

          <p>───</p>

          <div class="original">
            <strong>Votre message original (${subjectLabel}) :</strong><br><br>
            ${msg.message.replace(/\n/g, '<br>')}
          </div>

          <p>Si vous avez d'autres questions, n'hésitez pas à nous recontacter.</p>
          <p>Cordialement,<br>L'équipe GhostMeter 👻</p>
        </div>
        <div class="footer">
          <p>GhostMeter - Analyse tes conversations avec l'IA</p>
          <p><a href="https://ghostmeter.vercel.app">ghostmeter.vercel.app</a></p>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email avec Brevo
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (BREVO_API_KEY) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: 'GhostMeter', email: 'topetchic@gmail.com' },
          to: [{ email: msg.email }],
          subject: 'Re: Votre message - GhostMeter',
          htmlContent: emailHtml,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Brevo error:', error);
        return NextResponse.json({ error: 'Erreur Brevo: ' + error }, { status: 500 });
      }
    }

    // Marquer le message comme répondu
    msg.replied = true;
    msg.repliedAt = new Date().toISOString();
    msg.replyMessage = replyMessage;
    await kv.set(messageId, msg);

    return NextResponse.json({
      success: true,
      message: BREVO_API_KEY
        ? 'Email envoyé avec succès !'
        : 'Réponse enregistrée (configurez BREVO_API_KEY pour l\'envoi réel d\'emails)'
    });

  } catch (error) {
    console.error('Reply error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
