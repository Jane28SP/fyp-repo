-- Check if trigger exists and create user_profiles for existing users
-- Run this in Supabase SQL Editor

-- 1. Check if trigger function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'handle_new_user'
) AS function_exists;

-- 2. Check if trigger exists
SELECT EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
) AS trigger_exists;

-- 3. Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (NEW.id, '')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
    RAISE NOTICE 'Trigger created successfully';
  ELSE
    RAISE NOTICE 'Trigger already exists';
  END IF;
END $$;

-- 5. Create user_profiles for existing users who don't have one
INSERT INTO public.user_profiles (user_id, full_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up 
  WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 6. Verify the results
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM public.user_profiles) AS total_profiles,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.user_profiles) AS missing_profiles;

