
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Anime, Episode } from '../types';
import { TRANSLATIONS } from '../constants';
import AnimeCard from './AnimeCard';
import { Calendar, Clock, Flame } from 'lucide-react';

interface CalendarPageProps {
  onPlay: (anime: Anime) => void;
  onInfo: (anime: Anime) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ onPlay, onInfo }) => {
  const { content, appLanguage } = useAppStore();
  const t = TRANSLATIONS[appLanguage];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Get current day to set initial active tab
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
  // Adjust so 0 is Monday to match array
  const adjustedTodayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  
  const [activeDay, setActiveDay] = useState<string>(days[adjustedTodayIndex]);

  // Filter content by day, then sort by time (if available)
  const filteredContent = content
    .filter(anime => anime.airingDay === activeDay)
    .sort((a, b) => {
        if (!a.airingTime) return 1;
        if (!b.airingTime) return -1;
        return a.airingTime.localeCompare(b.airingTime);
    });

  // Mock Logic for "Airing Soon" visual
  const isToday = days[adjustedTodayIndex] === activeDay;

  return (
    <div className="min-h-screen pt-24 px-4 md:px-12 bg-[#141414] pb-20">
       <div className="flex items-center gap-4 mb-8">
           <div className="bg-[#E50914] p-3 rounded-full">
               <Calendar size={24} className="text-white" />
           </div>
           <div>
               <h1 className="text-3xl font-bold text-white">{t.calendar}</h1>
               <p className="text-gray-400 text-sm">Simulcast Schedule - {t.days[activeDay]}</p>
           </div>
       </div>

       {/* Day Tabs */}
       <div className="flex flex-wrap gap-2 mb-10 border-b border-gray-800 pb-4">
           {days.map(day => (
               <button 
                 key={day}
                 onClick={() => setActiveDay(day)}
                 className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                     activeDay === day 
                     ? 'bg-white text-black scale-105 shadow-lg shadow-white/20' 
                     : 'bg-[#1f1f1f] text-gray-400 hover:bg-[#333] hover:text-white'
                 }`}
               >
                   {t.days[day]}
               </button>
           ))}
       </div>

       {/* Content Grid */}
       <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 key={activeDay}">
           {filteredContent.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                   {filteredContent.map((anime, idx) => (
                       <div key={anime.id} className="relative group">
                           {/* Time Badge */}
                           {anime.airingTime && (
                               <div className="absolute top-2 left-2 z-20 bg-black/80 text-[#E50914] text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-[#E50914]/30 shadow-md">
                                   <Clock size={10} />
                                   <span>{anime.airingTime}</span>
                               </div>
                           )}
                           
                           {/* Simulated "Airing Soon" for demo purposes (first item if today) */}
                           {isToday && idx === 0 && (
                               <div className="absolute top-2 right-2 z-20 bg-[#E50914] text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md animate-pulse">
                                   <Flame size={10} fill="white" />
                                   <span>AIRING SOON</span>
                               </div>
                           )}

                           <AnimeCard 
                               anime={anime}
                               onPlay={onPlay}
                               onInfo={onInfo}
                           />
                       </div>
                   ))}
               </div>
           ) : (
               <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl bg-[#1f1f1f]/50">
                   <Calendar size={48} className="mb-4 opacity-20" />
                   <p className="text-lg font-medium">No scheduled broadcasts for {t.days[activeDay]}</p>
                   <p className="text-xs opacity-60 mt-2">Check back later or view Archive</p>
               </div>
           )}
       </div>
    </div>
  );
};

export default CalendarPage;