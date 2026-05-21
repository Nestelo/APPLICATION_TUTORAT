#!/bin/bash
# Script pour installer toutes les dépendances du frontend

# Vérifier si npm est installé
if ! command -v npm &> /dev/null
then
    echo "npm n'est pas installé. Veuillez l'installer avant de continuer."
    exit
fi

# Installer les dépendances
npm install

echo "Installation des dépendances terminée avec succès !"