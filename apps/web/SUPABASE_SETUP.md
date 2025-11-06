# Supabase Setup Instructions

## 1. Database Schema Updates

### Events Table
Make sure your `events` table includes an `updated_at` column:

```sql
-- Add updated_at column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Promo Codes Table
Also ensure `promo_codes` table has `updated_at`:

```sql
ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TRIGGER update_promo_codes_updated_at 
    BEFORE UPDATE ON promo_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 2. Storage Bucket Setup

### Create Event Images Bucket

**IMPORTANT:** The image upload feature requires this bucket to be created. Without it, users will see an error, but can still use image URLs or data URLs as a fallback.

#### Step-by-Step Instructions:
1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click on **Buckets** tab
5. Click **New Bucket** button (usually in the top right)
6. Fill in the form:
   - **Bucket name:** `event-images` (must be exactly this name)
   - **Public bucket:** ✅ **Check this box** (important for public image access)
   - **File size limit:** Leave default or set to 5MB
   - **Allowed MIME types:** Leave empty or add `image/*`
7. Click **Create bucket**

#### Verify Bucket Creation:
After creating, you should see `event-images` in your buckets list with a green "Public" badge.

### Set Storage Policies

#### For Event Images Upload (Authenticated Users Only)
```sql
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Allow authenticated users to update event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images');

-- Allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated users to delete event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');

-- Allow public read access
CREATE POLICY "Allow public read access to event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');
```

## 3. Row Level Security (RLS)

### Events Table RLS Policies
Ensure you have appropriate RLS policies for events:

```sql
-- Allow organizers to insert their own events
CREATE POLICY "Organizers can insert their own events"
ON events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = organizer_id);

-- Allow organizers to update their own events
CREATE POLICY "Organizers can update their own events"
ON events
FOR UPDATE
TO authenticated
USING (auth.uid() = organizer_id);

-- Allow organizers to delete their own events
CREATE POLICY "Organizers can delete their own events"
ON events
FOR DELETE
TO authenticated
USING (auth.uid() = organizer_id);

-- Allow public to read events
CREATE POLICY "Anyone can read events"
ON events
FOR SELECT
TO public
USING (true);
```

## 4. Verification

After setup, verify:
1. ✅ `events` table has `updated_at` column
2. ✅ `promo_codes` table has `updated_at` column
3. ✅ Storage bucket `event-images` exists and is public
4. ✅ Storage policies allow authenticated uploads
5. ✅ RLS policies are correctly set

## 5. Testing

Test the image upload functionality:
1. Log in as an organizer
2. Go to Organizer Dashboard
3. Create a new event
4. Click "Upload Image" button
5. Select an image file
6. Verify the image uploads and displays correctly

## Notes

- Maximum image size: 5MB (enforced in frontend)
- Supported formats: All image formats (JPEG, PNG, GIF, etc.)
- Images are stored in: `event-images/{eventId}-{timestamp}.{ext}`
- All image URLs are publicly accessible
