
import React, { useState } from 'react';
import AnimeCard from './AnimeCard';
import { Anime, LANGUAGES } from '../types';
import { ChevronDown } from 'lucide-react';
import { useAppStore } from '../store';

interface BrowseLanguagesProps {
    onPlay: (anime: Anime) => void;
}

const BrowseLanguages: React.FC<BrowseLanguagesProps> = ({ onPlay }) => {
  const [mode, setMode] = useState<'dub' | 'sub'>('dub'); // 'Original Language' or 'Subtitles' or 'Dubbing'
  const [selectedLang, setSelectedLang] = useState<string>('Japanese');
  const { content } = useAppStore();

  // Use content from store
  const allContent = content;

  // Filter Logic
  const filteredContent = allContent.filter(anime => {
      // Mock data check - in real app check anime.audioLanguages or anime.subtitleLanguages
      if (mode === 'dub') {
          // Simple check: does it have availableLanguages including selected?
          return anime.availableLanguages?.includes(selectedLang) && anime.hasDub;
      } else {
          return anime.availableLanguages?.includes(selectedLang) || anime.hasSub;
      }
  });

  return (
    <div className="min-h-screen pt-24 px-4 md:px-12 bg-[#141414]">
       <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 mb-8">
           <h1 className="text-3xl font-bold text-white">Browse by Languages</h1>
           
           <div className="flex items-center gap-4">
               <div className="relative group">
                   <button className="flex items-center gap-2 text-sm font-medium text-white bg-black border border-white/30 px-3 py-1 hover:bg-white/10">
                       {mode === 'dub' ? 'Dubbing' : 'Subtitles'} <ChevronDown size={14} />
                   </button>
                   <div className="absolute top-full left-0 w-32 bg-black border border-white/20 mt-1 hidden group-hover:block z-50">
                       <div className="p-2 hover:bg-white/10 cursor-pointer text-sm text-white" onClick={() => setMode('dub')}>Dubbing</div>
                       <div className="p-2 hover:bg-white/10 cursor-pointer text-sm text-white" onClick={() => setMode('sub')}>Subtitles</div>
                   </div>
               </div>

               <div className="relative group">
                   <button className="flex items-center gap-2 text-sm font-medium text-white bg-black border border-white/30 px-3 py-1 hover:bg-white/10">
                       {selectedLang} <ChevronDown size={14} />
                   </button>
                    <div className="absolute top-full left-0 w-32 bg-black border border-white/20 mt-1 hidden group-hover:block z-50 h-48 overflow-y-auto">
                       {LANGUAGES.map(lang => (
                           <div 
                             key={lang.code} 
                             className="p-2 hover:bg-white/10 cursor-pointer text-sm text-white"
                             onClick={() => setSelectedLang(lang.name)}
                           >
                               {lang.name}
                           </div>
                       ))}
                   </div>
               </div>
           </div>
           
           <div className="text-xs text-gray-400 md:ml-auto">
               Sort by: <span className="text-white font-bold">Suggestions</span>
           </div>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4 animate-fade-in">
            {filteredContent.length > 0 ? (
                filteredContent.map((anime) => (
                    <AnimeCard 
                        key={anime.id} 
                        anime={anime} 
                        onPlay={onPlay} 
                    />
                ))
            ) : (
                <div className="col-span-full h-64 flex items-center justify-center text-gray-500">
                    No content found for this filter.
                </div>
            )}
       </div>
    </div>
  );
};

export default BrowseLanguages;