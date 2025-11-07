const path = require('path');
const { BrowserWindow, app, Tray } = require('electron');

let tray;

function createWindow() {
  // Créer le tray seulement si l'icône existe
  const trayIconPath = path.join(__dirname, "../", "../", "public/logo.png");
  try {
    tray = new Tray(trayIconPath);
  } catch (error) {
    console.log('Could not create tray:', error.message);
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
  
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // En production, charger le fichier HTML depuis le dossier web-dist
    // Utiliser app.getAppPath() pour obtenir le bon chemin même dans une archive asar
    const appPath = app.getAppPath();
    const htmlPath = path.join(appPath, 'web-dist', 'index.html');
    win.loadFile(htmlPath);
  }
}

module.exports = createWindow;