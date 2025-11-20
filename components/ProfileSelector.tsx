
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { TRANSLATIONS, DXD_AVATARS } from '../constants';
import { UserProfile, LANGUAGES } from '../types';
import { PlusCircle, Pencil, Trash2, Lock, X } from 'lucide-react';

interface ProfileSelectorProps {
  onSelect: (profile: UserProfile) => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({ onSelect }) => {
  const { profiles, addProfile, editProfile, deleteProfile, appLanguage } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [newName, setNewName] = useState('');
  const [isKid, setIsKid] = useState(false);
  const [selectedLang, setSelectedLang] = useState('Turkish');
  const [tempAvatar, setTempAvatar] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  const t = TRANSLATIONS[appLanguage];

  const handleAddProfile = () => {
      if(newName.trim()) {
          addProfile(newName, isKid);
          resetForm();
      }
  };

  const handleStartEdit = (profile: UserProfile) => {
      setEditingProfile(profile);
      setNewName(profile.name);
      setIsKid(profile.isKid);
      setSelectedLang(profile.language || 'Turkish');
      setTempAvatar(profile.avatar);
  };

  const handleSaveEdit = () => {
      if (editingProfile && newName.trim()) {
          editProfile(editingProfile.id, {
              name: newName,
              isKid: isKid,
              language: selectedLang,
              avatar: tempAvatar
          });
          setEditingProfile(null);
          resetForm();
      }
  };

  const handleDelete = () => {
       if (editingProfile) {
          deleteProfile(editingProfile.id);
          setEditingProfile(null);
          resetForm();
      }
  };

  const resetForm = () => {
      setNewName('');
      setIsKid(false);
      setSelectedLang('Turkish');
      setTempAvatar('');
      setIsAdding(false);
      setEditingProfile(null);
      setShowAvatarPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-[#141414] flex flex-col items-center justify-center animate-fade-in z-50">
      <h1 className="text-4xl md:text-5xl font-medium text-white mb-12 tracking-tight">
          {isManaging ? t.manageProfiles : t.whosWatching}
      </h1>
      
      <div className="flex flex-wrap gap-8 justify-center px-4">
        {profiles.map((profile) => (
          <div 
            key={profile.id} 
            className="group flex flex-col items-center cursor-pointer relative"
            onClick={() => {
                if (isManaging) handleStartEdit(profile);
                else onSelect(profile);
            }}
          >
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-md overflow-hidden border-2 transition-all duration-200 mb-4 relative ${isManaging ? 'border-gray-500 opacity-60 hover:opacity-100 hover:border-white' : 'border-transparent hover:border-white hover:scale-105'}`}>
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              
              {isManaging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="bg-black/80 border border-white rounded-full p-2">
                          <Pencil size={20} className="text-white" />
                      </div>
                  </div>
              )}
            </div>
            <span className={`text-lg transition-colors font-medium ${isManaging ? 'text-gray-500' : 'text-gray-400 group-hover:text-white'}`}>{profile.name}</span>
            {profile.isKid && <div className="text-[10px] uppercase text-gray-500 mt-1 tracking-widest">Kids</div>}
          </div>
        ))}

        {!isAdding && !isManaging && profiles.length < 5 && (
            <div 
                className="group flex flex-col items-center cursor-pointer"
                onClick={() => setIsAdding(true)}
            >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-md flex items-center justify-center bg-transparent border-2 border-gray-600 group-hover:bg-white group-hover:border-white transition-all duration-200 mb-4 hover:scale-105">
                    <PlusCircle size={48} className="text-gray-600 group-hover:text-black" />
                </div>
                <span className="text-gray-400 text-lg group-hover:text-white transition-colors">{t.addProfile}</span>
            </div>
        )}
      </div>

      {!isAdding && !editingProfile && (
        <button 
            onClick={() => setIsManaging(!isManaging)}
            className={`mt-16 border px-8 py-2.5 tracking-widest transition uppercase text-sm font-bold ${isManaging ? 'bg-white text-black border-white hover:bg-[#c1c1c1]' : 'bg-transparent border-gray-500 text-gray-400 hover:text-white hover:border-white'}`}
        >
            {isManaging ? t.done : t.manageProfiles}
        </button>
      )}

      {/* Add/Edit Modal */}
      {(isAdding || editingProfile) && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-60 animate-in fade-in p-4">
              <div className="bg-[#141414] border border-gray-800 p-8 rounded max-w-lg w-full shadow-2xl relative">
                  
                  {showAvatarPicker ? (
                       <div className="animate-in fade-in">
                           <h2 className="text-2xl text-white mb-6 font-bold flex justify-between items-center">
                               Choose Icon
                               <button onClick={() => setShowAvatarPicker(false)}><X className="text-gray-400 hover:text-white"/></button>
                           </h2>
                           <div className="grid grid-cols-3 gap-4 max-h-64 overflow-y-auto p-2">
                               {DXD_AVATARS.map((avatar) => (
                                   <div 
                                    key={avatar.name} 
                                    className="cursor-pointer hover:scale-105 transition"
                                    onClick={() => { setTempAvatar(avatar.url); setShowAvatarPicker(false); }}
                                   >
                                       <img src={avatar.url} className="w-24 h-24 rounded object-cover border border-gray-600 hover:border-white" />
                                   </div>
                               ))}
                           </div>
                       </div>
                  ) : (
                      <>
                        <h2 className="text-3xl text-white mb-2 font-medium">
                            {editingProfile ? t.editProfile : t.addProfile}
                        </h2>
                        {editingProfile && <p className="text-gray-400 text-sm mb-6 uppercase tracking-wide">Profile Preferences</p>}
                        
                        <div className="flex flex-col md:flex-row gap-6 mb-8 mt-6">
                            <div className="relative cursor-pointer group" onClick={() => editingProfile && setShowAvatarPicker(true)}>
                                <img 
                                        src={tempAvatar || (editingProfile ? editingProfile.avatar : "https://picsum.photos/seed/new/200")} 
                                        alt="Profile" 
                                        className="w-32 h-32 rounded shadow-lg object-cover" 
                                />
                                {editingProfile && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded">
                                        <Pencil size={24} className="text-white" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 space-y-4">
                                <div>
                                    <input 
                                            type="text" 
                                            placeholder={t.name} 
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full bg-[#333] text-white px-4 py-3 rounded border border-transparent focus:border-white focus:outline-none placeholder-gray-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wide">{t.language}</label>
                                    <select 
                                            value={selectedLang}
                                            onChange={(e) => setSelectedLang(e.target.value)}
                                            className="w-full bg-black text-white px-3 py-2 text-sm border border-gray-700 focus:border-white rounded"
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.name}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer select-none border border-gray-700 p-3 rounded hover:border-gray-500 transition">
                                    <div className={`w-5 h-5 border flex items-center justify-center ${isKid ? 'bg-white border-white' : 'border-gray-500'}`}>
                                        {isKid && <div className="w-3 h-3 bg-black"></div>}
                                    </div>
                                    <input 
                                            type="checkbox" 
                                            checked={isKid}
                                            onChange={(e) => setIsKid(e.target.checked)}
                                            className="hidden"
                                    />
                                    <span className="text-white text-sm font-bold">{t.kidProfile}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-gray-800">
                            <button 
                                onClick={editingProfile ? handleSaveEdit : handleAddProfile}
                                className="bg-white text-black font-bold px-6 py-2 hover:bg-[#c1c1c1] transition"
                            >
                                {t.save}
                            </button>
                            <button 
                                onClick={resetForm}
                                className="border border-gray-500 text-gray-500 font-bold px-6 py-2 hover:border-white hover:text-white transition"
                            >
                                {t.cancel}
                            </button>

                            {editingProfile && (
                                <button 
                                    onClick={handleDelete}
                                    className="ml-auto border border-gray-500 text-gray-500 hover:border-red-600 hover:text-red-600 px-4 py-2 transition flex items-center gap-2"
                                >
                                    {t.deleteProfile} <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default ProfileSelector;