import { NextRequest, NextResponse } from 'next/server';
import { isKVAvailable, getUser, setUser, getResetToken, setResetToken, deleteResetToken, User } from '@/lib/localStore';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'ghostmeter_salt_2024').digest('hex');
}

// Endpoint de diagnostic : GET /api/auth/reset-password
// Vérifie que la clé BREVO_API_KEY est bien configurée et active côté Brevo.
// Usage : visiter https://votre-app.vercel.app/api/auth/reset-password dans le navigateur
export async function GET() {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    return NextResponse.json({
      configured: false,
      error: 'BREVO_API_KEY is not set in environment variables.'
    });
  }

  // Appel à l'endpoint /user de Brevo pour vérifier la clé
  // (sans envoyer d'email — juste vérifier que la clé marche)
  try {
    const res = await fetch('https://api.brevo.com/v3/user', {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return NextResponse.json({
        configured: true,
        auth_ok: false,
        status: res.status,
        error: body.substring(0, 500),
        hint: res.status === 401
          ? 'Clé invalide, révoquée, ou sans permissions. Vérifiez sur https://app.brevo.com/settings/keys/api que la clé a bien la permission "Transactional email".'
          : 'Erreur inattendue côté Brevo.'
      });
    }

    const data = await res.json();
    return NextResponse.json({
      configured: true,
      auth_ok: true,
      account_email: data.email,
      account_company: data.company?.name,
      plan: data.plan?.find((p: any) => p.type === 'free') ? 'free' : 'paid',
      sender_email_in_code: 'topetchic@gmail.com',
      hint: 'Pour que l\'envoi d\'emails fonctionne, "topetchic@gmail.com" doit être vérifié dans https://app.brevo.com/senders (Add a new sender, receive confirmation email, click link).'
    });
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      auth_ok: false,
      error: `Network error: ${err?.message || String(err)}`
    });
  }
}

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    console.error('[brevo] BREVO_API_KEY is not set in environment variables.');
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'GhostMeter',
          email: 'topetchic@gmail.com'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (response.ok) {
      console.log('[brevo] Email envoye avec succes a:', to);
      return true;
    } else {
      const error = await response.text();
      console.error(`[brevo] Erreur envoi email (status ${response.status}):`, error);
      return false;
    }
  } catch (error) {
    console.error('[brevo] Erreur réseau envoi email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, token, newPassword } = body;

    if (!isKVAvailable()) {
      console.log('Mode local: utilisation du stockage en memoire');
    }

    if (action === 'request') {
      if (!email) {
        return NextResponse.json({ error: 'Email requis' }, { status: 400 });
      }

      const user = await getUser(email);
      
      if (!user) {
        return NextResponse.json({ success: true, message: 'Si ce compte existe, un email a ete envoye' });
      }

      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expires = Date.now() + 3600000;
      
      await setResetToken(resetToken, { email: email.toLowerCase(), expires }, 3600);

      const resetUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/reset-password?token=' + resetToken + '&email=' + encodeURIComponent(email);
      
      await sendEmail(
        email,
        'Reinitialisation de votre mot de passe GhostMeter',
        '<html><body><h1>Reinitialisation de mot de passe</h1><p>Cliquez sur le lien ci-dessous pour reinitialiser votre mot de passe:</p><a href="' + resetUrl + '">' + resetUrl + '</a><p>Ce lien expire dans 1 heure.</p></body></html>'
      );

      return NextResponse.json({ success: true, message: 'Si ce compte existe, un email a ete envoye' });
    }

    if (action === 'reset') {
      if (!token || !email || !newPassword) {
        return NextResponse.json({ error: 'Parametres manquants' }, { status: 400 });
      }

      const storedData = await getResetToken(token);
      
      if (!storedData || storedData.email !== email.toLowerCase() || storedData.expires < Date.now()) {
        return NextResponse.json({ error: 'Token invalide ou expire' }, { status: 400 });
      }

      const user = await getUser(email);
      const hashedPassword = hashPassword(newPassword);
      
      if (user) {
        user.password = hashedPassword;
        await setUser(email, user);
      } else {
        const now = new Date().toISOString();
        const newUser: User = {
          email: email.toLowerCase(),
          password: hashedPassword,
          createdAt: now,
          isPremium: false,
          premiumSince: null,
          analysesCount: 0,
          lastActive: now
        };
        await setUser(email, newUser);
      }
      
      await deleteResetToken(token);

      return NextResponse.json({ success: true, message: 'Mot de passe reinitialise avec succes' });
    }

    return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
