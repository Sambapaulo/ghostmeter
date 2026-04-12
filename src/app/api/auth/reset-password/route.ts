import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { isKVAvailable, getUser, setUser, getResetToken, setResetToken, deleteResetToken } from '@/lib/localStore';
import { createHash } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

interface User {
  email: string;
  password: string;
  createdAt: number | string;
  isPremium?: boolean;
  premiumSince?: string | null;
  analysesCount?: number;
  lastActive?: string;
  sessionId?: string;
  sessionCreatedAt?: string;
  paypalOrderId?: string;
  adminGranted?: boolean;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'ghostmeter_salt_2024').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, token, newPassword } = body;

    // Log pour le développement
    if (!isKVAvailable()) {
      console.log('Mode local: utilisation du stockage en mémoire');
    }

    if (action === 'request') {
      if (!email) {
        return NextResponse.json({ error: 'Email requis' }, { status: 400 });
      }

      const user = await getUser(email);
      
      // Toujours retourner succès pour ne pas révéler si l'email existe
      if (!user) {
        return NextResponse.json({ success: true, message: 'Si ce compte existe, un email a ete envoye' });
      }

      // Générer un token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expires = Date.now() + 3600000; // 1 heure
      
      await setResetToken(resetToken, { email: email.toLowerCase(), expires }, 3600);

      // Envoyer l'email
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      try {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Reinitialisation de votre mot de passe GhostMeter',
          html: `
            <h1>Reinitialisation de mot de passe</h1>
            <p>Cliquez sur le lien ci-dessous pour reinitialiser votre mot de passe:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>Ce lien expire dans 1 heure.</p>
          `
        });
        console.log('Email envoye avec succes a:', email);
      } catch (emailError: any) {
        console.error('Erreur envoi email:', emailError);
      }

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

      // Récupérer l'utilisateur et mettre à jour le mot de passe
      const user = await getUser(email);
      const hashedPassword = hashPassword(newPassword);
      
      if (user) {
        user.password = hashedPassword;
        await setUser(email, user);
      } else {
        // Créer un nouvel utilisateur si n'existe pas (cas rare)
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
      
      // Supprimer le token utilisé
      await deleteResetToken(token);

      return NextResponse.json({ success: true, message: 'Mot de passe reinitialise avec succes' });
    }

    return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}