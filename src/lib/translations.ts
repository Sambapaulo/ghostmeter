// GhostMeter Translations - 4 Languages: FR, EN, DE, ES

export type Language = 'fr' | 'en' | 'de' | 'es';

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Menu
    'menu.history': 'Historique',
    'menu.history_count': '{count} conversation{s}',
    'menu.premium': 'Premium',
    'menu.premium_price': 'Dès {price}/mois',
    'menu.contact': 'Contact',
    'menu.contact_subtitle': 'Une question ? Un bug ?',
    'menu.about': 'À propos',
    'menu.cgu': 'CGU',
    'menu.cgu_subtitle': 'Conditions Générales d\'Utilisation',
    'menu.dark_mode': 'Mode sombre',
    'menu.light_mode': 'Mode clair',
    'menu.dark_mode_enable': 'Activer le thème sombre',
    'menu.dark_mode_disable': 'Désactiver le thème sombre',
    'menu.language': 'Langue',
    'menu.notifications': 'Notifications',
    'menu.notifications_enable': 'Activer les rappels quotidiens',
    'menu.notifications_daily': 'Message motivant chaque matin à 9h',
    'menu.notifications_test': '🔔 Tester une notification',
    'menu.logout': 'Déconnexion',
    'menu.save_account': 'Sauvegarder mon compte',
    'menu.save_account_subtitle': 'Lier un email',
    'menu.login': 'Connexion',
    'menu.login_subtitle': 'Récupérer mon compte Premium',
    'menu.version': 'Version',
    'menu.app_version': 'Application GhostMeter v{version}',
    'menu.native_notifications': 'Notifications natives activées',

    // Premium
    'premium.title': 'GhostMeter Premium',
    'premium.subtitle': 'Analyses illimitées + sauvegarde compte',
    'premium.pack_1month': '1 mois',
    'premium.pack_3months': '3 mois',
    'premium.pack_12months': '12 mois',
    'premium.best_value': 'Meilleure offre',
    'premium.save': 'Économisez {percent}%',
    'premium.per_month': '/mois',
    'premium.promo_code': 'Code promo',
    'premium.promo_validate': 'OK',
    'premium.promo_valid': 'Code valide ! -{discount}',
    'premium.promo_invalid': 'Code invalide',
    'premium.buy': 'Acheter',
    'premium.restore': 'Restaurer mes achats',
    'premium.restore_success': 'Achats restaurés !',
    'premium.restore_error': 'Erreur lors de la restauration',
    'premium.processing': 'Traitement...',
    'premium.redirecting': 'Redirection vers PayPal...',

    // Auth
    'auth.save_title': 'Sauvegarder Premium',
    'auth.login_title': 'Connexion',
    'auth.register_title': 'Créer un compte',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirm_password': 'Confirmer le mot de passe',
    'auth.save': 'Sauvegarder',
    'auth.login': 'Se connecter',
    'auth.register': 'Créer un compte',
    'auth.save_description': 'Lie ton email et mot de passe pour récupérer ton compte Premium.',
    'auth.login_description': 'Connecte-toi pour récupérer ton compte Premium.',
    'auth.register_description': 'Crée un compte pour sauvegarder ton Premium.',
    'auth.account_created': 'Compte créé ! Activez Premium pour profiter de toutes les fonctionnalités.',
    'auth.login_success': 'Connexion réussie !',
    'auth.login_success_premium': 'Connexion réussie ! Premium actif.',
    'auth.account_recovered': 'Compte récupéré ! Activez Premium pour plus de fonctionnalités.',
    'auth.no_account': 'Pas de compte ? Créer un compte',
    'auth.have_account': 'Déjà un compte ? Se connecter',

    // Home
    'home.title': 'Analyse ta conversation',
    'home.subtitle': 'Colle ta conversation et découvre ce que l\'IA pense de votre relation',
    'home.paste': 'Coller',
    'home.pasted': 'Collé !',
    'home.or': 'ou',
    'home.scan_screenshot': 'Scanner une capture d\'écran',
    'home.context': 'Contexte',
    'home.analyze': 'Analyser',
    'home.analyzing': 'Analyse en cours...',
    'home.remaining': 'Analyses restantes aujourd\'hui',
    'home.premium_unlimited': 'Illimité avec Premium',
    'home.get_premium': 'Obtenir Premium',

    // Contexts
    'context.crush': 'Crush secret',
    'context.ex': 'Ex',
    'context.new': 'Début de relation',
    'context.talking': 'Talking stage',
    'context.situationship': 'Situationship',
    'context.friend': 'Ami(e)',
    'context.other': 'Autre',

    // Results
    'results.interest': 'Intérêt',
    'results.manipulation': 'Manipulation',
    'results.ghosting': 'Ghosting',
    'results.overall': 'Global',
    'results.advice': 'Conseil',
    'results.positive_signs': 'Signaux positifs',
    'results.negative_signs': 'Signaux négatifs',
    'results.neutral_points': 'Points neutres',
    'results.badges': 'Badges',
    'results.vibe': 'Vibe',
    'results.new_analysis': 'Nouvelle analyse',
    'results.save': 'Sauvegarder',
    'results.saved': 'Sauvegardé !',
    'results.share': 'Partager',

    // Reply Generator
    'reply.title': 'Générateur de réponse',
    'reply.received_message': 'Message reçu',
    'reply.received_placeholder': 'Colle le message que tu as reçu...',
    'reply.reply_type': 'Type de réponse',
    'reply.generate': 'Générer',
    'reply.generating': 'Génération...',
    'reply.copy': 'Copier',
    'reply.copied': 'Copié !',
    'reply.next': 'Suivant',
    'reply.previous': 'Précédent',
    'reply.new': 'Nouveau',

    // Reply Types
    'replytype.interested_warm': 'Intéressé(e) & chaleureux',
    'replytype.interested_mysterious': 'Intéressé(e) mais mystérieux',
    'replytype.distant_polite': 'Distant & poli',
    'replytype.evasive': 'Évasif',
    'replytype.direct_honest': 'Direct & honnête',
    'replytype.flirty_playful': 'Joueur / Flirty',
    'replytype.indifferent': 'Indifférent',
    'replytype.soft_ghost': 'Ghosting doux',

    // Coach
    'coach.title': 'Coach Relationnel',
    'coach.placeholder': 'Pose ta question ou décris ta situation...',
    'coach.send': 'Envoyer',
    'coach.sending': 'Envoi...',
    'coach.questions_remaining': 'Questions restantes aujourd\'hui',
    'coach.unlimited': 'Illimité avec Premium',
    'coach.new_conversation': 'Nouvelle conversation',
    'coach.history': 'Historique',
    'coach.thinking': 'Réflexion...',

    // History
    'history.title': 'Historique',
    'history.empty': 'Aucune conversation enregistrée',
    'history.delete': 'Supprimer',

    // About
    'about.title': 'À propos',
    'about.description': 'GhostMeter est une application d\'analyse de conversations utilisant l\'intelligence artificielle pour vous aider à mieux comprendre vos relations.',
    'about.version': 'Version',
    'about.made_with': 'Fait avec ❤️',

    // CGU
    'cgu.title': 'Conditions Générales d\'Utilisation',

    // Contact
    'contact.title': 'Contact',
    'contact.subtitle': 'Une question ? Un bug ? Contactez-nous !',
    'contact.email': 'Email (optionnel)',
    'contact.email_hint': 'Pour recevoir une réponse',
    'contact.subject': 'Sujet *',
    'contact.subject_select': 'Sélectionner un sujet',
    'contact.subject_bug': '🐛 Signaler un bug',
    'contact.subject_feature': '💡 Suggestion de fonctionnalité',
    'contact.subject_premium': '👑 Question sur Premium',
    'contact.subject_other': '❓ Autre',
    'contact.message': 'Message *',
    'contact.message_placeholder': 'Décrivez votre question ou problème...',
    'contact.send': 'Envoyer',
    'contact.sending': 'Envoi en cours...',
    'contact.success': 'Message envoyé !',
    'contact.success_detail': 'Nous vous répondrons dans les plus brefs délais.',

    // Errors
    'error.fill_fields': 'Veuillez remplir tous les champs',
    'error.invalid_email': 'Email invalide',
    'error.password_short': 'Le mot de passe doit contenir au moins 4 caractères',
    'error.password_mismatch': 'Les mots de passe ne correspondent pas',
    'error.connection': 'Erreur de connexion',
    'error.generic': 'Une erreur est survenue',

    // Misc
    'loading': 'Chargement...',
    'close': 'Fermer',
    'cancel': 'Annuler',
    'confirm': 'Confirmer',
    'yes': 'Oui',
    'no': 'Non',
  },

  en: {
    // Menu
    'menu.history': 'History',
    'menu.history_count': '{count} conversation{s}',
    'menu.premium': 'Premium',
    'menu.premium_price': 'From {price}/month',
    'menu.contact': 'Contact',
    'menu.contact_subtitle': 'A question? A bug?',
    'menu.about': 'About',
    'menu.cgu': 'Terms of Use',
    'menu.cgu_subtitle': 'General Terms and Conditions',
    'menu.dark_mode': 'Dark mode',
    'menu.light_mode': 'Light mode',
    'menu.dark_mode_enable': 'Enable dark theme',
    'menu.dark_mode_disable': 'Disable dark theme',
    'menu.language': 'Language',
    'menu.notifications': 'Notifications',
    'menu.notifications_enable': 'Enable daily reminders',
    'menu.notifications_daily': 'Motivational message every morning at 9am',
    'menu.notifications_test': '🔔 Test notification',
    'menu.logout': 'Log out',
    'menu.save_account': 'Save my account',
    'menu.save_account_subtitle': 'Link an email',
    'menu.login': 'Log in',
    'menu.login_subtitle': 'Recover my Premium account',
    'menu.version': 'Version',
    'menu.app_version': 'GhostMeter App v{version}',
    'menu.native_notifications': 'Native notifications enabled',

    // Premium
    'premium.title': 'GhostMeter Premium',
    'premium.subtitle': 'Unlimited analyses + account backup',
    'premium.pack_1month': '1 month',
    'premium.pack_3months': '3 months',
    'premium.pack_12months': '12 months',
    'premium.best_value': 'Best value',
    'premium.save': 'Save {percent}%',
    'premium.per_month': '/month',
    'premium.promo_code': 'Promo code',
    'premium.promo_validate': 'OK',
    'premium.promo_valid': 'Valid code! -{discount}',
    'premium.promo_invalid': 'Invalid code',
    'premium.buy': 'Buy',
    'premium.restore': 'Restore my purchases',
    'premium.restore_success': 'Purchases restored!',
    'premium.restore_error': 'Error restoring purchases',
    'premium.processing': 'Processing...',
    'premium.redirecting': 'Redirecting to PayPal...',

    // Auth
    'auth.save_title': 'Save Premium',
    'auth.login_title': 'Log in',
    'auth.register_title': 'Create account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm password',
    'auth.save': 'Save',
    'auth.login': 'Log in',
    'auth.register': 'Create account',
    'auth.save_description': 'Link your email and password to recover your Premium account.',
    'auth.login_description': 'Log in to recover your Premium account.',
    'auth.register_description': 'Create an account to save your Premium.',
    'auth.account_created': 'Account created! Activate Premium to enjoy all features.',
    'auth.login_success': 'Login successful!',
    'auth.login_success_premium': 'Login successful! Premium active.',
    'auth.account_recovered': 'Account recovered! Activate Premium for more features.',
    'auth.no_account': 'No account? Create one',
    'auth.have_account': 'Already have an account? Log in',

    // Home
    'home.title': 'Analyze your conversation',
    'home.subtitle': 'Paste your conversation and discover what AI thinks about your relationship',
    'home.paste': 'Paste',
    'home.pasted': 'Pasted!',
    'home.or': 'or',
    'home.scan_screenshot': 'Scan a screenshot',
    'home.context': 'Context',
    'home.analyze': 'Analyze',
    'home.analyzing': 'Analyzing...',
    'home.remaining': 'Analyses remaining today',
    'home.premium_unlimited': 'Unlimited with Premium',
    'home.get_premium': 'Get Premium',

    // Contexts
    'context.crush': 'Secret crush',
    'context.ex': 'Ex',
    'context.new': 'New relationship',
    'context.talking': 'Talking stage',
    'context.situationship': 'Situationship',
    'context.friend': 'Friend',
    'context.other': 'Other',

    // Results
    'results.interest': 'Interest',
    'results.manipulation': 'Manipulation',
    'results.ghosting': 'Ghosting',
    'results.overall': 'Overall',
    'results.advice': 'Advice',
    'results.positive_signs': 'Positive signs',
    'results.negative_signs': 'Negative signs',
    'results.neutral_points': 'Neutral points',
    'results.badges': 'Badges',
    'results.vibe': 'Vibe',
    'results.new_analysis': 'New analysis',
    'results.save': 'Save',
    'results.saved': 'Saved!',
    'results.share': 'Share',

    // Reply Generator
    'reply.title': 'Reply Generator',
    'reply.received_message': 'Received message',
    'reply.received_placeholder': 'Paste the message you received...',
    'reply.reply_type': 'Reply type',
    'reply.generate': 'Generate',
    'reply.generating': 'Generating...',
    'reply.copy': 'Copy',
    'reply.copied': 'Copied!',
    'reply.next': 'Next',
    'reply.previous': 'Previous',
    'reply.new': 'New',

    // Reply Types
    'replytype.interested_warm': 'Interested & warm',
    'replytype.interested_mysterious': 'Interested but mysterious',
    'replytype.distant_polite': 'Distant & polite',
    'replytype.evasive': 'Evasive',
    'replytype.direct_honest': 'Direct & honest',
    'replytype.flirty_playful': 'Flirty & playful',
    'replytype.indifferent': 'Indifferent',
    'replytype.soft_ghost': 'Soft ghost',

    // Coach
    'coach.title': 'Relationship Coach',
    'coach.placeholder': 'Ask your question or describe your situation...',
    'coach.send': 'Send',
    'coach.sending': 'Sending...',
    'coach.questions_remaining': 'Questions remaining today',
    'coach.unlimited': 'Unlimited with Premium',
    'coach.new_conversation': 'New conversation',
    'coach.history': 'History',
    'coach.thinking': 'Thinking...',

    // History
    'history.title': 'History',
    'history.empty': 'No saved conversations',
    'history.delete': 'Delete',

    // About
    'about.title': 'About',
    'about.description': 'GhostMeter is a conversation analysis app using artificial intelligence to help you better understand your relationships.',
    'about.version': 'Version',
    'about.made_with': 'Made with ❤️',

    // CGU
    'cgu.title': 'Terms of Use',

    // Contact
    'contact.title': 'Contact',
    'contact.subtitle': 'A question? A bug? Contact us!',
    'contact.email': 'Email (optional)',
    'contact.email_hint': 'To receive a response',
    'contact.subject': 'Subject *',
    'contact.subject_select': 'Select a subject',
    'contact.subject_bug': '🐛 Report a bug',
    'contact.subject_feature': '💡 Feature suggestion',
    'contact.subject_premium': '👑 Premium question',
    'contact.subject_other': '❓ Other',
    'contact.message': 'Message *',
    'contact.message_placeholder': 'Describe your question or problem...',
    'contact.send': 'Send',
    'contact.sending': 'Sending...',
    'contact.success': 'Message sent!',
    'contact.success_detail': 'We will respond as soon as possible.',

    // Errors
    'error.fill_fields': 'Please fill in all fields',
    'error.invalid_email': 'Invalid email',
    'error.password_short': 'Password must be at least 4 characters',
    'error.password_mismatch': 'Passwords do not match',
    'error.connection': 'Connection error',
    'error.generic': 'An error occurred',

    // Misc
    'loading': 'Loading...',
    'close': 'Close',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'yes': 'Yes',
    'no': 'No',
  },

  de: {
    // Menu
    'menu.history': 'Verlauf',
    'menu.history_count': '{count} Konversation{en}',
    'menu.premium': 'Premium',
    'menu.premium_price': 'Ab {price}/Monat',
    'menu.contact': 'Kontakt',
    'menu.contact_subtitle': 'Eine Frage? Ein Bug?',
    'menu.about': 'Über uns',
    'menu.cgu': 'AGB',
    'menu.cgu_subtitle': 'Allgemeine Geschäftsbedingungen',
    'menu.dark_mode': 'Dunkelmodus',
    'menu.light_mode': 'Hellmodus',
    'menu.dark_mode_enable': 'Dunkles Design aktivieren',
    'menu.dark_mode_disable': 'Dunkles Design deaktivieren',
    'menu.language': 'Sprache',
    'menu.notifications': 'Benachrichtigungen',
    'menu.notifications_enable': 'Tägliche Erinnerungen aktivieren',
    'menu.notifications_daily': 'Motivierende Nachricht jeden Morgen um 9 Uhr',
    'menu.notifications_test': '🔔 Test-Benachrichtigung',
    'menu.logout': 'Abmelden',
    'menu.save_account': 'Konto speichern',
    'menu.save_account_subtitle': 'E-Mail verknüpfen',
    'menu.login': 'Anmelden',
    'menu.login_subtitle': 'Premium-Konto wiederherstellen',
    'menu.version': 'Version',
    'menu.app_version': 'GhostMeter App v{version}',
    'menu.native_notifications': 'Native Benachrichtigungen aktiviert',

    // Premium
    'premium.title': 'GhostMeter Premium',
    'premium.subtitle': 'Unbegrenzte Analysen + Konto-Backup',
    'premium.pack_1month': '1 Monat',
    'premium.pack_3months': '3 Monate',
    'premium.pack_12months': '12 Monate',
    'premium.best_value': 'Bestes Angebot',
    'premium.save': 'Spare {percent}%',
    'premium.per_month': '/Monat',
    'premium.promo_code': 'Gutscheincode',
    'premium.promo_validate': 'OK',
    'premium.promo_valid': 'Gültiger Code! -{discount}',
    'premium.promo_invalid': 'Ungültiger Code',
    'premium.buy': 'Kaufen',
    'premium.restore': 'Käufe wiederherstellen',
    'premium.restore_success': 'Käufe wiederhergestellt!',
    'premium.restore_error': 'Fehler beim Wiederherstellen',
    'premium.processing': 'Verarbeitung...',
    'premium.redirecting': 'Weiterleitung zu PayPal...',

    // Auth
    'auth.save_title': 'Premium speichern',
    'auth.login_title': 'Anmelden',
    'auth.register_title': 'Konto erstellen',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.confirm_password': 'Passwort bestätigen',
    'auth.save': 'Speichern',
    'auth.login': 'Anmelden',
    'auth.register': 'Konto erstellen',
    'auth.save_description': 'Verknüpfen Sie Ihre E-Mail und Ihr Passwort, um Ihr Premium-Konto wiederherzustellen.',
    'auth.login_description': 'Melden Sie sich an, um Ihr Premium-Konto wiederherzustellen.',
    'auth.register_description': 'Erstellen Sie ein Konto, um Ihr Premium zu speichern.',
    'auth.account_created': 'Konto erstellt! Aktivieren Sie Premium, um alle Funktionen zu nutzen.',
    'auth.login_success': 'Anmeldung erfolgreich!',
    'auth.login_success_premium': 'Anmeldung erfolgreich! Premium aktiv.',
    'auth.account_recovered': 'Konto wiederhergestellt! Aktivieren Sie Premium für mehr Funktionen.',
    'auth.no_account': 'Kein Konto? Konto erstellen',
    'auth.have_account': 'Bereits ein Konto? Anmelden',

    // Home
    'home.title': 'Analysiere dein Gespräch',
    'home.subtitle': 'Füge dein Gespräch ein und entdecke, was die KI über deine Beziehung denkt',
    'home.paste': 'Einfügen',
    'home.pasted': 'Eingefügt!',
    'home.or': 'oder',
    'home.scan_screenshot': 'Screenshot scannen',
    'home.context': 'Kontext',
    'home.analyze': 'Analysieren',
    'home.analyzing': 'Analyse läuft...',
    'home.remaining': 'Analysen übrig heute',
    'home.premium_unlimited': 'Unbegrenzt mit Premium',
    'home.get_premium': 'Premium holen',

    // Contexts
    'context.crush': 'Geheime Schwärmerei',
    'context.ex': 'Ex',
    'context.new': 'Neue Beziehung',
    'context.talking': 'Talking Stage',
    'context.situationship': 'Situationship',
    'context.friend': 'Freund/in',
    'context.other': 'Andere',

    // Results
    'results.interest': 'Interesse',
    'results.manipulation': 'Manipulation',
    'results.ghosting': 'Ghosting',
    'results.overall': 'Gesamt',
    'results.advice': 'Ratschlag',
    'results.positive_signs': 'Positive Zeichen',
    'results.negative_signs': 'Negative Zeichen',
    'results.neutral_points': 'Neutrale Punkte',
    'results.badges': 'Abzeichen',
    'results.vibe': 'Vibe',
    'results.new_analysis': 'Neue Analyse',
    'results.save': 'Speichern',
    'results.saved': 'Gespeichert!',
    'results.share': 'Teilen',

    // Reply Generator
    'reply.title': 'Antwort-Generator',
    'reply.received_message': 'Erhaltene Nachricht',
    'reply.received_placeholder': 'Füge die erhaltene Nachricht ein...',
    'reply.reply_type': 'Antworttyp',
    'reply.generate': 'Generieren',
    'reply.generating': 'Generierung...',
    'reply.copy': 'Kopieren',
    'reply.copied': 'Kopiert!',
    'reply.next': 'Weiter',
    'reply.previous': 'Zurück',
    'reply.new': 'Neu',

    // Reply Types
    'replytype.interested_warm': 'Interessiert & herzlich',
    'replytype.interested_mysterious': 'Interessiert aber mysteriös',
    'replytype.distant_polite': 'Distanziert & höflich',
    'replytype.evasive': 'Ausweichend',
    'replytype.direct_honest': 'Direkt & ehrlich',
    'replytype.flirty_playful': 'Flirtend & verspielt',
    'replytype.indifferent': 'Gleichgültig',
    'replytype.soft_ghost': 'Soft Ghost',

    // Coach
    'coach.title': 'Beziehungscoach',
    'coach.placeholder': 'Stelle deine Frage oder beschreibe deine Situation...',
    'coach.send': 'Senden',
    'coach.sending': 'Senden...',
    'coach.questions_remaining': 'Fragen übrig heute',
    'coach.unlimited': 'Unbegrenzt mit Premium',
    'coach.new_conversation': 'Neues Gespräch',
    'coach.history': 'Verlauf',
    'coach.thinking': 'Denke nach...',

    // History
    'history.title': 'Verlauf',
    'history.empty': 'Keine gespeicherten Gespräche',
    'history.delete': 'Löschen',

    // About
    'about.title': 'Über uns',
    'about.description': 'GhostMeter ist eine Gesprächsanalyse-App, die künstliche Intelligenz nutzt, um Ihnen zu helfen, Ihre Beziehungen besser zu verstehen.',
    'about.version': 'Version',
    'about.made_with': 'Gemacht mit ❤️',

    // CGU
    'cgu.title': 'Allgemeine Geschäftsbedingungen',

    // Contact
    'contact.title': 'Kontakt',
    'contact.subtitle': 'Eine Frage? Ein Bug? Kontaktieren Sie uns!',
    'contact.email': 'E-Mail (optional)',
    'contact.email_hint': 'Um eine Antwort zu erhalten',
    'contact.subject': 'Betreff *',
    'contact.subject_select': 'Betreff auswählen',
    'contact.subject_bug': '🐛 Bug melden',
    'contact.subject_feature': '💡 Feature-Vorschlag',
    'contact.subject_premium': '👑 Premium-Frage',
    'contact.subject_other': '❓ Andere',
    'contact.message': 'Nachricht *',
    'contact.message_placeholder': 'Beschreiben Sie Ihre Frage oder Ihr Problem...',
    'contact.send': 'Senden',
    'contact.sending': 'Senden...',
    'contact.success': 'Nachricht gesendet!',
    'contact.success_detail': 'Wir werden so schnell wie möglich antworten.',

    // Errors
    'error.fill_fields': 'Bitte füllen Sie alle Felder aus',
    'error.invalid_email': 'Ungültige E-Mail',
    'error.password_short': 'Passwort muss mindestens 4 Zeichen haben',
    'error.password_mismatch': 'Passwörter stimmen nicht überein',
    'error.connection': 'Verbindungsfehler',
    'error.generic': 'Ein Fehler ist aufgetreten',

    // Misc
    'loading': 'Laden...',
    'close': 'Schließen',
    'cancel': 'Abbrechen',
    'confirm': 'Bestätigen',
    'yes': 'Ja',
    'no': 'Nein',
  },

  es: {
    // Menu
    'menu.history': 'Historial',
    'menu.history_count': '{count} conversación{es}',
    'menu.premium': 'Premium',
    'menu.premium_price': 'Desde {price}/mes',
    'menu.contact': 'Contacto',
    'menu.contact_subtitle': '¿Una pregunta? ¿Un error?',
    'menu.about': 'Acerca de',
    'menu.cgu': 'Términos de uso',
    'menu.cgu_subtitle': 'Condiciones generales de uso',
    'menu.dark_mode': 'Modo oscuro',
    'menu.light_mode': 'Modo claro',
    'menu.dark_mode_enable': 'Activar tema oscuro',
    'menu.dark_mode_disable': 'Desactivar tema oscuro',
    'menu.language': 'Idioma',
    'menu.notifications': 'Notificaciones',
    'menu.notifications_enable': 'Activar recordatorios diarios',
    'menu.notifications_daily': 'Mensaje motivador cada mañana a las 9h',
    'menu.notifications_test': '🔔 Probar notificación',
    'menu.logout': 'Cerrar sesión',
    'menu.save_account': 'Guardar mi cuenta',
    'menu.save_account_subtitle': 'Vincular un email',
    'menu.login': 'Iniciar sesión',
    'menu.login_subtitle': 'Recuperar mi cuenta Premium',
    'menu.version': 'Versión',
    'menu.app_version': 'Aplicación GhostMeter v{version}',
    'menu.native_notifications': 'Notificaciones nativas activadas',

    // Premium
    'premium.title': 'GhostMeter Premium',
    'premium.subtitle': 'Análisis ilimitados + respaldo de cuenta',
    'premium.pack_1month': '1 mes',
    'premium.pack_3months': '3 meses',
    'premium.pack_12months': '12 meses',
    'premium.best_value': 'Mejor oferta',
    'premium.save': 'Ahorra {percent}%',
    'premium.per_month': '/mes',
    'premium.promo_code': 'Código promocional',
    'premium.promo_validate': 'OK',
    'premium.promo_valid': '¡Código válido! -{discount}',
    'premium.promo_invalid': 'Código inválido',
    'premium.buy': 'Comprar',
    'premium.restore': 'Restaurar mis compras',
    'premium.restore_success': '¡Compras restauradas!',
    'premium.restore_error': 'Error al restaurar compras',
    'premium.processing': 'Procesando...',
    'premium.redirecting': 'Redirigiendo a PayPal...',

    // Auth
    'auth.save_title': 'Guardar Premium',
    'auth.login_title': 'Iniciar sesión',
    'auth.register_title': 'Crear cuenta',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'auth.confirm_password': 'Confirmar contraseña',
    'auth.save': 'Guardar',
    'auth.login': 'Iniciar sesión',
    'auth.register': 'Crear cuenta',
    'auth.save_description': 'Vincula tu email y contraseña para recuperar tu cuenta Premium.',
    'auth.login_description': 'Inicia sesión para recuperar tu cuenta Premium.',
    'auth.register_description': 'Crea una cuenta para guardar tu Premium.',
    'auth.account_created': '¡Cuenta creada! Activa Premium para disfrutar de todas las funciones.',
    'auth.login_success': '¡Inicio de sesión exitoso!',
    'auth.login_success_premium': '¡Inicio de sesión exitoso! Premium activo.',
    'auth.account_recovered': '¡Cuenta recuperada! Activa Premium para más funciones.',
    'auth.no_account': '¿No tienes cuenta? Crear cuenta',
    'auth.have_account': '¿Ya tienes cuenta? Iniciar sesión',

    // Home
    'home.title': 'Analiza tu conversación',
    'home.subtitle': 'Pega tu conversación y descubre qué piensa la IA sobre tu relación',
    'home.paste': 'Pegar',
    'home.pasted': '¡Pegado!',
    'home.or': 'o',
    'home.scan_screenshot': 'Escanear una captura',
    'home.context': 'Contexto',
    'home.analyze': 'Analizar',
    'home.analyzing': 'Analizando...',
    'home.remaining': 'Análisis restantes hoy',
    'home.premium_unlimited': 'Ilimitado con Premium',
    'home.get_premium': 'Obtener Premium',

    // Contexts
    'context.crush': 'Amor secreto',
    'context.ex': 'Ex',
    'context.new': 'Nueva relación',
    'context.talking': 'Talking stage',
    'context.situationship': 'Situationship',
    'context.friend': 'Amigo/a',
    'context.other': 'Otro',

    // Results
    'results.interest': 'Interés',
    'results.manipulation': 'Manipulación',
    'results.ghosting': 'Ghosting',
    'results.overall': 'Global',
    'results.advice': 'Consejo',
    'results.positive_signs': 'Señales positivas',
    'results.negative_signs': 'Señales negativas',
    'results.neutral_points': 'Puntos neutros',
    'results.badges': 'Insignias',
    'results.vibe': 'Vibe',
    'results.new_analysis': 'Nuevo análisis',
    'results.save': 'Guardar',
    'results.saved': '¡Guardado!',
    'results.share': 'Compartir',

    // Reply Generator
    'reply.title': 'Generador de respuestas',
    'reply.received_message': 'Mensaje recibido',
    'reply.received_placeholder': 'Pega el mensaje que recibiste...',
    'reply.reply_type': 'Tipo de respuesta',
    'reply.generate': 'Generar',
    'reply.generating': 'Generando...',
    'reply.copy': 'Copiar',
    'reply.copied': '¡Copiado!',
    'reply.next': 'Siguiente',
    'reply.previous': 'Anterior',
    'reply.new': 'Nuevo',

    // Reply Types
    'replytype.interested_warm': 'Interesado y cálido',
    'replytype.interested_mysterious': 'Interesado pero misterioso',
    'replytype.distant_polite': 'Distante y educado',
    'replytype.evasive': 'Evasivo',
    'replytype.direct_honest': 'Directo y honesto',
    'replytype.flirty_playful': 'Coqueto y juguetón',
    'replytype.indifferent': 'Indiferente',
    'replytype.soft_ghost': 'Ghosting suave',

    // Coach
    'coach.title': 'Coach de relaciones',
    'coach.placeholder': 'Haz tu pregunta o describe tu situación...',
    'coach.send': 'Enviar',
    'coach.sending': 'Enviando...',
    'coach.questions_remaining': 'Preguntas restantes hoy',
    'coach.unlimited': 'Ilimitado con Premium',
    'coach.new_conversation': 'Nueva conversación',
    'coach.history': 'Historial',
    'coach.thinking': 'Pensando...',

    // History
    'history.title': 'Historial',
    'history.empty': 'No hay conversaciones guardadas',
    'history.delete': 'Eliminar',

    // About
    'about.title': 'Acerca de',
    'about.description': 'GhostMeter es una aplicación de análisis de conversaciones que utiliza inteligencia artificial para ayudarte a comprender mejor tus relaciones.',
    'about.version': 'Versión',
    'about.made_with': 'Hecho con ❤️',

    // CGU
    'cgu.title': 'Condiciones generales de uso',

    // Contact
    'contact.title': 'Contacto',
    'contact.subtitle': '¿Una pregunta? ¿Un error? ¡Contáctanos!',
    'contact.email': 'Email (opcional)',
    'contact.email_hint': 'Para recibir una respuesta',
    'contact.subject': 'Asunto *',
    'contact.subject_select': 'Seleccionar un asunto',
    'contact.subject_bug': '🐛 Reportar un error',
    'contact.subject_feature': '💡 Sugerir función',
    'contact.subject_premium': '👑 Pregunta sobre Premium',
    'contact.subject_other': '❓ Otro',
    'contact.message': 'Mensaje *',
    'contact.message_placeholder': 'Describe tu pregunta o problema...',
    'contact.send': 'Enviar',
    'contact.sending': 'Enviando...',
    'contact.success': '¡Mensaje enviado!',
    'contact.success_detail': 'Te responderemos lo antes posible.',

    // Errors
    'error.fill_fields': 'Por favor completa todos los campos',
    'error.invalid_email': 'Email inválido',
    'error.password_short': 'La contraseña debe tener al menos 4 caracteres',
    'error.password_mismatch': 'Las contraseñas no coinciden',
    'error.connection': 'Error de conexión',
    'error.generic': 'Ocurrió un error',

    // Misc
    'loading': 'Cargando...',
    'close': 'Cerrar',
    'cancel': 'Cancelar',
    'confirm': 'Confirmar',
    'yes': 'Sí',
    'no': 'No',
  },
};

// Helper function to get translation with interpolation
export function t(key: string, lang: Language, vars?: Record<string, string | number>): string {
  let text = translations[lang]?.[key] || translations['fr'][key] || key;

  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }

  return text;
}

// Get language from localStorage (client-side only)
export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';
  const stored = localStorage.getItem('ghostmeter_language');
  if (stored && ['fr', 'en', 'de', 'es'].includes(stored)) {
    return stored as Language;
  }
  return 'fr';
}

// Store language in localStorage
export function setStoredLanguage(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ghostmeter_language', lang);
  }
}
