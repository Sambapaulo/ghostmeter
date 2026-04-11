import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { createHash, randomBytes } from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface User {
  email: string;
  password: string;
  isPremium: boolean;
  premiumSince: string | null;
  analysesCount: number;
  createdAt: string;
  lastActive: string;
  paypalOrderId?: string;
  adminGranted?: boolean;
  sessionId?: string;
  sessionCreatedAt?: string;
  resetToken?: string;
  resetTokenExpires?: string;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'ghostmeter_salt_2024').digest('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, token, newPassword } = body;

    if (action === 'request') {
      if (!email) {
        return NextResponse.json({ error: 'Email requis' }, { status: 400 });
      }

      const key = 'user:' + email.toLowerCase();
      const user = await kv.get<User>(key);

      if (!user) {
        return NextResponse.json({ success: true, message: 'Si ce compte existe, un email a ete envoye' });
      }

      const resetToken = generateToken();
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      user.resetToken = resetToken;
      user.resetTokenExpires = resetTokenExpires;
      await kv.set(key, user);

      const resetUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://ghostmeter.vercel.app') + '/reset-password?token=' + resetToken + '&email=' + encodeURIComponent(email);

      try {
        await resend.emails.send({
          from: 'GhostMeter <noreply@ghostmeter.app>',
          to: email.toLowerCase(),
          subject: 'Reinitialisation de votre mot de passe - GhostMeter',
          html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #a855f7;">GhostMeter</h1></div><div style="background: #f9fafb; border-radius: 12px; padding: 30px;"><h2 style="color: #1f2937; margin-bottom: 20px;">Reinitialisation de mot de passe</h2><p style="color: #4b5563; margin-bottom: 20px;">Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p><a href="' + resetUrl + '" style="display: inline-block; background: linear-gradient(to right, #a855f7, #ec4899); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">Reinitialiser mon mot de passe</a><p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Ce lien expire dans 1 heure. Si vous n avez pas fait cette demande, ignorez cet email.</p></div><p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">2024 GhostMeter - Analyse de conversations</p></div>'
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        return NextResponse.json({ error: 'Erreur lors de l envoi de l email' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Si ce compte existe, un email a ete envoye' });
    }

    if (action === 'reset') {
      if (!email || !token || !newPassword) {
        return NextResponse.json({ error: 'Parametres manquants' }, { status: 400 });
      }

      if (newPassword.length < 4) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 4 caracteres' }, { status: 400 });
      }

      const key = 'user:' + email.toLowerCase();
      const user = await kv.get<User>(key);

      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 400 });
      }

      if (user.resetToken !== token) {
        return NextResponse.json({ error: 'Token invalide' }, { status: 400 });
      }

      if (new Date() > new Date(user.resetTokenExpires || 0)) {
        return NextResponse.json({ error: 'Token expire' }, { status: 400 });
      }

      user.password = hashPassword(newPassword);
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      user.lastActive = new Date().toISOString();
      await kv.set(key, user);

      return NextResponse.json({ success: true, message: 'Mot de passe reinitialise avec succes' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
