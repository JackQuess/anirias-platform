
import { createClient } from '@supabase/supabase-js';

// Use process.env, which works in this environment and will be replaced by Vite during a build.
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Anahtarlar eksikse geliştirme ortamı için uyar ve fallback yap.
    console.warn("Supabase keys missing. Backend features will be mocked.");
}

export const uploadFile = async (file: File, bucket: string = 'videos'): Promise<string | null> => {
    if (!supabase) {
        console.error("Supabase client not initialized");
        return null;
    }

    try {
        // Generate a unique file name to prevent collisions
        // e.g., 17156234234_my_video.mp4
        const fileExt = file.name.split('.').pop();
        const sanitizedName = file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${Date.now()}_${sanitizedName}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // Get Public URL
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;

    } catch (error) {
        console.error("Error uploading file:", error);
        return null;
    }
};

export default supabase;
