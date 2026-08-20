import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const SUPABASE_URL = meta.env?.VITE_SUPABASE_URL || 'https://spkwmbxklttqkhnfamrp.supabase.co';
const SUPABASE_ANON_KEY = meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/**
 * Save real user data strictly to Supabase database.
 * Requirement 13 & 4: Only real user data explicitly submitted is saved. Example data is never saved.
 */
export async function saveUserDataToSupabase(userId: string, data: any): Promise<{ success: boolean; error?: any }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured; local user storage remains available.' };
    }
    if (!data || data.type !== 'user') {
      console.warn('[Supabase] Refusing to save non-user data or example data to database.');
      return { success: false, error: 'Only user data can be saved' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        data_type: 'user',
        payload: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Supabase] Sync notice:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] Exception during sync:', err);
    return { success: false, error: err?.message || err };
  }
}

/**
 * Fetch real user data from Supabase for authenticated/active user
 */
export async function fetchUserDataFromSupabase(userId: string): Promise<any | null> {
  try {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('payload')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data.payload;
  } catch {
    return null;
  }
}
