
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Play, Plus, Check, ThumbsUp, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Anime, Episode } from '../types';
import { useAppStore } from '../store';
import { TRANSLATIONS } from '../constants';

interface InfoModalProps {
  anime: Anime;
  onClose: () => void;
  onPlay: (anime: Anime, episode?: Episode) => void;
}

interface SeasonOption {
    id: string;
    title: string;
    isInternal: boolean;
    seasonNumber?: number;
    animeId: string;
}

const InfoModal: React.FC<InfoModalProps> = ({ anime, onClose, onPlay }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'more_like_this'>('episodes');
  const { getList, addToList, removeFromList, appLanguage, content, getHistory } = useAppStore();
  
  // Current Anime Context (switches when external season is selected)
  const [currentAnime, setCurrentAnime] = useState<Anime>(anime);
  
  // Internal Season Selection (switches when internal season is selected)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [showSeasonMenu, setShowSeasonMenu] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[appLanguage];
  const list = getList();
  const history = getHistory();
  const isInList = list.includes(currentAnime.id);

  // Filter similar content
  const similarContent = content.filter(a => a.id !== currentAnime.id && a.tags.some(tag => currentAnime.tags.includes(tag))).slice(0, 6);

  const toggleList = () => {
    if (isInList) removeFromList(currentAnime.id);
    else addToList(currentAnime.id);
  };

  // Lock body scroll
  useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; }
  }, []);

  // --- Season Logic ---
  const seasonOptions = useMemo<SeasonOption[]>(() => {
      const options: SeasonOption[] = [];
      
      // 1. Detect Internal Seasons (based on episode.seasonNumber)
      const internalSeasons = new Set<number>();
      currentAnime.episodes.forEach(ep => internalSeasons.add(ep.seasonNumber || 1));
      const sortedInternal = Array.from(internalSeasons).sort((a, b) => a - b);

      sortedInternal.forEach(num => {
          options.push({
              id: `internal-${num}`,
              title: `Season ${num}`,
              isInternal: true,
              seasonNumber: num,
              animeId: currentAnime.id
          });
      });

      // 2. Detect External Related Seasons (Linked Animes)
      if (currentAnime.relatedSeasons) {
          currentAnime.relatedSeasons.forEach(rel => {
              if (rel.animeId !== currentAnime.id) {
                   options.push({
                       id: rel.animeId,
                       title: rel.title, // e.g. "Season 2", "Movie"
                       isInternal: false,
                       animeId: rel.animeId
                   });
              }
          });
      }

      // Fallback if no episodes and no relations (just show "Season 1" or similar)
      if (options.length === 0) {
          options.push({
              id: `internal-1`,
              title: currentAnime.seasonName || 'Season 1',
              isInternal: true,
              seasonNumber: 1,
              animeId: currentAnime.id
          });
      }

      return options;
  }, [currentAnime]);

  // Set default selection when anime changes
  useEffect(() => {
      if (seasonOptions.length > 0) {
          // Default to the first internal season found, or the first option available
          const firstInternal = seasonOptions.find(s => s.isInternal);
          setSelectedSeasonId(firstInternal ? firstInternal.id : seasonOptions[0].id);
      }
  }, [seasonOptions]);

  // Filter Episodes based on selection
  const displayedEpisodes = useMemo(() => {
      const selectedOpt = seasonOptions.find(s => s.id === selectedSeasonId);
      if (!selectedOpt || !selectedOpt.isInternal) return [];
      
      return currentAnime.episodes
          .filter(ep => (ep.seasonNumber || 1) === selectedOpt.seasonNumber)
          .sort((a, b) => a.id - b.id);
  }, [currentAnime, selectedSeasonId, seasonOptions]);

  const handleSeasonSelect = (option: SeasonOption) => {
      if (option.isInternal) {
          setSelectedSeasonId(option.id);
          setShowSeasonMenu(false);
      } else {
          // Switch Context to another Anime
          const nextAnime = content.find(a => a.id === option.animeId);
          if (nextAnime) {
              setCurrentAnime(nextAnime);
              setShowSeasonMenu(false);
              // selectedSeasonId will reset via useEffect
          }
      }
  };

  const currentSeasonTitle = seasonOptions.find(s => s.id === selectedSeasonId)?.title || 'Seasons';

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto overflow-x-hidden" ref={scrollContainerRef}>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-start justify-center p-0 md:p-8">
        <motion.div 
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-5xl bg-[#181818] shadow-2xl overflow-hidden rounded-none md:rounded-lg text-left my-0 md:my-8"
            onClick={(e) => e.stopPropagation()}
        >
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-[#181818]/50 hover:bg-[#181818] rounded-full flex items-center justify-center text-white transition border border-white/10 backdrop-blur-md"
            >
                <X size={24} />
            </button>

            <div className="relative w-full aspect-video">
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent z-10" />
                <img src={currentAnime.heroImage} alt={currentAnime.title} className="w-full h-full object-cover" />
                
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20 flex flex-col gap-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg italic uppercase">{currentAnime.title}</h1>
                    
                    <div className="flex items-center gap-4 mt-2">
                        <button 
                            onClick={() => onPlay(currentAnime)}
                            className="bg-white text-black px-8 py-2.5 rounded font-bold flex items-center gap-2 hover:bg-[#e6e6e6] transition"
                        >
                            <Play fill="black" size={20} /> {t.play}
                        </button>
                        <button 
                            onClick={toggleList}
                            className="w-11 h-11 border-2 border-gray-400 rounded-full flex items-center justify-center text-gray-300 hover:border-white hover:text-white transition bg-black/30 backdrop-blur"
                        >
                            {isInList ? <Check size={22} /> : <Plus size={22} />}
                        </button>
                        <button className="w-11 h-11 border-2 border-gray-400 rounded-full flex items-center justify-center text-gray-300 hover:border-white hover:text-white transition bg-black/30 backdrop-blur">
                            <ThumbsUp size={20} />
                        </button>
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className="w-11 h-11 border-2 border-gray-400 rounded-full flex items-center justify-center text-gray-300 hover:border-white hover:text-white transition ml-auto bg-black/30 backdrop-blur"
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-8 md:px-12 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm mb-8">
                    <div className="md:col-span-2 text-white">
                        <div className="flex items-center gap-3 mb-4 font-bold text-lg flex-wrap">
                            <span className="text-[#46d369]">{currentAnime.matchScore}% {t.match}</span>
                            <span className="text-gray-300">{currentAnime.year}</span>
                            <span className="border border-gray-500 px-1 text-xs rounded-sm bg-gray-800">{currentAnime.ageRating}</span>
                            <span className="text-gray-300">{currentAnime.episodes.length} {t.episodes}</span>
                            {currentAnime.studio && (
                                <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-mono tracking-wide">{currentAnime.studio}</span>
                            )}
                        </div>
                        <p className="text-base leading-relaxed text-gray-300">
                            {currentAnime.description}
                        </p>
                    </div>
                    <div className="text-gray-400 space-y-3 text-xs md:text-sm">
                        <div><span className="text-gray-500">Genres:</span> {currentAnime.tags.join(', ')}</div>
                        <div><span className="text-gray-500">Audio:</span> {currentAnime.availableLanguages?.join(', ') || 'Japanese'}</div>
                        <div><span className="text-gray-500">Subtitles:</span> Turkish, English</div>
                    </div>
                </div>

                <div className="border-t border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-6 mb-6 sticky top-0 bg-[#181818] z-30 pt-2">
                        <div className="flex gap-8">
                             <button 
                                onClick={() => setActiveTab('episodes')}
                                className={`text-lg font-bold uppercase pb-2 border-b-4 transition ${activeTab === 'episodes' ? 'border-[#E50914] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                            >
                                {t.episodes}
                            </button>
                            <button 
                                onClick={() => setActiveTab('more_like_this')}
                                className={`text-lg font-bold uppercase pb-2 border-b-4 transition ${activeTab === 'more_like_this' ? 'border-[#E50914] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                            >
                                {t.moreLikeThis}
                            </button>
                        </div>
                    </div>

                    <div className="min-h-[200px] pb-8">
                        {activeTab === 'episodes' && (
                            <div className="flex flex-col gap-1">
                                {/* Season Selector */}
                                {seasonOptions.length > 1 && (
                                    <div className="flex justify-end mb-4 relative">
                                        <button 
                                            onClick={() => setShowSeasonMenu(!showSeasonMenu)}
                                            className="flex items-center gap-3 bg-[#252525] hover:bg-[#333] border border-gray-600 hover:border-white text-white px-6 py-3 rounded text-lg font-bold transition w-full md:w-auto justify-between min-w-[240px]"
                                        >
                                            <span className="truncate">{currentSeasonTitle}</span>
                                            <ChevronDown size={20} className={`transition-transform ${showSeasonMenu ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showSeasonMenu && (
                                            <div className="absolute top-full right-0 mt-2 w-full md:w-72 bg-[#252525] border border-gray-600 rounded-lg shadow-2xl z-[60] max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                                {seasonOptions.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleSeasonSelect(s)}
                                                        className={`w-full text-left px-5 py-4 border-b border-gray-700 hover:bg-white/10 transition flex items-center justify-between ${s.id === selectedSeasonId ? 'bg-[#333] text-white' : 'text-gray-300'}`}
                                                    >
                                                        <span className="font-medium text-base">{s.title}</span>
                                                        {s.id === selectedSeasonId && <Check size={18} className="text-[#E50914]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Episodes List */}
                                {displayedEpisodes.length > 0 ? displayedEpisodes.map((ep, idx) => {
                                    const historyItem = history[currentAnime.id];
                                    const watchedPercent = (historyItem && historyItem.episodeId === ep.id) 
                                        ? (historyItem.timestamp / historyItem.duration) * 100 
                                        : 0;

                                    return (
                                        <div 
                                            key={ep.id} 
                                            className="group flex items-center gap-4 md:gap-6 p-4 rounded hover:bg-[#2a2a2a] cursor-pointer transition border-b border-white/5 last:border-none"
                                            onClick={() => onPlay(currentAnime, ep)}
                                        >
                                            <div className="text-xl md:text-3xl text-gray-500 font-bold w-8 md:w-12 text-center group-hover:text-white transition">
                                                {idx + 1}
                                            </div>

                                            <div className="relative w-32 md:w-40 h-20 md:h-24 rounded overflow-hidden flex-shrink-0 bg-gray-800 shadow-lg">
                                                <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80 group-hover:opacity-100" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="bg-black/50 rounded-full p-2 md:p-3 border border-white opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
                                                        <Play fill="white" size={16} className="text-white" />
                                                    </div>
                                                </div>
                                                {watchedPercent > 0 && (
                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                                                        <div className="h-full bg-[#E50914]" style={{ width: `${watchedPercent}%` }}></div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                                                <div className="flex justify-between items-start md:items-center flex-col md:flex-row">
                                                    <h4 className="text-white font-bold text-base md:text-lg group-hover:text-[#E50914] transition truncate w-full pr-2">{ep.title}</h4>
                                                    <span className="text-gray-400 text-xs md:text-sm font-mono whitespace-nowrap">{Math.round(ep.duration / 60)}m</span>
                                                </div>
                                                <p className="text-gray-400 text-xs md:text-sm leading-relaxed line-clamp-2 hidden md:block">
                                                    {ep.releaseDate ? `Released: ${ep.releaseDate}` : currentAnime.description.substring(0, 80) + '...'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-12 text-gray-500 italic">
                                        No episodes available for this season yet.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'more_like_this' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {similarContent.map(item => (
                                    <div key={item.id} className="bg-[#2f2f2f] rounded overflow-hidden group cursor-pointer shadow-lg" onClick={() => onPlay(item)}>
                                        <div className="aspect-video relative">
                                            <img src={item.heroImage} alt={item.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                                                <div className="bg-white/20 rounded-full p-3 border-2 border-white hover:bg-[#E50914] hover:border-[#E50914] transition">
                                                    <Play fill="white" size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2 font-bold text-white text-[10px] bg-[#E50914] px-1 rounded">{item.matchScore}%</div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="text-gray-200 font-bold text-sm mb-2 line-clamp-1 group-hover:text-white transition">{item.title}</h4>
                                            <p className="text-gray-400 text-xs line-clamp-2">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InfoModal;