# GhostMeter 👻

**Analyse ta conversation de crush avec l'IA**

Découvre si ton crush t'aime vraiment ! GhostMeter analyse tes conversations WhatsApp, Messenger, Instagram, Snapchat et te donne des scores d'intérêt, manipulation et ghosting.

![GhostMeter Banner](./public/icons/icon-512x512.png)

## 🚀 Fonctionnalités

- ** Analyse IA approfondie** : Score d'intérêt, manipulation, ghosting
- ** Message par message** : Chaque message analysé individuellement
- ** Évolution temporelle** : Visualise l'évolution de l'intérêt
- ** Red/Green Flags** : Détection automatique des signaux
- ** Punchline virale** : Phrase shareable pour TikTok
- ** PWA** : Installable sur mobile comme une app native
- ** 100% Mobile-first** : Interface optimisée pour smartphone

## 📱 Plateformes supportnées

- 💬 WhatsApp
- 💙 Messenger
- 📸 Instagram
- 👻 Snapchat
- 📱 Autre

## 🛠 Stack Technique

- **Framework** : Next.js 16 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS 4 + shadcn/ui
- **Animations** : Framer Motion
- **IA** : z-ai-web-dev-sdk
- **PWA** : next-pwa + Service Worker

---

## 📦 Installation

```bash
# Cloner le repo
git clone https://github.com/your-username/ghostmeter.git
cd ghostmeter

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

---

## 🚀 Déploiement

### Option 1: Vercel (Recommandé)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ghostmeter)

1. **Connecter à Vercel**
   ```bash
   # Installer Vercel CLI
   npm i -g vercel
   
   # Déployer
   vercel
   ```

2. **Ou via GitHub**
   - Push ton code sur GitHub
   - Connecte-toi sur [vercel.com](https://vercel.com)
   - Importe ton repo
   - Déploie en 1 clic !

3. **Configuration domaine**
   - Ajoute ton domaine personnalisé dans les settings Vercel
   - Ex: `ghostmeter.app`

### Option 2: Netlify

```bash
# Build
npm run build

# Déployer
netlify deploy --prod
```

### Option 3: Docker

```bash
# Build l'image
docker build -t ghostmeter .

# Run le container
docker run -p 3000:3000 ghostmeter
```

---

## 📱 Déploiement App Stores (Capacitor)

### Prérequis

- Node.js 18+
- Android Studio (pour Android)
- Xcode (pour iOS, macOS uniquement)
- Compte développeur Apple (99$/an) ou Google Play (25$ unique)

### Configuration

```bash
# Initialiser Capacitor
npm run cap:init

# Ajouter les plateformes
npm run cap:add:android
npm run cap:add:ios

# Build et synchroniser
npm run build:mobile
```

### Android (Play Store)

```bash
# Ouvrir dans Android Studio
npm run cap:open:android

# Dans Android Studio:
# 1. Build > Generate Signed Bundle / APK
# 2. Sélectionner Android App Bundle
# 3. Créer un keystore
# 4. Build release
# 5. Uploader sur Google Play Console
```

### iOS (App Store)

```bash
# Ouvrir dans Xcode
npm run cap:open:ios

# Dans Xcode:
# 1. Configurer signing & capabilities
# 2. Product > Archive
# 3. Distribute App
# 4. Uploader sur App Store Connect
```

---

## 📁 Structure du Projet

```
ghostmeter/
├── src/
│   ├── app/
│   │   ├── api/analyze/route.ts    # API IA
│   │   ├── page.tsx                 # Page principale
│   │   ├── layout.tsx               # Layout PWA
│   │   └── globals.css              # Styles globaux
│   ├── components/ui/               # shadcn/ui components
│   ├── hooks/                       # Hooks React
│   └── lib/                         # Utilitaires
├── public/
│   ├── icons/                       # Icônes PWA
│   ├── manifest.json                # Manifest PWA
│   └── sw.js                        # Service Worker
├── capacitor.config.ts              # Config Capacitor
├── vercel.json                      # Config Vercel
└── next.config.ts                   # Config Next.js
```

---

## 🔧 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run lint` | Vérifier le code |
| `npm run lint:fix` | Corriger automatiquement |
| `npm run type-check` | Vérification TypeScript |
| `npm run cap:init` | Initialiser Capacitor |
| `npm run cap:sync` | Synchroniser Capacitor |
| `npm run build:mobile` | Build pour mobile |

---

## 💰 Monétisation

### Modèle Freemium

- **Gratuit** : 3 analyses/jour
- **Premium** (4€/mois) :
  - Analyses illimitées
  - Conseils détaillés
  - Historique complet
  - Badges exclusifs

### Packs

- **Analyse Crush** : 1€/analyse (sans abonnement)

---

## 🔐 Sécurité

- Aucune donnée stockée côté serveur
- Conversations analysées en temps réel
- Historique local uniquement (localStorage)
- HTTPS obligatoire en production

---

## 📊 Analytics (Optionnel)

Pour ajouter Google Analytics :

1. Crée un compte Google Analytics
2. Ajoute ton ID dans `.env.local` :
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
3. Analytics sera automatiquement activé

---

## 🤝 Contribution

Les contributions sont les bienvenues !

```bash
# Fork le repo
git checkout -b feature/ma-feature

# Commit
git commit -m "Ajout de ma feature"

# Push
git push origin feature/ma-feature

# Ouvrir une Pull Request
```

---

## 📄 Licence

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

---

## 📞 Contact

- **Website** : [ghostmeter.app](https://ghostmeter.app)
- **TikTok** : [@ghostmeter](https://tiktok.com/@ghostmeter)
- **Email** : contact@ghostmeter.app

---

Made with 👻 by GhostMeter Team
