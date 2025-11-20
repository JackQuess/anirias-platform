export enum ContentType {
  SERIES = 'Series',
  MOVIE = 'Movie',
  OVA = 'OVA'
}

export type AnimeStatus = 'Ongoing' | 'Completed' | 'Upcoming';

export type AppLanguage = 'tr' | 'en' | 'de';

export type SubscriptionPlan = 'Free' | 'Standard' | 'Ultimate';

export interface Episode {
  id?: number; // <-- KRİTİK: Supabase tarafından atanacağı için isteğe bağlı yapıldı
  title: string;
  duration?: number; // seconds
  thumbnail?: string;
  introStart?: number;
  introEnd?: number;
  outroStart?: number; // Skip Outro
  releaseDate?: string;
  seasonNumber?: number;
  videoUrl?: string;
  episodeNumber?: number; // Jikan'dan gelen bölüm numarasını taşır
  animeId?: string;
}

export interface RelatedSeason {
  id: string;
  title: string;
  animeId: string;
}

export interface Anime {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  heroImage?: string;
  matchScore?: number;
  year?: number;
  ageRating?: string;
  tags?: string[];
  type: ContentType;
  status: AnimeStatus;
  episodes?: Episode[];
  hasDub?: boolean;
  hasSub?: boolean;
  availableLanguages?: string[];
  airingDay?: string;
  airingTime?: string;
  studio?: string;
  seasonName?: string;
  relatedSeasons?: RelatedSeason[];
  lastUpdated?: number;
  jikanId?: number;
}

export interface AccountDetails {
  id: string;
  email: string;
  plan: SubscriptionPlan;
  nextBillingDate: string;
  cardLast4: string;
  memberSince: string;
}

export interface UserProfile {
  id: string;
  account_id?: string;
  name: string;
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
  title: string;
  message: string;
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