import { Anime, ContentType, AnimeStatus, Episode } from '../types';

const JIKAN_API_URL = 'https://api.jikan.moe/v4';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Güvenli bir şekilde değeri tam sayıya çevirir, geçersizse undefined döndürür.
const safeInt = (val: any) => (val === null || val === undefined || isNaN(parseInt(val))) ? undefined : parseInt(val);

// Robust fetch with exponential backoff
const fetchWithRetry = async (url: string, retries = 5, backoff = 1000): Promise<any> => { // Artırılmış deneme sayısı ve bekleme süresi
    try {
        const response = await fetch(url);
        
        if (response.status === 429) {
            if (retries > 0) {
                console.warn(`Rate Limited. Retrying in ${backoff}ms...`);
                await delay(backoff);
                return fetchWithRetry(url, retries - 1, backoff * 2);
            } else {
                throw new Error('API Rate Limit Exceeded. Max retries reached.');
            }
        }

        if (!response.ok) {
            if(response.status === 404) return null;
            throw new Error(`API Error: ${response.status} - ${await response.text()}`);
        }

        return await response.json();
    } catch (error) {
        if (retries > 0) {
            await delay(backoff);
            return fetchWithRetry(url, retries - 1, backoff * 2);
        }
        console.error("Fetch failed after all retries:", error);
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
        while (hasNextPage && page <= 5) {
            onStatus(`Fetching Page ${page}...`);
            const data = await fetchWithRetry(`${JIKAN_API_URL}/anime/${malId}/episodes?page=${page}`);
            
            if (data && data.data) {
                const mapped = data.data.map((ep: any) => ({
                    title: ep.title || `Episode ${ep.mal_id}`,
                    // Süre int4 olduğu için güvenli int kullanıyoruz
                    duration: safeInt(ep.duration) || undefined, 
                    thumbnail: defaultImage,
                    // Sayısal alanlar artık null/undefined olabilir, bu da Supabase int'e boş değer göndermeyi dener.
                    introStart: safeInt(ep.introStart),
                    introEnd: safeInt(ep.introEnd),
                    outroStart: safeInt(ep.outroStart),
                    releaseDate: ep.aired ? new Date(ep.aired).toISOString().split('T')[0] : undefined,
                    seasonNumber: seasonNum,
                    videoUrl: '', 
                    episodeNumber: safeInt(ep.mal_id), 
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