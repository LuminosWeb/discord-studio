// main.js
const { app, ipcMain } = require('electron');
const path = require('path');
const createWindow = require('./window');
const { leaveVoice, openExternal, JoinAndPlay, GetGuildChannels, botLogin, botLogout, togglePause, getCurrentTrack, setVolume, setAudioMode, getAudioModes, seekTo, setLooping, windowMinimize, windowMaximize, windowClose } = require('../utils');

// Définir l'icône de l'application pour Windows
if (process.platform === 'win32') {
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  const iconPath = isDev 
    ? path.join(__dirname, '../../public/logo.ico')
    : path.join(process.resourcesPath, 'public', 'logo.ico');
  
  app.setAppUserModelId('com.discord.studio');
  // Note: l'icône dans la taskbar est définie par l'exe lui-même via electron-builder
}

app.whenReady().then(createWindow);

const listeners = [
    ['bot-login', botLogin],
    ['bot-logout', botLogout],
    ['get-guild-channels', GetGuildChannels],
    ['join-and-play', JoinAndPlay],
    ['leave-voice', leaveVoice],
    ['open-external', openExternal],
    ['toggle-pause', togglePause],
    ['get-current-track', getCurrentTrack],
    ['set-volume', setVolume],
    ['set-audio-mode', setAudioMode],
    ['get-audio-modes', getAudioModes],
    ['seek-to', seekTo],
    ['set-looping', setLooping],

    // default
    ['window-minimize', windowMinimize],
    ['window-maximize', windowMaximize],
    ['window-close', windowClose],
]

for (const [channel, handler] of listeners) {
    ipcMain.handle(channel, handler);
}