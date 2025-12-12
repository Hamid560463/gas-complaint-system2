
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and Key are required in constants.ts");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
