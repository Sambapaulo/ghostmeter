#!/bin/bash

# GhostMeter - Script d'installation automatique
# Exécute ce script sur ta machine locale

echo "👻 GhostMeter - Installation..."
echo ""

# Créer le dossier
mkdir -p ghostmeter
cd ghostmeter

# Initialiser le projet
echo "📦 Initialisation du projet..."
git init
git branch -M main

# Ajouter le remote GitHub
git remote add origin https://github.com/Sambapaulo/ghostmeter.git

echo ""
echo "✅ Projet initialisé !"
echo ""
echo "Maintenant, copie les fichiers du projet dans ce dossier."
echo "Ensuite exécute:"
echo ""
echo "  git add ."
echo "  git commit -m '🚀 Initial commit - GhostMeter'"
echo "  git push -u origin main"
echo ""

