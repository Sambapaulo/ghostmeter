from fpdf import FPDF
import os

class GhostMeterPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.add_font('DejaVu', '', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', uni=True)
        self.add_font('DejaVu', 'B', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', uni=True)
        
    def header(self):
        if self.page_no() > 1:
            self.set_font('DejaVu', 'B', 10)
            self.set_text_color(147, 51, 234)
            self.cell(0, 10, 'GhostMeter - Scripts Marketing TikTok/Reels', 0, 0, 'C')
            self.ln(15)
    
    def footer(self):
        self.set_y(-15)
        self.set_font('DejaVu', '', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title, emoji=""):
        self.set_font('DejaVu', 'B', 16)
        self.set_text_color(147, 51, 234)
        self.cell(0, 10, f'{emoji} {title}', 0, 1, 'L')
        self.ln(5)
    
    def section_title(self, title):
        self.set_font('DejaVu', 'B', 12)
        self.set_text_color(236, 72, 153)
        self.cell(0, 8, title, 0, 1, 'L')
        self.ln(2)
    
    def body_text(self, text):
        self.set_font('DejaVu', '', 11)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 7, text)
        self.ln(3)
    
    def hook_text(self, text):
        self.set_font('DejaVu', 'B', 12)
        self.set_text_color(239, 68, 68)
        self.multi_cell(0, 7, f"HOOK: {text}")
        self.ln(2)
    
    def cta_text(self, text):
        self.set_font('DejaVu', 'B', 11)
        self.set_text_color(34, 197, 94)
        self.multi_cell(0, 7, f"CTA: {text}")
        self.ln(3)

    def add_image_centered(self, image_path, w=150):
        if os.path.exists(image_path):
            x = (210 - w) / 2
            self.image(image_path, x=x, w=w)
            self.ln(10)

# Create PDF
pdf = GhostMeterPDF()
pdf.set_auto_page_break(auto=True, margin=20)

# Cover Page
pdf.add_page()
pdf.set_font('DejaVu', 'B', 28)
pdf.set_text_color(147, 51, 234)
pdf.ln(40)
pdf.cell(0, 15, 'GhostMeter', 0, 1, 'C')
pdf.set_font('DejaVu', '', 16)
pdf.set_text_color(236, 72, 153)
pdf.cell(0, 10, 'Scripts Marketing TikTok & Reels', 0, 1, 'C')
pdf.ln(10)

# Add logo
if os.path.exists('/home/z/my-project/download/ghostmeter-logo-mascot.png'):
    pdf.image('/home/z/my-project/download/ghostmeter-logo-mascot.png', x=55, w=100)
    
pdf.ln(20)
pdf.set_font('DejaVu', '', 12)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 8, 'Analyse ta conversation de crush avec l\'IA', 0, 1, 'C')
pdf.cell(0, 8, '5 Scripts viraux + Visuels', 0, 1, 'C')
pdf.ln(30)
pdf.set_font('DejaVu', '', 10)
pdf.cell(0, 8, 'Guide de marketing pour créateurs de contenu', 0, 1, 'C')

# Table of Contents
pdf.add_page()
pdf.chapter_title('Table des matières', '📋')
pdf.set_font('DejaVu', '', 11)
pdf.set_text_color(50, 50, 50)

toc = [
    ('1. Introduction & Stratégie', 3),
    ('2. Vidéo 1 - "Le test qui expose tout"', 4),
    ('3. Vidéo 2 - "J\'ai testé sur mon ex"', 5),
    ('4. Vidéo 3 - "Ce message change tout"', 6),
    ('5. Vidéo 4 - "Avant / Après analyse"', 7),
    ('6. Vidéo 5 - "Les gens ne sont pas prêts"', 8),
    ('7. Conseils de tournage', 9),
    ('8. Visuels disponibles', 10),
]

for item, page in toc:
    pdf.cell(0, 8, f'{item} ........................ p.{page}', 0, 1, 'L')

# Introduction
pdf.add_page()
pdf.chapter_title('Introduction & Stratégie', '🚀')

pdf.section_title('Concept GhostMeter')
pdf.body_text("GhostMeter est une application qui analyse les conversations romantiques avec l'IA pour détecter les signaux d'intérêt, de manipulation et de ghosting potentiel. L'application attribue des scores et donne des conseils personnalisés.")

pdf.section_title('Public cible')
pdf.body_text("• Jeunes adultes 18-35 ans\n• Personnes en phase de drague/dating\n• Utilisateurs de Tinder, Bumble, Hinge\n• Personnes ayant vécu du ghosting\n• Curieux de l'analyse relationnelle")

