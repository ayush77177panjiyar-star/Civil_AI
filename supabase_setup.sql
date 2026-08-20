-- ============================================================
-- CIVICAI / LEGAL GUIDER CENTRALIZED DATABASE SETUP & USER AUTH SCRIPT
-- Copy and paste this script into your Supabase SQL Editor
-- Centralizes User Authentication, Profiles, and Activity History
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Centralized User Authentication & Credentials Table
CREATE TABLE IF NOT EXISTS public.users_auth (
    user_id TEXT PRIMARY KEY UNIQUE, -- Unique custom User ID chosen by citizen
    password_hash TEXT NOT NULL,      -- Secure user authentication password
    email TEXT,
    full_name TEXT,
    profile_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY REFERENCES public.users_auth(user_id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Activities & History Table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.users_auth(user_id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- e.g., 'rti_draft', 'document_analysis', 'scheme_check', 'rights_analysis', 'form_application'
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Schemes Database Table
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_name TEXT NOT NULL UNIQUE,
    category TEXT,
    eligibility_criteria JSONB,
    benefits TEXT,
    source_url TEXT,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) & PUBLIC API ACCESS POLICIES
-- ============================================================

-- Enable Row Level Security (RLS)
ALTER TABLE public.users_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration script
DROP POLICY IF EXISTS "Public access on users_auth" ON public.users_auth;
DROP POLICY IF EXISTS "Public access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public access on user_activities" ON public.user_activities;
DROP POLICY IF EXISTS "Public access on schemes" ON public.schemes;

-- Enable standard public API access policies
CREATE POLICY "Public access on users_auth" ON public.users_auth FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on user_activities" ON public.user_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on schemes" ON public.schemes FOR ALL USING (true) WITH CHECK (true);

-- Auto-update modified timestamp trigger
CREATE OR REPLACE FUNCTION update_user_auth_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_auth_updated_at ON public.users_auth;
CREATE TRIGGER set_users_auth_updated_at
    BEFORE UPDATE ON public.users_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_user_auth_timestamp();
