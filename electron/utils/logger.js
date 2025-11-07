const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    // Initialiser plus tard quand app sera disponible
    this.logFile = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    try {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      this.logFile = path.join(userDataPath, 'discord-studio.log');
      
      // Créer le fichier s'il n'existe pas
      if (!fs.existsSync(this.logFile)) {
        fs.writeFileSync(this.logFile, '');
      }
      
      this.initialized = true;
      this.log('=== Application démarrée ===');
      this.log('Fichier de logs:', this.logFile);
    } catch (error) {
      console.error('Erreur initialisation logger:', error);
    }
  }

  log(message, ...args) {
    // Toujours afficher dans la console
    console.log(message, ...args);
    
    // Initialiser si pas encore fait
    if (!this.initialized) {
      this.init();
    }
    
    if (!this.logFile) return;
    
    try {
      const timestamp = new Date().toISOString();
      const argsStr = args.map(a => {
        if (typeof a === 'object') {
          try {
            return JSON.stringify(a);
          } catch (e) {
            return String(a);
          }
        }
        return String(a);
      }).join(' ');
      
      const logMessage = `[${timestamp}] ${message} ${argsStr}\n`;
      
      // Écrire dans le fichier (de manière synchrone pour garantir l'ordre)
      fs.appendFileSync(this.logFile, logMessage);
    } catch (error) {
      console.error('Erreur écriture log:', error);
    }
  }

  error(message, ...args) {
    // Toujours afficher dans la console
    console.error(message, ...args);
    
    // Initialiser si pas encore fait
    if (!this.initialized) {
      this.init();
    }
    
    if (!this.logFile) return;
    
    try {
      const timestamp = new Date().toISOString();
      const argsStr = args.map(a => {
        if (typeof a === 'object') {
          try {
            return JSON.stringify(a);
          } catch (e) {
            return String(a);
          }
        }
        return String(a);
      }).join(' ');
      
      const logMessage = `[${timestamp}] ERROR: ${message} ${argsStr}\n`;
      
      fs.appendFileSync(this.logFile, logMessage);
    } catch (error) {
      console.error('Erreur écriture log error:', error);
    }
  }

  getLogPath() {
    if (!this.initialized) {
      this.init();
    }
    return this.logFile;
  }

  clearLogs() {
    if (!this.logFile) return;
    
    try {
      fs.writeFileSync(this.logFile, '');
      this.log('=== Logs effacés ===');
    } catch (error) {
      console.error('Erreur effacement logs:', error);
    }
  }
}

module.exports = new Logger();
