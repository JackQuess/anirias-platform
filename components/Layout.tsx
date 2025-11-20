
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, X, Globe, LayoutList, ShieldCheck, Check, Crown, Menu, Users, Home, Calendar, Clock, Library } from 'lucide-react';
import { UserProfile } from '../types';
import { TRANSLATIONS } from '../constants';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenPremium?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onNavigate, onOpenPremium }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const { 
    appLanguage, 
    setAppLanguage, 
    setCurrentUser, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    account,
    searchQuery,
    setSearchQuery,
    signOut // Use signOut from store
  } = useAppStore();
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[appLanguage];
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            if (!searchQuery) setShowSearch(false); 
        }
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
            setShowNotifications(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.KeyboardEvent) => {
      if (e && e.key !== 'Enter') return;
      if (searchQuery.trim()) {
          onNavigate('search');
          setShowSearch(true);
          setShowMobileMenu(false);
      }
  };

  const navLinks = [
      { id: 'home', label: t.home, icon: <Home size={20} /> },
      { id: 'latest', label: t.latestEpisodes, icon: <Clock size={20} /> },
      { id: 'calendar', label: t.calendar, icon: <Calendar size={20} /> },
      { id: 'archive', label: t.archive, icon: <Library size={20} /> },
  ];

  const handleSignOut = () => {
      signOut(); // Supabase logout will trigger auth listener and clear state
  };

  return (
    <div className="min-h-screen bg-[#141414]">
      <AnimatePresence>
        {showMobileMenu && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => setShowMobileMenu(false)}
            >
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'tween', duration: 0.3 }}
                    className="absolute top-0 left-0 h-full w-[80%] max-w-sm bg-[#0a0a0a] p-6 flex flex-col shadow-2xl border-r border-gray-800"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-8">
                        <div className="text-[#E50914] font-black text-2xl tracking-tighter">ANIRIAS</div>
                        <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-[#222] rounded-full text-white hover:bg-[#333]"><X size={20} /></button>
                    </div>

                    <div className="flex items-center gap-3 mb-8 p-3 bg-[#181818] rounded-lg border border-gray-800">
                        <img src={user?.avatar} alt={user?.name} className="w-12 h-12 rounded object-cover" />
                        <div className="flex-1">
                             <p className="text-white font-bold">{user?.name}</p>
                             <p className="text-xs text-gray-400">{account.plan} Member</p>
                        </div>
                        <button onClick={() => setCurrentUser(null)} className="text-gray-400 hover:text-white"><Users size={20}/></button>
                    </div>

                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                        {navLinks.map(link => (
                            <div 
                                key={link.id}
                                onClick={() => { onNavigate(link.id); setShowMobileMenu(false); }}
                                className={`flex items-center gap-4 px-4 py-4 rounded-lg transition font-medium text-lg ${currentView === link.id ? 'bg-[#E50914] text-white shadow-lg' : 'text-gray-300 hover:bg-[#1f1f1f] hover:text-white'}`}
                            >
                                {link.icon}
                                {link.label}
                            </div>
                        ))}
                        <div className="h-px bg-gray-800 my-2"></div>
                        <div onClick={() => { onNavigate('list'); setShowMobileMenu(false); }} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1f1f1f] hover:text-white">
                            <LayoutList size={20} /> {t.myList}
                        </div>
                        <div onClick={() => { onNavigate('account'); setShowMobileMenu(false); }} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1f1f1f] hover:text-white">
                            <Globe size={20} /> {t.account}
                        </div>
                        {account.role === 'admin' && (
                            <div onClick={() => { onNavigate('admin'); setShowMobileMenu(false); }} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1f1f1f] hover:text-white">
                                <ShieldCheck size={20} className="text-[#E50914]" /> {t.adminPanel}
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <button 
                            onClick={handleSignOut}
                            className="w-full py-3 text-center text-gray-400 hover:text-white font-bold"
                        >
                            {t.signOut}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <nav className={`fixed top-0 left-0 w-full z-[60] transition-all duration-500 px-4 md:px-12 h-16 flex items-center justify-between ${scrolled ? 'bg-[#141414] shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        
        <div className="flex items-center gap-4 md:gap-8">
          <button className="md:hidden text-white p-1" onClick={() => setShowMobileMenu(true)}>
              <Menu size={28} />
          </button>

          <div 
            className="text-[#E50914] font-black text-2xl tracking-tighter cursor-pointer flex flex-col leading-none"
            onClick={() => onNavigate('home')}
          >
            <span>ANIRIAS</span>
            <span className="text-[8px] text-white tracking-widest opacity-60 text-center">ANIME PLATFORM</span>
          </div>

          <ul className="hidden md:flex items-center gap-6 text-sm text-gray-300 font-medium">
            {navLinks.map(link => (
                <li 
                    key={link.id}
                    className={`${currentView === link.id ? 'text-white font-bold' : 'hover:text-gray-400'} cursor-pointer transition`}
                    onClick={() => onNavigate(link.id)}
                >
                    {link.label}
                </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4 md:gap-6 text-white">
            <div ref={searchRef} className={`flex items-center border ${showSearch ? 'border-white bg-black/80 px-2 py-1 w-40 md:w-64' : 'border-transparent w-8'} transition-all duration-300 overflow-hidden rounded-full`}>
                <Search 
                    size={20} 
                    className="cursor-pointer hover:text-gray-300 min-w-[20px]" 
                    onClick={() => setShowSearch(!showSearch)} 
                />
                <input 
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    className={`bg-transparent border-none focus:outline-none text-sm ml-2 text-white w-full ${showSearch ? 'opacity-100' : 'opacity-0'}`}
                />
                {showSearch && searchQuery && (
                    <X 
                        size={16} 
                        className="cursor-pointer text-gray-400 hover:text-white" 
                        onClick={() => { setSearchQuery(''); if(currentView === 'search') onNavigate('home'); }} 
                    />
                )}
            </div>

            <div className="relative" ref={notifRef}>
                <div className="relative cursor-pointer hover:scale-110 transition" onClick={() => setShowNotifications(!showNotifications)}>
                    <Bell size={20} className="hover:text-gray-300" />
                    {unreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-[#E50914] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                            {unreadCount}
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {showNotifications && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full right-0 mt-4 w-80 md:w-96 bg-[#181818] border border-gray-800 rounded-lg shadow-2xl overflow-hidden origin-top-right"
                        >
                            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#1f1f1f]">
                                <span className="font-bold text-white">{t.notifications}</span>
                                <button 
                                    onClick={markAllNotificationsRead}
                                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 hover:underline" 
                                    title={t.markAllRead}
                                >
                                    <Check size={12} /> {t.markAllRead}
                                </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        className={`p-4 flex gap-3 border-b border-gray-800 hover:bg-[#252525] transition cursor-pointer relative group ${!n.read ? 'bg-[#252525]/50' : ''}`}
                                        onClick={() => markNotificationRead(n.id)}
                                    >
                                        <img src={n.image} alt="Thumb" className="w-16 h-10 object-cover rounded border border-gray-700" />
                                        <div className="flex-1">
                                            <p className={`text-sm text-gray-200 group-hover:text-white transition ${!n.read ? 'font-bold' : ''}`}>{n.title}</p>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-[#E50914] mt-1">{n.time}</p>
                                        </div>
                                        {!n.read && <div className="w-2 h-2 bg-[#E50914] rounded-full absolute top-4 right-4 shadow-[0_0_5px_#E50914]"></div>}
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                                        <Bell size={24} className="opacity-20"/>
                                        {t.noNotifications}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-2 cursor-pointer group relative z-50 hidden md:flex">
                <img src={user?.avatar} alt="User" className="w-8 h-8 rounded object-cover border border-gray-600" />
                <ChevronDown size={16} className="group-hover:rotate-180 transition duration-300" />
                
                <div className="absolute top-full right-0 mt-2 w-56 bg-black/95 border border-gray-800 rounded shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <div className="px-2 py-2 border-b border-gray-700 mb-1">
                         <p className="text-xs text-gray-400">Signed in as</p>
                         <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                         <span className="text-[10px] bg-[#E50914] px-1 rounded text-white font-bold">{account.plan}</span>
                    </div>
                    
                    <div 
                        className="text-sm text-gray-300 px-4 py-2 hover:bg-white/10 rounded flex items-center gap-3 transition"
                        onClick={() => onNavigate('list')}
                    >
                        <LayoutList size={16} /> {t.myList}
                    </div>
                    
                    <div 
                        className="text-sm text-gray-300 px-4 py-2 hover:bg-white/10 rounded flex items-center gap-3 transition"
                        onClick={() => onNavigate('account')}
                    >
                        <Globe size={16} /> {t.account}
                    </div>
                    
                    {account.role === 'admin' && (
                        <div 
                            className="text-sm text-gray-300 px-4 py-2 hover:bg-white/10 rounded flex items-center gap-3 transition"
                            onClick={() => onNavigate('admin')}
                        >
                            <ShieldCheck size={16} className="text-[#E50914]" /> {t.adminPanel}
                        </div>
                    )}

                     <div 
                        className="text-sm text-gray-300 px-4 py-2 hover:bg-white/10 rounded flex items-center gap-3 transition"
                        onClick={() => setCurrentUser(null)}
                    >
                        <Users size={16} /> {t.switchProfile}
                    </div>

                    <div className="h-px bg-gray-700 my-1"></div>
                    <div 
                        className="text-sm text-white px-4 py-2 hover:bg-[#E50914] rounded transition text-center font-semibold"
                        onClick={handleSignOut} 
                    >
                        {t.signOut}
                    </div>
                </div>
            </div>
        </div>
      </nav>

      <main className="relative z-0 min-h-screen">
        {children}
      </main>

      <footer className="py-12 px-4 md:px-12 text-gray-500 text-sm bg-[#0f0f0f] border-t border-gray-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <ul>
                <li className="mb-3 hover:text-white cursor-pointer transition" onClick={() => onNavigate('languages')}>{t.audioSubtitles}</li>
                <li className="mb-3 hover:text-white cursor-pointer transition" onClick={() => onNavigate('home')}>Media Center</li>
                <li className="mb-3 hover:text-white cursor-pointer transition">Privacy</li>
            </ul>
            <ul>
                <li className="mb-3 hover:text-white cursor-pointer transition" onClick={() => window.open('https://help.anirias.com', '_blank')}>Help Center</li>
                <li className="mb-3 hover:text-white cursor-pointer transition">Jobs</li>
                <li className="mb-3 hover:text-white cursor-pointer transition">Terms of Use</li>
            </ul>
            <ul>
                <li className="mb-3 hover:text-white cursor-pointer transition">Cookie Preferences</li>
                <li className="mb-3 hover:text-white cursor-pointer transition">Corporate Info</li>
                <li className="mb-3 hover:text-white cursor-pointer transition">Contact Us</li>
            </ul>
             <ul>
                 <li 
                    className="mb-3 text-[#E50914] font-bold cursor-pointer flex items-center gap-2"
                    onClick={onOpenPremium}
                >
                    <Crown size={16} /> Anirias Premium
                </li>
                 <li className="mb-3 hover:text-white cursor-pointer">Get the App</li>
            </ul>
        </div>

        <div className="max-w-5xl mx-auto mb-6">
             <div className="flex gap-2 mb-4">
                <button onClick={() => setAppLanguage('tr')} className={`text-xs px-3 py-1 border ${appLanguage === 'tr' ? 'border-[#E50914] text-[#E50914]' : 'border-gray-700 text-gray-500'} rounded hover:text-white transition`}>Türkçe</button>
                <button onClick={() => setAppLanguage('en')} className={`text-xs px-3 py-1 border ${appLanguage === 'en' ? 'border-[#E50914] text-[#E50914]' : 'border-gray-700 text-gray-500'} rounded hover:text-white transition`}>English</button>
                <button onClick={() => setAppLanguage('de')} className={`text-xs px-3 py-1 border ${appLanguage === 'de' ? 'border-[#E50914] text-[#E50914]' : 'border-gray-700 text-gray-500'} rounded hover:text-white transition`}>Deutsch</button>
             </div>
        </div>

        <div className="max-w-5xl mx-auto text-xs opacity-50">
            {t.footerCopy}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
