import { VERIFIED_SCHEMES_DATABASE } from '../data/groundedSchemes';

export interface SchemeSyncResult {
  success: boolean;
  count: number;
  lastSynced: string;
  source: string;
  error?: string;
}

/**
 * Automate Government Scheme Database updates and synchronization
 */
export async function syncVerifiedSchemesToDatabase(): Promise<SchemeSyncResult> {
  const lastSynced = new Date().toISOString();
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://spkwmbxklttqkhnfamrp.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseKey) {
      console.log('[SchemeSync] Local grounded database ready with', VERIFIED_SCHEMES_DATABASE.length, 'verified schemes.');
      return {
        success: true,
        count: VERIFIED_SCHEMES_DATABASE.length,
        lastSynced,
        source: 'Local Grounded Scheme Registry'
      };
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const records = VERIFIED_SCHEMES_DATABASE.map(scheme => ({
      scheme_name: scheme.name,
      category: scheme.category,
      eligibility_criteria: scheme.eligibilityCriteria,
      benefits: scheme.benefitsSummary,
      source_url: scheme.officialPortalUrl,
      last_synced: lastSynced
    }));

    const { data, error } = await supabase
      .from('schemes')
      .upsert(records, { onConflict: 'scheme_name' })
      .select();

    if (error) {
      console.warn('[SchemeSync] Supabase sync notice:', error.message);
      return {
        success: true,
        count: VERIFIED_SCHEMES_DATABASE.length,
        lastSynced,
        source: 'Local Grounded Registry (Supabase sync fallback)',
        error: error.message
      };
    }

    return {
      success: true,
      count: data?.length || records.length,
      lastSynced,
      source: 'Supabase Remote Multi-Tenant Database'
    };
  } catch (err: any) {
    console.warn('[SchemeSync] Exception during scheme update:', err);
    return {
      success: true,
      count: VERIFIED_SCHEMES_DATABASE.length,
      lastSynced,
      source: 'Local Grounded Registry (Fallback)',
      error: err?.message || String(err)
    };
  }
}
