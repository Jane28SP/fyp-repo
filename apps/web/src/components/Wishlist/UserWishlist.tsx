import React, { useEffect, useState } from 'react';
import { supabase, Event } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface UserWishlistProps {
  userId: string;
}

interface WishlistItem {
  id: string;
  event_id: string;
  created_at: string;
  event: Event;
}

const UserWishlist: React.FC<UserWishlistProps> = ({ userId }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, [userId]);

  const fetchWishlist = async () => {
    if (!userId) {
      setLoading(false);
      setWishlist([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get session from localStorage (bypass getSession() which hangs)
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'sznagdhpnjexuuydnimh';
      const storageKey = `sb-${projectRef}-auth-token`;
      const storedSession = localStorage.getItem(storageKey);
      
      if (!storedSession) {
        setError('Please login to view wishlist');
        setWishlist([]);
        setLoading(false);
        return;
      }

      const parsedSession = JSON.parse(storedSession);
      if (!parsedSession?.access_token) {
        setError('Invalid session. Please login again.');
        setWishlist([]);
        setLoading(false);
        return;
      }

      const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmpleHV1eWRuaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzg4NjEsImV4cCI6MjA3MDE1NDg2MX0.TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4';

      // Step 1: Fetch wishlist items
      const wishlistResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/wishlist?user_id=eq.${userId}&select=id,user_id,event_id,created_at&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${parsedSession.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
        }
      );

      if (!wishlistResponse.ok) {
        throw new Error(`Failed to load wishlist: ${wishlistResponse.status}`);
      }

      const wishlistData = await wishlistResponse.json();

      if (!wishlistData || wishlistData.length === 0) {
        setWishlist([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch associated events
      const eventIds = wishlistData.map((item: any) => item.event_id).join(',');
      const eventsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/events?id=in.(${eventIds})&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${parsedSession.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
        }
      );

      if (!eventsResponse.ok) {
        throw new Error(`Failed to load events: ${eventsResponse.status}`);
      }

      const eventsData = await eventsResponse.json();
      const eventsMap = new Map((eventsData || []).map((e: any) => [e.id, e]));

      // Step 3: Combine wishlist items with events
      const transformedData = wishlistData.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        event_id: item.event_id,
        created_at: item.created_at,
        event: eventsMap.get(item.event_id),
      }));

      setWishlist(transformedData);

    } catch (err: any) {
      console.error('Wishlist fetch error:', err);
      setError(err.message || 'Failed to load wishlist');
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistItemId: string) => {
    try {
      // Get session from localStorage
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'sznagdhpnjexuuydnimh';
      const storageKey = `sb-${projectRef}-auth-token`;
      const storedSession = localStorage.getItem(storageKey);
      
      if (!storedSession) {
        alert('Please login to remove items from wishlist');
        return;
      }

      const parsedSession = JSON.parse(storedSession);
      if (!parsedSession?.access_token) {
        alert('Invalid session. Please login again.');
        return;
      }

      const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmpleHV1eWRuaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzg4NjEsImV4cCI6MjA3MDE1NDg2MX0.TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4';

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/wishlist?id=eq.${wishlistItemId}&user_id=eq.${userId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${parsedSession.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to remove from wishlist: ${response.status}`);
      }

      // Refresh wishlist after removal
      await fetchWishlist();
    } catch (err: any) {
      console.error('Failed to remove from wishlist:', err);
      alert(`Failed to remove item from wishlist: ${err.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading wishlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchWishlist}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">My Wishlist</h3>
        <span className="text-sm text-gray-500">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</span>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.682a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h4 className="mt-4 text-lg font-semibold text-gray-900">Your wishlist is empty</h4>
          <p className="mt-2 text-gray-600">Start adding events you're interested in!</p>
          <Link
            to="/"
            className="mt-6 inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              {item.event?.image_url ? (
                <img
                  src={item.event.image_url}
                  alt={item.event.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Event';
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No Image</span>
                </div>
              )}
              <div className="p-4">
                <h4 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{item.event?.title}</h4>
                <p className="text-sm text-gray-600 mb-2">📅 {item.event?.date} {item.event?.time}</p>
                <p className="text-sm text-gray-600 mb-3">📍 {item.event?.location}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-orange-600">RM {item.event?.price}</span>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="text-red-500 hover:text-red-700 transition"
                    title="Remove from wishlist"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <Link
                  to="/"
                  className="mt-3 block w-full text-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserWishlist;

