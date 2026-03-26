import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface ContactMessage {
  id: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
  replied?: boolean;
  repliedAt?: string;
  replyMessage?: string;
}

// GET - Récupérer tous les messages (pour admin)
export async function GET(request: NextRequest) {
  try {
    const keys = await kv.keys('contact:*');
    
    if (!keys || keys.length === 0) {
      return NextResponse.json({ success: true, messages: [] });
    }

    const messages: ContactMessage[] = [];
    for (const key of keys) {
      const msg = await kv.get<ContactMessage>(key);
      if (msg) {
        messages.push(msg);
      }
    }

    // Sort by date (newest first)
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Envoyer un nouveau message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Sujet et message requis' }, { status: 400 });
    }

    const id = `contact:${Date.now()}`;
    const newMessage: ContactMessage = {
      id,
      email: email || 'Non renseigné',
      subject,
      message,
      createdAt: new Date().toISOString(),
      read: false
    };

    await kv.set(id, newMessage);

    return NextResponse.json({ 
      success: true, 
      message: 'Message envoyé avec succès' 
    });
  } catch (error) {
    console.error('Error saving contact message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un message
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await kv.del(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Marquer comme lu
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const msg = await kv.get<ContactMessage>(id);
    if (!msg) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });
    }

    msg.read = true;
    await kv.set(id, msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating contact message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
