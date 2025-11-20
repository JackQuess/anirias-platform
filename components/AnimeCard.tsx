
import React, { useState, useRef } from 'react';
import { Play, Plus, ThumbsUp, ChevronDown, Check, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anime } from '../types';
import { useAppStore } from '../store';

interface AnimeCardProps {
  anime: Anime;
  onPlay: (anime: Anime) => void;
  onInfo?: (anime: Anime) => void;
}

const FALLBACK_TRAILER = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onPlay, onInfo }) => {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [portalActive, setPortalActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoSrc, setVideoSrc] = useState<string>('');
  
  const { getHistory, getList, addToList, removeFromList } = useAppStore();
  
  // Get progress for this anime using the new store helpers
  const history = getHistory();
  const list = getList();
  
  const progress = history[anime.id];
  const isInList = list.includes(anime.id);
  // Ensure percent is valid and bounded 0-100
  const percentWatched = (progress && progress.duration > 0) 
    ? Math.min(Math.max((progress.timestamp / progress.duration) * 100, 0), 100) 
    : 0;

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Attempt to play the first episode as trailer, otherwise fallback
    const firstEpUrl = anime.episodes?.[0]?.videoUrl;
    setVideoSrc(firstEpUrl && firstEpUrl.trim() !== '' ? firstEpUrl : FALLBACK_TRAILER);
    
    timerRef.current = window.setTimeout(() => {
      setPortalActive(true);
    }, 500); // 500ms delay before expanding like Netflix
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPortalActive(false);
    setIsMuted(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleVideoError = () => {
      if (videoSrc !== FALLBACK_TRAILER) {
          setVideoSrc(FALLBACK_TRAILER);
      }
  };

  const toggleList = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInList) removeFromList(anime.id);
    else addToList(anime.id);
  };

  const matchColor = anime.matchScore > 90 ? 'text-[#46d369]' : 'text-yellow-400';

  // Determine episode info string
  let episodeInfo = "";
  if (progress) {
      episodeInfo = `S${anime.episodes.find(e => e.id === progress.episodeId)?.seasonNumber || 1} • E${progress.episodeId}`;
  } else if (anime.episodes.length > 0) {
      // If no progress, show latest or total
      const lastEp = anime.episodes[anime.episodes.length - 1];
      episodeInfo = `S${lastEp.seasonNumber || 1} • E${lastEp.id}`;
  }

  return (
    <motion.div 
      className="relative w-full aspect-[2/3] md:aspect-[16/9] rounded-lg cursor-pointer z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ zIndex: 50 }}
      layoutId={`card-${anime.id}`}
    >
      {/* Base Thumbnail (Static) */}
      <div className="w-full h-full rounded-lg overflow-hidden relative group shadow-md" onClick={() => onInfo && onInfo(anime)}>
        <img 
          src={anime.thumbnail} 
          alt={anime.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Gradient Overlay for readability */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/90 to-transparent opacity-80"></div>

        {/* Bottom Info (Season/Ep) */}
        {!portalActive && (
             <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
                 <span className="text-white font-bold text-xs md:text-sm line-clamp-1 drop-shadow-md">{anime.title}</span>
                 <div className="flex justify-between items-center">
                     {episodeInfo && (
                        <span className="text-[10px] text-gray-300 font-mono bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
                            {episodeInfo}
                        </span>
                     )}
                 </div>
             </div>
        )}

        {/* Progress Info on Static Card (Episode + Bar) */}
        {percentWatched > 0 && !portalActive && (
          <div className="absolute bottom-0 left-0 w-full flex flex-col">
             <div className="w-full h-1 bg-gray-700/50">
               <div className="h-full bg-[#E50914]" style={{ width: `${percentWatched}%` }} />
             </div>
          </div>
        )}
      </div>

      {/* Portal Expanded Card */}
      <AnimatePresence>
        {portalActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 0 }}
            animate={{ opacity: 1, scale: 1.2, y: -30 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full bg-[#141414] rounded-lg shadow-2xl shadow-black z-[60] overflow-hidden ring-1 ring-white/10"
            style={{ minHeight: '300px', width: '100%', transformOrigin: 'center center' }}
            onClick={() => onInfo && onInfo(anime)}
          >
            {/* Media Area */}
            <div className="relative w-full aspect-video bg-black">
                {/* Video Trailer */}
                <video
                    src={videoSrc}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted={isMuted}
                    loop
                    onError={handleVideoError}
                />
                
                <button 
                    className="absolute bottom-4 right-4 p-1.5 rounded-full border border-white/50 hover:border-white hover:bg-white/10 text-white z-20"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                    }}
                >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#141414] to-transparent"></div>
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 text-[10px] text-white uppercase tracking-wider rounded-sm font-bold border-l-2 border-[#E50914]">
                    {anime.type}
                </div>
            </div>

            {/* Info Area */}
            <div className="p-4 flex flex-col gap-3 bg-[#141414]">
                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlay(anime);
                            }}
                            className="w-8 h-8 rounded-full bg-white hover:bg-[#e6e6e6] text-black flex items-center justify-center transition-colors"
                        >
                            <Play size={16} fill="currentColor" />
                        </button>
                        <button 
                            onClick={toggleList}
                            className="w-8 h-8 rounded-full border-2 border-gray-400 hover:border-white text-gray-300 hover:text-white flex items-center justify-center transition-colors tooltip"
                            title={isInList ? "Remove from My List" : "Add to My List"}
                        >
                            {isInList ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                        <button 
                             onClick={(e) => e.stopPropagation()}
                             className="w-8 h-8 rounded-full border-2 border-gray-400 hover:border-white text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                        >
                            <ThumbsUp size={16} />
                        </button>
                    </div>
                    <button 
                        onClick={(e) => {
                             e.stopPropagation();
                             if(onInfo) onInfo(anime);
                        }}
                        className="w-8 h-8 rounded-full border-2 border-gray-400 hover:border-white text-gray-300 hover:text-white flex items-center justify-center ml-auto"
                    >
                        <ChevronDown size={16} />
                    </button>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
                    <span className={matchColor}>{anime.matchScore}% Match</span>
                    <span className="border border-gray-500 px-1 text-gray-400 text-[10px]">{anime.ageRating}</span>
                    <span className="text-gray-400">{anime.year}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {anime.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] text-white flex items-center">
                            <span className="w-1 h-1 bg-gray-500 rounded-full mr-1.5"></span>
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Progress Bar in Portal */}
                {percentWatched > 0 && (
                    <div className="mt-1">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                           <span>Ep {progress?.episodeId}</span>
                           <span>{Math.round(progress?.timestamp / 60)}m of {Math.round(progress?.duration / 60)}m</span>
                        </div>
                        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-[#E50914]" style={{ width: `${percentWatched}%` }} />
                        </div>
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimeCard;