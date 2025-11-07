const YTDlpWrap = require('yt-dlp-wrap').default;
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { BrowserWindow } = require('electron');
const { ActivityType } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } = require('@discordjs/voice');

/**
 * Classe pour gérer la musique et les connexions Discord
 */
class MusicManager {
  constructor(discordManager) {
    // Propriétés de connexion Discord
    /** @type {import("@discordjs/voice").VoiceConnection | null} */
    this.currentConnection = null;
    this.audioPlayer = null;
    this.audioResource = null;

    // Propriétés de lecture
    this.currentTrackInfo = null;
    this.isPaused = false;
    this.currentVolume = 1.0;
    this.playbackStartTime = 0;
    this.pausedTime = 0;
    this.isLoading = false;
    this.isLooping = false;

    // Propriétés audio
    this.currentAudioMode = 'normal';
    this.currentSeekTime = 0;

    // Propriétés de processus
    this.ytDlpProcess = null;
    this.ffmpegProcess = null;

    // Propriétés de session
    this.currentUrl = null;
    this.currentGuildId = null;
    this.currentChannelId = null;
    this.currentPlatform = 'youtube';
    this.cachedAudioPath = null;

    // Référence vers le gestionnaire Discord
    this.discordManager = discordManager;

    // Initialiser yt-dlp
    this.ytDlpWrap = new YTDlpWrap();
    this.ytDlpReady = false;
    this.initYtDlp();

    // Modes audio avec filtres FFmpeg
    this.AUDIO_MODES = {
      normal: '',
      loudness: 'loudnorm=I=-16:TP=-1.5:LRA=11',
      bassBooster: 'bass=g=10:f=110:w=0.3',
      bassReducer: 'bass=g=-10:f=110:w=0.3',
      electronic: 'equalizer=f=40:width_type=h:width=50:g=5,equalizer=f=100:width_type=h:width=50:g=3',
      acoustic: 'equalizer=f=2000:width_type=h:width=200:g=3,equalizer=f=8000:width_type=h:width=500:g=2',
      classical: 'equalizer=f=250:width_type=h:width=100:g=-2,equalizer=f=4000:width_type=h:width=400:g=3',
      dance: 'bass=g=8:f=60:w=0.5,treble=g=5:f=10000:w=0.5',
      deep: 'bass=g=15:f=50:w=0.8,equalizer=f=100:width_type=h:width=50:g=8',
      hiphop: 'bass=g=12:f=60:w=0.4,equalizer=f=200:width_type=h:width=100:g=3',
      jazz: 'equalizer=f=500:width_type=h:width=100:g=2,equalizer=f=3000:width_type=h:width=300:g=3',
      latin: 'equalizer=f=150:width_type=h:width=100:g=4,treble=g=3:f=8000:w=0.3',
      lounge: 'equalizer=f=1000:width_type=h:width=200:g=-2,bass=g=3:f=80:w=0.3',
      piano: 'equalizer=f=200:width_type=h:width=100:g=-3,equalizer=f=2000:width_type=h:width=400:g=4',
      pop: 'bass=g=5:f=100:w=0.3,treble=g=3:f=10000:w=0.3',
      rnb: 'bass=g=8:f=70:w=0.4,equalizer=f=1000:width_type=h:width=200:g=2',
      rock: 'bass=g=7:f=80:w=0.4,equalizer=f=1000:width_type=h:width=200:g=4,treble=g=4:f=8000:w=0.3',
      smallSpeakers: 'equalizer=f=100:width_type=h:width=50:g=-5,equalizer=f=1000:width_type=h:width=300:g=3'
    };
  }

  /**
   * Initialiser yt-dlp
   */
  async initYtDlp() {
    try {
      const { app } = require('electron');
      // Utiliser le dossier de données utilisateur qui est accessible en écriture
      const userDataPath = app.getPath('userData');
      const ytDlpPath = path.join(userDataPath, 'yt-dlp.exe');

      // Vérifier si yt-dlp existe déjà
      if (!fs.existsSync(ytDlpPath)) {
        console.log('Téléchargement de yt-dlp...');
        await YTDlpWrap.downloadFromGithub(ytDlpPath);
        console.log('yt-dlp téléchargé avec succès');
      }

      this.ytDlpWrap.setBinaryPath(ytDlpPath);
      this.ytDlpReady = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de yt-dlp:', error);
    }
  }

