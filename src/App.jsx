import { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import CompleteApp from "./components/CompleteApp";
import useLocalStorage from "use-local-storage";
import { formatTime } from "./utils/time";

const App = () => {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState("");
  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState("");
  const [mediaInput, setMediaInput] = useState("");
  const [playMessage, setPlayMessage] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useLocalStorage("platform", "youtube");
  const [isLogLoading, setIsLogLoading] = useState(false);
  const [accountHistory, setAccountHistory] = useLocalStorage("accounts", []);
  const [musicHistory, setMusicHistory] = useLocalStorage("musicHistory", []);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [audioModes, setAudioModes] = useState([]);
  const [currentAudioMode, setCurrentAudioMode] = useState('normal');
  const [isLooping, setIsLooping] = useState(false);

  // Récupérer les modes audio au chargement
  useEffect(() => {
    const fetchAudioModes = async () => {
      const res = await window.electronAPI.getAudioModes();
      if (res.ok) {
        setAudioModes(res.modes);
      }
    };
    fetchAudioModes();
  }, []);

  // Récupérer les salons vocaux quand un serveur est sélectionné
  useEffect(() => {
    const fetchChannels = async () => {
      if (!selectedGuild) {
        setChannels([]);
        setChannelId("");
        return;
      }

      const res = await window.electronAPI.getGuildChannels(selectedGuild);
      if (res.ok) {
        setChannels(res.channels);
        // Réinitialiser le channel sélectionné
        setChannelId("");
      } else {
        setChannels([]);
        setChannelId("");
      }
    };

    fetchChannels();
  }, [selectedGuild]);

  // Écouter l'événement de fin de musique
  useEffect(() => {
    const handleTrackEnded = () => {
      console.log('Musique terminée - nettoyage du frontend');
      setCurrentTrack(null);
      setCurrentTime(0);
      setIsPaused(false);
      setIsLoadingTrack(false);
      setPlayMessage('Lecture terminée.');
    };

    window.electronAPI.onTrackEnded(handleTrackEnded);

    return () => {
      window.electronAPI.removeTrackEndedListener(handleTrackEnded);
    };
  }, []);

  // Mettre à jour le temps actuel toutes les secondes
  useEffect(() => {
    if (!currentTrack || isLoadingTrack) return;

    const interval = setInterval(async () => {
      const res = await window.electronAPI.getCurrentTrack();
      if (res.ok) {
        if (res.trackInfo) {
          // Mettre à jour le temps seulement si pas en pause
          if (!res.isPaused) {
            setCurrentTime(res.currentTime);
          }
          setIsPaused(res.isPaused);

          // Mettre à jour le mode audio
          if (res.audioMode) {
            setCurrentAudioMode(res.audioMode);
          }
        } else {
          setCurrentTrack(null);
          setCurrentTime(0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTrack, isLoadingTrack]);

  useEffect(() => {
    if (mediaInput.trim().includes("spotify.com")) {
      setSelectedPlatform("spotify");
    } else if (mediaInput.trim().includes("youtube.com") || mediaInput.trim().includes("youtu.be")) {
      setSelectedPlatform("youtube");
    }
  }, [mediaInput, selectedPlatform]);

  const showError = (msg) => {
    setError(msg);
  };

  const botLogin = async (token) => {
    console.log("botLogin appelé avec token:", token.substring(0, 10) + "...");
    
    if (!window.electronAPI || !window.electronAPI.botLogin) {
      console.error("API Electron non disponible");
      return { ok: false, message: "API Electron non disponible" };
    }

    try {
      console.log("Appel de window.electronAPI.botLogin...");
      const res = await window.electronAPI.botLogin(token);
      console.log("Réponse complète de botLogin:", res);
      
      if (!res) {
        console.error("Réponse null/undefined du backend");
        return { ok: false, message: "Aucune réponse du serveur" };
      }
      
      // Retourner la réponse telle quelle, qu'elle soit ok ou pas
      return res;
      
    } catch (error) {
      console.error("Erreur dans l'appel botLogin:", error);
      return { ok: false, message: "Erreur de communication: " + error.message };
    }
  };

  const loginWithToken = async (tokenToUse) => {
    try {
      console.log("Tentative de connexion avec botLogin...");
      const res = await botLogin(tokenToUse);
      
      if (!res) {
        console.error("botLogin a retourné null/undefined");
        showError("Erreur de connexion - Aucune réponse du serveur");
        setIsLogLoading(false);
        return;
      }

      if (!res.ok) {
        console.error("Connexion échouée:", res.message);
        showError("Connexion échouée : " + (res.message || "Token invalide"));
        setIsLogLoading(false);
        return;
      }

      console.log("Connexion réussie, res:", res);

      const user = {
        name: res.accountName,
        accountId: res.accountId,
        avatar: res.avatar,
        id: `${res.guilds.length} Serveurs`,
      }

      console.log("Connexion réussie, mise à jour des états...", user);

      // Mettre à jour l'historique des comptes avec les nouvelles informations
      setAccountHistory(prevHistory => {
        const filteredHistory = prevHistory.filter(acc => acc.token !== tokenToUse);
        return [{ token: tokenToUse, ...user }, ...filteredHistory];
      });

      // Mettre à jour les états de l'application
      setIsLoggedIn(true);
      setUserInfo(user);
      setGuilds(res.guilds);
      setError("");
      
      console.log("États mis à jour, arrêt du chargement");
      setIsLogLoading(false);
      
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      showError("Erreur inattendue lors de la connexion: " + error.message);
      setIsLogLoading(false);
    }
  };

  const handleConnect = (currentToken) => {
    const trimmedToken = (currentToken || token).trim();

    if (!trimmedToken || trimmedToken.length === 0) {
      showError("Veuillez entrer un token valide.");
      setIsLogLoading(false); // Arrêter le chargement si token invalide
      return;
    }

    // Éviter les connexions multiples en vérifiant si on est déjà en train de se connecter
    if (isLogLoading) {
      console.log("Connexion déjà en cours, ignore la demande");
      return;
    }

    console.log("Démarrage de la connexion avec le token:", trimmedToken.substring(0, 10) + "...");

    setIsLogLoading(true); // Démarrer le chargement
    setError(""); // Réinitialiser les erreurs
    setToken(trimmedToken); // Mettre à jour le token d'état

    // Appeler directement loginWithToken sans modification de l'historique ici
    // L'historique sera mis à jour dans loginWithToken une fois la connexion réussie
    loginWithToken(trimmedToken);
  };

  const handlePlay = async () => {
    if (!selectedGuild || !channelId || !mediaInput) {
      setPlayMessage("Champs manquants.");
      return;
    }

    console.log("selectedGuild, channelId, mediaInput, selectedPlatform", selectedGuild, channelId, mediaInput, selectedPlatform);

    setIsLoadingTrack(true);
    setPlayMessage("Chargement de la musique...");

    const res = await window.electronAPI.joinAndPlay(selectedGuild, channelId, mediaInput, selectedPlatform);

    if (res.ok) {
      setMediaInput(""); // Réinitialiser l'input

      // Ajouter à l'historique si c'est YouTube
      if (res.trackInfo) {
        setCurrentTrack(res.trackInfo);
        setCurrentTime(0);
        setMusicHistory([res.trackInfo, ...musicHistory.filter(t => t.url !== res.trackInfo.url).slice(0, 19)]);
        setPlayMessage("Lecture démarrée 🎵");
        setIsLoadingTrack(false);
      }
    } else {
      setPlayMessage("Erreur : " + res.message);
      setIsLoadingTrack(false);
    }
  };

  const handleStop = async () => {
    await window.electronAPI.leaveVoice();
    setPlayMessage("Lecture arrêtée.");
    setCurrentTrack(null);
    setIsPaused(false);
    setCurrentTime(0);
    setIsLoadingTrack(false);
    setIsLooping(false);
  };

  const handleTogglePause = async () => {
    const res = await window.electronAPI.togglePause();
    if (res.ok) {
      setIsPaused(res.isPaused);
    }
  };

  const handleVolumeChange = async (newVolume) => {
    setVolume(newVolume);
    await window.electronAPI.setVolume(newVolume);
  };

  const handleAudioModeChange = async (mode) => {
    setCurrentAudioMode(mode);
    const res = await window.electronAPI.setAudioMode(mode);
    if (res.ok) {
      if (res.restarted) {
        setPlayMessage(`Mode changé : ${mode} (musique redémarrée)`);
      } else {
        setPlayMessage(`Mode sélectionné : ${mode} (s'appliquera à la prochaine musique)`);
      }
    }
  };

  const handleSeek = async (timeInSeconds) => {
    await window.electronAPI.seekTo(timeInSeconds);
  };

  const handleToggleLoop = async () => {
    const newLoopingState = !isLooping;
    setIsLooping(newLoopingState);
    
    // Informer le backend de l'état de la boucle
    const res = await window.electronAPI.setLooping(newLoopingState);
    if (res.ok) {
      console.log('État de boucle mis à jour:', newLoopingState);
    } else {
      console.error('Erreur lors de la mise à jour de la boucle:', res.message);
    }
  };

  const handleLogout = async () => {
    // Déconnecter le bot côté backend
    await window.electronAPI.botLogout();
    
    // Réinitialiser tous les états frontend
    setIsLoggedIn(false);
    setUserInfo(null);
    setGuilds([]);
    setChannels([]);
    setSelectedGuild("");
    setChannelId("");
    setToken("");
    setError("");
    setPlayMessage("");
    setIsLogLoading(false);
    setCurrentTrack(null);
    setIsPaused(false);
    setCurrentTime(0);
    setIsLoadingTrack(false);
    setIsLooping(false);
  };

  const actions = {
    handlePlay, 
    handleStop, 
    handleLogout, 
    handleTogglePause, 
    handleVolumeChange, 
    handleAudioModeChange, 
    handleSeek,
    handleToggleLoop
  };

  const states = {
    guilds,
    selectedGuild,
    setSelectedGuild,
    channels,
    channelId,
    setChannelId,
    mediaInput,
    setMediaInput,
    playMessage,
    selectedPlatform,
    userInfo,
    setSelectedPlatform,
    musicHistory,
    setMusicHistory,
    currentTrack,
    isPaused,
    volume,
    currentTime,
    setCurrentTime,
    formatTime,
    isLoadingTrack,
    audioModes,
    currentAudioMode,
    isLooping,
  };

  if (isLoggedIn) {
    return <CompleteApp
      actions={actions}
      state={states}
    />;
  } else {
    return <LoginPage
      isLoading={isLogLoading}
      error={error}
      setError={setError}
      token={token}
      setToken={setToken}
      handleConnect={handleConnect}
      cancelLoading={() => setIsLogLoading(false)}
      deleteAccountWithToken={(tokenToDelete) => {
        const updatedAccounts = accountHistory.filter(acc => acc.token !== tokenToDelete);
        setAccountHistory(updatedAccounts);
      }}
      accounts={{ accountHistory, setAccountHistory }}
    />;
  }

};

export default App;