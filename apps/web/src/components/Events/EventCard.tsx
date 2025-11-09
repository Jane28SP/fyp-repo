import React, { useState, useEffect } from 'react';
import { Event, supabase } from '../../lib/supabase';

interface EventCardProps {
  event: Event;
  onBook: (event: Event) => void;
  onAddToCart: (event: Event) => void;
  isBooked?: boolean;
  userId?: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, onBook, onAddToCart, isBooked = false, userId }) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'rgb(55, 109, 39)',
      'Business': 'bg-red-600',
      'Health & Wellness': 'bg-green-500',
      'Food & Drink': '#2f0bf5',
      'Music': '#231b09',
      'Education': '#6a2d7e',
    };
    return colors[category] || 'bg-red-500';
  };

  const getCategoryStyle = (category: string) => {
    const color = getCategoryColor(category);
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return { backgroundColor: color };
    }
    return {};
  };

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);

  useEffect(() => {
    const key = `eventReviews_${event.id}`;
    const reviews = JSON.parse(localStorage.getItem(key) || '[]');
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
      setAvgRating(parseFloat((sum / reviews.length).toFixed(1)));
      setRatingCount(reviews.length);
    } else {
      setAvgRating(null);
      setRatingCount(0);
    }
  }, [event.id]);

  useEffect(() => {
    console.log('EventCard userId check:', { userId, eventId: event.id, hasUserId: !!userId });
    if (userId) {
      checkWishlistStatus();
    }
  }, [userId, event.id]);

  const checkWishlistStatus = async () => {
    if (!userId) return;
    try {
      // Use Supabase client (handles auth automatically)
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', event.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
        console.error('Error checking wishlist:', error);
        setIsInWishlist(false);
        return;
      }

      setIsInWishlist(!!data);
    } catch (error) {
      console.error('Error checking wishlist:', error);
      setIsInWishlist(false);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('toggleWishlist called', { userId, eventId: event.id });
    
    if (!userId) {
      console.warn('No userId provided');
      alert('Please login to add events to wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      console.log('Toggling wishlist:', { userId, eventId: event.id, isInWishlist });

      if (isInWishlist) {
        // Remove from wishlist using direct REST API
        console.log('Removing from wishlist...');
        
        // Get user session from localStorage (bypass getSession() which hangs)
        let session;
        try {
          const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'sznagdhpnjexuuydnimh';
          const storageKey = `sb-${projectRef}-auth-token`;
          const storedSession = localStorage.getItem(storageKey);
          
          if (!storedSession) {
            alert('Please login to remove events from wishlist');
            setWishlistLoading(false);
            return;
          }
          
          const parsedSession = JSON.parse(storedSession);
          if (!parsedSession?.access_token) {
            alert('Invalid session. Please login again.');
            setWishlistLoading(false);
            return;
          }
          
          session = {
            access_token: parsedSession.access_token
          };
        } catch (sessionErr: any) {
          console.error('Failed to get session from localStorage:', sessionErr);
          alert('Failed to get session. Please try again.');
          setWishlistLoading(false);
          return;
        }

        const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
        const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmpleHV1eWRuaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzg4NjEsImV4cCI6MjA3MDE1NDg2MX0.TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4';

        // Use direct REST API with user's access token
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/wishlist?user_id=eq.${userId}&event_id=eq.${event.id}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
          }
        );

        console.log('Delete wishlist response:', { status: response.status, statusText: response.statusText });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Delete wishlist error:', errorData);
          throw new Error(errorData.message || `Failed to remove from wishlist: ${response.status}`);
        }

        const data = await response.json().catch(() => []);
        console.log('Delete wishlist success:', data);

        setIsInWishlist(false);
        console.log('Successfully removed from wishlist');
      } else {
        // Add to wishlist using direct REST API (same approach as EventList.tsx)
        console.log('Adding to wishlist...');
        
        // Get user session from localStorage (bypass getSession() which hangs)
        console.log('Step 1: Getting session from localStorage...');
        let session;
        try {
          // Supabase stores session in localStorage with key: sb-<project-ref>-auth-token
          const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'sznagdhpnjexuuydnimh';
          const storageKey = `sb-${projectRef}-auth-token`;
          
          console.log('Step 2: Reading from localStorage...', { storageKey });
          const storedSession = localStorage.getItem(storageKey);
          
          if (!storedSession) {
            console.error('Step 2 ERROR: No session in localStorage');
            alert('Please login to add events to wishlist');
            setWishlistLoading(false);
            return;
          }
          
          const parsedSession = JSON.parse(storedSession);
          console.log('Step 3: Session parsed from localStorage:', { 
            hasAccessToken: !!parsedSession?.access_token,
            hasExpiresAt: !!parsedSession?.expires_at
          });
          
          // Check if session is expired
          if (parsedSession?.expires_at) {
            const expiresAt = parsedSession.expires_at * 1000; // Convert to milliseconds
            const now = Date.now();
            if (now >= expiresAt) {
              console.error('Step 3 ERROR: Session expired');
              alert('Session expired. Please login again.');
              setWishlistLoading(false);
              return;
            }
          }
          
          if (!parsedSession?.access_token) {
            console.error('Step 3 ERROR: No access_token in session');
            alert('Invalid session. Please login again.');
            setWishlistLoading(false);
            return;
          }
          
          session = {
            access_token: parsedSession.access_token
          };
          console.log('Step 4: Session ready, access_token exists:', !!session.access_token);
        } catch (sessionErr: any) {
          console.error('Step 1-4 EXCEPTION: Failed to get session from localStorage:', sessionErr);
          console.error('Exception details:', {
            message: sessionErr?.message,
            name: sessionErr?.name
          });
          alert(`Failed to get session: ${sessionErr?.message || 'Unknown error'}. Please try again.`);
          setWishlistLoading(false);
          return;
        }

        const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
        const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmpleHV1eWRuaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzg4NjEsImV4cCI6MjA3MDE1NDg2MX0.TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4';

        const requestBody = {
          user_id: userId,
          event_id: event.id
        };

        console.log('Step 4: Preparing fetch request...', {
          url: `${SUPABASE_URL}/rest/v1/wishlist`,
          method: 'POST',
          hasAccessToken: !!session.access_token,
          body: requestBody
        });

        // Use direct REST API with user's access token
        let response;
        try {
          console.log('Step 5: Sending fetch request NOW...');
          response = await fetch(
            `${SUPABASE_URL}/rest/v1/wishlist`,
            {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify(requestBody),
            }
          );
          console.log('Step 6: Fetch request completed!', { 
            status: response.status, 
            statusText: response.statusText,
            ok: response.ok
          });
        } catch (fetchErr: any) {
          console.error('Step 5 EXCEPTION: Fetch request failed:', fetchErr);
          throw new Error(`Network error: ${fetchErr.message || 'Failed to send request'}`);
        }

        console.log('Step 7: Processing response...', { status: response.status, statusText: response.statusText });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Step 7 ERROR: Response not OK:', errorData);
          
          // Check if it's a duplicate error
          if (response.status === 409 || errorData.message?.includes('duplicate') || errorData.message?.includes('unique constraint')) {
            console.log('Item already in wishlist, updating state');
            setIsInWishlist(true);
            setWishlistLoading(false);
            return;
          }
          
          throw new Error(errorData.message || `Failed to add to wishlist: ${response.status}`);
        }

        const data = await response.json();
        console.log('Step 8: Success! Data received:', data);

        setIsInWishlist(true);
        console.log('Successfully added to wishlist');
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      const errorMessage = error.message || 'Unknown error';
      
      // Provide more helpful error messages
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
        alert('Permission denied. Please make sure you are logged in and the wishlist table has proper RLS policies. Check browser console for details.');
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('unique constraint')) {
        // Already handled above, but just in case
        setIsInWishlist(true);
      } else {
        alert(`Failed to update wishlist: ${errorMessage}`);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  // Default placeholder image
  const defaultImageUrl = 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop';
  const imageUrl = event.image_url || defaultImageUrl;

  return (
    <div 
      className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer"
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            // If image fails to load, use default placeholder
            const target = e.target as HTMLImageElement;
            if (target.src !== defaultImageUrl) {
              target.src = defaultImageUrl;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute top-4 right-4 z-40 flex flex-row gap-2 items-center">
          {event.price === 0 && (
            <span className="px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
              FREE
            </span>
          )}
          {event.category && (
            <span 
              className={`px-4 py-1.5 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm ${getCategoryColor(event.category).startsWith('#') || getCategoryColor(event.category).startsWith('rgb') ? '' : getCategoryColor(event.category)}`}
              style={getCategoryStyle(event.category)}
            >
              {event.category}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center text-sm">
            <svg className="w-5 h-5 text-amber-500 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-gray-900">{formatDate(event.date)} • {formatTime(event.time)}</span>
          </div>
          
          <div className="flex items-start text-sm">
            <svg className="w-5 h-5 text-red-500 mr-2.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-gray-600 line-clamp-2">{event.location}</div>
          </div>

          <div className="flex items-center text-sm">
            {(() => {
              const filled = avgRating ? Math.round(avgRating) : 0;
              const stars = Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < filled ? 'text-amber-500' : 'text-gray-300'}>★</span>
              ));
              return (
                <>
                  <span className="mr-1">{stars}</span>
                  {avgRating !== null && (
                    <span className="ml-1 text-gray-700">
                      <span className="font-semibold">{avgRating}</span>
                      <span className="ml-1">/ 5</span>
                      <span className="ml-2 text-xs text-gray-500">({ratingCount})</span>
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-5 border-t border-amber-100">
          <div className="flex flex-col">
            {event.price === 0 ? (
              <div className="text-2xl font-bold text-green-600">Free</div>
            ) : (
              <>
                <div className="text-2xl font-bold" style={{ color: '#2b2b2b' }}>
                  RM {event.price}
                </div>
                <div className="text-xs text-gray-500 font-medium">per ticket</div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {userId && (
              <button
                onClick={(e) => {
                  console.log('Wishlist button clicked!', { userId, eventId: event.id, isInWishlist });
                  toggleWishlist(e);
                }}
                disabled={wishlistLoading}
                className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer border-2 border-gray-200"
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {wishlistLoading ? (
                  <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg
                    className={`w-5 h-5 transition-colors ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                    fill={isInWishlist ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.682a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={() => onAddToCart(event)}
              className="relative px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: isCardHovered ? '#e4281f' : '#ffbe54' }}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Add to Cart</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 