import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const SUPABASE_URL = meta.env?.VITE_SUPABASE_URL || 'https://spkwmbxklttqkhnfamrp.supabase.co';
const SUPABASE_ANON_KEY = meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/**
 * Safely format string into valid v4 UUID string when required
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
 * Register a new user in Supabase public.users_auth table.
 * Enforces User ID uniqueness and returns error if User ID already exists.
 */
export async function registerUserInSupabase(
  userId: string,
  password: string,
  email: string = '',
  fullName: string = '',
  profileData: any = {}
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    if (!supabase) return { success: false, error: 'Supabase client is not configured' };
    const cleanId = userId.trim();
    if (!cleanId) return { success: false, error: 'User ID is required' };

    // Check if User ID already exists in Supabase
    const { data: existing } = await supabase
      .from('users_auth')
      .select('user_id')
      .eq('user_id', cleanId)
      .maybeSingle();

    if (existing) {
      return { 
        success: false, 
        error: 'This User ID already exists. Please choose a different User ID or login.' 
      };
    }

    // Insert user credentials into users_auth
    const { data, error } = await supabase
      .from('users_auth')
      .insert({
        user_id: cleanId,
        password_hash: password, // In production stored via backend bcrypt or Supabase Auth
        email: email || null,
        full_name: fullName || null,
        profile_data: profileData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('unique constraint')) {
        return { success: false, error: 'This User ID already exists. Please choose a different User ID or login.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to register user' };
  }
}

/**
 * Login user against Supabase public.users_auth
 */
export async function loginUserInSupabase(
  userId: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    if (!supabase) return { success: false, error: 'Supabase client is not configured' };
    const cleanId = userId.trim();

    const { data, error } = await supabase
      .from('users_auth')
      .select('*')
      .eq('user_id', cleanId)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'Invalid User ID or password. Please check your credentials.' };
    }

    if (data.password_hash !== password) {
      return { success: false, error: 'Invalid User ID or password. Please check your credentials.' };
    }

    return { success: true, user: data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed' };
  }
}

/**
 * Save / Update User Profile in Supabase
 */
export async function saveUserProfileToSupabase(
  userId: string,
  profileData: any
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!supabase) return { success: false, error: 'Supabase client is not configured' };
    const cleanId = userId.trim();

    const { error } = await supabase
      .from('users_auth')
      .upsert({
        user_id: cleanId,
        email: profileData.email || null,
        full_name: profileData.name || null,
        profile_data: profileData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Supabase] Profile upsert notice:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || err };
  }
}

/**
 * Save user activity record strictly for the active user ID
 */
export async function saveUserActivityToSupabase(
  userId: string, 
  activityType: UserActivityRecord['activity_type'], 
  payload: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
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
 * Fetch user activities strictly scoped to user_id
 */
export async function fetchUserActivitiesFromSupabase(userId: string): Promise<UserActivityRecord[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as UserActivityRecord[];
  } catch (err) {
    console.warn('[Supabase] Failed to fetch user activities:', err);
    return [];
  }
}

/**
 * Legacy wrapper
 */
export async function saveUserDataToSupabase(userId: string, data: any): Promise<{ success: boolean; error?: any }> {
  return saveUserProfileToSupabase(userId, data);
}

/**
 * Fetch user data from Supabase
 */
export async function fetchUserDataFromSupabase(userId: string): Promise<any | null> {
  try {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users_auth')
      .select('profile_data')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data.profile_data;
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
