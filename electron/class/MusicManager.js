const YTDlpWrap = require('yt-dlp-wrap').default;
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { BrowserWindow } = require('electron');
const { ActivityType } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } = require('@discordjs/voice');
const logger = require('../utils/logger');

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
   * Envoyer un log au frontend
   */
  sendLogToFrontend(message, data = null) {
    try {
      const allWindows = BrowserWindow.getAllWindows();
      if (allWindows.length > 0) {
        const logData = data ? `${message} ${JSON.stringify(data)}` : message;
        
        // Logger dans le fichier ET dans la console
        logger.log('[MusicManager]', logData);
        
        // Envoyer au frontend
        allWindows[0].webContents.send('backend-log', { message, data, timestamp: Date.now() });
      }
    } catch (e) {
      logger.error('Erreur envoi log:', e);
    }
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

      this.sendLogToFrontend('Initialisation de yt-dlp...');
      this.sendLogToFrontend('Chemin userData:', userDataPath);
      this.sendLogToFrontend('Chemin yt-dlp:', ytDlpPath);

      // Vérifier si yt-dlp existe déjà
      if (!fs.existsSync(ytDlpPath)) {
        this.sendLogToFrontend('Téléchargement de yt-dlp...');
        
        try {
          // Télécharger avec un timeout plus long pour éviter les problèmes réseau
          await Promise.race([
            YTDlpWrap.downloadFromGithub(ytDlpPath),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout téléchargement yt-dlp')), 60000)
            )
          ]);
          this.sendLogToFrontend('yt-dlp téléchargé avec succès');
        } catch (downloadError) {
          this.sendLogToFrontend('Erreur téléchargement yt-dlp:', downloadError.message);
          throw new Error('Impossible de télécharger yt-dlp: ' + downloadError.message);
        }
      } else {
        this.sendLogToFrontend('yt-dlp existe déjà');
      }

      // Vérifier que le fichier est bien présent et exécutable
      if (!fs.existsSync(ytDlpPath)) {
        throw new Error('Le fichier yt-dlp n\'existe pas après téléchargement');
      }

      const stats = fs.statSync(ytDlpPath);
      this.sendLogToFrontend('Taille du fichier yt-dlp:', stats.size + ' bytes');
      
      if (stats.size === 0) {
        throw new Error('Le fichier yt-dlp est vide');
      }

      this.ytDlpWrap.setBinaryPath(ytDlpPath);
      this.ytDlpReady = true;
      this.sendLogToFrontend('✅ yt-dlp initialisé avec succès');
    } catch (error) {
      this.sendLogToFrontend('❌ Erreur lors de l\'initialisation de yt-dlp:', error.message);
      this.ytDlpReady = false;
      throw error;
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
      this.sendLogToFrontend('Début getVideoInfo pour:', youtubeUrl);
      
      if (selectedPlatform === 'spotify') {
        this.sendLogToFrontend('Mode Spotify: extraction du nom de la track...');
        
        // Utiliser une regex pour extraire l'ID de la track depuis l'URL
        const trackIdMatch = youtubeUrl.match(/track\/([a-zA-Z0-9]+)/);
        
        if (trackIdMatch && trackIdMatch[1]) {
          const trackId = trackIdMatch[1];
          this.sendLogToFrontend('Track ID Spotify:', trackId);
          
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
            
            this.sendLogToFrontend('Infos Spotify récupérées:', spotifyData.title);
            
            // Chercher sur YouTube avec le nom de la track
            actualUrl = `ytsearch1:${spotifyData.title}`;
            
            // Récupérer les infos de la vidéo YouTube trouvée
            this.sendLogToFrontend('Appel ytDlpWrap.getVideoInfo pour Spotify...');
            const searchResult = await this.ytDlpWrap.getVideoInfo(actualUrl);
            this.sendLogToFrontend('✅ Infos vidéo récupérées pour Spotify');
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
        // YouTube direct - utiliser spawn directement pour plus de contrôle
        this.sendLogToFrontend('Mode YouTube: récupération des infos avec spawn...');
        
        const ytDlpArgs = [
          '--dump-json',
          '--no-playlist',
          '--no-warnings',
          '--skip-download',
          '--no-check-certificates',
          '--socket-timeout', '20',
          // Utiliser le client Android pour éviter les problèmes SABR
          '--extractor-args', 'youtube:player_client=android',
          youtubeUrl
        ];
        
        this.sendLogToFrontend('Commande yt-dlp:', this.ytDlpWrap.getBinaryPath());
        this.sendLogToFrontend('Arguments:', ytDlpArgs.join(' '));
        
        const ytDlpProcess = spawn(this.ytDlpWrap.getBinaryPath(), ytDlpArgs, {
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true
        });
        
        let outputData = '';
        let errorData = '';
        
        ytDlpProcess.stdout.on('data', (data) => {
          outputData += data.toString();
        });
        
        ytDlpProcess.stderr.on('data', (data) => {
          const msg = data.toString();
          errorData += msg;
          // Logger seulement les erreurs importantes
          if (msg.toLowerCase().includes('error')) {
            this.sendLogToFrontend('yt-dlp stderr:', msg.trim());
          }
        });
        
        const infoResult = await new Promise((resolve, reject) => {
          // Augmenter le timeout à 60 secondes
          const timeout = setTimeout(() => {
            ytDlpProcess.kill();
            reject(new Error('Timeout getVideoInfo (60s)'));
          }, 60000);
          
          ytDlpProcess.on('close', (code) => {
            clearTimeout(timeout);
            
            if (code === 0 && outputData) {
              try {
                // Parser le JSON (peut contenir plusieurs lignes, prendre la première valide)
                const lines = outputData.trim().split('\n');
                let jsonData = null;
                
                for (const line of lines) {
                  try {
                    const parsed = JSON.parse(line);
                    if (parsed.title) {
                      jsonData = parsed;
                      break;
                    }
                  } catch (e) {
                    // Ignorer les lignes non-JSON
                  }
                }
                
                if (jsonData) {
                  this.sendLogToFrontend('✅ JSON parsé avec succès, titre:', jsonData.title);
                  resolve(jsonData);
                } else {
                  this.sendLogToFrontend('❌ Aucun JSON valide trouvé dans la sortie');
                  reject(new Error('Aucune info vidéo dans la sortie'));
                }
              } catch (e) {
                this.sendLogToFrontend('❌ Erreur parsing JSON:', e.message);
                reject(new Error('Erreur parsing JSON: ' + e.message));
              }
            } else {
              this.sendLogToFrontend('❌ yt-dlp code sortie:', code);
              if (errorData) {
                this.sendLogToFrontend('Erreur:', errorData.slice(-300));
              }
              reject(new Error(`yt-dlp failed (code ${code})`));
            }
          });
          
          ytDlpProcess.on('error', (err) => {
            clearTimeout(timeout);
            this.sendLogToFrontend('❌ Erreur processus yt-dlp:', err.message);
            reject(err);
          });
        });
        
        this.sendLogToFrontend('✅ Infos vidéo YouTube récupérées');
        
        videoInfo = {
          title: infoResult.title || 'Titre inconnu',
          artist: infoResult.uploader || infoResult.channel || 'Artiste inconnu',
          thumbnail: infoResult.thumbnail || 'https://via.placeholder.com/480',
          views: infoResult.view_count || 0,
          duration: infoResult.duration || 0,
          url: youtubeUrl,
          platform: 'youtube'
        };
      }
      
      this.sendLogToFrontend('✅ getVideoInfo terminé avec succès');
      return { videoInfo, actualUrl };
    } catch (error) {
      this.sendLogToFrontend('❌ Erreur lors de la récupération des infos:', error.message);
      
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
    if (this.cachedAudioPath && fs.existsSync(this.cachedAudioPath)) {
      console.log('Utilisation du cache existant:', this.cachedAudioPath);
      return this.cachedAudioPath;
    }

    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `discord-audio-${Date.now()}.webm`);
    
    console.log('Téléchargement du fichier audio...');
    console.log('URL actuelle:', actualUrl);
    console.log('Fichier de sortie:', tempFile);
    console.log('Binaire yt-dlp:', this.ytDlpWrap.getBinaryPath());
    
    // Vérifier que yt-dlp est prêt
    if (!this.ytDlpReady) {
      throw new Error('yt-dlp n\'est pas initialisé');
    }

    // Vérifier que le binaire existe
    if (!fs.existsSync(this.ytDlpWrap.getBinaryPath())) {
      throw new Error('Binaire yt-dlp introuvable: ' + this.ytDlpWrap.getBinaryPath());
    }
    
    // Télécharger le fichier complet avec plus d'options pour la stabilité
    const downloadArgs = [
      '--no-check-certificates',
      '--socket-timeout', '30',
      '--retries', '3',
      '-f', 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio',
      '-o', tempFile,
      actualUrl
    ];
    
    console.log('Arguments yt-dlp:', downloadArgs.join(' '));
    
    const downloadProcess = spawn(this.ytDlpWrap.getBinaryPath(), downloadArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    // Capturer les erreurs et la sortie
    let errorOutput = '';
    let stdOutput = '';
    
    downloadProcess.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      console.log('yt-dlp stderr:', message.trim());
    });

    downloadProcess.stdout.on('data', (data) => {
      const message = data.toString();
      stdOutput += message;
      console.log('yt-dlp stdout:', message.trim());
    });

    // Timeout de 5 minutes pour le téléchargement
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        downloadProcess.kill();
        reject(new Error('Timeout: Le téléchargement a pris trop de temps (5 min)'));
      }, 300000); // 5 minutes
    });

    const downloadPromise = new Promise((resolve, reject) => {
      downloadProcess.on('close', (code) => {
        console.log('yt-dlp terminé avec le code:', code);
        
        if (code === 0) {
          // Vérifier que le fichier a bien été créé
          if (fs.existsSync(tempFile)) {
            const stats = fs.statSync(tempFile);
            console.log('Fichier téléchargé, taille:', stats.size, 'bytes');
            
            if (stats.size > 0) {
              this.cachedAudioPath = tempFile;
              resolve();
            } else {
              reject(new Error('Le fichier téléchargé est vide'));
            }
          } else {
            reject(new Error('Le fichier n\'a pas été créé'));
          }
        } else {
          console.error('Code de sortie yt-dlp:', code);
          console.error('Erreur stderr:', errorOutput);
          console.error('Sortie stdout:', stdOutput);
          reject(new Error(`Échec du téléchargement (code: ${code}). ${errorOutput.slice(-300)}`));
        }
      });
      
      downloadProcess.on('error', (err) => {
        console.error('Erreur processus yt-dlp:', err);
        reject(new Error('Erreur de processus yt-dlp: ' + err.message));
      });
    });

    try {
      await Promise.race([downloadPromise, timeoutPromise]);
      return this.cachedAudioPath;
    } catch (error) {
      // Nettoyer le fichier partiel si il existe
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          console.error('Erreur suppression fichier partiel:', e);
        }
      }
      throw error;
    }
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
        // En production, essayer plusieurs emplacements probables (app.asar.unpacked etc.)
        const { app } = require('electron');
        const path = require('path');
        const appPath = app.getAppPath();

        const possiblePaths = [
          // Common locations when using asar/unpacked
          path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'ffmpeg.exe'),
          path.join(process.resourcesPath, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
          path.join(appPath, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
          path.join(__dirname, '..', '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
          // fallback to system ffmpeg
          'ffmpeg'
        ];

        const fsExists = require('fs').existsSync;
        ffmpegPath = possiblePaths.find(p => {
          try {
            // If entry is 'ffmpeg' treat as candidate
            if (p === 'ffmpeg') return false; // check system ffmpeg later
            return fsExists(p);
          } catch (e) {
            return false;
          }
        });

        // If no file found, try require('ffmpeg-static') which may point to unpacked binary
        if (!ffmpegPath) {
          try {
            const ff = require('ffmpeg-static');
            if (ff && fsExists(ff)) ffmpegPath = ff;
          } catch (e) {
            // ignore
          }
        }

        // If still not found, fallback to system ffmpeg (must be in PATH)
        if (!ffmpegPath) {
          ffmpegPath = 'ffmpeg';
        }
      }

      logger.log('Utilisation de FFmpeg:', ffmpegPath);
    } catch (error) {
      logger.error('Erreur lors de la résolution du chemin FFmpeg:', error);
      // Fallback sur ffmpeg système
      ffmpegPath = 'ffmpeg';
    }

    // Si ffmpegPath est un chemin absolu valide, ajouter son dossier au PATH pour que prism-media puisse le trouver
    try {
      const pathModule = require('path');
      const fsModule = require('fs');
      if (ffmpegPath && ffmpegPath !== 'ffmpeg' && fsModule.existsSync(ffmpegPath)) {
        const ffDir = pathModule.dirname(ffmpegPath);
        // Préserver l'ancien PATH
        const oldPath = process.env.PATH || process.env.Path || '';
        if (!oldPath.includes(ffDir)) {
          process.env.PATH = `${ffDir}${path.delimiter}${oldPath}`;
          logger.log('Ajout de FFmpeg au PATH:', ffDir);
        }
      }
    } catch (e) {
      logger.error('Erreur ajout FFmpeg au PATH:', e.message);
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
      this.sendLogToFrontend('🎵 Audio démarré - PLAYING');
      this.isPaused = false;
      this.isLoading = false;
      
      // Mettre à jour l'activité Discord avec le titre de la musique
      if (this.currentTrackInfo) {
        this.updateBotActivity(this.currentTrackInfo);
      }
    });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.sendLogToFrontend('⏹️ Audio terminé - IDLE');
      
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
      this.sendLogToFrontend('❌ Erreur du lecteur audio:', error.message);
      this.sendLogToFrontend('Stack trace:', error.stack);
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
      this.sendLogToFrontend('=== DÉBUT JOINANDPLAY ===');
      this.sendLogToFrontend('Guild:', guildId);
      this.sendLogToFrontend('Channel:', channelId);
      this.sendLogToFrontend('URL:', youtubeUrl);
      this.sendLogToFrontend('Platform:', selectedPlatform);
      
      this.isLoading = true;

      if (!this.discordManager.isReady()) throw new Error('Bot non connecté');
      if (!guildId || !channelId) throw new Error('Guild ou channel manquant');
      if (!youtubeUrl) throw new Error('URL YouTube manquante');

      // Vérifier que yt-dlp est prêt avant de continuer
      if (!this.ytDlpReady) {
        this.sendLogToFrontend('⚠️ yt-dlp pas prêt, tentative de réinitialisation...');
        await this.initYtDlp();
        if (!this.ytDlpReady) {
          throw new Error('yt-dlp n\'est pas disponible. Veuillez redémarrer l\'application.');
        }
      } else {
        this.sendLogToFrontend('✅ yt-dlp est prêt');
      }

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
      this.sendLogToFrontend('Récupération du canal vocal...');
      const channel = await this.discordManager.fetchChannel(channelId);
      if (!channel || !channel.isVoiceBased()) {
        throw new Error('Canal vocal invalide');
      }
      this.sendLogToFrontend('✅ Canal vocal récupéré');

      // Récupérer les informations de la vidéo
      this.sendLogToFrontend('Récupération des informations de la vidéo...');
      const { videoInfo, actualUrl } = await this.getVideoInfo(youtubeUrl, selectedPlatform);
      this.currentTrackInfo = videoInfo;
      this.sendLogToFrontend('✅ Infos vidéo récupérées:', videoInfo.title);

      // Créer la connexion vocale avec @discordjs/voice
      this.sendLogToFrontend('Création de la connexion vocale...');
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      this.currentConnection = connection;

      // Attendre que la connexion soit prête
      try {
        this.sendLogToFrontend('Attente de la connexion vocale...');
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        this.sendLogToFrontend('✅ Connexion vocale établie');
      } catch (error) {
        connection.destroy();
        throw new Error('Impossible de se connecter au canal vocal');
      }

      // Créer le lecteur audio
      this.sendLogToFrontend('Création du lecteur audio...');
      this.audioPlayer = createAudioPlayer();
      this.isPaused = false;

      // Vérifier si yt-dlp est prêt
      if (!this.ytDlpReady) {
        throw new Error('yt-dlp n\'est pas encore initialisé. Veuillez réessayer.');
      }

      // Télécharger le fichier audio
      this.sendLogToFrontend('📥 Téléchargement du fichier audio...');
      await this.downloadAudio(actualUrl);
      this.sendLogToFrontend('✅ Fichier audio téléchargé');

      // Créer le stream audio
      this.sendLogToFrontend('Création du stream audio avec FFmpeg...');
      const audioStream = this.createAudioStream();
      this.sendLogToFrontend('✅ Stream audio créé');

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
      this.sendLogToFrontend('Souscription du lecteur à la connexion...');
      connection.subscribe(this.audioPlayer);

      // Jouer la ressource
      this.sendLogToFrontend('▶️ Démarrage de la lecture...');
      this.audioPlayer.play(resource);

      this.sendLogToFrontend('=== ✅ JOINANDPLAY TERMINÉ AVEC SUCCÈS ===');
      return { ok: true, trackInfo: videoInfo, isLoading: true };
    } catch (err) {
      this.sendLogToFrontend('=== ❌ ERREUR JOINANDPLAY ===');
      this.sendLogToFrontend('Type d\'erreur:', err.constructor.name);
      this.sendLogToFrontend('Message:', err.message);
      this.sendLogToFrontend('Stack:', err.stack);
      
      this.isLoading = false;
      if (this.currentConnection) {
        this.currentConnection.destroy();
        this.currentConnection = null;
      }
      
      // Nettoyer les processus en cas d'erreur
      this.cleanup();
      
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