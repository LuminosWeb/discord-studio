# 🎵 Discord Studio

<div align="center">
  <img src="public/logo.png" alt="Discord Studio Logo" width="128" height="128">
  
  **Une application Electron moderne pour diffuser de la musique dans Discord**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![Electron](https://img.shields.io/badge/Electron-38+-blue.svg)](https://www.electronjs.org/)
  [![Discord.js](https://img.shields.io/badge/Discord.js-14+-purple.svg)](https://discord.js.org/)
</div>

## 📖 Description

Discord Studio est une application de bureau moderne qui permet de créer facilement un bot musical pour Discord. L'application offre une interface utilisateur intuitive pour contrôler la lecture de musique depuis YouTube et Spotify directement dans les canaux vocaux Discord.

## ✨ Fonctionnalités

### 🎧 Lecture Audio
- **Multi-plateformes** : Support YouTube et Spotify
- **Qualité optimisée** : Audio haute qualité avec FFmpeg
- **Contrôles complets** : Play/Pause, Volume, Seek, Boucle
- **Cache intelligent** : Téléchargement et mise en cache pour une lecture fluide

### 🎛️ Modes Audio
- **15 modes différents** : Normal, Bass Booster, Rock, Electronic, etc.
- **Application en temps réel** : Changement instantané sans interruption
- **Filtres FFmpeg** : Qualité professionnelle

### 🤖 Integration Discord
- **Connexion simple** : Interface pour token de bot
- **Sélection serveur/canal** : Navigation intuitive
- **Activité en temps réel** : Affichage de la musique en cours
- **Gestion des permissions** : Contrôle d'accès aux canaux

### 🎨 Interface Moderne
- **Design épuré** : Interface utilisateur moderne avec Tailwind CSS
- **Responsive** : Adaptable à différentes tailles d'écran
- **Contrôles intuitifs** : Slider de volume, barre de progression
- **Thème sombre** : Design moderne et agréable

## 🛠️ Technologies

### Frontend
- **React 19** - Interface utilisateur moderne
- **Tailwind CSS** - Styling utilitaire
- **Vite** - Build tool rapide
- **Lucide React** - Icônes modernes

### Backend
- **Electron 38** - Application de bureau
- **Discord.js 14** - API Discord
- **@discordjs/voice** - Connexions vocales
- **FFmpeg** - Traitement audio

### Audio Processing
- **yt-dlp** - Téléchargement YouTube/Spotify
- **ffmpeg-static** - Encodage et filtres audio
- **@discordjs/opus** - Codec audio Discord

## 🚀 Installation

### Prérequis
- **Node.js 18+** - [Télécharger](https://nodejs.org/)
- **npm** ou **yarn** - Gestionnaire de paquets
- **Bot Discord** - [Créer un bot](https://discord.com/developers/applications)

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/LuminosWeb/discord-studio.git
cd discord-studio
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Créer un bot Discord**
   - Aller sur [Discord Developer Portal](https://discord.com/developers/applications)
   - Créer une nouvelle application
   - Aller dans "Bot" et créer un bot
   - Copier le token
   - Inviter le bot sur votre serveur avec les permissions nécessaires

4. **Lancer l'application**
```bash
npm run dev
```

## 📦 Build et Distribution

### Build pour développement
```bash
npm run dev
```

### Build pour production
```bash
npm run build-simple
```

L'application sera construite dans le dossier `build/Discord Studio-win32-x64/`

## 🎯 Utilisation

### Première utilisation

1. **Connexion du bot**
   - Lancer l'application
   - Coller le token de votre bot Discord
   - Se connecter

2. **Sélection du serveur et canal**
   - Choisir le serveur Discord
   - Sélectionner un canal vocal

3. **Lecture de musique**
   - Coller un lien YouTube ou Spotify
   - Cliquer sur "Rejoindre et Jouer"
   - Profiter de la musique !

### Contrôles disponibles

| Contrôle | Description |
|----------|-------------|
| ⏯️ Play/Pause | Contrôler la lecture |
| 🔊 Volume | Ajuster le volume (0-100%) |
| 🔁 Boucle | Répéter la musique en boucle |
| ⏭️ Seek | Naviguer dans la musique |
| 🎛️ Mode Audio | Changer les filtres audio |

### Modes Audio Disponibles

- **Normal** - Son naturel
- **Bass Booster** - Renforcement des basses
- **Rock** - Optimisé pour le rock
- **Electronic** - Parfait pour l'électronique
- **Classical** - Idéal pour le classique
- **Jazz** - Optimisé pour le jazz
- **Pop** - Parfait pour la pop
- Et bien d'autres...

## 🏗️ Architecture

### Structure du projet
```
discord-studio/
├── electron/           # Code Electron principal
│   ├── main/          # Processus principal
│   ├── class/         # Classes métier
│   └── utils.js       # Utilitaires
├── src/               # Code React
│   ├── components/    # Composants UI
│   └── utils/         # Utilitaires frontend
├── public/            # Assets statiques
└── build/             # Application compilée
```

### Classes principales

#### `DiscordManager`
- Gestion du client Discord
- Connexion/déconnexion
- Opérations sur les serveurs

#### `MusicManager`
- Lecture audio
- Contrôles de musique
- Modes audio et filtres

## 🤝 Contribution

Ce projet est communautaire et ouvert aux contributions !

### Comment contribuer

1. **Fork** le repository
2. **Créer** une branche pour votre fonctionnalité
```bash
git checkout -b feature/amazing-feature
```
3. **Commiter** vos changements
```bash
git commit -m '✨ Add amazing feature'
```
4. **Push** vers la branche
```bash
git push origin feature/amazing-feature
```
5. **Ouvrir** une Pull Request

### Types de contributions recherchées

- 🐛 Corrections de bugs
- ✨ Nouvelles fonctionnalités
- 📝 Amélioration de la documentation
- 🎨 Améliorations UI/UX
- 🔧 Optimisations de performance
- 🌐 Traductions

## 📋 Roadmap

### Version actuelle (1.0.0)
- [x] Interface utilisateur complète
- [x] Support YouTube et Spotify
- [x] 15 modes audio différents
- [x] Système de cache intelligent
- [x] Architecture modulaire

### Prochaines versions

#### v1.1.0
- [ ] Support SoundCloud
- [ ] Playlists personnalisées
- [ ] Historique de lecture
- [ ] Raccourcis clavier

#### v1.2.0
- [ ] Interface web pour contrôle à distance
- [ ] API REST pour intégrations
- [ ] Système de plugins
- [ ] Mode multi-serveurs

#### v2.0.0
- [ ] Refonte complète de l'UI
- [ ] Support Linux et macOS
- [ ] Base de données intégrée
- [ ] Système d'authentification avancé

## 🐛 Problèmes connus

- **Windows uniquement** : Actuellement testé sur Windows 10/11
- **Token Discord requis** : Nécessite la création d'un bot
- **Dépendance FFmpeg** : Peut nécessiter l'installation manuelle sur certains systèmes

## 📄 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Discord.js** - Pour l'excellente bibliothèque Discord
- **yt-dlp** - Pour le support multi-plateformes
- **FFmpeg** - Pour le traitement audio de qualité
- **Electron** - Pour la plateforme d'application de bureau
- **Tous les contributeurs** - Pour leurs contributions précieuses

## 📞 Support

### Aide et Questions
- 📧 **Email** : [contact@luminosweb.com](mailto:contact@luminosweb.com)
- 💬 **Discord** : Rejoignez notre serveur de support
- 🐛 **Issues** : [GitHub Issues](https://github.com/LuminosWeb/discord-studio/issues)

### Liens utiles
- 📖 **Documentation** : [Wiki GitHub](https://github.com/LuminosWeb/discord-studio/wiki)
- 🎥 **Tutoriels** : [Chaîne YouTube](https://youtube.com)
- 🌐 **Site web** : [LuminosWeb](https://luminosweb.com)

---

<div align="center">
  Fait avec ❤️ par <strong>LuminosWeb</strong><br>
  ⭐ N'hésitez pas à mettre une étoile si ce projet vous plaît !
</div> 
