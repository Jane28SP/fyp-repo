import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type CreateClientOptions = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storage?: any; // Web: localStorage, Mobile: AsyncStorage wrapper
};

let client: SupabaseClient | null = null;

export function getSupabaseClient(opts: CreateClientOptions): SupabaseClient {
  if (client) return client;
  
  client = createClient(opts.supabaseUrl, opts.supabaseAnonKey, {
    auth: {
      storage: opts.storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  
  return client;
}

export function resetClient() {
  client = null;
}

