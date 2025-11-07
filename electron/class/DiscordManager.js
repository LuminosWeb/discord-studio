const { Client, GatewayIntentBits } = require("discord.js");

/**
 * Classe pour gérer le client Discord et les opérations associées
 */
class DiscordManager {
  constructor() {
    /** @type {Client | null} */
    this.client = null;
    this.isConnected = false;
    this.currentToken = null;
  }

  /**
   * Créer un nouveau client Discord
   * @returns {Client}
   */
  createClient() {
    return new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
      ]
    });
  }

  /**
   * Obtenir le client Discord actuel
   * @returns {Client | null}
   */
  getClient() {
    return this.client;
  }

  /**
   * Vérifier si le client est connecté
   * @returns {boolean}
   */
  isReady() {
    return this.client && this.client.isReady();
  }

  /**
   * Connecter le bot Discord avec un token
   * @param {string} botToken - Token du bot Discord
   * @returns {Promise<{ok: boolean, guilds?: Array, accountId?: string, accountName?: string, avatar?: string, message?: string}>}
   */
  async login(botToken) {
    try {
      console.log('Backend botLogin appelé avec token:', botToken ? botToken.substring(0, 10) + '...' : 'null');
      
      if (!botToken) {
        console.error('Token manquant dans botLogin backend');
        throw new Error('Bot token manquant');
      }

      console.log('Vérification du client existant...');
      
      // Si le client est déjà connecté avec le même token, le réutiliser
      if (this.client && this.isReady() && this.currentToken === botToken) {
        console.log('Réutilisation du client existant (même token)');
        
        // Pas besoin de se reconnecter, passer directement à la récupération des guilds
      } else {
        // Déconnecter proprement l'ancien client s'il existe avec un token différent
        if (this.client) {
          console.log('Destruction du client existant (token différent)');
          try {
            // Détruire le client
            await this.client.destroy();
            console.log('Client détruit avec succès');
          } catch (destroyError) {
            console.error('Erreur lors de la destruction du client:', destroyError);
          }
        }
        
        // Créer un nouveau client complètement frais
        console.log('Création d\'un nouveau client Discord...');
        this.client = this.createClient();
        this.currentToken = botToken;

        console.log('Tentative de connexion Discord...');
        await this.client.login(botToken);
        console.log('Connexion Discord réussie, attente que le client soit prêt...');

        // Attendre que le client soit prêt avec timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log('Timeout atteint - Client status:', {
              isReady: this.client.isReady(),
              guildsCount: this.client.guilds.cache.size,
              status: this.client.ws.status
            });
            reject(new Error('Timeout lors de l\'initialisation du client Discord'));
          }, 15000); // 15 secondes de timeout

          const onClientReady = () => {
            console.log('Client prêt via événement clientReady');
            clearTimeout(timeout);
            // Attendre un peu que tous les guilds se chargent
            setTimeout(() => {
              console.log('Client final - guilds:', this.client.guilds.cache.size);
              this.isConnected = true;
              resolve();
            }, 2000);
          };

          // Si le client est déjà prêt
          if (this.client.isReady()) {
            console.log('Client déjà prêt immédiatement');
            clearTimeout(timeout);
            this.isConnected = true;
            resolve();
          } else {
            console.log('En attente de clientReady...');
            this.client.once('clientReady', onClientReady);
          }
        });
      }

      console.log('Client Discord prêt, récupération des guilds...');
      const guilds = this.client.guilds.cache.map(guild => ({ 
        id: guild.id, 
        name: guild.name
      }));

      console.log(`${guilds.length} guilds trouvées pour l'utilisateur ${this.client.user.username}`);

      const result = {
        ok: true,
        guilds,
        accountId: this.client.user.id,
        accountName: this.client.user.username,
        avatar: this.client.user.displayAvatarURL()
      };

      console.log('botLogin backend réussi, retour:', result);
      return result;
    } catch (err) {
      console.error('Erreur dans botLogin backend:', err);
      await this.logout();
      const errorResult = { ok: false, message: err.message };
      console.log('botLogin backend échoué, retour:', errorResult);
      return errorResult;
    }
  }

  /**
   * Obtenir les canaux vocaux d'un serveur
   * @param {string} guildId - ID du serveur Discord
   * @returns {Promise<{ok: boolean, channels?: Array, message?: string}>}
   */
  async getGuildChannels(guildId) {
    if (!this.client || !this.client.user) {
      return { ok: false, message: 'Bot non connecté' };
    }

    try {
      const guild = await this.client.guilds.fetch(guildId);
      const channels = (await guild.channels.fetch())
        .filter(c => c && c.isVoiceBased())
        .map(c => ({ id: c.id, name: c.name, type: c.type }));
      return { ok: true, channels };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  /**
   * Récupérer un canal Discord par son ID
   * @param {string} channelId - ID du canal
   * @returns {Promise<any>}
   */
  async fetchChannel(channelId) {
    if (!this.client) {
      throw new Error('Client Discord non connecté');
    }
    return await this.client.channels.fetch(channelId);
  }

  /**
   * Déconnecter le bot Discord
   * @returns {Promise<{ok: boolean, message?: string}>}
   */
  async logout() {
    try {
      if (this.client && this.isReady()) {
        await this.client.destroy();
        console.log('Client Discord déconnecté avec succès');
      }
      
      this.client = null;
      this.isConnected = false;
      this.currentToken = null;
      
      return { ok: true };
    } catch (err) {
      console.error('Erreur lors de la déconnexion Discord:', err);
      this.client = null;
      this.isConnected = false;
      this.currentToken = null;
      return { ok: false, message: err.message };
    }
  }

  /**
   * Mettre à jour l'activité du bot Discord
   * @param {Object|null} trackInfo - Informations de la piste en cours ou null pour arrêter l'activité
   */
  async updateBotActivity(trackInfo = null) {
    try {
      if (!this.client || !this.client.user) return;

      if (trackInfo && trackInfo.title) {
        // Créer le texte d'activité avec titre et artiste
        const activityText = trackInfo.artist && trackInfo.artist !== 'Artiste inconnu' 
          ? `${trackInfo.title} - ${trackInfo.artist}`
          : trackInfo.title;
        
        // Définir l'activité "Écoute" avec le titre et l'artiste
        const { ActivityType } = require("discord.js");
        await this.client.user.setActivity(activityText, { 
          type: ActivityType.Listening,
          name: activityText
        });
        console.log(`Activité mise à jour: Écoute ${activityText}`);
      } else {
        // Supprimer l'activité
        await this.client.user.setActivity(null);
        console.log('Activité supprimée');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'activité:', error);
    }
  }

  /**
   * Obtenir les informations utilisateur du bot
   * @returns {Object|null}
   */
  getBotInfo() {
    if (!this.client || !this.client.user) {
      return null;
    }

    return {
      id: this.client.user.id,
      username: this.client.user.username,
      avatar: this.client.user.displayAvatarURL(),
      discriminator: this.client.user.discriminator
    };
  }

  /**
   * Obtenir la liste des serveurs du bot
   * @returns {Array}
   */
  getGuilds() {
    if (!this.client) {
      return [];
    }

    return this.client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      memberCount: guild.memberCount
    }));
  }
}

module.exports = DiscordManager;