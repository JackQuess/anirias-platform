import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { Anime, Episode, ContentType } from '../types';
import { 
  X, Plus, Trash2, Layers, Pencil, Search, Download, 
  Database, Loader2, CheckCircle2, MinusCircle, Upload, ListPlus, Image as ImageIcon,
} from 'lucide-react';
import { searchAnimeOnJikan, fetchEpisodesFromJikan } from '../services/jikanService';
import { TRANSLATIONS } from '../constants';
import { uploadFile } from '../services/supabaseClient';

const AdminPanel: React.FC = () => {
  const { content, addAnime, updateAnime, deleteAnime, addEpisode, updateEpisode, deleteEpisode, appLanguage } = useAppStore();
  const t = TRANSLATIONS[appLanguage];
  
  // --- UI State ---
  const [rightPanelView, setRightPanelView] = useState<'empty' | 'edit_anime' | 'manage_episodes'>('empty');
  const [selectedAnimeId, setSelectedAnimeId] = useState<string | null>(null);
  const [searchLibraryQuery, setSearchLibraryQuery] = useState('');
  const [loadingStates, setLoadingStates] = useState({
    saveAnime: false,
    deleteAnime: null as string | null,
    saveEpisode: false,
    deleteEpisode: null as number | null,
    importing: false,
    fetchingRelations: false,
    uploading: false
  });

  // --- Import Modal State ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'metadata' | 'episodes'>('metadata');
  const [importStep, setImportStep] = useState<'search' | 'results' | 'downloading'>('search');
  const [importQuery, setImportQuery] = useState('');
  const [importResults, setImportResults] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState('');
  const [importQueue, setImportQueue] = useState<{ jikanId: number; title: string; thumbnail: string; targetSeason: number }[]>([]);

  // --- Forms ---
  const [animeForm, setAnimeForm] = useState<Partial<Anime>>({});
  const [tagInput, setTagInput] = useState('');
  const [editingEpisodeId, setEditingEpisodeId] = useState<number | null>(null);
  const [episodeForm, setEpisodeForm] = useState<Partial<Episode>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null); 
  
  // --- Memos & Derived State ---
  const filteredLibrary = useMemo(() => {
      return content
          .filter(a => a.title.toLowerCase().includes(searchLibraryQuery.toLowerCase()))
          .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
  }, [content, searchLibraryQuery]);

  const selectedAnime = content.find(a => a.id === selectedAnimeId);

  const episodesBySeason = useMemo<Record<string, Episode[]>>(() => {
      if (!selectedAnime) return {};
      const groups: Record<string, Episode[]> = {};
      selectedAnime.episodes.forEach(ep => {
          const season = (ep.seasonNumber || 1).toString();
          if (!groups[season]) groups[season] = [];
          groups[season].push(ep);
      });
      for (const season in groups) {
          groups[season].sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
      }
      return groups;
  }, [selectedAnime]);

  useEffect(() => {
      if (selectedAnimeId && !content.some(a => a.id === selectedAnimeId)) {
          setRightPanelView('empty');
          setSelectedAnimeId(null);
      }
  }, [content, selectedAnimeId]);

  // --- Handlers ---
  const handleSelectAnime = (anime: Anime) => {
    setSelectedAnimeId(anime.id);
    setRightPanelView('manage_episodes');
    setEpisodeForm({});
    setEditingEpisodeId(null);
  };

  const handleAddNewAnime = () => {
    setSelectedAnimeId(null);
    setAnimeForm({ 
        title: '', 
        description: '', 
        thumbnail: '', 
        heroImage: '', 
        year: new Date().getFullYear(), 
        ageRating: 'PG-13', 
        tags: [], 
        type: ContentType.SERIES, 
        status: 'Upcoming', 
        episodes: [] 
    });
    setTagInput('');
    setRightPanelView('edit_anime');
  };

  const handleEditAnimeMetadata = (anime: Anime) => {
    setSelectedAnimeId(anime.id);
    setAnimeForm(anime);
    setTagInput(anime.tags.join(', '));
    setRightPanelView('edit_anime');
  };

  const handleSaveAnime = async () => {
      if (!animeForm.title) return alert('Title is required.');
      setLoadingStates(prev => ({...prev, saveAnime: true}));
      try {
          const processedTags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
          const finalData = { ...animeForm, tags: processedTags };
          
          if (selectedAnimeId) { 
              await updateAnime(selectedAnimeId, finalData);
              setRightPanelView('manage_episodes');
          } else { 
              const newAnime = await addAnime(finalData as any);
              setSelectedAnimeId(newAnime.id);
              setRightPanelView('manage_episodes');
          }
      } catch (e) {
          console.error("Save Anime Error:", e);
          alert('Failed to save anime.');
      } finally {
          setLoadingStates(prev => ({...prev, saveAnime: false}));
      }
  };

  const handleDeleteAnime = async (e: React.MouseEvent, animeId: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete this anime? This cannot be undone.`)) return;
    setLoadingStates(prev => ({ ...prev, deleteAnime: animeId }));
    try {
        await deleteAnime(animeId);
    } catch (e) {
        console.error(e);
        alert('Failed to delete anime.');
    } finally {
        setLoadingStates(prev => ({ ...prev, deleteAnime: null }));
    }
  };

  const handleSaveEpisode = async () => {
      if (!selectedAnimeId || !episodeForm.title) return alert('Episode Title is required');
      setLoadingStates(prev => ({...prev, saveEpisode: true}));
      try {
          if (editingEpisodeId) {
              await updateEpisode(selectedAnimeId, editingEpisodeId, episodeForm);
          } else {
              const newEp = { ...episodeForm as Omit<Episode, 'id'>, id: Date.now() };
              await addEpisode(selectedAnimeId, newEp as Episode);
          }
          setEpisodeForm({});
          setEditingEpisodeId(null);
      } catch (e) {
          console.error("Save Episode Error:", e);
          alert('Failed to save episode. Check console for details.');
      } finally {
          setLoadingStates(prev => ({...prev, saveEpisode: false}));
      }
  };

  const handleDeleteEpisode = async (episodeId: number) => {
      if (!selectedAnimeId || !window.confirm("Delete this episode?")) return;
      setLoadingStates(prev => ({ ...prev, deleteEpisode: episodeId }));
      try {
          await deleteEpisode(selectedAnimeId, episodeId);
      } catch (e) {
          console.error(e);
          alert('Failed to delete episode.');
      } finally {
          setLoadingStates(prev => ({ ...prev, deleteEpisode: null }));
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingStates(prev => ({ ...prev, uploading: true }));

    try {
        const publicUrl = await uploadFile(file, 'videos'); 
        if (publicUrl) {
            setEpisodeForm(prev => ({ ...prev, videoUrl: publicUrl }));
        } else {
            alert("Upload failed. Check console.");
        }
    } catch (error) {
        console.error("Upload Error:", error);
        alert("An error occurred during upload.");
    } finally {
        setLoadingStates(prev => ({ ...prev, uploading: false }));
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  // --- Import Handlers ---
  const openImportModal = (mode: 'metadata' | 'episodes') => {
      if (mode === 'episodes' && !selectedAnime) return;
      setImportMode(mode);
      setImportQuery(mode === 'episodes' ? selectedAnime!.title : '');
      setImportStep('search');
      setImportResults([]);
      setImportQueue([]);
      setShowImportModal(true);
  };

  const handleImportSearch = async () => {
    if (!importQuery.trim()) return;
    setLoadingStates(p => ({...p, importing: true}));
    setImportStatus('Searching Jikan DB...');
    try {
        const results = await searchAnimeOnJikan(importQuery);
        setImportResults(results);
        setImportStep('results');
    } catch (error) {
        console.error("Search Error:", error);
    } finally {
        setLoadingStates(p => ({...p, importing: false}));
    }
  };

  const handleAddToQueue = (item: any) => {
      if (importQueue.find(q => q.jikanId === item.jikanId)) return;
      const maxSeason = importQueue.length > 0 ? Math.max(...importQueue.map(q => q.targetSeason)) : 0;
      setImportQueue([...importQueue, { jikanId: item.jikanId, title: item.title, thumbnail: item.thumbnail, targetSeason: maxSeason + 1 }]);
  };

  const handleFillMetadata = (item: Partial<Anime>) => {
    setAnimeForm(prev => ({ ...prev, ...item }));
    setTagInput(item.tags?.join(', ') || '');
    setShowImportModal(false);
  }

  const handleBatchImportEpisodes = async () => {
      if (!selectedAnimeId || !selectedAnime || importQueue.length === 0) return;
      setImportStep('downloading');
      setLoadingStates(p => ({...p, importing: true}));
      try {
          const queue = [...importQueue].sort((a, b) => a.targetSeason - b.targetSeason);
          for (const item of queue) {
              setImportStatus(`Fetching: ${item.title} (S${item.targetSeason})...`);
              const episodes = await fetchEpisodesFromJikan(item.jikanId, item.targetSeason, selectedAnime.thumbnail || item.thumbnail, setImportStatus);
              if (episodes.length > 0) {
                  const taggedEpisodes = episodes.map(ep => ({ ...ep, seasonNumber: item.targetSeason }));
                  await addEpisode(selectedAnimeId, taggedEpisodes);
              }
              await new Promise(r => setTimeout(r, 1500)); 
          }
          alert(`Batch Import Complete!`);
      } catch (e) {
          console.error(e);
          alert('Batch import failed. Check console.');
      } finally {
          setShowImportModal(false);
          setLoadingStates(p => ({...p, importing: false}));
      }
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-[#141414] pb-20 text-white w-full">
        
        {/* IMPORT MODAL */}
        {showImportModal && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#1f1f1f] border border-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                           <Database size={18} className="text-[#E50914]" />
                           {importMode === 'metadata' ? t.adminImportJikan : `Import Episodes for ${selectedAnime?.title}`}
                        </h2>
                        <button onClick={() => setShowImportModal(false)}><X className="text-gray-500 hover:text-white"/></button>
                    </div>

                    {importStep === 'search' && (
                        <div className="p-8 flex-1 flex flex-col items-center justify-center">
                            <input type="text" value={importQuery} onChange={e => setImportQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleImportSearch()} placeholder={t.adminSearchPlaceholder} className="w-full max-w-lg bg-[#141414] border border-gray-700 rounded py-3 px-4 text-lg focus:border-[#E50914] outline-none"/>
                            <button onClick={handleImportSearch} disabled={loadingStates.importing} className="mt-4 bg-[#E50914] px-8 py-3 rounded font-bold flex items-center gap-2 disabled:opacity-50">
                                {loadingStates.importing ? <><Loader2 className="animate-spin"/> Searching...</> : <>Search <Search/></>}
                            </button>
                        </div>
                    )}

                    {importStep === 'results' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                           <div className={`grid ${importMode === 'episodes' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 h-full overflow-hidden`}>
                               <div className="p-4 overflow-y-auto custom-scrollbar">
                                   <h3 className="text-sm text-gray-400 mb-2">Results ({importResults.length})</h3>
                                    {importResults.map(item => (
                                        <div key={item.jikanId} className="flex gap-3 p-2 bg-[#2a2a2a] rounded mb-2 items-center">
                                            <img src={item.thumbnail} className="w-12 h-16 object-cover rounded" alt={item.title}/>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate">{item.title}</p>
                                                <p className="text-xs text-gray-400">{item.year} - {item.studio}</p>
                                            </div>
                                            {importMode === 'metadata' ? (
                                                <button onClick={() => handleFillMetadata(item)} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1"><Upload size={14}/> Fill</button>
                                            ) : !importQueue.find(q => q.jikanId === item.jikanId) ? (
                                                <button onClick={() => handleAddToQueue(item)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1"><ListPlus size={14}/> Add</button>
                                            ) : (
                                                 <span className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14}/> Queued</span>
                                            )}
                                        </div>
                                    ))}
                               </div>
                               {importMode === 'episodes' && (
                                   <div className="p-4 bg-[#141414] overflow-y-auto custom-scrollbar border-l border-gray-800">
                                       <h3 className="text-sm text-gray-400 mb-2">Import Queue ({importQueue.length})</h3>
                                       {importQueue.map((item) => (
                                           <div key={item.jikanId} className="flex gap-3 p-2 bg-[#2a2a2a] rounded mb-2 items-center">
                                                <img src={item.thumbnail} className="w-12 h-16 object-cover rounded" alt={item.title}/>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold truncate">{item.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-400">Season:</span>
                                                        <input type="number" value={item.targetSeason} onChange={e => setImportQueue(q => q.map(i => i.jikanId === item.jikanId ? {...i, targetSeason: Number(e.target.value)} : i))} className="w-16 bg-black border border-gray-600 rounded px-2 py-1 text-sm"/>
                                                    </div>
                                                </div>
                                                <button onClick={() => setImportQueue(q => q.filter(i => i.jikanId !== item.jikanId))} className="text-red-500"><MinusCircle size={16}/></button>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
                           {importMode === 'episodes' && <div className="p-4 border-t border-gray-800 flex justify-end">
                                <button onClick={handleBatchImportEpisodes} disabled={importQueue.length === 0} className="bg-[#E50914] px-6 py-3 rounded font-bold disabled:bg-gray-600 flex items-center gap-2">
                                   Import {importQueue.length} Series
                                </button>
                           </div>}
                        </div>
                    )}
                    
                    {importStep === 'downloading' && (
                        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                            <Loader2 size={48} className="animate-spin text-[#E50914] mb-4"/>
                            <p className="font-bold text-lg">Importing Episodes...</p>
                            <p className="text-sm text-gray-400 mt-1">{importStatus}</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        <h1 className="text-3xl font-bold flex items-center gap-3 mb-6"><Layers className="text-[#E50914]" /> {t.adminPanel}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-160px)]">
            
            {/* --- LEFT: ANIME LIST --- */}
            <div className="lg:col-span-4 xl:col-span-3 bg-[#1f1f1f] rounded-xl border border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 space-y-3">
                    <button onClick={handleAddNewAnime} className="w-full bg-[#E50914] hover:bg-red-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2"><Plus size={20} /> {t.adminAddAnime}</button>
                    <input type="text" placeholder="Search library..." value={searchLibraryQuery} onChange={e => setSearchLibraryQuery(e.target.value)} className="w-full bg-[#141414] border border-gray-700 rounded py-2 px-4 text-sm" />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {filteredLibrary.map(anime => (
                        <div key={anime.id} onClick={() => handleSelectAnime(anime)} className={`group flex gap-3 p-2 rounded cursor-pointer border ${selectedAnimeId === anime.id ? 'bg-[#2a2a2a] border-gray-600' : 'border-transparent hover:bg-[#252525]'}`}>
                            <img src={anime.thumbnail} className="w-14 h-20 object-cover rounded" alt={anime.title} />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm truncate">{anime.title}</h3>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${anime.status === 'Ongoing' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>{anime.status}</span>
                            </div>
                            <button onClick={(e) => handleDeleteAnime(e, anime.id)} disabled={loadingStates.deleteAnime === anime.id} className="p-2 text-gray-500 hover:text-red-500">
                                {loadingStates.deleteAnime === anime.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* --- RIGHT: EDITOR PANEL --- */}
            <div className="lg:col-span-8 xl:col-span-9 bg-[#1f1f1f] rounded-xl border border-gray-800 flex flex-col">
                {rightPanelView === 'empty' && <div className="flex-1 flex items-center justify-center text-gray-500 flex-col"><Layers size={48} className="opacity-20 mb-2"/><span>Select an anime or add a new one.</span></div>}
                
                {rightPanelView === 'edit_anime' && (
                    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{selectedAnimeId ? 'Edit Anime' : 'Add New Anime'}</h2>
                            <button onClick={() => openImportModal('metadata')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"><Database size={16} /> Auto-Fill</button>
                        </div>
                        
                        {/* Anime Form */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <input value={animeForm.title || ''} onChange={e => setAnimeForm({...animeForm, title: e.target.value})} placeholder="Title" className="col-span-2 bg-[#141414] border border-gray-700 rounded p-2"/>
                            <textarea value={animeForm.description || ''} onChange={e => setAnimeForm({...animeForm, description: e.target.value})} placeholder="Description" className="col-span-2 bg-[#141414] border border-gray-700 rounded p-2 h-24"/>
                            
                            {/* Image URLs */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><ImageIcon size={12}/> Poster URL</label>
                                <input value={animeForm.thumbnail || ''} onChange={e => setAnimeForm({...animeForm, thumbnail: e.target.value})} placeholder="https://..." className="w-full bg-[#141414] border border-gray-700 rounded p-2"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><ImageIcon size={12}/> Hero Image URL</label>
                                <input value={animeForm.heroImage || ''} onChange={e => setAnimeForm({...animeForm, heroImage: e.target.value})} placeholder="https://... (Wide)" className="w-full bg-[#141414] border border-gray-700 rounded p-2"/>
                            </div>

                            <input value={animeForm.year || ''} type="number" onChange={e => setAnimeForm({...animeForm, year: Number(e.target.value)})} placeholder="Year" className="bg-[#141414] border border-gray-700 rounded p-2"/>
                            <input value={animeForm.ageRating || ''} onChange={e => setAnimeForm({...animeForm, ageRating: e.target.value})} placeholder="Age Rating" className="bg-[#141414] border border-gray-700 rounded p-2"/>
                            <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Tags (comma separated)" className="col-span-2 bg-[#141414] border border-gray-700 rounded p-2"/>
                            <input value={animeForm.studio || ''} onChange={e => setAnimeForm({...animeForm, studio: e.target.value})} placeholder="Studio" className="bg-[#141414] border border-gray-700 rounded p-2"/>
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button className="px-6 py-3 text-gray-400" onClick={() => setRightPanelView('empty')}>Cancel</button>
                            <button onClick={handleSaveAnime} disabled={loadingStates.saveAnime} className="px-6 py-3 bg-[#E50914] text-white rounded font-bold flex items-center gap-2">
                                {loadingStates.saveAnime && <Loader2 size={16} className="animate-spin" />}
                                {loadingStates.saveAnime ? 'Saving...' : 'Save Anime'}
                            </button>
                        </div>
                    </div>
                )}

                {rightPanelView === 'manage_episodes' && selectedAnime && (
                    <div className="flex flex-col h-full">
                         <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">{selectedAnime.title}</h2>
                                <p className="text-sm text-gray-400">{selectedAnime.episodes.length} Episodes</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openImportModal('episodes')} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-sm"><Download size={16} /> Auto Import Episodes</button>
                                <button onClick={() => handleEditAnimeMetadata(selectedAnime)} className="border border-gray-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2"><Pencil size={16}/> Edit Details</button>
                            </div>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            
                            {/* --- EPISODE EDITOR (LEFT) --- */}
                            <div className="w-1/2 lg:w-1/3 bg-[#1a1a1a] p-6 border-r border-gray-800 overflow-y-auto custom-scrollbar">
                                <h3 className="font-bold text-[#E50914] mb-4">{editingEpisodeId ? 'Edit Episode' : 'Add Single Episode'}</h3>
                                <div className="space-y-3 text-sm">
                                    <input value={episodeForm.title || ''} onChange={e => setEpisodeForm({...episodeForm, title: e.target.value})} placeholder="Episode Title" className="w-full bg-black border border-gray-700 rounded p-2"/>
                                    
                                    {/* Video Upload */}
                                    <div className="flex gap-2">
                                      <input 
                                          value={episodeForm.videoUrl || ''} 
                                          onChange={e => setEpisodeForm({...episodeForm, videoUrl: e.target.value})} 
                                          placeholder="Video Source URL (.mp4)" 
                                          className="w-full bg-black border border-gray-700 rounded p-2"
                                      />
                                      <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        disabled={loadingStates.uploading}
                                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded flex items-center justify-center disabled:opacity-50"
                                        title="Upload Video"
                                      >
                                          {loadingStates.uploading ? <Loader2 size={18} className="animate-spin"/> : <Upload size={18}/>}
                                      </button>
                                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="video/mp4,video/webm"/>
                                    </div>

                                    <input value={episodeForm.thumbnail || ''} onChange={e => setEpisodeForm({...episodeForm, thumbnail: e.target.value})} placeholder="Thumbnail URL" className="w-full bg-black border border-gray-700 rounded p-2"/>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Season</label>
                                        <input type="number" value={episodeForm.seasonNumber || 1} onChange={e => setEpisodeForm({...episodeForm, seasonNumber: Number(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2"/>
                                      </div>
                                      {/* --- DÜZELTİLEN KISIM --- */}
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Episode #</label>
                                        <input 
                                            type="number" 
                                            // id yerine episodeNumber'a bağladık
                                            value={episodeForm.episodeNumber || ''} 
                                            onChange={e => setEpisodeForm({...episodeForm, episodeNumber: parseInt(e.target.value)})} 
                                            placeholder="1"
                                            className="w-full bg-black border border-gray-700 rounded p-2"
                                        />
                                      </div>
                                      {/* ----------------------- */}
                                    </div>
                                </div>
                                <button onClick={handleSaveEpisode} disabled={loadingStates.saveEpisode} className="w-full bg-white text-black font-bold py-3 rounded mt-4 flex items-center justify-center gap-2 hover:bg-gray-200">
                                    {loadingStates.saveEpisode && <Loader2 size={16} className="animate-spin" />}
                                    {editingEpisodeId ? 'Update' : 'Add'} Episode
                                </button>
                                {editingEpisodeId && <button onClick={() => { setEditingEpisodeId(null); setEpisodeForm({}); }} className="w-full text-gray-500 mt-2 text-sm hover:text-white">Cancel Edit</button>}
                            </div>

                            {/* --- EPISODE LIST (RIGHT) --- */}
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                {Object.keys(episodesBySeason).length > 0 ? Object.entries(episodesBySeason).map(([season, eps]) => (
                                    <div key={season} className="mb-6">
                                        <h4 className="font-bold mb-3 text-gray-400 text-sm uppercase tracking-wider">Season {season}</h4>
                                        <div className="space-y-1">
                                            {(eps as Episode[]).map(ep => (
                                                <div key={ep.id} className="flex items-center justify-between p-3 bg-[#252525] hover:bg-[#2a2a2a] rounded border border-transparent hover:border-gray-600 group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <span className="text-[#E50914] font-mono text-xs w-6">#{ep.episodeNumber}</span>
                                                        <span className="text-sm truncate font-medium">{ep.title}</span>
                                                        {!ep.videoUrl && <span className="text-[10px] bg-red-900/50 text-red-400 px-1 rounded">No Video</span>}
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEpisodeForm(ep); setEditingEpisodeId(ep.id); }} className="p-1 text-blue-400 hover:bg-blue-900/30 rounded"><Pencil size={14} /></button>
                                                        <button onClick={() => handleDeleteEpisode(ep.id)} disabled={loadingStates.deleteEpisode === ep.id} className="p-1 text-red-400 hover:bg-red-900/30 rounded">
                                                            {loadingStates.deleteEpisode === ep.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : <p className="text-gray-500 text-center mt-8">No episodes added yet.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AdminPanel;