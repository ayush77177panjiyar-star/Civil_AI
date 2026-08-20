-- ============================================================
-- CIVICAI SUPABASE DATABASE SETUP & SECURITY MIGRATION SCRIPT
-- Copy and paste this into your Supabase SQL Editor
-- Fixes Cross-User Data Leak with strict Row-Level Security (RLS)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Activities & History Table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- e.g., 'rti_draft', 'document_analysis', 'scheme_check', 'rights_analysis', 'form_application'
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Schemes Database Table
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_name TEXT NOT NULL,
    category TEXT,
    eligibility_criteria JSONB,
    benefits TEXT,
    source_url TEXT,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration to avoid conflict errors
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view only their own activity" ON public.user_activities;
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activities;
DROP POLICY IF EXISTS "Users can delete their own activity" ON public.user_activities;
DROP POLICY IF EXISTS "Public schemes read access" ON public.schemes;

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- RLS Policies for User Activities (Fixes Cross-User Data Leak)
CREATE POLICY "Users can view only their own activity" 
ON public.user_activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity" 
ON public.user_activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity" 
ON public.user_activities FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for Schemes (Publicly Readable, Admin-only write)
CREATE POLICY "Public schemes read access" 
ON public.schemes FOR SELECT 
USING (true);
