import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://spkwmbxklttqkhnfamrp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseServer = (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'your_supabase_key_here')
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Node-safe memory registry for serverless environments
const inMemoryServerAccounts: Record<string, { id: string; user_id: string; full_name?: string; email?: string; password_hash: string }> = {};

export async function serverRegisterUser(userId: string, password: string, email?: string, fullName?: string) {
  const cleanId = String(userId || '').trim();
  if (!cleanId) return { success: false, error: 'User ID is required' };

  if (supabaseServer) {
    try {
      const { data: existing } = await supabaseServer
        .from('users_auth')
        .select('user_id')
        .eq('user_id', cleanId)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'This User ID already exists. Please choose a different User ID or login.' };
      }

      const { data, error } = await supabaseServer
        .from('users_auth')
        .insert([{
          user_id: cleanId,
          email: email || `${cleanId.toLowerCase()}@civicai.user`,
          full_name: fullName || cleanId,
          password_hash: password
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'This User ID already exists.' };
        }
        throw error;
      }
      return { success: true, user: data };
    } catch (e: any) {
      console.warn('[Supabase Server Notice]:', e?.message || e);
    }
  }

  // Node-safe in-memory fallback
  if (inMemoryServerAccounts[cleanId]) {
    return { success: false, error: 'This User ID already exists. Please choose a different User ID or login.' };
  }

  const newAcc = {
    id: `usr_${Date.now()}`,
    user_id: cleanId,
    email: email || `${cleanId.toLowerCase()}@civicai.user`,
    full_name: fullName || cleanId,
    password_hash: password
  };
  inMemoryServerAccounts[cleanId] = newAcc;
  return { success: true, user: newAcc };
}

export async function serverLoginUser(userId: string, password: string) {
  const cleanId = String(userId || '').trim();
  if (!cleanId) return { success: false, error: 'User ID is required' };

  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('users_auth')
        .select('*')
        .eq('user_id', cleanId)
        .maybeSingle();

      if (data) {
        if (data.password_hash === password) {
          return { success: true, user: data };
        }
        return { success: false, error: 'Invalid User ID or password. Please check your credentials.' };
      }
    } catch (e: any) {
      console.warn('[Supabase Server Notice]:', e?.message || e);
    }
  }

  // Node-safe in-memory check
  const localAcc = inMemoryServerAccounts[cleanId];
  if (localAcc) {
    if (localAcc.password_hash === password) {
      return { success: true, user: localAcc };
    }
    return { success: false, error: 'Invalid User ID or password.' };
  }

  return { success: false, error: 'User ID not registered. Please create a free account.' };
}
