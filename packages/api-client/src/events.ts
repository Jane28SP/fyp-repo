import { SupabaseClient } from "@supabase/supabase-js";
import { Event, EventSchema } from "shared";

const EVENTS_TABLE = "events";

export async function fetchEvents(supabase: SupabaseClient): Promise<Event[]> {
  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .select("*")
    .order("startsAt", { ascending: true });

  if (error) throw error;
  
  // Validate with Zod
  return data.map((item) => EventSchema.parse(item));
}

export async function fetchEventById(
  supabase: SupabaseClient,
  id: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return EventSchema.parse(data);
}

export async function createEvent(
  supabase: SupabaseClient,
  event: Omit<Event, "id" | "createdAt" | "updatedAt">
): Promise<Event> {
  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return EventSchema.parse(data);
}

export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Omit<Event, "id" | "createdAt">>
): Promise<Event> {
  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return EventSchema.parse(data);
}

export async function deleteEvent(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from(EVENTS_TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Realtime subscription helper
export function subscribeToEvents(
  supabase: SupabaseClient,
  callback: (event: Event) => void
) {
  const channel = supabase
    .channel("events-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: EVENTS_TABLE,
      },
      (payload) => {
        if (payload.new) {
          try {
            const event = EventSchema.parse(payload.new);
            callback(event);
          } catch (err) {
            console.error("Invalid event data:", err);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

