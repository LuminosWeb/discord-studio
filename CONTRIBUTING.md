# 🤝 Guide de Contribution - Discord Studio

Merci de votre intérêt pour contribuer à Discord Studio ! Ce guide vous aidera à comprendre comment participer au développement de ce projet communautaire.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Types de Contributions](#types-de-contributions)
- [Configuration de l'Environnement](#configuration-de-lenvironnement)
- [Standards de Code](#standards-de-code)
- [Process de Pull Request](#process-de-pull-request)
- [Reporting de Bugs](#reporting-de-bugs)

## 📜 Code de Conduite

Ce projet adhère au [Contributor Covenant](https://www.contributor-covenant.org/). En participant, vous vous engagez à respecter ce code. Merci de signaler tout comportement inacceptable.

## 🚀 Comment Contribuer

### 1. Fork et Clone
```bash
git clone https://github.com/VOTRE_USERNAME/discord-studio.git
cd discord-studio
npm install
```

### 2. Créer une Branche
```bash
git checkout -b feature/nom-de-votre-feature
# ou
git checkout -b fix/description-du-bug
```

### 3. Développer et Tester
```bash
npm run dev  # Pour le développement
npm run build-simple  # Pour tester la build
```

### 4. Commit et Push
```bash
git add .
git commit -m "type: description courte"
git push origin feature/nom-de-votre-feature
```

### 5. Ouvrir une Pull Request

## 🎯 Types de Contributions

### 🐛 Corrections de Bugs
- Corrigez des bugs existants
- Ajoutez des tests pour éviter les régressions
- Documentez la correction dans la PR

### ✨ Nouvelles Fonctionnalités
- Proposez d'abord l'idée dans une issue
- Implémentez la fonctionnalité
- Ajoutez la documentation nécessaire
- Incluez des tests si applicable

### 📚 Documentation
- Améliorez le README
- Ajoutez des commentaires dans le code
- Créez des guides d'utilisation
- Corrigez les erreurs de frappe

### 🎨 Interface Utilisateur
- Améliorez le design existant
- Proposez de nouvelles interfaces
- Optimisez l'expérience utilisateur
- Respectez le thème actuel

### 🔧 Optimisations
- Améliorez les performances
- Réduisez l'utilisation mémoire
- Optimisez les processus de build
- Refactorisez le code existant

## 🛠️ Configuration de l'Environnement

### Prérequis
- Node.js 18+
- npm 8+
- Git
- Visual Studio Code (recommandé)

### Installation
```bash
git clone https://github.com/LuminosWeb/discord-studio.git
cd discord-studio
npm install
```

### Structure du Projet
```
discord-studio/
├── electron/           # Code Electron (Backend)
│   ├── main/          # Processus principal
│   ├── class/         # Classes métier
│   └── utils.js       # Utilitaires backend
├── src/               # Code React (Frontend)
│   ├── components/    # Composants UI
│   └── utils/         # Utilitaires frontend
├── public/            # Assets statiques
└── web-dist/          # Build Vite (ignoré)
```

## 📏 Standards de Code

### JavaScript/JSX
- Utilisez des noms de variables descriptifs
- Commentez les fonctions complexes
- Respectez l'indentation (2 espaces)
- Utilisez les template literals pour les chaînes

```javascript
// ✅ Bon
const updateTrackInfo = async (trackData) => {
  // Mettre à jour les informations de la piste
  return await musicManager.setCurrentTrack(trackData);
};

// ❌ Éviter
const upd = (d) => musicManager.set(d);
```

### React Components
- Un composant par fichier
- Utilisez des hooks quand approprié
- Exportez par défaut le composant principal

```jsx
// ✅ Bon
import React, { useState } from 'react';

const MusicControls = ({ onPlay, onPause }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <div className="music-controls">
      {/* Contrôles */}
    </div>
  );
};

export default MusicControls;
```

### CSS/Tailwind
- Utilisez Tailwind CSS pour le styling
- Créez des classes personnalisées si nécessaire
- Maintenez la cohérence visuelle

## 🔄 Process de Pull Request

### 1. Checklist Avant Soumission
- [ ] Le code compile sans erreurs
- [ ] Les tests passent (si applicables)
- [ ] La documentation est mise à jour
- [ ] Le code suit les standards du projet
- [ ] La PR a une description claire

### 2. Template de PR
```markdown
## Description
Brève description des changements

## Type de Changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests
- [ ] Tests ajoutés/modifiés
- [ ] Tous les tests passent

## Screenshots (si applicable)
[Ajoutez des captures d'écran]
```

### 3. Review Process
- Un mainteneur reviewera votre PR
- Répondez aux commentaires
- Effectuez les modifications demandées
- Une fois approuvée, la PR sera mergée

## 🐛 Reporting de Bugs

### Avant de Reporter
1. Vérifiez les issues existantes
2. Testez avec la dernière version
3. Reproduisez le bug

### Template d'Issue
```markdown
## Description du Bug
Description claire du problème

## Étapes pour Reproduire
1. Étape 1
2. Étape 2
3. Étape 3

## Comportement Attendu
Ce qui devrait se passer

## Comportement Actuel
Ce qui se passe vraiment

## Environnement
- OS: [Windows 10/11]
- Node.js: [version]
- Discord Studio: [version]

## Screenshots
[Si applicable]
```

## 💡 Idées de Contributions

### Faciles pour Débuter
- Corriger des typos dans la documentation
- Ajouter des tooltips à l'interface
- Améliorer les messages d'erreur
- Ajouter des icônes manquantes

### Niveau Intermédiaire
- Ajouter de nouveaux modes audio
- Implémenter des raccourcis clavier
- Créer des composants UI réutilisables
- Optimiser les performances

### Niveau Avancé
- Support pour Linux/macOS
- Système de plugins
- API REST pour contrôle externe
- Interface web companion

## 🎉 Reconnaissance

Tous les contributeurs seront mentionnés dans :
- La section contributors du README
- Les release notes
- La page About de l'application

## 📞 Besoin d'Aide ?

- 💬 Ouvrez une discussion GitHub
- 📧 Contactez l'équipe : contact@luminosweb.com
- 🐛 Créez une issue pour les questions techniques

---

Merci de contribuer à Discord Studio ! 🎵