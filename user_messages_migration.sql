-- ============================================================
-- CIVICAI USER MESSAGES PERSISTENCE MIGRATION SCRIPT
-- Copy and paste this script into your Supabase SQL Editor
-- Creates user_messages table and sets up Row Level Security (RLS)
-- ============================================================

-- 1. Create user_messages table
CREATE TABLE IF NOT EXISTS public.user_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'failed'))
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Anyone can insert user_messages" ON public.user_messages;
DROP POLICY IF EXISTS "Users can read own user_messages" ON public.user_messages;

-- 3. RLS Policies
-- Allow anyone (authenticated or anonymous citizens) to insert user messages
CREATE POLICY "Anyone can insert user_messages"
ON public.user_messages
FOR INSERT
TO public
WITH CHECK (true);

-- Allow citizens to read their own messages (or anonymous messages)
CREATE POLICY "Users can read own user_messages"
ON public.user_messages
FOR SELECT
TO public
USING (user_id = auth.uid()::text OR user_id IS NULL);