  /**
   * Mettre à jour l'activité du bot Discord
   * @param {Object|null} trackInfo - Informations de la piste en cours ou null pour arrêter l'activité
   */
  async updateBotActivity(trackInfo = null) {
    await this.discordManager.updateBotActivity(trackInfo);
  }

  /**
   * Nettoyer les processus et fichiers temporaires
   */
  cleanup() {
    // Arrêter les processus
    if (this.ytDlpProcess) {
      try { this.ytDlpProcess.kill(); } catch (e) {}
      this.ytDlpProcess = null;
    }
    if (this.ffmpegProcess) {
      try { this.ffmpegProcess.kill(); } catch (e) {}
      this.ffmpegProcess = null;
    }

    // Nettoyer le fichier cache
    if (this.cachedAudioPath && fs.existsSync(this.cachedAudioPath)) {
      try {
        setTimeout(() => {
          try {
            if (fs.existsSync(this.cachedAudioPath)) {
              fs.unlinkSync(this.cachedAudioPath);
              console.log('Cache supprimé');
            }
          } catch (e) {
            console.error('Erreur suppression cache:', e.message);
          }
        }, 500);
      } catch (e) {
        console.error('Erreur lors du nettoyage:', e);
      }
    }
    this.cachedAudioPath = null;
  }

  /**
   * Réinitialiser l'état du manager
   */
  reset() {
    this.cleanup();
    
    this.audioResource = null;
    this.currentTrackInfo = null;
    this.playbackStartTime = 0;
    this.pausedTime = 0;
    this.isPaused = false;
    this.isLooping = false;
    this.isLoading = false;
    this.currentUrl = null;
    this.currentGuildId = null;
    this.currentChannelId = null;
    this.currentSeekTime = 0;
  }

