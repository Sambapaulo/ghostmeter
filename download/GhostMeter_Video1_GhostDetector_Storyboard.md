# 🎬 GhostMeter - Vidéo Marketing #1
## "Ghost Detector" - L'Analyse Ghosting

---

## 📋 Fiche Technique

| Élément | Valeur |
|---------|--------|
| **Durée** | 5-7 secondes |
| **Format** | 9:16 (TikTok/Reels/Shorts) |
| **Résolution** | 1080x1920px |
| **Style** | Dark Mode, Violet/Rose Néon |
| **FPS** | 60 |

---

## 🎨 Palette de Couleurs

```
Fond principal : #1a1a2e (violet très foncé)
Dégradé : #a855f7 → #ec4899 (violet → rose)
Texte : #ffffff (blanc)
Accent succès : #22c55e (vert)
Accent alerte : #ef4444 (rouge)
```

---

## 📱 Frame 1 - L'Entrée (0-1s)

### Description
Un smartphone en mode portrait affiche l'app GhostMeter. La zone de texte est vide, avec un placeholder "Collez votre conversation...".

### Action
Le texte suivant apparaît avec un effet "coller" (pop-in rapide) :

```
💬 Conversation

Lui: Hey ! 😊                    [14:32]
Moi: Coucou ! Ça fait plaisir !  [14:35]
Lui: On devrait se voir...       [14:40]
Moi: Oui quand tu veux ! 😊      [14:42]

... 3 jours plus tard ...

Moi: Tu es là ?                  [09:15]

... encore 2 jours ...

[Messages non lus ✓✓]
```

### Animation
- Bulles de chat qui apparaissent une par une (stagger effect)
- Légère vibration sur "3 jours plus tard"
- Le "Tu es là ?" apparaît en orange (signal d'alerte)

---

## 📱 Frame 2 - Le Bouton (1-2s)

### Description
Le texte est maintenant en place. En bas de l'écran, le bouton devient actif.

### Élément UI
```
┌─────────────────────────────────┐
│                                 │
│     🔮 ANALYSER                 │
│                                 │
└─────────────────────────────────┘
```

### Animation
- Le bouton pulse doucement (glow effect)
- Un halo violet apparaît autour
- Le curseur/doigt s'approche

---

## 📱 Frame 3 - Le Clic (2-3s)

### Description
Le doigt tape sur le bouton "Analyser".

### Animation
1. Le bouton s'enfonce (scale: 0.95)
2. Onde de choc lumineuse violette qui s'étend
3. Le bouton se transforme en loader
4. Les petits 👻 apparaissent et traversent le texte

### Effets sonores suggérés
- "Ding" mystérieux
- Son de scan futuriste

---

## 📱 Frame 4 - Le Scan (3-4s)

### Description
L'analyse est en cours.

### Animation
1. Une ligne de scan horizontale traverse le texte (effet laser)
2. Des mots se surlignent :
   - "3 jours" → ROUGE
   - "Tu es là ?" → ORANGE
   - "non lus" → ROUGE
3. Petits fantômes 👻 qui flottent autour des messages

### Effets visuels
- Particules violettes qui orbitent
- Compteur de pourcentage qui défile : 0% → 87%

---

## 📱 Frame 5 - Les Résultats (4-6s)

### Description
Une carte de résultats glisse depuis le bas.

### UI Résultats
```
┌─────────────────────────────────┐
│        📊 ANALYSE TERMINÉE      │
├─────────────────────────────────┤
│                                 │
│  👻 GHOSTING SCORE              │
│     ████████████░░ 87%          │
│     🔴 CRITIQUE                  │
│                                 │
│  💔 INTÉRÊT SCORE               │
│     ███░░░░░░░░░░░ 23%          │
│     ⚪ FAIBLE                    │
│                                 │
├─────────────────────────────────┤
│  💡 CONSEIL                     │
│                                 │
│  "Il te ghost.                  │
│   Ne perds plus ton temps."     │
│                                 │
│         👻 💔 🚩                │
└─────────────────────────────────┘
```

### Animation
1. La carte glisse avec un léger rebond
2. Les scores se remplissent (barres animées)
3. Le texte du conseil apparaît mot par mot (effet machine à écrire)
4. Le fantôme 👻 traverse l'écran de droite à gauche

---

## 📱 Frame 6 - Fin (6-7s)

### Description
Écran final avec logo GhostMeter.

### Animation
1. Logo GhostMeter apparaît au centre
2. Slogan fade in : "Détecte les ghosts. Garde ta dignité."
3. Petit fantôme 👻 qui fait un clin d'œil

### Call to Action
```
        👻 GHOSTMETER
   Détecte les ghosts.
   Garde ta dignité.

   [Télécharger] [App Store] [Play Store]
```

---

## 🎵 Design Sonore

| Moment | Son | Intensité |
|--------|-----|-----------|
| Coller texte | "Pop" léger | 20% |
| Apparition bulles | "Bloop" x4 | 15% |
| Clic bouton | "Ding" mystérieux | 40% |
| Scan | "Whirrr" futuriste | 30% |
| Résultats | "Ta-da" satisfaisant | 50% |
| Fantôme final | "Boo" rigolo | 25% |

---

## 💡 Notes pour Production

### Outils recommandés :
- **Motion Design** : After Effects + Bodymovin (export Lottie)
- **Alternative** : Cavalry, Figma + Smart Animate
- **IA Vidéo** : Runway Gen-2, Pika Labs, Kling

### Conseils :
1. Générer les animations SANS texte d'abord
2. Ajouter le texte en post-production
3. Exporter en H.264 ou ProRes 4444
4. Prévoir une version loop (la fin revient au début)

---

## 📐 Template Figma/After Effects

```
┌─────────────────────────────────┐
│ Status Bar (heure, batterie)    │
├─────────────────────────────────┤
│                                 │
│      👻 GhostMeter              │
│      [Logo]                     │
│                                 │
├─────────────────────────────────┤
│                                 │
│   [Zone Conversation]           │
│   - Bulles de chat              │
│   - Timeline                    │
│   - Messages                    │
│                                 │
├─────────────────────────────────┤
│                                 │
│   🔮 ANALYSER                   │
│                                 │
├─────────────────────────────────┤
│      [Zone Résultats]           │
│      - Scores                   │
│      - Conseils                 │
│                                 │
└─────────────────────────────────┘
```

---

*Document créé pour GhostMeter Marketing - 2025*
