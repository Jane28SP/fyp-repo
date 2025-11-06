import { getSupabaseClient } from "api-client";

export const supabase = getSupabaseClient({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL!,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
  storage: window.localStorage,
});


