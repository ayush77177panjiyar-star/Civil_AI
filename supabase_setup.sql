-- ============================================================
-- CIVICAI SUPABASE DATABASE SETUP SCRIPT
-- Project ID: spkwmbxklttqkhnfamrp
-- Copy and paste this into Supabase SQL Editor (https://supabase.com/dashboard/project/spkwmbxklttqkhnfamrp/sql)
-- ============================================================

-- 1. Create `user_profiles` table for storing clean user records
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    data_type TEXT NOT NULL DEFAULT 'user',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index on user_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles (user_id);

-- 3. Create `audit_logs` table for logging grounded queries (excluding example views)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,
    feature TEXT NOT NULL,
    user_query TEXT NOT NULL,
    confidence TEXT DEFAULT 'HIGH',
    sources_cited TEXT[] DEFAULT '{}',
    is_example BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) & Public access policies for standard API key access
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated access on user_profiles
CREATE POLICY "Allow public select on user_profiles" 
    ON public.user_profiles FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert/update on user_profiles" 
    ON public.user_profiles FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Allow public insert on audit_logs
CREATE POLICY "Allow public insert on audit_logs" 
    ON public.audit_logs FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 5. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
