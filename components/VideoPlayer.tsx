import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, ArrowLeft, Server, X } from 'lucide-react';
import { Anime, Episode, ServerOption } from '../types';
import { SERVERS } from '../constants';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
  anime: Anime;
  episode: Episode;
  onClose: () => void;
  onNextEpisode?: () => void;
}

const FALLBACK_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";

const VideoPlayer: React.FC<VideoPlayerProps> = ({ anime, episode, onClose, onNextEpisode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [currentServer, setCurrentServer] = useState<ServerOption>(SERVERS[0]);
  
  // Feature State
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showNextEpButton, setShowNextEpButton] = useState(false);
  const [nextEpCountdown, setNextEpCountdown] = useState(10);
  const [showGesture, setShowGesture] = useState<'forward' | 'rewind' | null>(null);
  
  const controlsTimeoutRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  // FIX: Use getHistory selector to get user-specific watch history
  const { updateProgress, getHistory } = useAppStore();

  // Initialize Video Source
  useEffect(() => {
      const src = episode.videoUrl && episode.videoUrl.trim() !== '' ? episode.videoUrl : FALLBACK_VIDEO;
      setVideoSrc(src);
      setIsPlaying(true);
  }, [episode]);

  // Resume logic - get initial time
  // FIX: Get history for current user and then find saved progress for the anime
  const history = getHistory();
  const savedProgress = history[anime.id];
  // Use episode.id safely with fallback
  const currentEpisodeId = episode.id ?? 0;
  const initialTime = savedProgress && savedProgress.episodeId === currentEpisodeId ? savedProgress.timestamp : 0;

  // Handle Source Error
  const handleVideoError = () => {
      console.warn("Video source failed:", videoSrc);
      if (videoSrc !== FALLBACK_VIDEO) {
          setVideoSrc(FALLBACK_VIDEO);
      }
  };

  // Set time when metadata is loaded (more reliable than useEffect)
  const handleLoadedMetadata = () => {
      if (videoRef.current) {
          if (initialTime > 0) {
              videoRef.current.currentTime = initialTime;
          }
          videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
      }
  };

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if(!videoRef.current) return;
          
          switch(e.key.toLowerCase()) {
              case ' ':
              case 'k':
                  e.preventDefault();
                  togglePlay();
                  break;
              case 'f':
                  e.preventDefault();
                  toggleFullscreen();
                  break;
              case 'm':
                  e.preventDefault();
                  toggleMute();
                  break;
              case 'arrowright':
                  e.preventDefault();
                  videoRef.current.currentTime += 10;
                  setShowGesture('forward');
                  setTimeout(() => setShowGesture(null), 800);
                  break;
              case 'arrowleft':
                  e.preventDefault();
                  videoRef.current.currentTime -= 10;
                  setShowGesture('rewind');
                  setTimeout(() => setShowGesture(null), 800);
                  break;
              case 'escape':
                  onClose();
                  break;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted]); 

  // Controls Visibility
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (containerRef.current) containerRef.current.style.cursor = 'default';
      
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = window.setTimeout(() => {
          if (isPlaying) {
            setShowControls(false);
            if (containerRef.current) containerRef.current.style.cursor = 'none';
          }
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
      } else {
          videoRef.current.pause();
          setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen();
      } else {
          document.exitFullscreen();
      }
  };

  const toggleMute = () => {
      if(videoRef.current) {
          const newMute = !videoRef.current.muted;
          videoRef.current.muted = newMute;
          setIsMuted(newMute);
          if (newMute && volume > 0) {
              setVolume(0);
          } else if (!newMute && volume === 0) {
              setVolume(0.5); // Restore to a default volume
              videoRef.current.volume = 0.5;
          }
      }
  }

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if(videoRef.current) videoRef.current.volume = v;
    setIsMuted(v === 0);
    if(videoRef.current) videoRef.current.muted = (v === 0);
  }

  const handleTouch = (side: 'left' | 'right') => {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
          // Double tap
          if (videoRef.current) {
              if (side === 'left') {
                  videoRef.current.currentTime -= 10;
                  setShowGesture('rewind');
              } else {
                  videoRef.current.currentTime += 10;
                  setShowGesture('forward');
              }
              setTimeout(() => setShowGesture(null), 800);
          }
      } else {
          // Single tap
          setShowControls(!showControls);
      }
      lastTapRef.current = now;
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setProgress(curr);
      setDuration(dur);

      // Save progress every 5 seconds
      if (Math.floor(curr) % 5 === 0) {
        // Use safe ID fallback
        updateProgress(anime.id, episode.id ?? 0, curr, dur);
      }

      // Skip Intro Logic
      if (episode.introStart && episode.introEnd) {
        setShowSkipIntro(curr >= episode.introStart && curr <= episode.introEnd);
      }

      // Next Episode Logic (Last 30 seconds)
      if (dur > 0 && dur - curr < 30 && onNextEpisode) {
          setShowNextEpButton(true);
          setNextEpCountdown(Math.max(0, Math.floor(dur - curr)));
      } else {
          setShowNextEpButton(false);
      }
    }
  };

  const handleSkipIntro = () => {
    if (videoRef.current && episode.introEnd) {
      videoRef.current.currentTime = episode.introEnd;
      setShowSkipIntro(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden group animate-in fade-in duration-500">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onNextEpisode}
        onError={handleVideoError}
        autoPlay
        playsInline
      />

      {/* Gesture Areas */}
      <div className="absolute inset-0 flex z-20">
          <div className="w-1/3 h-full" onDoubleClick={() => handleTouch('left')}></div>
          <div className="w-1/3 h-full" onDoubleClick={toggleFullscreen} onClick={togglePlay}></div>
          <div className="w-1/3 h-full" onDoubleClick={() => handleTouch('right')}></div>
      </div>

      {/* Gesture Feedback */}
      {showGesture && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${showGesture === 'rewind' ? 'left-1/4' : 'right-1/4'} bg-black/50 rounded-full p-6 text-white z-30 animate-ping`}>
              {showGesture === 'rewind' ? <span className="font-bold text-2xl">-10s</span> : <span className="font-bold text-2xl">+10s</span>}
          </div>
      )}

      {/* Skip Intro Button */}
      {showSkipIntro && (
        <button
          onClick={handleSkipIntro}
          className="absolute bottom-32 right-8 bg-white/90 hover:bg-white text-black px-6 py-2 rounded-sm font-bold flex items-center gap-2 transition z-50 animate-bounce"
        >
          <SkipForward size={20} /> SKIP INTRO
        </button>
      )}

      {/* Next Episode Auto-Prompt */}
      {showNextEpButton && onNextEpisode && (
          <div className="absolute bottom-32 right-8 bg-[#181818] border border-gray-700 p-4 rounded shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-right-10">
              <div className="flex flex-col">
                  <span className="text-gray-400 text-xs uppercase">Up Next</span>
                  <span className="text-white font-bold">Next Episode</span>
                  <span className="text-[#E50914] text-xs">Playing in {nextEpCountdown}s...</span>
              </div>
              <button 
                onClick={onNextEpisode}
                className="bg-white hover:bg-gray-200 text-black rounded-full p-3 transition"
              >
                  <SkipForward size={24} fill="black" />
              </button>
              <button 
                onClick={() => setShowNextEpButton(false)} 
                className="absolute -top-2 -right-2 bg-black border border-white rounded-full p-1"
              >
                  <X size={12} className="text-white" />
              </button>
          </div>
      )}

      {/* Top Bar (Back) */}
      <div className={`absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 z-40 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={onClose} className="text-white hover:text-[#E50914] transition">
          <ArrowLeft size={40} />
        </button>
      </div>

      {/* Controls Overlay */}
      <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-8 pb-8 pt-16 transition-opacity duration-300 z-40 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-gray-600/50 rounded-full mb-6 cursor-pointer group/timeline">
          <div 
            className="absolute top-0 left-0 h-full bg-[#E50914] rounded-full" 
            style={{ width: `${(progress / duration) * 100}%` }}
          />
           <div 
            className="absolute top-1/2 -translate-y-1/2 h-5 w-5 bg-[#E50914] rounded-full shadow scale-0 group-hover/timeline:scale-100 transition-transform" 
            style={{ left: `${(progress / duration) * 100}%` }}
          />
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={progress} 
            onChange={(e) => {
              if(videoRef.current) {
                const t = Number(e.target.value);
                videoRef.current.currentTime = t;
                // Use safe ID fallback
                updateProgress(anime.id, episode.id ?? 0, t, duration);
              }
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={togglePlay} className="text-white hover:text-[#E50914] transition">
              {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" />}
            </button>
            
            <div className="relative group/vol flex items-center">
                <button onClick={toggleMute} className="text-white">
                    {isMuted || volume === 0 ? <VolumeX size={28} /> : <Volume2 size={28} />}
                </button>
                <AnimatePresence>
                <motion.div 
                    initial={{ y: 10, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 10, opacity: 0, scale: 0.9 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-auto p-2 opacity-0 invisible group-hover/vol:opacity-100 group-hover/vol:visible transition-all duration-300 flex justify-center"
                >
                    <div className="bg-black/80 backdrop-blur-md rounded-full p-2 h-32 flex justify-center shadow-lg">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            className="w-2 h-full accent-[#E50914] cursor-pointer"
                            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                        />
                    </div>
                </motion.div>
                </AnimatePresence>
            </div>

            <div className="text-lg text-gray-300 font-medium font-mono">
              {formatTime(progress)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {onNextEpisode && (
                <button onClick={onNextEpisode} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase">
                    Next Ep <SkipForward size={20} />
                </button>
            )}
            <div className="text-right hidden md:block border-l border-gray-600 pl-6">
                <div className="text-white font-bold text-lg">{anime.title}</div>
                <div className="text-[#E50914] font-semibold text-sm">Ep {episode.id}: {episode.title}</div>
            </div>

            <div className="relative">
                <button 
                    onClick={() => setShowServerMenu(!showServerMenu)}
                    className="flex items-center gap-2 text-gray-300 hover:text-white px-4 py-1.5 border border-gray-600 rounded hover:border-white transition bg-black/50 backdrop-blur-md"
                >
                    <Server size={20} />
                    <span className="text-sm font-bold uppercase tracking-wider">{currentServer.name}</span>
                </button>
                {showServerMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-[#1f1f1f] border border-gray-700 rounded shadow-xl p-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="text-xs text-gray-500 mb-2 px-2 font-bold uppercase tracking-widest">Select Stream Source</div>
                        {SERVERS.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => {
                                    setCurrentServer(s);
                                    setShowServerMenu(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded text-sm flex justify-between mb-1 ${currentServer.id === s.id ? 'bg-[#E50914] text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                            >
                                <span>{s.name}</span>
                                <span className="opacity-80 text-xs bg-black/30 px-1 rounded">{s.quality}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button 
                onClick={toggleFullscreen} 
                className="text-white hover:scale-110 transition"
            >
              <Maximize size={28} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;