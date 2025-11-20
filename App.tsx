
import React, { useState, useEffect } from 'react';
import { Anime, Episode } from './types';
import { TRANSLATIONS } from './constants';
import { useAppStore } from './store';
import ProfileSelector from './components/ProfileSelector';
import Layout from './components/Layout';
import HeroBillboard from './components/HeroBillboard';
import AnimeCard from './components/AnimeCard';
import VideoPlayer from './components/VideoPlayer';
import GeminiOracle from './components/GeminiOracle';
import AccountPage from './components/AccountPage';
import BrowseLanguages from './components/BrowseLanguages';
import InfoModal from './components/InfoModal';
import AdminPanel from './components/AdminPanel';
import CalendarPage from './components/CalendarPage';
import ArchivePage from './components/ArchivePage';
import PremiumModal from './components/PremiumModal';
import AuthPage from './components/AuthPage';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [playingAnime, setPlayingAnime] = useState<Anime | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<Episode | null>(null);
  const [modalAnime, setModalAnime] = useState<Anime | null>(null);
  const [currentView, setCurrentView] = useState<string>('home');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { 
    currentUser, 
    setCurrentUser, 
    getHistory, 
    getList, 
    appLanguage, 
    content, 
    searchQuery, 
    fetchContent, 
    isContentLoading,
    session,
    isAuthLoading,
    initializeAuth
  } = useAppStore();
  
  const t = TRANSLATIONS[appLanguage];

  // Initialize Auth and Fetch content
  useEffect(() => {
    initializeAuth();
    fetchContent();
  }, [initializeAuth, fetchContent]);

  // Loading State (Booting)
  if (isAuthLoading || isContentLoading) {
    return (
      <div className="fixed inset-0 bg-[#141414] flex flex-col items-center justify-center text-white z-[200]">
        <div className="text-[#E50914] font-black text-5xl tracking-tighter mb-4 animate-pulse">ANIRIAS</div>
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  // 1. Authentication Check
  if (!session) {
      return <AuthPage />;
  }

  // 2. Profile Selection Check
  if (!currentUser) {
    return <ProfileSelector onSelect={setCurrentUser} />;
  }

  // Get current user specific data
  const history = getHistory();
  const myListIds = getList();

  // Player Logic
  const handlePlay = (anime: Anime, episode?: Episode) => {
      if (episode) {
          setPlayingEpisode(episode);
      } else {
          const saved = history[anime.id];
          if (saved && saved.episodeId) {
              const nextEp = anime.episodes.find(e => e.id === saved.episodeId);
              if (nextEp) {
                  setPlayingEpisode(nextEp);
              } else {
                  setPlayingEpisode(anime.episodes[0]);
              }
          } else {
              setPlayingEpisode(anime.episodes[0]);
          }
      }
      setPlayingAnime(anime);
      setModalAnime(null);
  };

  const handleNextEpisode = () => {
      if(playingAnime && playingEpisode) {
          const currentIndex = playingAnime.episodes.findIndex(e => e.id === playingEpisode.id);
          if(currentIndex >= 0 && currentIndex < playingAnime.episodes.length - 1) {
              setPlayingEpisode(playingAnime.episodes[currentIndex + 1]);
          } else {
              setPlayingAnime(null);
              setPlayingEpisode(null);
          }
      }
  };

  if (playingAnime && playingEpisode) {
    return (
      <VideoPlayer 
        anime={playingAnime} 
        episode={playingEpisode}
        onClose={() => { setPlayingAnime(null); setPlayingEpisode(null); }} 
        onNextEpisode={handleNextEpisode}
      />
    );
  }

  // Content Filtering Logic
  let contentToDisplay: Anime[] = [];
  let pageTitle = "";

  switch (currentView) {
      case 'latest':
          contentToDisplay = [...content]
            .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
            .slice(0, 24);
          pageTitle = t.latestEpisodes;
          break;
      case 'list':
          contentToDisplay = content.filter(anime => myListIds.includes(anime.id));
          pageTitle = t.myList;
          break;
      case 'search':
          contentToDisplay = content.filter(anime => 
            anime.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            anime.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            anime.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          pageTitle = `Results for "${searchQuery}"`;
          break;
      default:
          contentToDisplay = content;
  }

  const continueWatchingList = content.filter(
    anime => history[anime.id] && history[anime.id].timestamp > 0
  ).sort((a, b) => history[b.id].lastWatched - history[a.id].lastWatched);

  return (
    <Layout 
        user={currentUser} 
        currentView={currentView} 
        onNavigate={setCurrentView}
        onOpenPremium={() => setShowPremiumModal(true)}
    >
      
      <AnimatePresence mode="wait">
        {currentView === 'home' && (
            <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
            {content.length > 0 && (
                <HeroBillboard 
                    anime={content[0]} 
                    onPlay={() => handlePlay(content[0])}
                    onInfo={() => setModalAnime(content[0])}
                />
            )}

            <div className="relative z-10 -mt-24 md:-mt-48 px-4 md:px-12 pb-20 space-y-12">
                {continueWatchingList.length > 0 && (
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        {t.continueWatching}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
                        {continueWatchingList.map((anime) => (
                            <div key={anime.id} onClick={() => handlePlay(anime)}>
                                <AnimeCard 
                                    anime={anime} 
                                    onPlay={handlePlay}
                                    onInfo={setModalAnime} 
                                />
                            </div>
                        ))}
                    </div>
                </motion.section>
                )}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4">{t.trending}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
                        {content.slice(0, 6).map((anime) => (
                            <AnimeCard 
                                key={anime.id} 
                                anime={anime} 
                                onPlay={handlePlay}
                                onInfo={setModalAnime} 
                            />
                        ))}
                    </div>
                </motion.section>
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4">{t.latestEpisodes}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
                        {[...content].sort((a,b) => (b.lastUpdated || 0) - (a.lastUpdated || 0)).slice(0, 6).map((anime) => (
                            <AnimeCard 
                                key={anime.id + '_new'} 
                                anime={anime} 
                                onPlay={handlePlay}
                                onInfo={setModalAnime} 
                            />
                        ))}
                    </div>
                </motion.section>
            </div>
            </motion.div>
        )}
        {currentView === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <CalendarPage onPlay={handlePlay} onInfo={setModalAnime} />
            </motion.div>
        )}
        {currentView === 'archive' && (
            <motion.div key="archive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ArchivePage onPlay={handlePlay} onInfo={setModalAnime} />
            </motion.div>
        )}
        {(currentView === 'latest' || currentView === 'list' || currentView === 'search') && (
            <motion.div 
                key="grid" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="pt-24 px-4 md:px-12 min-h-screen"
            >
                <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-2">
                    {currentView === 'search' && <Search size={32} className="text-[#E50914]" />}
                    {pageTitle}
                </h1>
                {contentToDisplay.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
                        {contentToDisplay.map((anime) => (
                            <AnimeCard 
                                key={anime.id} 
                                anime={anime} 
                                onPlay={handlePlay}
                                onInfo={setModalAnime} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                        <Search size={64} className="mb-4 opacity-20" />
                        <p className="text-xl">{t.emptyList || "No results found."}</p>
                        {currentView === 'search' && <p className="text-sm mt-2">Try adjusting your search terms.</p>}
                    </div>
                )}
            </motion.div>
        )}
        {currentView === 'account' && (
            <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AccountPage user={currentUser} />
            </motion.div>
        )}
        {currentView === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                <AdminPanel />
            </motion.div>
        )}
        {currentView === 'languages' && (
            <motion.div key="languages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BrowseLanguages onPlay={handlePlay} />
            </motion.div>
        )}
        {!['home', 'latest', 'calendar', 'archive', 'list', 'account', 'admin', 'search', 'languages'].includes(currentView) && (
             <motion.div key="404" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col items-center justify-center text-white">
                 <AlertTriangle size={64} className="text-[#E50914] mb-4" />
                 <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
                 <p className="text-gray-400 mb-6">The content you are looking for is currently unavailable.</p>
                 <button onClick={() => setCurrentView('home')} className="bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200">Go Home</button>
             </motion.div>
        )}
      </AnimatePresence>
      {content.length > 0 && <GeminiOracle currentContext={content[0]} />}
      <AnimatePresence>
        {modalAnime && (
            <InfoModal 
                anime={modalAnime} 
                onClose={() => setModalAnime(null)} 
                onPlay={handlePlay} 
            />
        )}
      </AnimatePresence>
      {showPremiumModal && (
          <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}
    </Layout>
  );
};

export default App;
