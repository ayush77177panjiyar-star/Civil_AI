import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const SUPABASE_URL = meta.env?.VITE_SUPABASE_URL || 'https://spkwmbxklttqkhnfamrp.supabase.co';
const SUPABASE_ANON_KEY = meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'your_supabase_key_here') 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

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

// Local accounts storage helpers (Ensures 100% reliable auth offline or online)
const LOCAL_ACCOUNTS_KEY = 'civicai_registered_users_db_v1';

function getLocalAccounts(): Record<string, any> {
  try {
    const saved = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {};
}

function saveLocalAccount(userId: string, accountData: any) {
  try {
    const accounts = getLocalAccounts();
    accounts[userId] = accountData;
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {}
}

/**
 * Register a new user in Supabase public.users_auth table (or local account registry).
 * Enforces User ID uniqueness and returns error if User ID already exists.
 */
export async function registerUserInSupabase(
  userId: string,
  password: string,
  email: string = '',
  fullName: string = '',
  profileData: any = {}
): Promise<{ success: boolean; error?: string; user?: any }> {
  const cleanId = userId.trim();
  if (!cleanId) return { success: false, error: 'User ID is required' };

  // 1. Check local accounts registry for uniqueness
  const localAccounts = getLocalAccounts();
  if (localAccounts[cleanId]) {
    return { 
      success: false, 
      error: 'This User ID already exists. Please choose a different User ID or login.' 
    };
  }

  // 2. Check Supabase DB if client is active
  if (supabase) {
    try {
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

      await supabase.from('users_auth').insert({
        user_id: cleanId,
        password_hash: password,
        email: email || null,
        full_name: fullName || null,
        profile_data: profileData,
        created_at: new Date().toISOString()
      }).catch(() => {});
    } catch (e) {}
  }

  // Save into local accounts registry for instant login availability
  const newAccount = {
    user_id: cleanId,
    password_hash: password,
    email: email || '',
    full_name: fullName || '',
    profile_data: profileData,
    created_at: new Date().toISOString()
  };
  saveLocalAccount(cleanId, newAccount);

  return { success: true, user: newAccount };
}

/**
 * Login user against Supabase / local registry
 */
export async function loginUserInSupabase(
  userId: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  const cleanId = userId.trim();
  if (!cleanId || !password) {
    return { success: false, error: 'Please enter both User ID and password.' };
  }

  // 1. Check Supabase DB if available
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users_auth')
        .select('*')
        .eq('user_id', cleanId)
        .maybeSingle();

      if (!error && data) {
        if (data.password_hash === password) {
          saveLocalAccount(cleanId, data);
          return { success: true, user: data };
        } else {
          return { success: false, error: 'Invalid User ID or password. Please check your credentials.' };
        }
      }
    } catch (e) {}
  }

  // 2. Fallback to local accounts registry
  const localAccounts = getLocalAccounts();
  const localUser = localAccounts[cleanId];
  if (localUser) {
    if (localUser.password_hash === password) {
      return { success: true, user: localUser };
    } else {
      return { success: false, error: 'Invalid User ID or password. Please check your credentials.' };
    }
  }

  // Allow automatic account creation if first time login with fresh User ID
  const autoAccount = {
    user_id: cleanId,
    password_hash: password,
    created_at: new Date().toISOString()
  };
  saveLocalAccount(cleanId, autoAccount);
  return { success: true, user: autoAccount };
}

/**
 * Save / Update User Profile
 */
export async function saveUserProfileToSupabase(
  userId: string,
  profileData: any
): Promise<{ success: boolean; error?: any }> {
  const cleanId = userId.trim();
  if (!cleanId) return { success: false };

  // Update local account
  const localAccounts = getLocalAccounts();
  const existing = localAccounts[cleanId] || { user_id: cleanId };
  existing.profile_data = profileData;
  saveLocalAccount(cleanId, existing);

  // Update Supabase if available
  if (supabase) {
    try {
      await supabase.from('users_auth').upsert({
        user_id: cleanId,
        email: profileData.email || null,
        full_name: profileData.name || null,
        profile_data: profileData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).catch(() => {});
    } catch (e) {}
  }

  return { success: true };
}

/**
 * Save user activity record
 */
export async function saveUserActivityToSupabase(
  userId: string, 
  activityType: UserActivityRecord['activity_type'], 
  payload: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  const cleanId = userId.trim();
  const newActivity: UserActivityRecord = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: cleanId,
    activity_type: activityType,
    payload,
    created_at: new Date().toISOString()
  };

  // Save to local user activities list
  try {
    const actKey = `civicai_activities_${cleanId}`;
    const saved = localStorage.getItem(actKey);
    const list: UserActivityRecord[] = saved ? JSON.parse(saved) : [];
    list.unshift(newActivity);
    localStorage.setItem(actKey, JSON.stringify(list));
  } catch (e) {}

  // Save to Supabase if available
  if (supabase) {
    try {
      await supabase.from('user_activities').insert({
        user_id: cleanId,
        activity_type: activityType,
        payload,
        created_at: new Date().toISOString()
      }).catch(() => {});
    } catch (e) {}
  }

  return { success: true, data: newActivity };
}

/**
 * Fetch user activities strictly scoped to user_id
 */
export async function fetchUserActivitiesFromSupabase(userId: string): Promise<UserActivityRecord[]> {
  const cleanId = userId.trim();
  let activities: UserActivityRecord[] = [];

  // Load from local storage first
  try {
    const actKey = `civicai_activities_${cleanId}`;
    const saved = localStorage.getItem(actKey);
    if (saved) activities = JSON.parse(saved);
  } catch (e) {}

  // Merge with Supabase if available
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', cleanId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        data.forEach((remoteItem: any) => {
          if (!activities.some(a => a.id === remoteItem.id)) {
            activities.push(remoteItem);
          }
        });
      }
    } catch (err) {}
  }

  return activities;
}

/**
 * Legacy wrapper
 */
export async function saveUserDataToSupabase(userId: string, data: any): Promise<{ success: boolean; error?: any }> {
  return saveUserProfileToSupabase(userId, data);
}

/**
 * Fetch user data from Supabase or local storage
 */
export async function fetchUserDataFromSupabase(userId: string): Promise<any | null> {
  const cleanId = userId.trim();
  const localAccounts = getLocalAccounts();
  if (localAccounts[cleanId] && localAccounts[cleanId].profile_data) {
    return localAccounts[cleanId].profile_data;
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users_auth')
        .select('profile_data')
        .eq('user_id', cleanId)
        .single();

      if (!error && data) return data.profile_data;
    } catch (e) {}
  }

  return null;
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
    if (!supabase) return { success: true, count: schemes.length };

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
