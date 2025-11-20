
import React, { useState } from 'react';
import { UserProfile, LANGUAGES } from '../types';
import { ChevronDown, ChevronUp, CreditCard, Lock, Crown, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import PremiumModal from './PremiumModal';

interface AccountPageProps {
  user: UserProfile;
}

const AccountPage: React.FC<AccountPageProps> = ({ user }) => {
  const { updateUserPreferences, profiles, account, cancelSubscription, clearWatchHistory } = useAppStore();
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const toggleProfile = (id: string) => {
    setExpandedProfile(expandedProfile === id ? null : id);
  };

  const handleLanguageChange = (lang: string) => {
    updateUserPreferences(user.id, { language: lang });
  };

  const toggleAutoplay = (key: 'autoplayNext' | 'autoplayPreviews') => {
    updateUserPreferences(user.id, { [key]: !user[key] });
  };

  const handleCancel = () => {
      if(window.confirm("Are you sure you want to cancel your premium benefits?")) {
          cancelSubscription();
      }
  }

  const handleClearHistory = () => {
      if(window.confirm("This will wipe all your 'Continue Watching' progress. Are you sure?")) {
          clearWatchHistory();
      }
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] pt-20 pb-10 px-4">
      
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl text-[#333] font-normal mb-6 border-b border-[#999] pb-4">Account</h1>

        {/* Membership & Billing */}
        <div className="flex flex-col md:flex-row gap-4 py-4 border-b border-[#ccc]">
          <div className="w-full md:w-1/4">
            <h2 className="text-[#737373] text-lg font-medium uppercase tracking-wide">Membership & Billing</h2>
            {account.plan !== 'Free' && (
                <button 
                    onClick={handleCancel}
                    className="mt-4 bg-[#e6e6e6] hover:bg-[#ccc] text-black shadow py-3 px-4 text-sm font-medium w-full transition"
                >
                Cancel Membership
                </button>
            )}
          </div>
          <div className="w-full md:w-3/4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-[#333]">{account.email}</span>
              <a href="#" className="text-[#0071eb] hover:underline text-sm">Change email</a>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#737373] text-sm">Password: ********</span>
              <a href="#" className="text-[#0071eb] hover:underline text-sm">Change password</a>
            </div>
            <div className="bg-[#f4f4f4] border-t border-[#ccc] pt-4 mt-4">
               <div className="flex items-center gap-2 mb-2">
                 <CreditCard size={20} className="text-[#737373]" />
                 <span className="font-bold text-[#333]">•••• •••• •••• {account.cardLast4}</span>
                 <span className="ml-auto text-sm font-bold">Next Bill: {account.nextBillingDate}</span>
               </div>
               <a href="#" className="text-[#0071eb] hover:underline text-sm block text-right">Manage payment info</a>
            </div>
          </div>
        </div>

        {/* Plan Details */}
        <div className="flex flex-col md:flex-row gap-4 py-6 border-b border-[#ccc]">
           <div className="w-full md:w-1/4">
              <h2 className="text-[#737373] text-lg font-medium uppercase tracking-wide">Plan Details</h2>
           </div>
           <div className="w-full md:w-3/4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#333] text-lg">{account.plan} Plan</span>
                {account.plan === 'Ultimate' && <Crown size={16} className="text-[#E50914]" fill="#E50914"/>}
                {account.plan !== 'Free' && (
                     <span className="border border-[#E50914] text-[#E50914] text-xs px-1 font-bold rounded-sm">HD</span>
                )}
              </div>
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="text-[#0071eb] hover:underline text-sm font-bold"
              >
                  Change plan
              </button>
           </div>
        </div>

        {/* Profile & Parental Controls */}
        <div className="flex flex-col md:flex-row gap-4 py-6">
          <div className="w-full md:w-1/4">
             <h2 className="text-[#737373] text-lg font-medium uppercase tracking-wide">Profile & Parental Controls</h2>
          </div>
          <div className="w-full md:w-3/4">
             {profiles.map(profile => (
               <div key={profile.id} className="border-b border-[#ccc] last:border-none">
                 <div 
                    className="flex items-center justify-between py-4 cursor-pointer group"
                    onClick={() => toggleProfile(profile.id)}
                  >
                    <div className="flex items-center gap-3">
                       <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded" />
                       <div className="flex flex-col">
                          <span className="font-bold text-[#333]">{profile.name}</span>
                          {profile.isKid && <span className="text-xs text-[#737373]">Kids</span>}
                       </div>
                    </div>
                    {expandedProfile === profile.id ? <ChevronUp className="text-[#999]" /> : <ChevronDown className="text-[#999]" />}
                 </div>

                 {/* Expanded Settings */}
                 {expandedProfile === profile.id && (
                   <div className="pl-14 pb-6 space-y-4 animate-fade-in">
                      {profile.id === user.id ? (
                        <>
                          {/* Language */}
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-[#333] font-medium text-sm">Language</div>
                              <div className="text-[#737373] text-xs">Current: {user.language || 'English'}</div>
                            </div>
                            <div className="flex gap-2">
                                {LANGUAGES.slice(0,3).map(lang => (
                                    <button 
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.name)}
                                        className={`text-xs px-2 py-1 border rounded ${user.language === lang.name ? 'bg-[#0071eb] text-white border-[#0071eb]' : 'bg-white text-[#333] border-[#ccc]'}`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                          </div>

                          {/* Maturity */}
                          <div className="flex justify-between items-center py-2 border-t border-[#eee]">
                            <div className="flex items-center gap-2">
                                <div className="bg-[#333] p-1 rounded-sm text-white"><Lock size={16} /></div>
                                <div>
                                    <div className="text-[#333] font-medium text-sm">Viewing Restrictions</div>
                                    <div className="text-[#737373] text-xs">Maturity Rating: {profile.isKid ? '10+' : '18+'}</div>
                                </div>
                            </div>
                            <a href="#" className="text-[#0071eb] text-sm">Change</a>
                          </div>

                          {/* Autoplay */}
                          <div className="py-2 border-t border-[#eee]">
                              <div className="text-[#333] font-medium text-sm mb-2">Playback Settings</div>
                              <label className="flex items-center gap-2 cursor-pointer mb-2">
                                  <input 
                                    type="checkbox" 
                                    checked={user.autoplayNext ?? true} 
                                    onChange={() => toggleAutoplay('autoplayNext')}
                                    className="accent-[#0071eb]" 
                                  />
                                  <span className="text-sm text-[#333]">Autoplay next episode in a series on all devices.</span>
                              </label>
                               <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={user.autoplayPreviews ?? true} 
                                    onChange={() => toggleAutoplay('autoplayPreviews')}
                                    className="accent-[#0071eb]" 
                                  />
                                  <span className="text-sm text-[#333]">Autoplay previews while browsing on all devices.</span>
                              </label>
                          </div>

                          {/* Watch History */}
                          <div className="py-2 border-t border-[#eee] mt-4">
                              <div className="text-[#333] font-medium text-sm mb-2">Viewing Activity</div>
                              <button 
                                onClick={handleClearHistory}
                                className="text-red-600 hover:underline text-sm flex items-center gap-1 font-bold"
                              >
                                  <Trash2 size={14} /> Clear Watch History
                              </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-[#737373] italic">
                            Switch to this profile to edit settings.
                        </div>
                      )}
                   </div>
                 )}
               </div>
             ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-right">
             <button className="text-[#0071eb] hover:underline border border-[#0071eb] px-4 py-2 rounded text-sm font-bold">Sign out of all devices</button>
        </div>

      </div>
    </div>
  );
};

export default AccountPage;