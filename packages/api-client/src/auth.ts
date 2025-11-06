import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "shared";

export async function signIn(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut(supabase: SupabaseClient) {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(
  supabase: SupabaseClient
): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user as User | null;
}

export async function getSession(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data;
}

