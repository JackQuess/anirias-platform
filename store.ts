import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, WatchHistoryItem, AppLanguage, Anime, Episode, Notification, AccountDetails, SubscriptionPlan } from './types';
import { INITIAL_PROFILES, MOCK_NOTIFICATIONS } from './constants';
// @ts-ignore: Suppress implicit any error for this import if types are missing
import supabaseClientAny from './services/supabaseClient';
import { Session, SupabaseClient, AuthChangeEvent } from '@supabase/supabase-js';

// Client'ı güvenli bir şekilde tiple
const supabase = supabaseClientAny as unknown as SupabaseClient | null;

interface AppState {
  appLanguage: AppLanguage;
  profiles: UserProfile[];
  currentUser: UserProfile | null;
  watchHistory: Record<string, Record<string, WatchHistoryItem>>; 
  myList: Record<string, string[]>;
  content: Anime[];
  isContentLoading: boolean;
  notifications: Notification[];
  searchQuery: string;
  
  // Auth State
  session: Session | null;
  isAuthLoading: boolean;

  // Account State
  account: AccountDetails;

  // Actions
  initializeAuth: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;

  fetchContent: () => Promise<void>;
  setAppLanguage: (lang: AppLanguage) => void;
  setCurrentUser: (user: UserProfile | null) => void;
  addProfile: (name: string, isKid: boolean) => void;
  editProfile: (id: string, data: Partial<UserProfile>) => void;
  deleteProfile: (id: string) => void;
  updateProgress: (animeId: string, episodeId: number, timestamp: number, duration: number) => void;
  clearWatchHistory: () => void;
  removeFromHistory: (animeId: string) => void;
  addToList: (animeId: string) => void;
  removeFromList: (animeId: string) => void;
  updateUserPreferences: (userId: string, preferences: Partial<UserProfile>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  setSearchQuery: (query: string) => void;
  
  // Admin Actions
  addAnime: (anime: Omit<Anime, 'id' | 'episodes' | 'lastUpdated'>) => Promise<Anime>;
  updateAnime: (id: string, updatedAnime: Partial<Anime>) => Promise<void>;
  deleteAnime: (id: string) => Promise<void>;
  addEpisode: (animeId: string, episode: Episode | Episode[]) => Promise<void>;
  updateEpisode: (animeId: string, episodeId: number, updatedEpisode: Partial<Episode>) => Promise<void>;
  deleteEpisode: (animeId: string, episodeId: number) => Promise<void>;

  // Account Actions
  upgradeSubscription: (plan: SubscriptionPlan) => void;
  cancelSubscription: () => void;
  updateAccountSettings: (settings: Partial<AccountDetails>) => void;

  // Selectors
  getHistory: () => Record<string, WatchHistoryItem>;
  getList: () => string[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      appLanguage: 'tr',
      profiles: INITIAL_PROFILES,
      currentUser: null,
      watchHistory: {},
      myList: {},
      content: [],
      isContentLoading: true,
      notifications: MOCK_NOTIFICATIONS,
      searchQuery: '',
      
      session: null,
      isAuthLoading: true,
      
      account: {
          id: 'acc_mock_1',
          email: "user@anirias.com",
          plan: "Free",
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          cardLast4: "4242",
          memberSince: "2023"
      },

      initializeAuth: async () => {
          if (!supabase) {
             console.warn("Supabase client not initialized.");
             set({ isAuthLoading: false });
             return;
          }
          
          const { data: { session } } = await supabase.auth.getSession();
          set({ session, isAuthLoading: false });

          supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
              set({ session });
              if (!session) {
                  set({ currentUser: null });
              }
          });
      },

      signIn: async (email, password) => {
          if (!supabase) throw new Error("Supabase not initialized");
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
      },

      signUp: async (email, password) => {
          if (!supabase) throw new Error("Supabase not initialized");
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
      },

      signOut: async () => {
          if (!supabase) return;
          await supabase.auth.signOut();
          set({ currentUser: null, session: null });
      },

