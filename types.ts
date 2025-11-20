export enum ContentType {
  SERIES = 'Series',
  MOVIE = 'Movie',
  OVA = 'OVA'
}

export type AnimeStatus = 'Ongoing' | 'Completed' | 'Upcoming';

export type AppLanguage = 'tr' | 'en' | 'de';

export type SubscriptionPlan = 'Free' | 'Standard' | 'Ultimate';

export interface Episode {
  id: number;
  title: string;
  duration: number; // seconds
  thumbnail: string;
  videoUrl?: string; // URL to the video file (mp4/m3u8)
  
  // Season & Episode Numbers
  seasonNumber?: number;
  episodeNumber?: number; // Store.ts içinde kullanılıyor, eklendi.

  // Timestamps (Skip Intro/Outro)
  introStart?: number;
  introEnd?: number;
  outroStart?: number; // Store.ts hatasını çözmek için eklendi.
  
  releaseDate?: string; // ISO String
  animeId?: string; // Link to parent anime (Opsiyonel)
}

export interface RelatedSeason {
  id: string;
  title: string; // e.g. "Season 2", "Movie"
  animeId: string; // Link to the actual anime ID
}

export interface Anime {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  heroImage: string;
  matchScore: number;
  year: number;
  ageRating: string;
  tags: string[];
  type: ContentType;
  status: AnimeStatus;
  episodes: Episode[];
  hasDub: boolean;
  hasSub: boolean;
  availableLanguages?: string[];
  airingDay?: string; // e.g. "Monday"
  airingTime?: string; // e.g. "23:30"
  studio?: string; // e.g. "MAPPA"
  seasonName?: string; // e.g. "Season 1", "Arc 2"
  relatedSeasons?: RelatedSeason[]; // Links to other seasons
  lastUpdated?: number; // Timestamp for sorting
  jikanId?: number; // For Jikan/MAL integration
}

export interface AccountDetails {
  email: string;
  plan: SubscriptionPlan;
  nextBillingDate: string;
  cardLast4: string;
  memberSince: string;
}

export interface UserProfile {
  id: string;
  name: string;
  account_id?: string;
  avatar: string;
  isKid: boolean;
  language?: string;
  autoplayNext?: boolean;
  autoplayPreviews?: boolean;
}

export interface WatchHistoryItem {
  animeId: string;
  episodeId: number;
  timestamp: number;
  duration: number;
  lastWatched: number;
}

export interface Notification {
  id: string;
  animeId: string;
  title: string; // "New Episode: One Punch Man"
  message: string; // "Season 3 Episode 7 is now available."
  image: string;
  time: string;
  read: boolean;
}

export interface ServerOption {
  id: string;
  name: string;
  quality: string;
}

export const LANGUAGES = [
  { code: 'tr', name: 'Turkish' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'de', name: 'German' },
];