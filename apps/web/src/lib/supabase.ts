import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmpleHV1eWRuaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc5MjM1MjAsImV4cCI6MjAyMzQ5OTUyMH0.RNlVuEBvVGDdP-5cjVHyNHgpUQDqpBKhqBsH_HpPBVw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 数据库类型定义
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  price: number;
  category?: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  organizer_id: string;
}

export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'checked_in';
  rsvp_status: 'going' | 'maybe' | 'not_going';
  created_at: string;
  checked_in_at?: string;
  event?: Event;
  notes?: string;
  promo_code?: string;
  discount_amount?: number;
  attendee_name?: string;
  attendee_email?: string;
  attendee_phone?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  usage_count: number;
  event_id?: string; // null means applicable to all events
  organizer_id: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  booking_id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  device_info?: {
    userAgent?: string;
    platform?: string;
    language?: string;
    screenWidth?: number;
    screenHeight?: number;
    timestamp?: string;
    timezone?: string;
  };
  organizer_id: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email?: string;
  activity_type: string;
  entity_type: 'event' | 'booking' | 'promo_code' | 'user' | 'payment' | 'other';
  entity_id?: string;
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Upload image to Supabase Storage
// Returns the image URL or throws an error with helpful message
export async function uploadEventImage(file: File, eventId?: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = eventId 
      ? `${eventId}-${Date.now()}.${fileExt}`
      : `event-${Date.now()}.${fileExt}`;
    const filePath = `event-images/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      
      // Provide helpful error message for bucket not found
      if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
        throw new Error(
          'Storage bucket "event-images" not found. Please create it in Supabase Dashboard → Storage → Buckets. ' +
          'Or you can use an image URL instead.'
        );
      }
      
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    // Re-throw with original message if it's already our custom message
    if (error.message?.includes('Storage bucket')) {
      throw error;
    }
    throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
  }
}

// Create a data URL from file (for mock mode or when storage is unavailable)
export function createImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}