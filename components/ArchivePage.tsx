
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Anime } from '../types';
import AnimeCard from './AnimeCard';
import { TRANSLATIONS } from '../constants';
import { Search, Filter, ArrowDownAZ, ArrowUpAZ, Clock, Star } from 'lucide-react';

interface ArchivePageProps {
  onPlay: (anime: Anime) => void;
  onInfo: (anime: Anime) => void;
}

const ArchivePage: React.FC<ArchivePageProps> = ({ onPlay, onInfo }) => {
  const { content, appLanguage } = useAppStore();
  const t = TRANSLATIONS[appLanguage];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'az' | 'za' | 'rating'>('newest');

  // Extract all unique tags from content for filters
  const allTags = useMemo(() => {
      const tags = new Set<string>();
      content.forEach(anime => anime.tags.forEach(tag => tags.add(tag)));
      return Array.from(tags).sort();
  }, [content]);

  // Filter and Sort Content
  const filteredContent = useMemo(() => {
      let result = content;

      // Search
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          result = result.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
      }

      // Filter
      if (selectedGenre) {
          result = result.filter(a => a.tags.includes(selectedGenre));
      }

      // Sort
      return result.sort((a, b) => {
          switch (sortOption) {
              case 'newest':
                  return b.year - a.year || Number(b.id) - Number(a.id);
              case 'oldest':
                  return a.year - b.year;
              case 'az':
                  return a.title.localeCompare(b.title);
              case 'za':
                  return b.title.localeCompare(a.title);
              case 'rating':
                  return b.matchScore - a.matchScore;
              default:
                  return 0;
          }
      });
  }, [content, searchQuery, selectedGenre, sortOption]);

  return (
    <div className="min-h-screen pt-24 px-4 md:px-12 bg-[#141414] pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
              <h1 className="text-3xl font-bold text-white mb-2">{t.archive}</h1>
              <p className="text-gray-400 text-sm">{filteredContent.length} titles found</p>
          </div>

          <div className="flex items-center gap-4 bg-[#1f1f1f] px-4 py-2 rounded-full border border-gray-700 w-full md:w-auto">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white focus:outline-none text-sm w-full md:w-64"
              />
          </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-6 mb-10 border-b border-gray-800 pb-6">
          {/* Sort Options */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
              <span className="text-gray-500 text-xs font-bold uppercase whitespace-nowrap">{t.sort}:</span>
              <button 
                onClick={() => setSortOption('newest')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap border ${sortOption === 'newest' ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
              >
                  <Clock size={14} /> {t.sortBy.newest}
              </button>
               <button 
                onClick={() => setSortOption('rating')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap border ${sortOption === 'rating' ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
              >
                  <Star size={14} /> {t.sortBy.rating}
              </button>
              <button 
                onClick={() => setSortOption('az')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap border ${sortOption === 'az' ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
              >
                  <ArrowDownAZ size={14} /> {t.sortBy.az}
              </button>
              <button 
                onClick={() => setSortOption('za')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap border ${sortOption === 'za' ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
              >
                  <ArrowUpAZ size={14} /> {t.sortBy.za}
              </button>
          </div>

          {/* Genre Filters */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar flex-1">
               <span className="text-gray-500 text-xs font-bold uppercase whitespace-nowrap">{t.categories}:</span>
               <button 
                 onClick={() => setSelectedGenre(null)}
                 className={`px-3 py-1.5 rounded text-sm whitespace-nowrap transition ${!selectedGenre ? 'text-[#E50914] font-bold underline decoration-2 underline-offset-4' : 'text-gray-400 hover:text-white'}`}
               >
                   All
               </button>
               {allTags.map(tag => (
                   <button 
                     key={tag}
                     onClick={() => setSelectedGenre(tag)}
                     className={`px-3 py-1.5 rounded text-sm whitespace-nowrap transition ${selectedGenre === tag ? 'text-[#E50914] font-bold underline decoration-2 underline-offset-4' : 'text-gray-400 hover:text-white'}`}
                   >
                       {tag}
                   </button>
               ))}
          </div>
      </div>

      {/* Results Grid */}
      <div className="animate-in fade-in duration-500">
          {filteredContent.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                  {filteredContent.map(anime => (
                      <AnimeCard 
                          key={anime.id} 
                          anime={anime} 
                          onPlay={onPlay} 
                          onInfo={onInfo}
                      />
                  ))}
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Filter size={48} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">No anime found matching your criteria.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedGenre(null); }}
                    className="mt-4 text-[#E50914] hover:underline"
                  >
                      Clear Filters
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};

export default ArchivePage;