
import { supabase } from './supabaseClient';
import { SUPABASE_URL } from '../constants';

// --- CONFIG ---
// Check if we are connected to Supabase
const USE_CLOUD_DB = SUPABASE_URL && SUPABASE_URL.length > 5;

// Helper to check connection type
export const isCloudStorage = () => !!(USE_CLOUD_DB);

// --- Types ---
export type CollectionName = 'users' | 'complaints' | 'settings';

// --- API ---

/**
 * Fetches all items from a collection (table).
 */
export const fetchCollection = async <T>(collection: CollectionName): Promise<T[]> => {
    if (USE_CLOUD_DB) {
        // Cloud Fetch: Assuming table names match collection names and store data in 'data' column 
        // OR mapping flat tables. For this refactor, we assume the previous structure:
        // 'users' table has a 'data' jsonb column, or we map it.
        // To make migration easier, we assume the table has the columns directly matching the types.
        
        // HOWEVER, based on previous structure, everything was in a 'data' column. 
        // Let's stick to that for compatibility unless we migrate schema.
        const { data, error } = await supabase
            .from(collection)
            .select('*'); // Select all columns
        
        if (error) {
            console.error(`Error fetching ${collection}:`, error);
            return [];
        }
        
        // If data is stored in a JSONB column named 'data':
        if (data.length > 0 && 'data' in data[0]) {
             return data.map((row: any) => row.data) as T[];
        }
        
        // If data is stored as flat columns (Better practice, but let's support both)
        return data as T[];
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
 */
export const saveItem = async <T extends { id: string }>(collection: CollectionName, item: T): Promise<boolean> => {
    if (USE_CLOUD_DB) {
        // Cloud Save (Upsert)
        // We wrap item in a 'data' column to match the previous structure expectation
        const payload = { id: item.id, data: item };
        
        const { error } = await supabase
            .from(collection)
            .upsert(payload, { onConflict: 'id' });

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
 * Bulk saves items.
 */
export const saveCollection = async <T extends { id: string }>(collection: CollectionName, items: T[]): Promise<boolean> => {
    if (USE_CLOUD_DB) {
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
export const fetchSettings = async <T>(defaultSettings: T): Promise<T> => {
    const SETTINGS_ID = 'global_sms_settings';
    
    if (USE_CLOUD_DB) {
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
    
    if (USE_CLOUD_DB) {
        await supabase
            .from('settings')
            .upsert({ id: SETTINGS_ID, data: settings });
    } else {
        localStorage.setItem('gas_app_sms_settings', JSON.stringify(settings));
    }
};
