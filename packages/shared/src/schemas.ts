import { z } from "zod";

// Event Schema
export const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Event = z.infer<typeof EventSchema>;

// User Schema (if needed)
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