pdf.section_title('Angles marketing')
pdf.body_text("1. CURIOSITÉ - \"Que pense vraiment mon crush ?\"\n2. PEUR - \"Et si je me faisais manipuler ?\"\n3. VALIDATION - \"J'avais raison de douter\"\n4. PARTAGE - \"Mon ex m'a menti\"\n5. DRAME - Les scores bas créent de l'engagement")

pdf.section_title('Format recommandé')
pdf.body_text("• Durée: 15-30 secondes (Reels/TikTok)\n• Format: Vertical 9:16\n• Ton: Dramatique mais authentique\n• Musique: Tendances actuelles, montées en tension")

# Video 1
pdf.add_page()
pdf.chapter_title('Vidéo 1: "Le test qui expose tout"', '🎥')

pdf.hook_text("\"Tu veux savoir s'il/elle te ment ?\"")

pdf.section_title('Corps (5-15s)')
pdf.body_text("\"J'ai testé un outil qui analyse les messages...\net ça m'a dit qu'il n'était pas honnête 😳\"\n\nMontre l'interface de l'app\nScrolle vers le score")

pdf.section_title('Climax (15-20s)')
pdf.body_text("\"Regarde ça...\"\n\nRévèle un score de 32%\nRéaction choquée\nZoom sur le score")

pdf.cta_text("\"Teste avec ton crush, lien en bio\"")

pdf.section_title('Storyboard')
pdf.body_text("""[0-2s] Face caméra, regard intensif
[2-10s] Montre téléphone, navigue dans l'app
[10-15s] Build-up vers le résultat
[15-20s] Révèle score 32%, réaction choc
[20-25s] CTA final

Musique: Montée en tension
Effet sonore: \"Ding\" dramatique au reveal""")

# Video 2
pdf.add_page()
pdf.chapter_title('Vidéo 2: "J\'ai testé sur mon ex"', '💔')

pdf.hook_text("\"J'ai testé mon ex avec une IA...\"")

pdf.section_title('Corps (5-15s)')
pdf.body_text("\"Je pensais qu'il/elle était sincère...\nmais regarde le résultat 😶\"\n\nMontre les anciens messages\nLance l'analyse")

pdf.section_title('Reveal (15-22s)')
pdf.body_text("Score très faible + badge \"Ghosting probable\"\nRéaction: déçue/révoltée\n\"Ça explique tout...\"")

pdf.cta_text("\"Fais-le avant de te faire avoir\"")

pdf.section_title('Storyboard')
pdf.body_text("""[0-2s] Expression triste/révoltée
[2-8s] Scroll des anciens messages
[8-15s] Lance l'analyse, patiente
[15-22s] Score 18%, réaction choquée
[22-28s] Message final + CTA

Émotion: Déception → Révélation
Angle: Validation post-breakup""")

# Video 3
pdf.add_page()
pdf.chapter_title('Vidéo 3: "Ce message change tout"', '💬')

pdf.hook_text("\"Si quelqu'un t'envoie ça... méfie-toi\"")

pdf.section_title('Corps (5-12s)')
pdf.body_text("Montre un message type:\n\"désolé j'étais occupé 😅\"\n\n\"Ça semble innocent non ?\"\n\"Attends...\"")

pdf.section_title('Analyse (12-22s)')
pdf.body_text("\"Selon l'IA → manque d'intérêt détecté\"\n\nScore d'intérêt: 23%\nGhosting probable: 78%\n\n\"C'est ce qu'il m'envoyait...\"")

pdf.cta_text("\"Teste ton propre message\"")

pdf.section_title('Storyboard')
pdf.body_text("""[0-3s] Message en gros plan
[3-8s] Analyse cynique du message
[8-15s] Lance l'analyse IA
[15-22s] Résultat avec warning
[22-28s] CTA

Type: Éducatif avec twist
Résonance: Beaucoup reconnaîtront ce message""")

# Video 4
pdf.add_page()
pdf.chapter_title('Vidéo 4: "Avant / Après analyse"', '⚡')

pdf.hook_text("\"Avant j'étais sûr à 100%... après ça 😳\"")

pdf.section_title('Corps (5-15s)')
pdf.body_text("AVANT:\n\"Je pense qu'il/elle m'aime\"\n\"On s'entend super bien\"\n\nAPRÈS:\nMontre le score\nExpression choquée")

pdf.section_title('Contraste (15-25s)')
pdf.body_text("Score révélateur\n\"J'étais complètement à côté de la plaque\"\nBadge: \"Signaux mixtes détectés\"")

pdf.cta_text("\"Le lien est en bio\"")

pdf.section_title('Storyboard')
pdf.body_text("""[0-3s] Confidence initiale
[3-10s] Rappel des bons moments
[10-12s] Transition brutale
[12-20s] Score choquant
[20-25s] CTA

Structure: Setup → Twist → Payoff
Émotion: Confiance → Choc""")

