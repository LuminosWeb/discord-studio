const path = require('path');
const { BrowserWindow, app, Tray, shell } = require('electron');
const logger = require('../utils/logger');

let tray;

function createWindow() {
  // Initialiser le logger
  logger.init();
  logger.log('Création de la fenêtre principale...');
  
  // Créer le tray seulement si l'icône existe
  const trayIconPath = path.join(__dirname, "../", "../", "public/logo.png");
  try {
    tray = new Tray(trayIconPath);
    logger.log('Tray créé avec succès');
  } catch (error) {
    logger.error('Could not create tray:', error.message);
  }

  const win = new BrowserWindow({
    width: 1000,
    height: 900,
    minHeight: 900,
    minWidth: 1000,
    icon: path.join(__dirname, "../", "../", "public/logo.ico"),
    frame: false, // Supprime la barre système
    webPreferences: {
      preload: path.join(__dirname, "schema.js"),
      contextIsolation: true,
      nodeIntegration: true,
      enableHardwareAcceleration: true, // ✅ Active l'accélération matérielle
      webSecurity: true, // Nécessaire pour les modules ES6 en local
    },
  });
  
  // En développement, charger depuis le serveur Vite
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  // 🔥 Désactive le double-clic sur la title bar
  win.on("system-context-menu", (event) => event.preventDefault());
  
  // Raccourci pour ouvrir le dossier des logs (Ctrl+Shift+L)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'l') {
      const logPath = logger.getLogPath();
      if (logPath) {
        logger.log('Ouverture du dossier des logs...');
        shell.showItemInFolder(logPath);
      }
      event.preventDefault();
    }
    
    // Raccourci pour effacer les logs (Ctrl+Shift+C)
    if (input.control && input.shift && input.key.toLowerCase() === 'c') {
      logger.clearLogs();
      logger.log('Logs effacés par l\'utilisateur');
      event.preventDefault();
    }
  });
  
  if (isDev) {
    logger.log('Mode développement détecté');
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    logger.log('Mode production détecté');
    // En production, charger le fichier HTML depuis le dossier web-dist
    // Utiliser app.getAppPath() pour obtenir le bon chemin même dans une archive asar
    const appPath = app.getAppPath();
    const htmlPath = path.join(appPath, 'web-dist', 'index.html');
    logger.log('Chemin HTML:', htmlPath);
    win.loadFile(htmlPath);
    
    // Ouvrir la console en production pour déboguer
    win.webContents.openDevTools();
  }
  
  logger.log('Fenêtre créée avec succès');
  logger.log('Raccourcis disponibles:');
  logger.log('  - Ctrl+Shift+L : Ouvrir le dossier des logs');
  logger.log('  - Ctrl+Shift+C : Effacer les logs');
}

module.exports = createWindow;