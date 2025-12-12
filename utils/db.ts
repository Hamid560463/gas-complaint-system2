
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// --- CONFIG ---
const USE_CLOUD_DB = SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.length > 5;

let supabase: SupabaseClient | null = null;

if (USE_CLOUD_DB) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("🔌 Connected to Cloud Database (Supabase)");
    } catch (e) {
        console.error("Failed to initialize Supabase", e);
    }
} else {
    console.log("💾 Using Local Storage (Browser Memory)");
}

// Helper to check connection type
export const isCloudStorage = () => !!(USE_CLOUD_DB && supabase);

// --- Types ---
export type CollectionName = 'users' | 'complaints' | 'settings';

// --- API ---

/**
 * Fetches all items from a collection (table).
 */
export const fetchCollection = async <T>(collection: CollectionName): Promise<T[]> => {
    if (USE_CLOUD_DB && supabase) {
        // Cloud Fetch
        const { data, error } = await supabase
            .from(collection)
            .select('data');
        
        if (error) {
            console.error(`Error fetching ${collection}:`, error);
            return [];
        }
        return data.map((row: any) => row.data) as T[];
    } else {
        // LocalStorage Fetch
        const localData = localStorage.getItem(`gas_app_${collection}`);
        if (!localData) return [];
        try {
            return JSON.parse(localData) as T[];
        } catch {
            return [];
        }
    }
};

/**
 * Saves (Inserts or Updates) a single item.
 * Requires the item to have an 'id' field.
 */
export const saveItem = async <T extends { id: string }>(collection: CollectionName, item: T): Promise<boolean> => {
    if (USE_CLOUD_DB && supabase) {
        // Cloud Save (Upsert)
        const { error } = await supabase
            .from(collection)
            .upsert({ id: item.id, data: item }, { onConflict: 'id' });

        if (error) {
            console.error(`Error saving to ${collection}:`, error);
            return false;
        }
        return true;
    } else {
        // LocalStorage Save
        const currentItems = await fetchCollection<T>(collection);
        const index = currentItems.findIndex(i => i.id === item.id);
        
        let newItems;
        if (index >= 0) {
            newItems = [...currentItems];
            newItems[index] = item;
        } else {
            newItems = [...currentItems, item];
        }
        
        localStorage.setItem(`gas_app_${collection}`, JSON.stringify(newItems));
        return true;
    }
};

/**
 * Bulk saves items (Replaces the whole collection in LocalStorage, or Upserts in Cloud).
 * NOTE: For Cloud, we iterate upserts. For huge datasets, this needs optimization.
 */
export const saveCollection = async <T extends { id: string }>(collection: CollectionName, items: T[]): Promise<boolean> => {
    if (USE_CLOUD_DB && supabase) {
        const updates = items.map(item => ({
            id: item.id,
            data: item
        }));
        
        const { error } = await supabase.from(collection).upsert(updates, { onConflict: 'id' });
        
        if (error) {
             console.error(`Error bulk saving ${collection}:`, error);
             return false;
        }
        return true;
    } else {
        localStorage.setItem(`gas_app_${collection}`, JSON.stringify(items));
        return true;
    }
};

// --- SETTINGS SPECIAL HANDLER ---
// Settings are usually a single object, but our DB schema uses rows. 
// We will store settings with a fixed ID 'global_sms_settings'.

export const fetchSettings = async <T>(defaultSettings: T): Promise<T> => {
    const SETTINGS_ID = 'global_sms_settings';
    
    if (USE_CLOUD_DB && supabase) {
        const { data, error } = await supabase
            .from('settings')
            .select('data')
            .eq('id', SETTINGS_ID)
            .single();
        
        if (error || !data) return defaultSettings;
        return data.data as T;
    } else {
        const saved = localStorage.getItem('gas_app_sms_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    }
};

export const saveSettings = async <T>(settings: T): Promise<void> => {
    const SETTINGS_ID = 'global_sms_settings';
    
    if (USE_CLOUD_DB && supabase) {
        await supabase
            .from('settings')
            .upsert({ id: SETTINGS_ID, data: settings });
    } else {
        localStorage.setItem('gas_app_sms_settings', JSON.stringify(settings));
    }
};
