import { Anime, ContentType, AnimeStatus, Episode } from '../types';

const JIKAN_API_URL = 'https://api.jikan.moe/v4';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Robust fetch with exponential backoff
const fetchWithRetry = async (url: string, retries = 3, backoff = 500): Promise<any> => {
    try {
        const response = await fetch(url);
        
        if (response.status === 429) {
            if (retries > 0) {
                console.warn(`Rate Limited. Retrying in ${backoff}ms...`);
                await delay(backoff);
                return fetchWithRetry(url, retries - 1, backoff * 2);
            } else {
                throw new Error('API Rate Limit Exceeded. Please wait a moment.');
            }
        }

        if (!response.ok) {
            if(response.status === 404) return null;
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (retries > 0) {
            await delay(backoff);
            return fetchWithRetry(url, retries - 1, backoff * 2);
        }
        console.error("Fetch failed:", error);
        return null;
    }
};

export const searchAnimeOnJikan = async (query: string): Promise<Partial<Anime>[]> => {
  const data = await fetchWithRetry(`${JIKAN_API_URL}/anime?q=${encodeURIComponent(query)}&limit=10`);
  if (!data || !data.data) return [];

  return data.data.map((item: any) => mapJikanToAnime(item));
};

export const getAnimeDetails = async (malId: number): Promise<Partial<Anime> | null> => {
    const data = await fetchWithRetry(`${JIKAN_API_URL}/anime/${malId}`);
    if (!data || !data.data) return null;
    return mapJikanToAnime(data.data);
};

export const getAnimeRelations = async (malId: number): Promise<any[]> => {
    const data = await fetchWithRetry(`${JIKAN_API_URL}/anime/${malId}/relations`);
    if (!data || !data.data) return [];
    return data.data;
};

const mapJikanToAnime = (item: any): Partial<Anime> => {
    let status: AnimeStatus = 'Completed';
    if (item.status === 'Currently Airing') status = 'Ongoing';
    if (item.status === 'Not yet aired') status = 'Upcoming';

    let type: ContentType = ContentType.SERIES;
    if (item.type === 'Movie') type = ContentType.MOVIE;

    const studio = item.studios?.[0]?.name || '';
    const airingDay = item.broadcast?.day?.replace(/s$/, '') || '';
    const airingTime = item.broadcast?.time || '';

    return {
        jikanId: item.mal_id,
        title: item.title_english || item.title,
        description: item.synopsis?.replace('[Written by MAL Rewrite]', '').trim() || '',
        thumbnail: item.images?.jpg?.large_image_url || '',
        heroImage: item.trailer?.images?.maximum_image_url || item.images?.jpg?.large_image_url,
        matchScore: item.score ? Math.floor(item.score * 10) : 85,
        year: item.year || new Date(item.aired?.from).getFullYear() || 2024,
        ageRating: item.rating || '16+',
        tags: item.genres ? item.genres.map((g: any) => g.name) : [],
        type,
        status,
        episodes: [],
        hasDub: false,
        hasSub: true,
        availableLanguages: ['Japanese'],
        airingDay,
        airingTime,
        studio,
        seasonName: 'Season 1'
    };
};

export const fetchEpisodesFromJikan = async (
    malId: number, 
    seasonNum: number, 
    defaultImage: string,
    onStatus: (msg: string) => void
): Promise<Episode[]> => {
    let allEpisodes: Episode[] = [];
    let page = 1;
    let hasNextPage = true;

    try {
        while (hasNextPage && page <= 5) { // Limit pages
            onStatus(`Fetching Page ${page}...`);
            const data = await fetchWithRetry(`${JIKAN_API_URL}/anime/${malId}/episodes?page=${page}`);
            
            if (data && data.data) {
                const mapped = data.data.map((ep: any) => ({
                    // KRİTİK: id alanı YOK. Supabase otomatik atar.
                    title: ep.title || `Episode ${ep.mal_id}`,
                    duration: 1440, // Varsayılan süre
                    thumbnail: defaultImage,
                    introStart: undefined,
                    introEnd: undefined,
                    outroStart: undefined,
                    releaseDate: ep.aired ? new Date(ep.aired).toISOString().split('T')[0] : undefined,
                    seasonNumber: seasonNum,
                    videoUrl: '', 
                    episodeNumber: ep.mal_id, // MAL ID'yi bölüm numarası olarak sakla
                }));
                allEpisodes = [...allEpisodes, ...mapped];
            }
            
            hasNextPage = data?.pagination?.has_next_page || false;
            page++;
            if(hasNextPage) await delay(1000);
        }
        return allEpisodes;
    } catch (e) {
        console.error("Batch Import Failed during API fetch:", e);
        return [];
    }
};