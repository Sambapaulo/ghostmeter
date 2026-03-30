# -*- coding: utf-8 -*-
"""
GhostMeter Video Marketing Assets Guide
Complete guide with AI image prompts and Filmora instructions
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.lib.units import cm, inch
import os

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')

# Create document
output_path = '/home/z/my-project/download/GhostMeter_Guide_Videos_Marketing.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title='GhostMeter Guide Videos Marketing',
    author='Z.ai',
    creator='Z.ai',
    subject='Guide complet pour creer les videos marketing GhostMeter'
)

# Styles
styles = getSampleStyleSheet()

# French styles
title_style = ParagraphStyle(
    'TitleStyle',
    fontName='SimHei',
    fontSize=28,
    alignment=TA_CENTER,
    spaceAfter=30,
    textColor=colors.HexColor('#6B21A8')
)

subtitle_style = ParagraphStyle(
    'SubtitleStyle',
    fontName='SimHei',
    fontSize=16,
    alignment=TA_CENTER,
    spaceAfter=20,
    textColor=colors.HexColor('#7C3AED')
)

heading1_style = ParagraphStyle(
    'Heading1Style',
    fontName='Microsoft YaHei',
    fontSize=18,
    alignment=TA_LEFT,
    spaceBefore=20,
    spaceAfter=12,
    textColor=colors.HexColor('#6B21A8')
)

heading2_style = ParagraphStyle(
    'Heading2Style',
    fontName='Microsoft YaHei',
    fontSize=14,
    alignment=TA_LEFT,
    spaceBefore=15,
    spaceAfter=8,
    textColor=colors.HexColor('#7C3AED')
)

body_style = ParagraphStyle(
    'BodyStyle',
    fontName='SimHei',
    fontSize=11,
    alignment=TA_LEFT,
    spaceAfter=8,
    leading=16,
    wordWrap='CJK'
)

prompt_style = ParagraphStyle(
    'PromptStyle',
    fontName='Times New Roman',
    fontSize=10,
    alignment=TA_LEFT,
    spaceAfter=6,
    leading=14,
    backColor=colors.HexColor('#F3E8FF'),
    borderPadding=8,
    leftIndent=10,
    rightIndent=10
)

step_style = ParagraphStyle(
    'StepStyle',
    fontName='SimHei',
    fontSize=11,
    alignment=TA_LEFT,
    spaceAfter=6,
    leading=14,
    leftIndent=15,
    wordWrap='CJK'
)

# Build content
story = []

# Cover page
story.append(Spacer(1, 80))
story.append(Paragraph("GhostMeter", title_style))
story.append(Paragraph("Guide Complet des Videos Marketing", subtitle_style))
story.append(Spacer(1, 30))
story.append(Paragraph("3 Videos pour TikTok, Reels et Shorts", ParagraphStyle('Center', fontName='SimHei', fontSize=14, alignment=TA_CENTER)))
story.append(Spacer(1, 50))
story.append(Paragraph("Assets Visuels + Prompts IA + Instructions Filmora", ParagraphStyle('Center2', fontName='SimHei', fontSize=12, alignment=TA_CENTER, textColor=colors.grey)))
story.append(PageBreak())

# Introduction
story.append(Paragraph("Introduction", heading1_style))
story.append(Paragraph("Ce guide contient tout ce dont vous avez besoin pour creer 3 videos marketing professionnelles pour GhostMeter. Chaque video est concue pour les formats verticaux (TikTok, Instagram Reels, YouTube Shorts) et dure environ 30-45 secondes.", body_style))
story.append(Spacer(1, 10))
story.append(Paragraph("Les trois videos couvrent les fonctionnalites principales de l'application:", body_style))
story.append(Paragraph("1. Ghost Detector - Detectez qui vous ignore (Ghosting)", step_style))
story.append(Paragraph("2. Reply Magic - Generateur de reponses parfaites", step_style))
story.append(Paragraph("3. Love Coach - Coach relationnel IA", step_style))
story.append(Spacer(1, 15))

# Tools section
story.append(Paragraph("Outils Necessaires", heading1_style))
story.append(Paragraph("1. Filmora (votre version payante) - Pour le montage video", body_style))
story.append(Paragraph("2. Bing Image Creator (gratuit) - bing.com/images/create", body_style))
story.append(Paragraph("3. Canva (gratuit) - canva.com - Pour les overlays texte", body_style))
story.append(Paragraph("4. CapCut (gratuit) - Alternative a Filmora si besoin", body_style))
story.append(Spacer(1, 15))

story.append(PageBreak())

# VIDEO 1
story.append(Paragraph("VIDEO 1 : Ghost Detector", heading1_style))
story.append(Paragraph("Theme : Detectez qui vous ignore (Ghosting Analysis)", subtitle_style))
story.append(Spacer(1, 10))

story.append(Paragraph("Concept de la Video", heading2_style))
story.append(Paragraph("Une video mysterieuse et accrocheuse qui montre comment GhostMeter analyse les comportements de ghosting. L'ambiance est sombre avec des effets de neon violet/cyan pour rappeler l'univers paranormal de l'app.", body_style))
story.append(Spacer(1, 10))

story.append(Paragraph("Scenes et Prompts pour Generer les Images", heading2_style))
story.append(Spacer(1, 8))

# Scene 1
story.append(Paragraph("Scene 1 : Introduction (0-5 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#9333EA'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Image mysterieuse d'un detecteur de fantomes sur smartphone.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Mysterious ghost detector app on smartphone screen, dark moody atmosphere, ghost detection interface with radar scanning, purple and cyan neon glow, supernatural energy waves, paranormal activity indicator, professional app mockup, dark background with fog, vertical mobile format, 9:16 aspect ratio, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 2
story.append(Paragraph("Scene 2 : Probleme (5-12 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#9333EA'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Personne triste regardant son telephone sans reponse.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Young sad person looking at phone with disappointment, no response to messages, ghosted situation, dark moody lighting, alone in room, phone screen showing no new messages, emotional scene, cinematic portrait, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 3
story.append(Paragraph("Scene 3 : Analyse (12-22 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#9333EA'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Interface de l'app montrant l'analyse de ghosting.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Smartphone screen showing ghost meter analysis results, paranormal detection app interface, ghost probability percentage displayed, energy level indicator bars, purple and cyan UI design, professional app mockup, dark mysterious background, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 4
story.append(Paragraph("Scene 4 : Revelation (22-30 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#9333EA'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Fantome qui represente la personne qui vous ignore.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Dramatic reveal of ghost figure emerging from phone screen, supernatural entity, transparent ethereal form, purple and cyan glow, spooky atmosphere, cinematic lighting, horror movie style, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 5
story.append(Paragraph("Scene 5 : Decouverte (30-40 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#9333EA'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Personne choquee comprenant la verite.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Shocked person discovering truth on phone, revelation moment, dramatic lighting, cinematic portrait, expression of surprise and understanding, phone illuminating face in dark room, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 6 - Call to Action
story.append(Paragraph("Scene 6 : Call to Action (40-45 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#9333EA'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Utilisez un texte overlay dans Filmora avec le logo GhostMeter.", body_style))
story.append(Paragraph("Texte: 'Telecharge GhostMeter - Decouvrez qui vous ignore'", body_style))

story.append(Spacer(1, 15))
story.append(Paragraph("Instructions Filmora Detaillees", heading2_style))
story.append(Paragraph("Etape 1 : Importation", step_style))
story.append(Paragraph("Ouvrez Filmora et creez un nouveau projet en format 9:16 (vertical). Importez les 5 images generees dans l'ordre des scenes.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 2 : Decoupage", step_style))
story.append(Paragraph("Placez chaque image sur la timeline avec les durees suivantes: Scene 1 (5s), Scene 2 (7s), Scene 3 (10s), Scene 4 (8s), Scene 5 (10s), CTA (5s). Total: 45 secondes.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 3 : Transitions", step_style))
story.append(Paragraph("Utilisez des transitions 'Fondu' ou 'Dissolution' entre chaque scene (0.5 seconde chacune). Pour la Scene 4 (Revelation), utilisez 'Flash' ou 'Eclair' pour un effet dramatique.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 4 : Effets", step_style))
story.append(Paragraph("Appliquez des effets de 'Brouillard' ou 'Fumee' sur les Scenes 1, 3 et 4. Ajoutez des particules lumineuses (Effects > Particles > Sparkles) sur toute la video.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 5 : Texte et Overlays", step_style))
story.append(Paragraph("Ajoutez des textes accrocheurs avec la police 'creepy' ou 'mysterieuse': 'Il t'ignore vraiment?' (Scene 2), 'GhostMeter detecte 87% de ghosting' (Scene 3), 'La verite revelee' (Scene 4).", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 6 : Musique", step_style))
story.append(Paragraph("Choisissez une musique mysterieuse/epouvante dans la bibliotheque Filmora (Audio > Horror/Mystery). Reglez le volume a 20-30% pour ne pas couvrir les textes.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 7 : Export", step_style))
story.append(Paragraph("Exportez en 1080x1920, 30fps, format MP4. Optimise pour TikTok, Reels et Shorts.", body_style))

story.append(PageBreak())

# VIDEO 2
story.append(Paragraph("VIDEO 2 : Reply Magic", heading1_style))
story.append(Paragraph("Theme : Generateur de Reponses Parfaites", subtitle_style))
story.append(Spacer(1, 10))

story.append(Paragraph("Concept de la Video", heading2_style))
story.append(Paragraph("Une video emotionnelle qui montre la transformation d'une situation de rejet en succes grace a l'IA. L'ambiance passe du sombre/triste au lumineux/joyeux.", body_style))
story.append(Spacer(1, 10))

story.append(Paragraph("Scenes et Prompts pour Generer les Images", heading2_style))
story.append(Spacer(1, 8))

# Scene 1 Video 2
story.append(Paragraph("Scene 1 : Rejet (0-6 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#EC4899'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Personne triste lisant un message de rejet.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Sad person crying looking at phone with rejection message on screen, heartbroken expression, dark room, emotional scene, phone showing sad text message, dramatic moody lighting, cinematic portrait, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 2 Video 2
story.append(Paragraph("Scene 2 : Pas de Reponse (6-12 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#EC4899'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Conversation sans reponse - messages bleus seuls.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Phone screen showing text message conversation with no response, blue message bubbles only one side, waiting for reply, sad dating app chat interface, dark background, vertical format close up, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 3 Video 2
story.append(Paragraph("Scene 3 : Magie IA (12-20 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#EC4899'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Transformation magique avec l'intervention de l'IA.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Magical transformation scene, sparkles and golden light particles, phone screen glowing with magic, cupid arrow effect, romantic magical energy, transformation moment, fairy tale style, pink and gold colors, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 4 Video 2
story.append(Paragraph("Scene 4 : Reponse Parfaite (20-30 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#EC4899'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Message charmant genere par l'IA.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Phone screen showing perfect charming response message, dating app chat with heart reactions, romantic conversation success, pink and red tones, happy outcome, love message with emojis, modern app interface, vertical format, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 5 Video 2
story.append(Paragraph("Scene 5 : Succes (30-40 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#EC4899'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Personne heureuse avec un sourire.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Happy excited person looking at phone with joy, successful dating conversation, smiling at phone screen with heart eyes, bright warm golden lighting, romantic success, joyful expression, beautiful portrait, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 6 Video 2
story.append(Paragraph("Scene 6 : Call to Action (40-45 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#EC4899'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Texte overlay avec logo GhostMeter.", body_style))
story.append(Paragraph("Texte: 'GhostMeter - Ne reste jamais sans reponse'", body_style))

story.append(Spacer(1, 15))
story.append(Paragraph("Instructions Filmora Detaillees", heading2_style))
story.append(Paragraph("Etape 1 : Preparation", step_style))
story.append(Paragraph("Creez un projet 9:16. Cette video necessite un changement d'ambiance progressif du sombre au lumineux.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 2 : Colorimetrie", step_style))
story.append(Paragraph("Appliquez des filtres: Scenes 1-2 = 'Cold' ou 'Blue' (triste), Scene 3 = transition graduelle, Scenes 4-5 = 'Warm' ou 'Golden' (heureux). Utilisez Color Tuning pour adoucir la transition.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 3 : Effets Speciaux", step_style))
story.append(Paragraph("Scene 3 : Ajoutez l'effet 'Magic Sparkles' ou 'Fairy Dust' (Effects > Particles). Utilisez 'Lens Flare' quand le telephone s'illumine. Ajoutez des coeurs flottants (Effects > Romance > Floating Hearts).", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 4 : Texte Emotionnel", step_style))
story.append(Paragraph("Scene 1: 'Il m'a rejete...' - police elegante, couleur sombre. Scene 2: 'Plus aucune reponse...' - style SMS. Scene 3: 'Et si l'IA pouvait m'aider?' - texte mysterieux. Scene 4: 'GhostMeter a genere la reponse parfaite!' - texte brillant. Scene 5: 'Ca a marche!' - texte joyeux avec emojis.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 5 : Musique", step_style))
story.append(Paragraph("Choisissez une musique qui commence melancolique et devient joyeuse (Audio > Emotional > Hopeful). Ou utilisez 2 pistes avec fondu enchainé.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 6 : Animations Texte", step_style))
story.append(Paragraph("Utilisez des animations de texte 'Typewriter' pour les messages SMS. Animation 'Pop' pour les resultats positifs. Transition 'Bounce' pour le CTA final.", body_style))

story.append(PageBreak())

# VIDEO 3
story.append(Paragraph("VIDEO 3 : Love Coach", heading1_style))
story.append(Paragraph("Theme : Coach Relationnel IA", subtitle_style))
story.append(Spacer(1, 10))

story.append(Paragraph("Concept de la Video", heading2_style))
story.append(Paragraph("Une video educative et positive montrant comment l'IA peut aider a resoudre les problemes de couple. L'ambiance est moderne et professionnelle avec des touches de rose et violet.", body_style))
story.append(Spacer(1, 10))

story.append(Paragraph("Scenes et Prompts pour Generer les Images", heading2_style))
story.append(Spacer(1, 8))

# Scene 1 Video 3
story.append(Paragraph("Scene 1 : Confusion (0-6 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#F472B6'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Personne confuse avec des points d'interrogation.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Confused person with question marks around head, unsure about relationship, puzzled expression, thinking hard about dating dilemma, colorful abstract question marks floating, modern illustration style, pink and purple background, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 2 Video 3
story.append(Paragraph("Scene 2 : Problemes (6-14 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#F472B6'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Couple en difficulte avec coeur brise.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Split screen showing couple having problems, broken heart between them, relationship issues, arguing couple silhouette, red and blue dramatic lighting, relationship trouble visualization, emotional scene, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 3 Video 3
story.append(Paragraph("Scene 3 : IA Coach (14-22 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#F472B6'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Avatar IA bienveillant qui apparait.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Futuristic AI love coach avatar appearing on phone screen, holographic effect, wise friendly robot assistant with heart icons, pink and purple glow, digital cupid character, helpful AI interface, modern tech design, vertical format, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 4 Video 3
story.append(Paragraph("Scene 4 : Conseils (22-32 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#F472B6'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Interface de chat avec conseils IA.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Phone screen showing AI chat conversation giving relationship advice, helpful tips in message bubbles, heartwarming messages, coach interface design, modern app with pink and warm colors, friendly AI assistant chat, vertical format, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 5 Video 3
story.append(Paragraph("Scene 5 : Retrouvailles (32-42 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#F472B6'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Couple heureux reuni.", body_style))
story.append(Paragraph("Prompt a copier dans Bing Image Creator:", ParagraphStyle('PromptLabel', fontName='SimHei', fontSize=10, textColor=colors.grey, spaceAfter=4)))
story.append(Paragraph("Happy couple hugging reunited, love restored, romantic moment, warm golden lighting, joyful reunion embrace, relationship saved, cinematic romantic scene, hearts floating, vertical format 9:16, high quality, detailed", prompt_style))
story.append(Spacer(1, 8))

# Scene 6 Video 3
story.append(Paragraph("Scene 6 : Call to Action (42-50 secondes)", ParagraphStyle('SceneTitle', fontName='Microsoft YaHei', fontSize=12, textColor=colors.HexColor('#F472B6'), spaceBefore=10, spaceAfter=6)))
story.append(Paragraph("Texte overlay avec logo GhostMeter.", body_style))
story.append(Paragraph("Texte: 'GhostMeter - Votre coach relationnel 24/7'", body_style))

story.append(Spacer(1, 15))
story.append(Paragraph("Instructions Filmora Detaillees", heading2_style))
story.append(Paragraph("Etape 1 : Structure Narrative", step_style))
story.append(Paragraph("Cette video suit un arc narratif: Probleme -> Solution -> Resultat positif. La duree totale est de 50 secondes.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 2 : Effets Visuels", step_style))
story.append(Paragraph("Scene 1: Ajoutez des points d'interrogation animes (Elements > Stickers > Question marks). Scene 2: Effet de 'fissure' ou 'shatter' sur le coeur brise. Scene 3: Effet holographique pour l'avatar IA (Effects > Tech > Hologram). Scene 5: Ajoutez des coeurs et confettis.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 3 : Style de Texte", step_style))
story.append(Paragraph("Utilisez un style 'moderne et epure' avec des couleurs pastel. Scene 1: 'Je ne comprends plus mon couple...' - couleur grise. Scene 2: 'Les disputes s'accumulent...' - rouge atténue. Scene 3: 'GhostMeter Love Coach est la!' - violet brillant. Scene 4: 'Des conseils personnalises...' - rose tendre. Scene 5: 'Notre couple est sauvé!' - doré avec animation.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 4 : Musique", step_style))
story.append(Paragraph("Choisissez une musique inspirante et motivante (Audio > Inspirational > Uplifting). Le tempo doit monter progressivement vers la fin.", body_style))
story.append(Spacer(1, 6))
story.append(Paragraph("Etape 5 : Transitions", step_style))
story.append(Paragraph("Utilisez des transitions douces: 'Dissolve' pour les scenes de probleme, 'Iris Circle' ou 'Heart Wipe' pour les scenes positives. Scene 3 (apparition IA): transition 'Glitch' ou 'Digital'.", body_style))

story.append(PageBreak())

# Quick Reference
story.append(Paragraph("Aide-Memoire Rapide", heading1_style))
story.append(Spacer(1, 10))

# Summary table
summary_data = [
    [Paragraph('<b>Video</b>', ParagraphStyle('th', fontName='SimHei', fontSize=10, textColor=colors.white, alignment=TA_CENTER)),
     Paragraph('<b>Duree</b>', ParagraphStyle('th', fontName='SimHei', fontSize=10, textColor=colors.white, alignment=TA_CENTER)),
     Paragraph('<b>Ambiance</b>', ParagraphStyle('th', fontName='SimHei', fontSize=10, textColor=colors.white, alignment=TA_CENTER)),
     Paragraph('<b>Musique</b>', ParagraphStyle('th', fontName='SimHei', fontSize=10, textColor=colors.white, alignment=TA_CENTER))],
    [Paragraph('Ghost Detector', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER)),
     Paragraph('45 sec', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER)),
     Paragraph('Mysterieuse, sombre', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER)),
     Paragraph('Horror/Mystery', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER))],
    [Paragraph('Reply Magic', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER)),
     Paragraph('45 sec', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER)),
     Paragraph('Triste -> Joyeuse', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER)),
     Paragraph('Emotional/Hopeful', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER))],
    [Paragraph('Love Coach', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER)),
     Paragraph('50 sec', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER)),
     Paragraph('Moderne, positive', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER)),
     Paragraph('Inspirational', ParagraphStyle('td', fontName='SimHei', fontSize=9, alignment=TA_CENTER))]
]

summary_table = Table(summary_data, colWidths=[3.5*cm, 2*cm, 4*cm, 3.5*cm])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6B21A8')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(summary_table)
story.append(Spacer(1, 20))

# Tips
story.append(Paragraph("Conseils Pro pour des Videos Virales", heading2_style))
story.append(Paragraph("1. Hook en 3 secondes : Les 3 premieres secondes doivent captiver. Utilisez une question ou une affirmation choquante.", body_style))
story.append(Paragraph("2. Sous-titres obligatoires : 80% des utilisateurs regardent sans son. Ajoutez toujours des sous-titres.", body_style))
story.append(Paragraph("3. Musique tendance : Utilisez les sons populaires du moment sur TikTok/Reels pour plus de visibilite.", body_style))
story.append(Paragraph("4. CTA clair : Terminez toujours par un appel a l'action: 'Lien en bio' ou 'Telecharge GhostMeter'.", body_style))
story.append(Paragraph("5. Hashtags stratégiques : #dating #ghosting #relations #conseilsamour #ia", body_style))
story.append(Spacer(1, 15))

# Links
story.append(Paragraph("Liens Utiles", heading2_style))
story.append(Paragraph("Bing Image Creator: bing.com/images/create", body_style))
story.append(Paragraph("Canva (overlays): canva.com", body_style))
story.append(Paragraph("TikTok Trends: tiktok.com/discover", body_style))
story.append(Paragraph("GhostMeter App: [votre lien]", body_style))

# Build PDF
doc.build(story)
print(f"PDF generated: {output_path}")
