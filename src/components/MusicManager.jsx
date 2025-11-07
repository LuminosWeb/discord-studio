import { useRef, useState, useEffect } from 'react';
import { Repeat } from 'lucide-react';
import CustomSelect from './CustomSelect';

function MusicManager({ state, actions }) {
    const seekTimeoutRef = useRef(null);
    const [hoverTime, setHoverTime] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleSeek = (e) => {
        if (!state.currentTrack) return;
        
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = Math.floor(percentage * state.currentTrack.duration);
        
        // Mettre à jour immédiatement l'interface
        state.setCurrentTime(newTime);
        
        // Debounce l'appel au backend
        if (seekTimeoutRef.current) {
            clearTimeout(seekTimeoutRef.current);
        }
        
        seekTimeoutRef.current = setTimeout(() => {
            actions.handleSeek(newTime);
            setIsDragging(false);
        }, 1000);
    };

    const handleMouseMove = (e) => {
        if (!state.currentTrack) return;
        
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, mouseX / rect.width));
        const time = Math.floor(percentage * state.currentTrack.duration);
        
        setHoverTime(time);
    };

    const handleMouseDown = (e) => {
        if (!state.currentTrack) return;
        setIsDragging(true);
        handleSeek(e);
    };

    const handleMouseUp = (e) => {
        if (isDragging && state.currentTrack) {
            handleSeek(e);
        }
    };

    const handleMouseLeave = () => {
        setHoverTime(null);
    };

    // Nettoyer le timeout au démontage
    useEffect(() => {
        return () => {
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
            }
        };
    }, []);

    // Valeurs par défaut si pas de musique
    const track = state.currentTrack || {
        title: 'Aucune musique',
        thumbnail: 'https://via.placeholder.com/480x270/2f3136/ffffff?text=Aucune+musique',
        views: 0,
        duration: 0
    };

    const currentTime = state.currentTrack ? state.currentTime : 0;
    const duration = state.currentTrack ? state.currentTrack.duration : 0;
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="relative current-track-info">
            {state.currentTrack ? (
                <img 
                    src={track.thumbnail} 
                    alt={track.title} 
                    className="track-thumbnail"
                    style={{ opacity: state.currentTrack ? 1 : 0.5 }}
                />
            ) : (
                <div className="track-thumbnail centered-no-track">
                    <span className="no-track-text">Aucune musique<br/>en cours</span>
                </div>
            )}

            <div className="absolute top-0 right-2 playback-controls z-[50]">
                {/* Bouton de boucle */}
                <button
                    className={`loop-button ${state.isLooping ? 'active' : ''}`}
                    onClick={actions.handleToggleLoop}
                    title={state.isLooping ? 'Désactiver la boucle' : 'Activer la boucle'}
                    disabled={!state.currentTrack}
                    style={{ 
                        opacity: state.currentTrack ? 1 : 0.5,
                        cursor: state.currentTrack ? 'pointer' : 'not-allowed'
                    }}
                >
                    <Repeat size={16} />
                </button>
            </div>

            <div className="relative track-details">
                <h4 className={`track-title ${state.currentTrack ? 'has-link' : ''}`} onClick={() => state.currentTrack ? window.electronAPI?.openExternal(track.url) : null} title={`${track.title} - ${track.artist}`}>
                    {track.title}
                </h4>
                {track.artist ? <p className="track-artist">@{track.artist}</p> : null}
                <p className="track-views">
                    <i className="fas fa-eye mr-1"></i>
                    {track.views?.toLocaleString("en")} vues
                </p>

                {/* Barre de progression */}
                <div className="progress-container">
                    <span className="progress-time">{state.formatTime(currentTime)}</span>
                    <div 
                        className="progress-bar-wrapper" 
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        style={{ cursor: state.currentTrack ? 'pointer' : 'not-allowed', opacity: state.currentTrack ? 1 : 0.5 }}
                    >
                        <div className="progress-bar">
                            <div
                                className={`progress-bar-fill ${isDragging ? 'no-transition' : ''}`}
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        {hoverTime !== null && state.currentTrack && (
                            <div 
                                className="progress-hover-time"
                                style={{ left: `${(hoverTime / duration) * 100}%` }}
                            >
                                {state.formatTime(hoverTime)}
                            </div>
                        )}
                    </div>
                    <span className="progress-time">{state.formatTime(duration)}</span>
                </div>

                {/* Contrôle de volume */}
                <div className="volume-container">
                    <i className={`fas fa-volume-${state.volume === 0 ? 'mute' : state.volume < 0.5 ? 'down' : 'up'} volume-icon`}></i>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={state.volume}
                        onChange={(e) => actions.handleVolumeChange(parseFloat(e.target.value))}
                        className="volume-slider"
                        style={{ '--volume-percent': `${state.volume * 100}%` }}
                    />
                    <span className="volume-percentage">{Math.round(state.volume * 100)}%</span>
                </div>

                {/* Sélecteur de mode audio */}
                <div className="audio-mode-container">
                    <i className="fas fa-sliders-h audio-mode-icon"></i>
                    <CustomSelect
                        value={state.currentAudioMode}
                        onChange={(value) => actions.handleAudioModeChange(value)}
                        options={state.audioModes}
                        placeholder="Mode audio"
                        dropdownPosition="top"
                        height={37}
                    />
                </div>
            </div>
        </div>
    );
}

export default MusicManager;
