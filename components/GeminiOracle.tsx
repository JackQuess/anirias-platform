
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { getAnimeRecommendation } from '../services/geminiService';
import { Anime } from '../types';
import { useAppStore } from '../store';
import { TRANSLATIONS } from '../constants';

interface GeminiOracleProps {
  currentContext: Anime | null;
}

interface Message {
  sender: 'user' | 'oracle';
  text: string;
}

const GeminiOracle: React.FC<GeminiOracleProps> = ({ currentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const { appLanguage } = useAppStore();
  const t = TRANSLATIONS[appLanguage];

  const [messages, setMessages] = useState<Message[]>([
    { sender: 'oracle', text: t.oracleGreeting }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Update initial greeting when language changes
  useEffect(() => {
      setMessages([{ sender: 'oracle', text: t.oracleGreeting }]);
  }, [appLanguage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg = query;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setQuery('');
    setIsLoading(true);

    const response = await getAnimeRecommendation(userMsg, currentContext, appLanguage);

    setMessages(prev => [...prev, { sender: 'oracle', text: response }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-[90] ${isOpen ? 'bg-gray-800 rotate-45' : 'bg-gradient-to-br from-[#E50914] to-purple-600 hover:scale-110'}`}
      >
        {isOpen ? <PlusIcon /> : <Sparkles size={24} className="text-white animate-pulse" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-80 md:w-96 h-[500px] bg-[#1a1a1a] rounded-xl border border-gray-700 shadow-2xl z-[90] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#E50914] to-purple-900 p-4 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Sparkles size={16} /> {t.oracleTitle}
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#141414]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.sender === 'user' 
                    ? 'bg-gray-700 text-white rounded-br-none' 
                    : 'bg-[#E50914]/20 border border-[#E50914]/30 text-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#E50914]/10 p-3 rounded-lg flex gap-1">
                  <span className="w-2 h-2 bg-[#E50914] rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-[#E50914] rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-[#E50914] rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-[#1a1a1a] border-t border-gray-700">
            <div className="relative">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.oraclePlaceholder}
                className="w-full bg-black border border-gray-600 rounded-full py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#E50914] hover:text-white transition"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper for the Close Icon
const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default GeminiOracle;