const path = require('path');
const { BrowserWindow, app, Tray, shell } = require('electron');
const logger = require('../utils/logger');

let tray;

function createWindow() {
  // Initialiser le logger
  logger.init();
  logger.log('Création de la fenêtre principale...');
  
  // Déterminer le chemin correct de l'icône selon l'environnement
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  
  // En développement, utiliser le dossier public
  // En production, utiliser le dossier extraResources
  const fs = require('fs');
  let iconPath;
  
  if (isDev) {
    iconPath = path.join(__dirname, '../../public/logo.ico');
  } else {
    // En production, essayer plusieurs chemins possibles
    const possiblePaths = [
      path.join(process.resourcesPath, 'public', 'logo.ico'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'public', 'logo.ico'),
      path.join(__dirname, '../../public/logo.ico'),
      path.join(app.getAppPath(), 'public', 'logo.ico'),
    ];
    
    // Trouver le premier chemin qui existe
    for (const testPath of possiblePaths) {
      logger.log('Test du chemin:', testPath);
      if (fs.existsSync(testPath)) {
        iconPath = testPath;
        logger.log('✅ Icône trouvée à:', testPath);
        break;
      } else {
        logger.log('❌ Icône non trouvée à:', testPath);
      }
    }
    
    // Si aucun chemin ne fonctionne, utiliser le premier par défaut
    if (!iconPath) {
      iconPath = possiblePaths[0];
      logger.error('⚠️ Aucune icône trouvée, utilisation du chemin par défaut:', iconPath);
    }
  }
  
  logger.log('Mode:', isDev ? 'développement' : 'production');
  logger.log('Chemin final de l\'icône:', iconPath);
  logger.log('process.resourcesPath:', process.resourcesPath);
  logger.log('app.getAppPath():', app.getAppPath());
  logger.log('__dirname:', __dirname);
  
  // Créer le tray avec l'icône .ico pour Windows
  try {
    tray = new Tray(iconPath);
    tray.setToolTip('Discord Studio');
    logger.log('Tray créé avec succès');
  } catch (error) {
    logger.error('Could not create tray:', error.message);
  }

  const win = new BrowserWindow({
    width: 1000,
    height: 900,
    minHeight: 900,
    minWidth: 1000,
    icon: iconPath,
    frame: false, // Supprime la barre système
    webPreferences: {
      preload: path.join(__dirname, "schema.js"),
      contextIsolation: true,
      nodeIntegration: true,
      enableHardwareAcceleration: true, // ✅ Active l'accélération matérielle
      webSecurity: true, // Nécessaire pour les modules ES6 en local
    },
  });
  
  // Forcer l'icône après la création de la fenêtre (pour Windows)
  if (process.platform === 'win32' && fs.existsSync(iconPath)) {
    win.setIcon(iconPath);
    logger.log('Icône forcée sur la fenêtre');
  }
  
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
  } else {
    logger.log('Mode production détecté');
    const appPath = app.getAppPath();
    const htmlPath = path.join(appPath, 'web-dist', 'index.html');
    logger.log('Chemin HTML:', htmlPath);
    win.loadFile(htmlPath);
  }
  
  logger.log('Fenêtre créée avec succès');
  logger.log('Raccourcis disponibles:');
  logger.log('  - Ctrl+Shift+L : Ouvrir le dossier des logs');
  logger.log('  - Ctrl+Shift+C : Effacer les logs');
}

module.exports = createWindow;