      fetchContent: async () => {
        if (!supabase) {
            set({ isContentLoading: false });
            return;
        }
        set({ isContentLoading: true });
        try {
            // DÜZELTME: İlişki hatasını (PGRST201) önlemek için foreign key adını açıkça belirtiyoruz.
            const { data, error } = await supabase
                .from('animes')
                .select(`*, episodes!episodes_anime_id_fkey(*)`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Backend (snake_case) -> Frontend (camelCase) Dönüşümü
            const mappedData = (data as any[]).map(anime => ({
                ...anime,
                heroImage: anime.hero_image || anime.heroImage, 
                ageRating: anime.age_rating || anime.ageRating,
                jikanId: anime.jikan_id,
                episodes: (anime.episodes || []).map((ep: any) => ({
                    id: ep.id,
                    title: ep.title,
                    description: ep.description,
                    thumbnail: ep.thumbnail_url || ep.thumbnail,
                    videoUrl: ep.video_url || ep.videoUrl,
                    seasonNumber: ep.season_number || ep.seasonNumber,
                    episodeNumber: ep.episode_number || ep.episodeNumber,
                    introStart: ep.intro_start,
                    introEnd: ep.intro_end,
                    outroStart: ep.outro_start,
                    animeId: ep.anime_id,
                    duration: ep.duration
                })).sort((a: any, b: any) => (a.episodeNumber || 0) - (b.episodeNumber || 0))
            })) as Anime[];

            set({ content: mappedData, isContentLoading: false });
        } catch (error) {
            console.error("Error fetching content:", error);
            set({ isContentLoading: false });
        }
      },

      setAppLanguage: (lang) => set({ appLanguage: lang }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      addProfile: (name, isKid) => {
        set((state) => {
            const newId = (Math.random() * 10000).toFixed(0);
            const newProfile: UserProfile = {
                id: newId, name, isKid,
                account_id: 'acc_1',
                avatar: `https://picsum.photos/seed/${newId}/200`,
                language: 'Turkish', autoplayNext: true, autoplayPreviews: true
            };
            return { profiles: [...state.profiles, newProfile] };
        });
      },

      editProfile: (id, data) => {
        set((state) => {
            const updatedProfiles = state.profiles.map(p => p.id === id ? { ...p, ...data } : p);
            const updatedCurrentUser = state.currentUser?.id === id ? { ...state.currentUser, ...data } : state.currentUser;
            return { profiles: updatedProfiles, currentUser: updatedCurrentUser };
        });
      },

      deleteProfile: (id) => {
        set((state) => {
            const updatedProfiles = state.profiles.filter(p => p.id !== id);
            const updatedCurrentUser = state.currentUser?.id === id ? null : state.currentUser;
            return { profiles: updatedProfiles, currentUser: updatedCurrentUser };
        });
      },

      updateProgress: (animeId, episodeId, timestamp, duration) => {
        const user = get().currentUser;
        if (!user) return;
        set((state) => {
          const userHistory = state.watchHistory[user.id] || {};
          return {
            watchHistory: { ...state.watchHistory, [user.id]: { ...userHistory, [animeId]: { animeId, episodeId, timestamp, duration, lastWatched: Date.now() } } }
          };
        });
      },

      clearWatchHistory: () => {
        const user = get().currentUser;
        if (!user) return;
        set((state) => ({ watchHistory: { ...state.watchHistory, [user.id]: {} } }));
      },
      
      removeFromHistory: (animeId) => {
          const user = get().currentUser;
          if (!user) return;
          set((state) => {
              const userHistory = { ...state.watchHistory[user.id] };
              delete userHistory[animeId];
              return { watchHistory: { ...state.watchHistory, [user.id]: userHistory } };
          });
      },

      addToList: (animeId) => {
        const user = get().currentUser;
        if (!user) return;
        set((state) => {
          const userList = state.myList[user.id] || [];
          if (userList.includes(animeId)) return state;
          return { myList: { ...state.myList, [user.id]: [...userList, animeId] } };
        });
      },

      removeFromList: (animeId) => {
        const user = get().currentUser;
        if (!user) return;
        set((state) => {
          const userList = state.myList[user.id] || [];
          return { myList: { ...state.myList, [user.id]: userList.filter(id => id !== animeId) } };
        });
      },

      updateUserPreferences: (userId, preferences) => {
        set((state) => {
           const updatedCurrentUser = state.currentUser?.id === userId ? { ...state.currentUser, ...preferences } : state.currentUser;
           const updatedProfiles = state.profiles.map(p => p.id === userId ? { ...p, ...preferences } : p);
           return { currentUser: updatedCurrentUser, profiles: updatedProfiles };
        });
      },

      markNotificationRead: (id) => set((state) => ({ notifications: state.notifications.map(n => n.id === id ? {...n, read: true} : n) })),
      markAllNotificationsRead: () => set((state) => ({ notifications: state.notifications.map(n => ({...n, read: true})) })),
      
      // --- ADMIN ACTIONS WITH SUPABASE ---

      addAnime: async (animeData) => {
        if (!supabase) throw new Error("Supabase client not available");
        
        const dbPayload = {
            title: animeData.title,
            description: animeData.description,
            thumbnail: animeData.thumbnail,
            hero_image: animeData.heroImage,
            year: animeData.year,
            age_rating: animeData.ageRating,
            tags: animeData.tags,
            type: animeData.type,
            status: animeData.status,
            jikan_id: animeData.jikanId
        };

        const { data, error } = await supabase.from('animes').insert([dbPayload]).select().single();
        
        if (error) {
            console.error("Error adding anime:", error);
            throw error;
        }
        
        const newAnime = { ...animeData, id: data.id, episodes: [] } as Anime;
        set(state => ({ content: [newAnime, ...state.content] }));
        return newAnime;
      },

      updateAnime: async (id, updatedAnime) => {
        if (!supabase) throw new Error("Supabase client not available");
        
        const dbPayload: any = { ...updatedAnime };
        if (updatedAnime.heroImage) dbPayload.hero_image = updatedAnime.heroImage;
        if (updatedAnime.ageRating) dbPayload.age_rating = updatedAnime.ageRating;
        if (updatedAnime.jikanId) dbPayload.jikan_id = updatedAnime.jikanId;
        
        delete dbPayload.heroImage;
        delete dbPayload.ageRating;
        delete dbPayload.jikanId;

        const { error } = await supabase.from('animes').update(dbPayload).eq('id', id);
        if (error) throw error;
        
        set(state => ({
          content: state.content.map(a => a.id === id ? { ...a, ...updatedAnime, lastUpdated: Date.now() } : a)
        }));
      },

      deleteAnime: async (id) => {
        if (!supabase) throw new Error("Supabase client not available");
        const { error } = await supabase.from('animes').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ content: state.content.filter(a => a.id !== id) }));
      },

      addEpisode: async (animeId, episodeData) => {
        if (!supabase) throw new Error("Supabase client not available");

        const episodesInput = Array.isArray(episodeData) ? episodeData : [episodeData];
        
        const dbPayloads = episodesInput.map(ep => {
            // Geçici ID'yi yoksay
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...rest } = ep;

            return {
                anime_id: animeId,
                title: ep.title,
                thumbnail_url: ep.thumbnail,
                video_url: ep.videoUrl,
                season_number: ep.seasonNumber || 1,
                // DÜZELTME: episodeNumber zorunlu olduğu için rasgele sayı atıyoruz
                episode_number: ep.episodeNumber || (Math.floor(Math.random() * 10000)), 
                intro_start: ep.introStart,
                intro_end: ep.introEnd,
                outro_start: ep.outroStart,
                duration: ep.duration
            };
        });

        const { error } = await supabase.from('episodes').insert(dbPayloads);
        
        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        set(state => ({
          content: state.content.map(a => a.id === animeId ? { 
              ...a, 
              episodes: [...a.episodes, ...(Array.isArray(episodeData) ? episodeData : [episodeData])], 
              lastUpdated: Date.now() 
          } : a)
        }));
      },

      updateEpisode: async (animeId, episodeId, updatedEpisode) => {
        if (!supabase) throw new Error("Supabase client not available");
        
        const dbPayload: any = {};
        if (updatedEpisode.title) dbPayload.title = updatedEpisode.title;
        if (updatedEpisode.thumbnail) dbPayload.thumbnail_url = updatedEpisode.thumbnail;
        if (updatedEpisode.videoUrl) dbPayload.video_url = updatedEpisode.videoUrl;
        if (updatedEpisode.seasonNumber) dbPayload.season_number = updatedEpisode.seasonNumber;
        if (updatedEpisode.episodeNumber) dbPayload.episode_number = updatedEpisode.episodeNumber;
        if (updatedEpisode.introStart !== undefined) dbPayload.intro_start = updatedEpisode.introStart;
        if (updatedEpisode.introEnd !== undefined) dbPayload.intro_end = updatedEpisode.introEnd;
        if (updatedEpisode.outroStart !== undefined) dbPayload.outro_start = updatedEpisode.outroStart;
        if (updatedEpisode.duration !== undefined) dbPayload.duration = updatedEpisode.duration;

        const { error } = await supabase.from('episodes').update(dbPayload).eq('id', episodeId);
        
        if (error) {
            console.error("Supabase Update Error:", error);
            throw error;
        }

        set(state => ({
          content: state.content.map(a => a.id === animeId ? { ...a, episodes: a.episodes.map(e => e.id === episodeId ? { ...e, ...updatedEpisode } : e), lastUpdated: Date.now() } : a)
        }));
      },

      deleteEpisode: async (animeId, episodeId) => {
        if (!supabase) throw new Error("Supabase client not available");
        const { error } = await supabase.from('episodes').delete().eq('id', episodeId);
        if (error) throw error;
        set(state => ({
          content: state.content.map(a => a.id === animeId ? { ...a, episodes: a.episodes.filter(e => e.id !== episodeId), lastUpdated: Date.now() } : a)
        }));
      },
      
      upgradeSubscription: (plan) => set(state => ({ account: { ...state.account, plan } })),
      cancelSubscription: () => set(state => ({ account: { ...state.account, plan: 'Free' } })),
      updateAccountSettings: (settings) => set(state => ({ account: { ...state.account, ...settings } })),

      getHistory: () => {
        const { currentUser, watchHistory } = get();
        if (!currentUser) return {};
        return watchHistory[currentUser.id] || {};
      },
      getList: () => {
        const { currentUser, myList } = get();
        if (!currentUser) return [];
        return myList[currentUser.id] || [];
      }
    }),
    { name: 'anirias-v4-prod' }
  )
);