# Video 5
pdf.add_page()
pdf.chapter_title('Vidéo 5: "Les gens ne sont pas prêts"', '😱')

pdf.hook_text("\"Les gens ne sont pas prêts pour cette IA...\"")

pdf.section_title('Corps (5-15s)')
pdf.body_text("\"Elle analyse ton crush... et donne un score réel\"\n\n\"C'est brutal mais nécessaire\"\n\nMontre l'interface")

pdf.section_title('Cliffhanger (15-22s)')
pdf.body_text("\"J'ai eu 18% 😭\"\n\nRéaction: dévastée mais honnête\n\"Au moins je sais maintenant\"")

pdf.cta_text("\"Teste avant d'être déçu\"")

pdf.section_title('Storyboard')
pdf.body_text("""[0-3s] Mise en garde mystérieuse
[3-12s] Présentation de l'outil
[12-18s] Révélation personnelle
[18-25s] Message d'espoir + CTA

Ton: Vulnerable, authentique
Engagement: Audience partage ses scores""")

# Tips
pdf.add_page()
pdf.chapter_title('Conseils de tournage', '🎬')

pdf.section_title('Éclairage')
pdf.body_text("• Lumière naturelle ou ring light\n• Éviter les ombres dures sur le visage\n• Fond simple ou légèrement flou")

pdf.section_title('Son')
pdf.body_text("• Micro de qualité ou enregistreur externe\n• Musique tendance en fond\n• Effets sonores pour les reveals (ding, whoosh)\n• Garder le voix claire et audible")

pdf.section_title('Montage')
pdf.body_text("• Coupes rapides (0.5-2s par plan)\n• Zoom progressif sur les scores\n• Texte overlay pour les points clés\n• Sous-titres obligatoires (70% regardent sans son)")

pdf.section_title('Timing optimal')
pdf.body_text("• Poster: 18h-22h en semaine\n• Week-end: 11h-14h et 19h-22h\n• Mardi, jeudi et dimanche = meilleurs jours")

pdf.section_title('Hashtags recommandés')
pdf.body_text("#ghostmeter #dating #crush #ia #analyse #relations #amour #conseils #tiktokfr #reelsfr #datingtips #redflags")

# Visuals page
pdf.add_page()
pdf.chapter_title('Visuels disponibles', '🖼️')

pdf.body_text("Les images suivantes ont été créées pour vos contenus marketing:")
pdf.ln(5)

visuals = [
    ("ghostmeter-score-18.png", "Score 18% - Dramatique"),
    ("ghostmeter-score-32.png", "Score 32% - Choc"),
    ("ghostmeter-before-after.png", "Avant/Après Thumbnail"),
    ("ghostmeter-message-warning.png", "Message Warning"),
    ("ghostmeter-thumbnail-pas-prets.png", "Thumbnail 'Pas Prêts'"),
    ("ghostmeter-logo-mascot.png", "Logo & Mascotte"),
]

for filename, desc in visuals:
    pdf.set_font('DejaVu', 'B', 10)
    pdf.set_text_color(147, 51, 234)
    pdf.cell(0, 6, f"• {filename}", 0, 1)
    pdf.set_font('DejaVu', '', 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, f"  {desc}", 0, 1)

pdf.ln(10)
pdf.section_title('Utilisation recommandée')
pdf.body_text("""• Thumbnails: Pour les couvertures de vidéos
• Posts: Instagram, Facebook feed
• Stories: Contenu additionnel
• Publicité: Campagnes sponsorisées
• Watermark: Ajouter votre logo/pseudo""")

# Final page
pdf.add_page()
pdf.chapter_title('Checklist avant publication', '✅')

checklist = [
    "Hook accrocheur dans les 2 premières secondes",
    "Score/montage dramatique au bon moment",
    "CTA clair à la fin",
    "Hashtags pertinents (5-10)",
    "Sous-titres ajoutés",
    "Miniature attractive",
    "Réponse aux commentaires la 1ère heure",
    "Partage sur plusieurs plateformes",
]

pdf.set_font('DejaVu', '', 11)
for item in checklist:
    pdf.set_text_color(34, 197, 94)
    pdf.cell(5, 8, '✓', 0, 0)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(0, 8, item, 0, 1)

pdf.ln(20)
pdf.set_font('DejaVu', 'B', 12)
pdf.set_text_color(147, 51, 234)
pdf.cell(0, 10, 'Bonne chance pour vos vidéos ! 🚀', 0, 1, 'C')
pdf.ln(5)
pdf.set_font('DejaVu', '', 10)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 8, 'GhostMeter - Analyse ta conversation de crush avec l\'IA', 0, 1, 'C')

# Save PDF
output_path = '/home/z/my-project/download/GhostMeter-Scripts-Marketing.pdf'
pdf.output(output_path)
print(f"PDF créé: {output_path}")