  /**
   * Quitter le canal vocal
   */
  async leaveVoice() {
    try {
      if (this.currentConnection) {
        this.currentConnection.destroy();
        this.currentConnection = null;
      }
      if (this.audioPlayer) {
        this.audioPlayer.stop();
        this.audioPlayer = null;
      }
      
      this.reset();
      
      // Supprimer l'activité Discord
      this.updateBotActivity(null);
      
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  /**
   * Obtenir les informations de la vidéo depuis l'URL
   */
  async getVideoInfo(youtubeUrl, selectedPlatform) {
    let videoInfo = null;
    let actualUrl = youtubeUrl;
    
    try {
      if (selectedPlatform === 'spotify') {
        // Pour Spotify, extraire le nom de la track depuis l'URL
        console.log('Mode Spotify: extraction du nom de la track...');
        
        // Utiliser une regex pour extraire l'ID de la track depuis l'URL
        const trackIdMatch = youtubeUrl.match(/track\/([a-zA-Z0-9]+)/);
        
        if (trackIdMatch && trackIdMatch[1]) {
          const trackId = trackIdMatch[1];
          console.log('Track ID Spotify:', trackId);
          
          // Utiliser l'API Spotify publique (pas besoin d'auth pour les métadonnées basiques)
          try {
            const https = require('https');
            const spotifyData = await new Promise((resolve, reject) => {
              https.get(`https://open.spotify.com/oembed?url=spotify:track:${trackId}`, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                  try {
                    resolve(JSON.parse(data));
                  } catch (e) {
                    reject(e);
                  }
                });
              }).on('error', reject);
            });
            
            console.log('Infos Spotify récupérées:', spotifyData.title);
            
            // Chercher sur YouTube avec le nom de la track
            actualUrl = `ytsearch1:${spotifyData.title}`;
            
            // Récupérer les infos de la vidéo YouTube trouvée
            const searchResult = await this.ytDlpWrap.getVideoInfo(actualUrl);
            videoInfo = {
              title: spotifyData.title,
              artist: spotifyData.author_name || searchResult.uploader || searchResult.channel || 'Artiste inconnu',
              thumbnail: searchResult.thumbnail || spotifyData.thumbnail_url,
              views: searchResult.view_count || 0,
              duration: searchResult.duration || 0,
              url: youtubeUrl,
              platform: 'spotify'
            };
          } catch (apiError) {
            console.error('Erreur API Spotify:', apiError);
            // Fallback: utiliser juste le track ID comme recherche
            actualUrl = `ytsearch1:spotify ${trackId}`;
            videoInfo = {
              title: 'Musique Spotify',
              artist: 'Artiste inconnu',
              thumbnail: 'https://via.placeholder.com/480',
              views: 0,
              duration: 0,
              url: youtubeUrl,
              platform: 'spotify'
            };
          }
        } else {
          // Si on ne peut pas extraire l'ID, utiliser l'URL complète
          console.log('Impossible d\'extraire l\'ID Spotify');
          actualUrl = `ytsearch1:${youtubeUrl}`;
          videoInfo = {
            title: 'Musique Spotify',
            artist: 'Artiste inconnu',
            thumbnail: 'https://via.placeholder.com/480',
            views: 0,
            duration: 0,
            url: youtubeUrl,
            platform: 'spotify'
          };
        }
      } else {
        // YouTube direct
        const infoResult = await this.ytDlpWrap.getVideoInfo(youtubeUrl);
        videoInfo = {
          title: infoResult.title,
          artist: infoResult.uploader || infoResult.channel || 'Artiste inconnu',
          thumbnail: infoResult.thumbnail,
          views: infoResult.view_count,
          duration: infoResult.duration,
          url: youtubeUrl,
          platform: 'youtube'
        };
      }
      
      console.log('Infos vidéo:', videoInfo);
      return { videoInfo, actualUrl };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos:', error);
      
      // Si c'est Spotify et qu'on n'a pas pu récupérer les infos, utiliser l'URL directement pour la recherche
      if (selectedPlatform === 'spotify') {
        actualUrl = `ytsearch1:${youtubeUrl}`;
      }
      
      // Créer des infos par défaut si l'extraction échoue
      videoInfo = {
        title: selectedPlatform === 'spotify' ? 'Musique Spotify' : 'Musique YouTube',
        artist: 'Artiste inconnu',
        thumbnail: 'https://via.placeholder.com/480',
        views: 0,
        duration: 0,
        url: youtubeUrl,
        platform: selectedPlatform
      };
      
      return { videoInfo, actualUrl };
    }
  }

  /**
   * Télécharger le fichier audio
   */
  async downloadAudio(actualUrl) {
    if (this.cachedAudioPath) return this.cachedAudioPath;

    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `discord-audio-${Date.now()}.webm`);
    
    console.log('Téléchargement du fichier audio...');
    console.log('URL actuelle:', actualUrl);
    
    // Télécharger le fichier complet
    const downloadArgs = [
      '-f', 'bestaudio',
      '-o', tempFile,
      actualUrl
    ];
    
    const downloadProcess = spawn(this.ytDlpWrap.getBinaryPath(), downloadArgs);

    // Capturer les erreurs
    let errorOutput = '';
    downloadProcess.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      console.log('yt-dlp:', message);
    });

    downloadProcess.stdout.on('data', (data) => {
      console.log('yt-dlp output:', data.toString());
    });

    await new Promise((resolve, reject) => {
      downloadProcess.on('close', (code) => {
        if (code === 0) {
          this.cachedAudioPath = tempFile;
          console.log('Fichier téléchargé:', this.cachedAudioPath);
          resolve();
        } else {
          console.error('Code de sortie yt-dlp:', code);
          console.error('Erreur complète:', errorOutput);
          reject(new Error(`Échec du téléchargement (code: ${code}). ${errorOutput.slice(0, 200)}`));
        }
      });
      downloadProcess.on('error', (err) => {
        console.error('Erreur processus yt-dlp:', err);
        reject(err);
      });
    });

    return this.cachedAudioPath;
  }

  /**
   * Créer la ressource audio avec FFmpeg
   */
  createAudioStream() {
    let ffmpegPath;
    
    try {
      // En mode développement, utiliser ffmpeg-static
      const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
      
      if (isDev) {
        ffmpegPath = require('ffmpeg-static');
      } else {
        // En production, utiliser le chemin relatif vers ffmpeg
        const { app } = require('electron');
        const path = require('path');
        const appPath = app.getAppPath();
        
        // Essayer plusieurs emplacements possibles pour ffmpeg
        const possiblePaths = [
          path.join(appPath, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
          path.join(process.resourcesPath, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
          path.join(__dirname, '..', '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
          'ffmpeg' // Fallback sur ffmpeg système
        ];
        
        ffmpegPath = possiblePaths.find(p => {
          try {
            return require('fs').existsSync(p);
          } catch {
            return false;
          }
        });
        
        if (!ffmpegPath) {
          console.error('FFmpeg introuvable dans la version buildée');
          throw new Error('FFmpeg introuvable');
        }
      }
      
      console.log('Utilisation de FFmpeg:', ffmpegPath);
    } catch (error) {
      console.error('Erreur lors de la résolution du chemin FFmpeg:', error);
      // Fallback sur ffmpeg système
      ffmpegPath = 'ffmpeg';
    }
    
    const ffmpegArgs = [
      '-ss', this.currentSeekTime.toString(),
      '-i', this.cachedAudioPath,
      '-f', 'opus',
      '-ar', '48000',
      '-ac', '2',
      '-b:a', '128k'
    ];

    // Ajouter les filtres audio si un mode est sélectionné
    if (this.currentAudioMode !== 'normal' && this.AUDIO_MODES[this.currentAudioMode]) {
      ffmpegArgs.splice(ffmpegArgs.length - 4, 0, '-af', this.AUDIO_MODES[this.currentAudioMode]);
    }

    ffmpegArgs.push('pipe:1');

    this.ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
    
    this.ffmpegProcess.on('error', (err) => {
      console.error('Erreur FFmpeg:', err);
    });

    this.ffmpegProcess.stderr.on('data', (data) => {
      // Logs FFmpeg (optionnel)
      // console.log('FFmpeg:', data.toString());
    });

    return this.ffmpegProcess.stdout;
  }

  /**
   * Configurer les événements du lecteur audio
   */
  setupAudioPlayerEvents() {
    this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
      console.log('Audio démarré');
      this.isPaused = false;
      this.isLoading = false;
      
      // Mettre à jour l'activité Discord avec le titre de la musique
      if (this.currentTrackInfo) {
        this.updateBotActivity(this.currentTrackInfo);
      }
    });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      console.log('Audio terminé');
      
      // Vérifier si la boucle est activée
      if (this.isLooping && this.cachedAudioPath && fs.existsSync(this.cachedAudioPath)) {
        console.log('Boucle activée - redémarrage de la musique');
        this.restartForLoop();
        return; // Sortir de la fonction pour éviter le nettoyage
      }
      
      // Nettoyage normal si pas de boucle ou erreur
      if (this.currentConnection) {
        this.currentConnection.destroy();
        this.currentConnection = null;
      }
      this.currentTrackInfo = null;
      this.audioResource = null;
      this.playbackStartTime = 0;
      this.isLoading = false;
      
      this.cleanup();
      
      // Supprimer l'activité Discord
      this.updateBotActivity(null);
      
      const allWindows = BrowserWindow.getAllWindows();
      if (allWindows.length > 0) {
        allWindows[0].webContents.send('track-ended');
      }
    });

    this.audioPlayer.on('error', error => {
      console.error('Erreur du lecteur audio:', error);
      console.error('Stack trace:', error.stack);
      this.isLoading = false;
      
      // Envoyer l'erreur au frontend pour debugging
      const allWindows = BrowserWindow.getAllWindows();
      if (allWindows.length > 0) {
        allWindows[0].webContents.send('audio-error', error.message);
      }
    });
  }

  /**
   * Redémarrer la musique en boucle
   */
  restartForLoop() {
    try {
      // Remettre le temps à 0
      this.currentSeekTime = 0;
      this.playbackStartTime = Date.now();
      
      // Arrêter le processus FFmpeg précédent
      if (this.ffmpegProcess) {
        try { this.ffmpegProcess.kill(); } catch (e) {}
        this.ffmpegProcess = null;
      }

      // Créer un nouveau stream audio
      const audioStream = this.createAudioStream();

      const resource = createAudioResource(audioStream, {
        inputType: StreamType.OggOpus,
        inlineVolume: true
      });

      // Définir le volume
      if (resource.volume) {
        resource.volume.setVolume(this.currentVolume);
      }

      this.audioResource = resource;
      
      // Rejouer la musique
      this.audioPlayer.play(resource);
      
      console.log('Musique redémarrée en boucle');
    } catch (err) {
      console.error('Erreur lors de la boucle:', err);
    }
  }

  /**
   * Rejoindre un canal vocal et jouer une musique
   */
  async joinAndPlay(guildId, channelId, youtubeUrl, selectedPlatform) {
    try {
      this.isLoading = true;

      if (!this.discordManager.isReady()) throw new Error('Bot non connecté');
      if (!guildId || !channelId) throw new Error('Guild ou channel manquant');
      if (!youtubeUrl) throw new Error('URL YouTube manquante');

      // Sauvegarder les informations pour rejouer avec un nouveau mode
      this.currentUrl = youtubeUrl;
      this.currentGuildId = guildId;
      this.currentChannelId = channelId;
      this.currentPlatform = selectedPlatform;
      this.currentSeekTime = 0;

      // Si l'URL change, supprimer l'ancien cache
      if (this.cachedAudioPath && fs.existsSync(this.cachedAudioPath)) {
        this.cleanup();
      }

      // Déconnecter l'ancienne connexion si elle existe
      if (this.currentConnection) {
        this.currentConnection.destroy();
        this.currentConnection = null;
      }

      if (this.audioPlayer) {
        this.audioPlayer.stop();
        this.audioPlayer = null;
      }

      // Arrêter les processus précédents s'ils existent
      if (this.ytDlpProcess) {
        try { this.ytDlpProcess.kill(); } catch (e) {}
        this.ytDlpProcess = null;
      }
      if (this.ffmpegProcess) {
        try { this.ffmpegProcess.kill(); } catch (e) {}
        this.ffmpegProcess = null;
      }

      // Obtenir le canal vocal
      const channel = await this.discordManager.fetchChannel(channelId);
      if (!channel || !channel.isVoiceBased()) {
        throw new Error('Canal vocal invalide');
      }

      // Récupérer les informations de la vidéo
      const { videoInfo, actualUrl } = await this.getVideoInfo(youtubeUrl, selectedPlatform);
      this.currentTrackInfo = videoInfo;

      // Créer la connexion vocale avec @discordjs/voice
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      this.currentConnection = connection;

      // Attendre que la connexion soit prête
      try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        console.log('Connexion vocale établie');
      } catch (error) {
        connection.destroy();
        throw new Error('Impossible de se connecter au canal vocal');
      }

      // Créer le lecteur audio
      this.audioPlayer = createAudioPlayer();
      this.isPaused = false;

      // Vérifier si yt-dlp est prêt
      if (!this.ytDlpReady) {
        throw new Error('yt-dlp n\'est pas encore initialisé. Veuillez réessayer.');
      }

      // Télécharger le fichier audio
      await this.downloadAudio(actualUrl);

      // Créer le stream audio
      const audioStream = this.createAudioStream();

      const resource = createAudioResource(audioStream, {
        inputType: StreamType.OggOpus,
        inlineVolume: true
      });

      // Définir le volume initial
      if (resource.volume) {
        resource.volume.setVolume(this.currentVolume);
      }

      this.audioResource = resource;
      this.playbackStartTime = Date.now();

      // Configurer les événements du lecteur
      this.setupAudioPlayerEvents();

      // Souscrire le lecteur à la connexion
      connection.subscribe(this.audioPlayer);

      // Jouer la ressource
      this.audioPlayer.play(resource);

      return { ok: true, trackInfo: videoInfo, isLoading: true };
    } catch (err) {
      console.error('Erreur JoinAndPlay:', err);
      this.isLoading = false;
      if (this.currentConnection) {
        this.currentConnection.destroy();
        this.currentConnection = null;
      }
      return { ok: false, message: err.message };
    }
  }

  /**
   * Basculer entre pause et lecture
   */
  async togglePause() {
    try {
      if (!this.audioPlayer) {
        return { ok: false, message: 'Aucune musique en cours' };
      }

      if (this.isPaused) {
        // Reprendre : ajuster playbackStartTime pour exclure le temps de pause
        const pauseDuration = Date.now() - this.pausedTime;
        this.playbackStartTime += pauseDuration;
        this.audioPlayer.unpause();
        this.isPaused = false;
        this.pausedTime = 0;
        
        // Remettre l'activité lors de la reprise
        if (this.currentTrackInfo) {
          this.updateBotActivity(this.currentTrackInfo);
        }
        
        return { ok: true, isPaused: false };
      } else {
        // Mettre en pause : sauvegarder le moment de la pause
        this.pausedTime = Date.now();
        this.audioPlayer.pause();
        this.isPaused = true;
        
        // Supprimer l'activité lors de la pause
        this.updateBotActivity(null);
        
        return { ok: true, isPaused: true };
      }
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  /**
   * Obtenir les informations de la piste actuelle
   */
  getCurrentTrack() {
    let currentTime = 0;
    if (this.audioResource && this.playbackStartTime > 0) {
      currentTime = Math.floor((Date.now() - this.playbackStartTime) / 1000);
    }
    return {
      ok: this.audioResource !== null,
      trackInfo: this.currentTrackInfo,
      isPaused: this.isPaused,
      currentTime,
      volume: this.currentVolume,
      isLoading: this.isLoading,
      audioMode: this.currentAudioMode
    };
  }

  /**
   * Définir le mode audio
   */
  async setAudioMode(mode) {
    try {
      if (!this.AUDIO_MODES.hasOwnProperty(mode)) {
        return { ok: false, message: 'Mode audio invalide' };
      }

      this.currentAudioMode = mode;
      console.log('Mode audio changé:', mode);
      
      // Si une musique est en cours ET qu'on a le fichier en cache
      if (this.currentUrl && this.audioPlayer && this.currentConnection && this.cachedAudioPath) {
        console.log('Application instantanée du filtre...');
        
        // Sauvegarder le temps de lecture actuel
        this.currentSeekTime = this.playbackStartTime > 0 ? Math.floor((Date.now() - this.playbackStartTime) / 1000) : 0;
        
        // Arrêter l'ancien player mais garder la connexion
        this.audioPlayer.stop();
        
        // Arrêter le processus FFmpeg précédent
        if (this.ffmpegProcess) {
          try { this.ffmpegProcess.kill(); } catch (e) {}
          this.ffmpegProcess = null;
        }

        // Créer un nouveau stream FFmpeg avec le nouveau filtre
        const audioStream = this.createAudioStream();

        const resource = createAudioResource(audioStream, {
          inputType: StreamType.OggOpus,
          inlineVolume: true
        });

        // Définir le volume
        if (resource.volume) {
          resource.volume.setVolume(this.currentVolume);
        }

        this.audioResource = resource;
        this.playbackStartTime = Date.now() - (this.currentSeekTime * 1000); // Ajuster le temps de départ

        // Jouer la nouvelle ressource sur la connexion existante
        this.audioPlayer.play(resource);
        
        console.log('Filtre appliqué instantanément !');
        return { ok: true, audioMode: this.currentAudioMode, restarted: true };
      }
      
      return { ok: true, audioMode: this.currentAudioMode, restarted: false };
    } catch (err) {
      console.error('Erreur setAudioMode:', err);
      return { ok: false, message: err.message };
    }
  }

  /**
   * Définir le volume
   */
  async setVolume(volume) {
    try {
      if (!this.audioResource || !this.audioResource.volume) {
        return { ok: false, message: 'Aucune musique en cours' };
      }

      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.audioResource.volume.setVolume(clampedVolume);
      this.currentVolume = clampedVolume;

      return { ok: true, volume: clampedVolume };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  /**
   * Aller à une position spécifique dans la musique
   */
  async seekTo(timeInSeconds) {
    try {
      if (!this.currentUrl || !this.cachedAudioPath || !this.audioPlayer || !this.currentConnection) {
        return { ok: false, message: 'Aucune musique en cours' };
      }

      console.log('Seek vers:', timeInSeconds, 'secondes');
      
      // Mettre à jour currentSeekTime
      this.currentSeekTime = timeInSeconds;
      
      // Arrêter le player actuel
      this.audioPlayer.stop();
      
      // Arrêter le processus FFmpeg précédent
      if (this.ffmpegProcess) {
        try { this.ffmpegProcess.kill(); } catch (e) {}
        this.ffmpegProcess = null;
      }

      // Créer un nouveau stream FFmpeg depuis le fichier local à la position demandée
      const audioStream = this.createAudioStream();

      const resource = createAudioResource(audioStream, {
        inputType: StreamType.OggOpus,
        inlineVolume: true
      });

      // Définir le volume
      if (resource.volume) {
        resource.volume.setVolume(this.currentVolume);
      }

      this.audioResource = resource;
      this.playbackStartTime = Date.now() - (this.currentSeekTime * 1000); // Ajuster le temps de départ

      // Jouer la nouvelle ressource
      this.audioPlayer.play(resource);
      
      // Reprendre si c'était en pause
      if (this.isPaused) {
        this.audioPlayer.unpause();
        this.isPaused = false;
      }
      
      console.log('Seek effectué avec succès');
      return { ok: true, seekTime: this.currentSeekTime };
    } catch (err) {
      console.error('Erreur seekTo:', err);
      return { ok: false, message: err.message };
    }
  }

  /**
   * Définir l'état de la boucle
   */
  setLooping(looping) {
    this.isLooping = looping;
    console.log('Boucle définie à:', looping);
    return { ok: true, isLooping: this.isLooping };
  }

  /**
   * Obtenir les modes audio disponibles
   */
  getAudioModes() {
    const modes = Object.keys(this.AUDIO_MODES).map(key => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
    }));
    return { ok: true, modes };
  }
}

module.exports = MusicManager;