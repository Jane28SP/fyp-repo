-- Create wishlist table for storing user's favorite events
-- This table stores events that users want to save for later

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id) -- Prevent duplicate entries
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_event_id ON wishlist(event_id);

-- Enable Row Level Security
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
  ON wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can add to their own wishlist
CREATE POLICY "Users can insert own wishlist"
  ON wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete from their own wishlist
CREATE POLICY "Users can delete own wishlist"
  ON wishlist
  FOR DELETE
  USING (auth.uid() = user_id);

