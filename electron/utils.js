const { shell, BrowserWindow } = require('electron');
const DiscordManager = require('./class/DiscordManager');
const MusicManager = require('./class/MusicManager');

// Instance globale du gestionnaire Discord
const discordManager = new DiscordManager();

// Instance globale du gestionnaire de musique
const musicManager = new MusicManager(discordManager);

// Initialiser yt-dlp au chargement du module (pour compatibilité)
const initYtDlp = async () => {
  await musicManager.initYtDlp();
};

initYtDlp();

/** 
  @param {Electron.IpcMainEvent} event
*/
const leaveVoice = async (event) => {
  return await musicManager.leaveVoice();
}

/**
    @param {Electron.IpcMainEvent} event
    @param {string} url
*/
const openExternal = async (event, url) => {
  try {
    await shell.openExternal(url);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/**
    @param {Electron.IpcMainEvent} event
    @param {string} guildId
    @param {string} channelId
    @param {string} youtubeUrl
*/
const JoinAndPlay = async (event, guildId, channelId, youtubeUrl, selectedPlateform) => {
  return await musicManager.joinAndPlay(guildId, channelId, youtubeUrl, selectedPlateform);
}

/**
    @param {Electron.IpcMainEvent} event
    @param {string} guildId
*/
const GetGuildChannels = async (event, guildId) => {
  return await discordManager.getGuildChannels(guildId);
}

/**
    @param {Electron.IpcMainEvent} event
    @param {string} botToken
*/
const botLogin = async (event, botToken) => {
  return await discordManager.login(botToken);
}

/**
  @param {Electron.IpcMainEvent} event
*/
const togglePause = async (event) => {
  return await musicManager.togglePause();
}

/**
  @param {Electron.IpcMainEvent} event
*/
const getCurrentTrack = async (event) => {
  return musicManager.getCurrentTrack();
}

/**
  @param {Electron.IpcMainEvent} event
  @param {string} mode
*/
const setAudioMode = async (event, mode) => {
  return await musicManager.setAudioMode(mode);
}

/**
  @param {Electron.IpcMainEvent} event
*/
const getAudioModes = async (event) => {
  return musicManager.getAudioModes();
}

/**
  @param {Electron.IpcMainEvent} event
  @param {number} volume
*/
const setVolume = async (event, volume) => {
  return await musicManager.setVolume(volume);
}

/**
  @param {Electron.IpcMainEvent} event
  @param {number} timeInSeconds
*/
const seekTo = async (event, timeInSeconds) => {
  return await musicManager.seekTo(timeInSeconds);
}

/**
  @param {Electron.IpcMainEvent} event
*/
const windowMinimize = async (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
};

/**
  @param {Electron.IpcMainEvent} event
*/
const windowMaximize = async (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
};

/**
  @param {Electron.IpcMainEvent} event
*/
const windowClose = async (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
}

/**
  @param {Electron.IpcMainEvent} event
*/
const botLogout = async (event) => {
  try {
    // Réinitialiser le gestionnaire de musique
    await musicManager.leaveVoice();
    
    // Déconnecter le bot Discord
    await discordManager.logout();
    
    return { ok: true };
  } catch (err) {
    console.error('Erreur lors de la déconnexion:', err);
    return { ok: false, message: err.message };
  }
}

/**
 * Définir l'état de la boucle
 * @param {Electron.IpcMainEvent} event
 * @param {boolean} looping
 */
const setLooping = async (event, looping) => {
  return musicManager.setLooping(looping);
}

module.exports = {
  leaveVoice,
  openExternal,
  JoinAndPlay,
  GetGuildChannels,
  botLogin,
  botLogout,
  togglePause,
  getCurrentTrack,
  setVolume,
  setAudioMode,
  getAudioModes,
  seekTo,
  setLooping,
  windowMinimize,
  windowMaximize,
  windowClose
};