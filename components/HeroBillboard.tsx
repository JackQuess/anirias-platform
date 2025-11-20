
import React, { useState, useEffect, useRef } from 'react';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { Anime } from '../types';
import { TRANSLATIONS } from '../constants';
import { useAppStore } from '../store';

interface HeroBillboardProps {
  anime: Anime;
  onPlay: () => void;
  onInfo: () => void;
}

const HeroBillboard: React.FC<HeroBillboardProps> = ({ anime, onPlay, onInfo }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { appLanguage } = useAppStore();
  const t = TRANSLATIONS[appLanguage];

  const sampleVideo = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Split title for subtitle logic
  const titleParts = anime.title.split(':');
  const mainTitle = titleParts[0];
  const subTitle = titleParts.length > 1 ? titleParts.slice(1).join(':') : null;

  return (
    <div className="relative w-full h-[85vh] md:h-[95vh] overflow-hidden bg-[#141414]">
      {/* Background Layer */}
      <div className="absolute inset-0 w-full h-full">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full h-full"
        >
            {!isVideoEnded && !videoError ? (
                <video 
                    ref={videoRef}
                    src={sampleVideo}
                    className="w-full h-full object-cover opacity-70"
                    autoPlay 
                    muted={isMuted}
                    playsInline
                    onEnded={() => setIsVideoEnded(true)}
                    onError={() => setVideoError(true)}
                />
            ) : (
                <motion.img 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ duration: 1 }}
                    src={anime.heroImage} 
                    alt="Hero Background" 
                    className="w-full h-full object-cover"
                />
            )}
        </motion.div>
        
        {/* Cinematic Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent z-10" />
        <div className="absolute bottom-0 left-0 w-full h-3/4 bg-gradient-to-t from-[#141414] via-[#141414]/90 to-transparent z-10" />
      </div>

      {/* Content Layer */}
      <div className="absolute inset-0 flex flex-col justify-end pb-24 md:pb-32 px-6 md:px-16 max-w-6xl z-20 pointer-events-none">
        <div className="pointer-events-auto">
            {/* Title Section */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mb-8"
            >
              <div className="flex flex-col gap-2">
                <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-2xl uppercase italic leading-tight break-words">
                  {mainTitle}
                </h1>
                {subTitle && (
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-[#E50914] drop-shadow-2xl uppercase italic leading-tight break-words">
                     {subTitle.trim()}
                  </h2>
                )}
              </div>
            </motion.div>

            {/* Meta Info */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex items-center gap-4 mb-6 text-sm md:text-lg font-medium text-shadow flex-wrap"
            >
                <span className="text-[#46d369] font-bold">{anime.matchScore}% {t.match}</span>
                <span className="text-gray-300">{anime.year}</span>
                <span className="border border-gray-500 px-2 rounded text-gray-300 bg-black/30 backdrop-blur-sm">{anime.ageRating}</span>
                <span className="bg-[#E50914] text-white text-xs px-2 py-0.5 rounded font-bold">HD</span>
            </motion.div>

            {/* Description */}
            <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="text-base md:text-xl text-gray-200 drop-shadow-md max-w-2xl mb-10 line-clamp-3 text-shadow-sm font-medium leading-relaxed"
            >
                {anime.description}
            </motion.p>

            {/* Buttons */}
            <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.8 }}
                className="flex items-center gap-4"
            >
                <button 
                    onClick={onPlay}
                    className="bg-white text-black hover:bg-[#c1c1c1] transition px-8 py-3.5 rounded-md font-bold flex items-center gap-3 text-lg shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                    <Play fill="black" size={24} /> {t.play}
                </button>
                <button 
                    onClick={onInfo}
                    className="bg-gray-600/40 text-white hover:bg-gray-600/60 backdrop-blur-md transition px-8 py-3.5 rounded-md font-bold flex items-center gap-3 text-lg shadow-lg border border-white/10"
                >
                    <Info size={24} /> {t.moreInfo}
                </button>
            </motion.div>
        </div>
      </div>

      {/* Mute Toggle */}
      <div className="absolute bottom-[35%] right-0 flex items-center gap-4 pr-4 md:pr-16 z-30 hidden md:flex">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-12 h-12 rounded-full border border-gray-400 flex items-center justify-center hover:bg-white/10 hover:border-white transition text-white bg-black/20 backdrop-blur-sm"
          >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          <div className="w-24 h-8 bg-gray-500/30 backdrop-blur-sm border-l-4 border-white flex items-center px-2 text-sm font-bold uppercase tracking-wider text-white">
              {anime.ageRating}
          </div>
      </div>
    </div>
  );
};

export default HeroBillboard;