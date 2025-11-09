-- Add email column to user_profiles table for easier access
-- Note: Password should NEVER be stored in user_profiles
-- Passwords are securely managed by Supabase Auth in auth.users table

-- Add email column if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Update existing records with email from auth.users
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.user_id = au.id
AND up.email IS NULL;

-- Create a function to automatically sync email when user_profiles is created/updated
CREATE OR REPLACE FUNCTION public.sync_user_profile_email()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sync email from auth.users when user_profiles is created or updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT email INTO NEW.email
    FROM auth.users
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync email (safe version without DROP)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sync_email_on_user_profile'
  ) THEN
    CREATE TRIGGER sync_email_on_user_profile
      BEFORE INSERT OR UPDATE ON public.user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_user_profile_email();
  END IF;
END $$;

-- Update the handle_new_user function to also sync email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, email)
  VALUES (NEW.id, '', NEW.email)
  ON CONFLICT (user_id) DO UPDATE
  SET email = NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

