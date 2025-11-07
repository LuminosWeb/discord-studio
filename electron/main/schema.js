
const { contextBridge, ipcRenderer } = require('electron');

const exposes = {
  botLogin: (token) => ipcRenderer.invoke('bot-login', token),
  botLogout: () => ipcRenderer.invoke('bot-logout'),
  getGuildChannels: (guildId) => ipcRenderer.invoke('get-guild-channels', guildId),
  joinAndPlay: (guildId, channelId, youtubeUrl, platform) => ipcRenderer.invoke('join-and-play', guildId, channelId, youtubeUrl, platform),
  leaveVoice: () => ipcRenderer.invoke('leave-voice'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  togglePause: () => ipcRenderer.invoke('toggle-pause'),
  getCurrentTrack: () => ipcRenderer.invoke('get-current-track'),
  setVolume: (volume) => ipcRenderer.invoke('set-volume', volume),
  setAudioMode: (mode) => ipcRenderer.invoke('set-audio-mode', mode),
  getAudioModes: () => ipcRenderer.invoke('get-audio-modes'),
  seekTo: (timeInSeconds) => ipcRenderer.invoke('seek-to', timeInSeconds),
  setLooping: (isLooping) => ipcRenderer.invoke('set-looping', isLooping),

  // Event listeners
  onTrackEnded: (callback) => ipcRenderer.on('track-ended', callback),
  removeTrackEndedListener: (callback) => ipcRenderer.removeListener('track-ended', callback),

  // manage window actions
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
}

contextBridge.exposeInMainWorld('electronAPI', exposes);