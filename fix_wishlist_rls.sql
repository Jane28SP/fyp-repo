-- Fix wishlist RLS policies to ensure they work correctly
-- Run this in Supabase SQL Editor

-- First, check if table exists in public schema
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'wishlist'
) AS table_exists;

-- Create or replace policies (safe version without DROP)
-- Policy: Users can view their own wishlist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'wishlist' 
    AND policyname = 'Users can view own wishlist'
  ) THEN
    CREATE POLICY "Users can view own wishlist"
      ON public.wishlist
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can add to their own wishlist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'wishlist' 
    AND policyname = 'Users can insert own wishlist'
  ) THEN
    CREATE POLICY "Users can insert own wishlist"
      ON public.wishlist
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can delete from their own wishlist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'wishlist' 
    AND policyname = 'Users can delete own wishlist'
  ) THEN
    CREATE POLICY "Users can delete own wishlist"
      ON public.wishlist
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'wishlist';

