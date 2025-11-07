// main.js
const { app, ipcMain } = require('electron');
const createWindow = require('./window');
const { leaveVoice, openExternal, JoinAndPlay, GetGuildChannels, botLogin, botLogout, togglePause, getCurrentTrack, setVolume, setAudioMode, getAudioModes, seekTo, setLooping, windowMinimize, windowMaximize, windowClose } = require('../utils');

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