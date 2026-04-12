import { NextRequest, NextResponse } from 'next/server';
import { isKVAvailable, getUser, setUser, getResetToken, setResetToken, deleteResetToken, User } from '@/lib/localStore';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'ghostmeter_salt_2024').digest('hex');
}

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY non configure');
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
          email: 'noreply@brevo.com'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (response.ok) {
      console.log('Email envoye avec succes a:', to);
      return true;
    } else {
      const error = await response.text();
      console.error('Erreur envoi email Brevo:', error);
      return false;
    }
  } catch (error) {
    console.error('Erreur envoi email:', error);
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
