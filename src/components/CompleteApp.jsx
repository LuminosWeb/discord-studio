import { Fragment, useState } from 'react'
import Navbar from './Navbar'
import CustomSelect from './CustomSelect'
import MusicManager from './MusicManager'
import { Trash2 } from 'lucide-react';

function CompleteApp({ actions, state }) {
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'youtube', 'spotify'
    const handlePlayMusic = (track) => {
        if (state.isLoadingTrack) return;
        state.setMediaInput(track.url);
    }

    const handleDeleteTrack = (e, index) => {
        e.stopPropagation(); // Empêcher le clic de déclencher handlePlayMusic
        
        // Si on est dans une vue filtrée, on doit trouver l'index réel dans l'historique complet
        let realIndex = index;
        if (historyFilter !== 'all') {
            const filteredHistory = getFilteredHistory();
            const trackToDelete = filteredHistory[index];
            realIndex = state.musicHistory.findIndex(track => track.url === trackToDelete.url);
        }
        
        const newHistory = state.musicHistory.filter((_, i) => i !== realIndex);
        state.setMusicHistory(newHistory);
    }

    const getFilteredHistory = () => {
        if (historyFilter === 'all') {
            return state.musicHistory;
        }
        return state.musicHistory.filter(track => {
            const platform = getTypeByUrl(track.url);
            return platform === historyFilter;
        });
    }

    const getHistoryCount = (filter) => {
        if (filter === 'all') {
            return state.musicHistory.length;
        }
        return state.musicHistory.filter(track => {
            const platform = getTypeByUrl(track.url);
            return platform === filter;
        }).length;
    }

    const getTypeByUrl = (url) => {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            return "youtube";
        } else if (url.includes("spotify.com")) {
            return "spotify";
        }
        
        return null;
    }

    return (
        <Fragment>
            <Navbar user={{ name: state.userInfo.name, id: state.userInfo.id, avatar: state.userInfo.avatar, accountId: state.userInfo.accountId }} onLogout={actions.handleLogout} />

            <div className="app">
                <div className="flex md:flex-row flex-col flex-wrap gap-4 max-w-[90%] mx-auto">
                    <div className="flex flex-col gap-4">
                        <div className="discord-container min-w-[500px]">
                            <div className="w-fit mx-auto">
                                <i className="fa-brands fa-discord text-[60px]"></i>
                            </div>

                            <h1 className="text-3xl font-bold text-center mb-2 text-discord-text">Discord Music</h1>

                            <div className="music-controls">
                                <h3 className="text-lg font-medium text-discord-text">
                                    Sélection du serveur{" "}
                                    <sup className='font-normal text-sm text-indigo-300'>({state.guilds.length})</sup>
                                </h3>

                                <CustomSelect
                                    value={state.selectedGuild}
                                    onChange={(value) => state.setSelectedGuild(value)}
                                    options={[
                                        { value: '', label: 'Sélectionner un serveur' },
                                        ...state.guilds.map(g => ({ value: g.id, label: g.name }))
                                    ]}
                                    placeholder="Sélectionner un serveur"
                                    disabled={state.isLoadingTrack}
                                />

                                <h3 className="text-lg font-medium text-discord-text">
                                    Sélection du salon vocal{" "}
                                    <sup className='font-normal text-sm text-indigo-300'>({state.channels.length})</sup>
                                </h3>

                                <CustomSelect
                                    isVocalChannel={true}
                                    value={state.channelId}
                                    onChange={(value) => state.setChannelId(value)}
                                    options={[
                                        { value: '', label: 'Sélectionner un salon' },
                                        ...state.channels.map(c => ({ value: c.id, label: c.name }))
                                    ]}
                                    placeholder="Sélectionner un salon vocal"
                                    disabled={!state.selectedGuild || state.isLoadingTrack}
                                />

                                <h3 className="text-lg font-normal text-discord-text">Sélection de la plateforme</h3>

                                <div className="platform-selection">
                                    <div className="platform-buttons">
                                        <button
                                            className={`platform-button youtube ${state.selectedPlatform === 'youtube' ? 'active' : ''}`}
                                            onClick={() => state.setSelectedPlatform('youtube')}
                                            disabled={state.isLoadingTrack}
                                        >
                                            <i className="fab fa-youtube"></i>
                                            YouTube
                                        </button>
                                        <button
                                            className={`platform-button spotify ${state.selectedPlatform === 'spotify' ? 'active' : ''}`}
                                            onClick={() => state.setSelectedPlatform('spotify')}
                                            disabled={state.isLoadingTrack}
                                        >
                                            <i className="fab fa-spotify"></i>
                                            Spotify
                                        </button>
                                    </div>
                                </div>

                                <div className="control-row">
                                    <input
                                        type="text"
                                        value={state.mediaInput}
                                        onChange={(e) => state.setMediaInput(e.target.value)}
                                        placeholder={state.selectedPlatform === 'youtube' ? "URL YouTube (https://youtube.com/watch?v=...)" : "URL Spotify (track, playlist ou album)"}
                                        className="discord-input flex-1"
                                        disabled={state.isLoadingTrack}
                                    />
                                </div>

                                <div className="control-row">
                                    <button
                                        className="discord-button flex-1"
                                        onClick={state.currentTrack ? actions.handleTogglePause : actions.handlePlay}
                                        disabled={state.isLoadingTrack}
                                    >
                                        {state.isLoadingTrack ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin mr-2 animate-spin"></i>
                                                Chargement...
                                            </>
                                        ) : (
                                            <>
                                                <i className={`fas fa-${state.currentTrack ? (state.isPaused ? 'play' : 'pause') : 'play'} mr-2`}></i>
                                                {state.currentTrack ? (state.isPaused ? 'Reprendre' : 'Pause') : 'Lire'}
                                            </>
                                        )}
                                    </button>
                                    <button className="discord-button-danger flex-1" onClick={actions.handleStop} disabled={state.isLoadingTrack}>
                                        <i className="fas fa-stop mr-2"></i>Stop
                                    </button>
                                </div>
                            </div>
                        </div>

                        <MusicManager state={state} actions={actions} />
                    </div>

                {state.musicHistory.length > 0 ? (
                    <div className="h-full flex flex-col md:w-screen md:max-w-[500px] flex-1">
                        <div className="music-history flex-1 flex flex-col w-full">
                            <div className="history-header">
                                <h3 className="text-lg font-semibold text-discord-text mb-3">
                                    <i className="fas fa-history mr-2"></i>
                                    Historique ({getHistoryCount(historyFilter)})
                                </h3>
                                
                                {/* Boutons de filtrage */}
                                <div className="history-filter-buttons">
                                    <button
                                        className={`filter-button ${historyFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setHistoryFilter('all')}
                                    >
                                        <i className="fas fa-music mr-1"></i>
                                        Tout ({getHistoryCount('all')})
                                    </button>
                                    <button
                                        className={`filter-button youtube ${historyFilter === 'youtube' ? 'active' : ''}`}
                                        onClick={() => setHistoryFilter('youtube')}
                                    >
                                        <i className="fab fa-youtube mr-1"></i>
                                        YouTube ({getHistoryCount('youtube')})
                                    </button>
                                    <button
                                        className={`filter-button spotify ${historyFilter === 'spotify' ? 'active' : ''}`}
                                        onClick={() => setHistoryFilter('spotify')}
                                    >
                                        <i className="fab fa-spotify mr-1"></i>
                                        Spotify ({getHistoryCount('spotify')})
                                    </button>
                                </div>
                            </div>
                            
                            <div className="history-list flex-1">
                                {getFilteredHistory().map((track, index) => (
                                    <div key={index} className="history-item" onClick={() => handlePlayMusic(track)}>
                                        {getTypeByUrl(track.url) !== null ? (
                                            <div className={`history-platform-icon-container ${getTypeByUrl(track.url)}`}>
                                                {getTypeByUrl(track.url) === 'youtube' ? (
                                                    <i className="fab fa-youtube history-platform-icon"></i>
                                                ) : getTypeByUrl(track.url) === 'spotify' ? (
                                                    <i className="fab fa-spotify history-platform-icon"></i>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        <img src={track.thumbnail} alt={track.title} className="history-thumbnail" />

                                        <div className="history-details">
                                            <p className="history-title" title={track.title?.trim()}>{track.title}</p>

                                            {track.artist ? (
                                                <p className="history-artist" title={track.artist?.trim()}>@{track.artist}</p>
                                            ) : null}

                                            <p className="history-views">
                                                <i className="fas fa-eye mr-1"></i>
                                                {track.views?.toLocaleString("en")} vues
                                            </p>
                                        </div>

                                        <button 
                                            className="history-delete-btn"
                                            onClick={(e) => handleDeleteTrack(e, index)}
                                            title="Supprimer de l'historique"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
                </div>
            </div>
        </Fragment>
    )
}

export default CompleteApp