import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const SUPABASE_URL = meta.env?.VITE_SUPABASE_URL || 'https://spkwmbxklttqkhnfamrp.supabase.co';
const SUPABASE_ANON_KEY = meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/**
 * Safely format string into valid UUID v4 format to prevent Postgres type mismatch
 */
export function toUuid(id: string): string {
  if (!id) return '00000000-0000-4000-8000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  
  let hex = '';
  for (let i = 0; i < id.length; i++) {
    hex += id.charCodeAt(i).toString(16);
  }
  hex = (hex + '00000000000000000000000000000000').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export interface UserActivityRecord {
  id?: string;
  user_id: string;
  activity_type: 'rti_draft' | 'document_analysis' | 'scheme_check' | 'rights_analysis' | 'form_application';
  payload: any;
  created_at?: string;
}

/**
 * Save user activity record strictly for the authenticated / current user ID
 */
export async function saveUserActivityToSupabase(
  userId: string, 
  activityType: UserActivityRecord['activity_type'], 
  payload: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const validUuid = toUuid(userId);
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: validUuid,
        activity_type: activityType,
        payload,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Activity insert notice:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn('[Supabase] Exception saving user activity:', err);
    return { success: false, error: err?.message || err };
  }
}

/**
 * Fetch user activities strictly scoped to user_id (RLS enforced)
 */
export async function fetchUserActivitiesFromSupabase(userId: string): Promise<UserActivityRecord[]> {
  try {
    if (!supabase) return [];
    const validUuid = toUuid(userId);

    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', validUuid)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as UserActivityRecord[];
  } catch (err) {
    console.warn('[Supabase] Failed to fetch user activities:', err);
    return [];
  }
}

/**
 * Sync user profile to Supabase public.profiles
 */
export async function syncUserProfileToSupabase(
  userId: string,
  profile: { email?: string; full_name?: string }
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const validUuid = toUuid(userId);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: validUuid,
        email: profile.email || null,
        full_name: profile.full_name || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || err };
  }
}

/**
 * Save real user data strictly to Supabase database (backward compatibility for full profile payload)
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

    const validUuid = toUuid(userId);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: validUuid,
        email: data.email || null,
        full_name: data.name || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

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
    const validUuid = toUuid(userId);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', validUuid)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Public schemes fetcher
 */
export async function fetchSchemesFromSupabase(): Promise<any[]> {
  try {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('schemes')
      .select('*')
      .order('scheme_name', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.warn('[Supabase] Failed to fetch schemes:', err);
    return [];
  }
}

/**
 * Admin / automated scheme upsert
 */
export async function upsertSchemesToSupabase(schemes: Array<{
  id?: string;
  scheme_name: string;
  category?: string;
  eligibility_criteria?: any;
  benefits?: string;
  source_url?: string;
}>): Promise<{ success: boolean; count?: number; error?: any }> {
  try {
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const records = schemes.map(s => ({
      id: s.id ? toUuid(s.id) : undefined,
      scheme_name: s.scheme_name,
      category: s.category || 'General',
      eligibility_criteria: s.eligibility_criteria || {},
      benefits: s.benefits || '',
      source_url: s.source_url || '',
      last_synced: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('schemes')
      .upsert(records, { onConflict: 'scheme_name' })
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, count: data?.length || records.length };
  } catch (err: any) {
    return { success: false, error: err?.message || err };
  }
}
