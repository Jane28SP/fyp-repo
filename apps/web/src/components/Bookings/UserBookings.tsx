import React, { useState, useEffect, useMemo } from 'react';
import { Booking, Event } from '../../lib/supabase';
import QRCode from '../Events/QRCode';

interface UserBookingsProps {
  userId: string;
}

type FilterTab = 'all' | 'upcoming' | 'past' | 'cancelled';

const UserBookings: React.FC<UserBookingsProps> = ({ userId }) => {
  const [bookings, setBookings] = useState<(Booking & { event: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrBooking, setQrBooking] = useState<(Booking & { event: Event }) | null>(null);
  const [reviewBooking, setReviewBooking] = useState<(Booking & { event: Event }) | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const savedBookings = localStorage.getItem(`userBookings_${userId}`);
      
      if (savedBookings) {
        setBookings(JSON.parse(savedBookings));
        setLoading(false);
        return;
      }

      // Mock data
      const mockBookings: (Booking & { event: Event })[] = [
        {
          id: '1',
          user_id: userId,
          event_id: '1',
          status: 'cancelled',
          rsvp_status: 'not_going',
          created_at: new Date().toISOString(),
          event: {
            id: '1',
            title: 'Tech Talk: React 19 New Features',
            description: 'Deep dive into React 19 latest features.',
            date: '2025-05-15',
            time: '14:00-16:00',
            location: 'Kuala Lumpur Convention Centre, Hall 1',
            capacity: 50,
            price: 50,
            category: 'Technology',
            image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
            created_at: '2024-01-01T00:00:00Z',
            organizer_id: 'mock-organizer-1'
          }
        },
        {
          id: '2',
          user_id: userId,
          event_id: '2',
          status: 'confirmed',
          rsvp_status: 'going',
          created_at: new Date().toISOString(),
          event: {
            id: '2',
            title: 'Startup Investment Forum',
            description: 'Network with renowned investors.',
            date: '2025-12-20',
            time: '09:00-17:00',
            location: 'Petaling Jaya Convention Centre, Selangor',
            capacity: 100,
            price: 299,
            category: 'Business',
            image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
            created_at: '2024-01-01T00:00:00Z',
            organizer_id: 'mock-organizer-2'
          }
        },
        {
          id: '3',
          user_id: userId,
          event_id: '3',
          status: 'confirmed',
          rsvp_status: 'maybe',
          created_at: new Date().toISOString(),
          event: {
            id: '3',
            title: 'Food Festival: International Cuisine',
            description: 'Taste delicious food from around the world.',
            date: '2025-11-25',
            time: '11:00-20:00',
            location: 'Malacca Heritage Food Court, Jonker Street',
            capacity: 200,
            price: 80,
            category: 'Food & Drink',
            image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
            created_at: '2024-01-01T00:00:00Z',
            organizer_id: 'mock-organizer-4'
          }
        },
        {
          id: '4',
          user_id: userId,
          event_id: '4',
          status: 'checked_in',
          rsvp_status: 'going',
          created_at: new Date().toISOString(),
          event: {
            id: '4',
            title: 'Yoga Workshop',
            description: 'Professional yoga instructor guidance.',
            date: '2024-09-25',
            time: '10:00-12:00',
            location: 'Penang Yoga Studio, George Town',
            capacity: 30,
            price: 150,
            category: 'Health & Wellness',
            image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
            created_at: '2024-01-01T00:00:00Z',
            organizer_id: 'mock-organizer-3'
          }
        },
        {
          id: '5',
          user_id: userId,
          event_id: '5',
          status: 'confirmed',
          rsvp_status: 'going',
          created_at: new Date().toISOString(),
          event: {
            id: '5',
            title: 'Concert: Classical Meets Modern',
            description: 'Famous symphony orchestra performance.',
            date: '2025-12-20',
            time: '19:30-21:30',
            location: 'Dewan Filharmonik Petronas, KLCC',
            capacity: 500,
            price: 380,
            category: 'Music',
            image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
            created_at: '2024-01-01T00:00:00Z',
            organizer_id: 'mock-organizer-5'
          }
        }
      ];

      setBookings(mockBookings);
      localStorage.setItem(`userBookings_${userId}`, JSON.stringify(mockBookings));
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    let result = bookings;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (activeTab) {
      case 'upcoming':
        result = result.filter(b => 
          b.status !== 'cancelled' && 
          new Date(b.event.date) >= today
        );
        break;
      case 'past':
        result = result.filter(b => new Date(b.event.date) < today);
        break;
      case 'cancelled':
        result = result.filter(b => b.status === 'cancelled');
        break;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.event.title.toLowerCase().includes(query) ||
        b.event.location.toLowerCase().includes(query) ||
        b.event.category?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [bookings, activeTab, searchQuery]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Technology':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
      case 'Business':
        return { bg: 'bg-red-100', text: 'text-red-700' };
      case 'Health & Wellness':
        return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'Food & Drink':
        return { bg: '', text: 'text-white', style: { backgroundColor: '#2f0bf5' } };
      case 'Music':
        return { bg: '', text: 'text-white', style: { backgroundColor: '#231b09' } };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '/');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'cancelled') {
      return (
        <div className="absolute top-4 right-4 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg" style={{ backgroundColor: '#E4281F', color: 'white' }}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Cancelled
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent absolute top-0" style={{ borderColor: '#FFBE54', borderTopColor: 'transparent' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={fetchBookings} className="px-6 py-3 rounded-lg font-bold text-white shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: '#FFBE54' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications Button */}
      <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all group">
        <svg className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Notifications</span>
      </button>

      {/* Enhanced Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
        <div className="grid grid-cols-4 gap-1">
          {[
            { key: 'all', label: 'All Bookings', icon: '📋', count: bookings.length },
            { key: 'upcoming', label: 'Upcoming', icon: '📅', count: bookings.filter(b => b.status !== 'cancelled' && new Date(b.event.date) >= new Date()).length },
            { key: 'past', label: 'Past Events', icon: '✓', count: bookings.filter(b => new Date(b.event.date) < new Date()).length },
            { key: 'cancelled', label: 'Cancelled', icon: '✕', count: bookings.filter(b => b.status === 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as FilterTab)}
              className={`px-3 py-2.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                activeTab === tab.key
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === tab.key ? { backgroundColor: '#FFBE54' } : {}}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-base">{tab.icon}</span>
                <span className="text-xs font-semibold whitespace-nowrap">{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/30' : 'bg-gray-100'}`}>
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Search Bar */}
      <div className="relative">
        <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: '#FFBE54' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by event name, location, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all text-gray-700 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Enhanced Bookings List */}
      <div className="space-y-4">
        {(() => {
          const reviewedSet = new Set<string>(
            (JSON.parse(localStorage.getItem(`userReviews_${userId}`) || '[]') as any[]).map(r => r.eventId)
          );
          return filteredBookings.map((booking) => {
          const categoryColor = getCategoryColor(booking.event.category || '');
          return (
            <div 
              key={booking.id} 
              className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-orange-200 transition-all duration-300 group relative"
            >
              <div className="flex gap-5 p-5">
                {/* Event Image */}
                <div className="relative w-56 h-36 flex-shrink-0 rounded-xl overflow-hidden">
                  <img
                    src={booking.event.image_url}
                    alt={booking.event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {getStatusBadge(booking.status)}
                </div>

                {/* Event Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span 
                        className={`px-4 py-1.5 rounded-full text-xs font-bold ${categoryColor.bg} ${categoryColor.text}`}
                        style={categoryColor.style}
                      >
                        {booking.event.category}
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-md" style={{ backgroundColor: '#E4281F' }}>
                        RM {booking.event.price}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                      {booking.event.title}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" style={{ color: '#FFBE54' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">{formatDate(booking.event.date)}</span>
                        <span className="text-gray-400">•</span>
                        <span>{booking.event.time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" style={{ color: '#E4281F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{booking.event.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  {booking.status === 'cancelled' && (
                    <button className="mt-4 px-8 py-3 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all" style={{ backgroundColor: '#FFBE54' }}>
                      Book Again
                    </button>
                  )}
                  {booking.status !== 'cancelled' && (
                    <div className="mt-4 flex gap-3">
                      {/* Review: only for past or completed/checked_in */}
                      { (() => {
                          const isPast = new Date(booking.event.date) < new Date();
                          const status = (booking as any).status as string;
                          const isDone = status === 'checked_in' || status === 'completed';
                          const notReviewed = !reviewedSet.has(booking.event.id);
                          return (isPast || isDone) && notReviewed;
                        })() && (
                        <button
                          onClick={() => {
                            setReviewBooking(booking);
                            setRating(5);
                            setReviewText('');
                          }}
                          className="px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                          style={{ backgroundColor: '#FFBE54' }}
                        >
                          Leave Review
                        </button>
                      )}
                      <button
                        onClick={() => setQrBooking(booking)}
                        className="px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                        style={{ backgroundColor: '#E4281F' }}
                      >
                        View QR
                      </button>
                      <button
                        className="px-5 py-3 rounded-xl text-sm font-bold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        Download
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        });})()}
      </div>

      {/* Enhanced Status Legend */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 shadow-md">
        <h4 className="font-bold text-gray-900 mb-4 text-lg">Status Legend</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: '#10B981' }}></div>
            <span className="text-sm font-medium text-gray-700">Going - Confirmed attendance</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: '#FFBE54' }}></div>
            <span className="text-sm font-medium text-gray-700">Maybe - Pending confirmation</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: '#E4281F' }}></div>
            <span className="text-sm font-medium text-gray-700">Cancelled - Booking cancelled</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: '#3B82F6' }}></div>
            <span className="text-sm font-medium text-gray-700">Completed - Event finished</span>
          </div>
        </div>
      </div>

      {/* No Results */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-100">
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? `No results match "${searchQuery}"` : 'Start exploring amazing events!'}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: '#FFBE54' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Events
          </a>
        </div>
      )}
      {qrBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Check-in QR Code</h3>
            <p className="text-gray-600 mb-6">Show this QR at the entrance for {qrBooking.event.title}</p>
            <div className="bg-white p-4 rounded-xl inline-block mx-auto shadow-md">
              <QRCode
                bookingId={qrBooking.id}
                eventId={qrBooking.event.id}
                userId={userId}
              />
            </div>
            <button
              onClick={() => setQrBooking(null)}
              className="mt-6 w-full px-6 py-4 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: '#FFBE54' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {reviewBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Rate this event</h3>
            <p className="text-gray-600 mb-4">{reviewBooking.event.title}</p>
            <div className="flex items-center gap-2 mb-4">
              {[1,2,3,4,5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-2xl"
                  style={{ color: star <= rating ? '#F59E0B' : '#E5E7EB' }}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-400"
              rows={4}
              placeholder="Share your experience..."
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setReviewBooking(null)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // 1) 写入事件的评论列表
                  const key = `eventReviews_${reviewBooking.event.id}`;
                  const existing = JSON.parse(localStorage.getItem(key) || '[]');
                  const newReview = { userId, rating, comment: reviewText, date: new Date().toISOString() };
                  existing.push(newReview);
                  localStorage.setItem(key, JSON.stringify(existing));

                  // 2) 写入用户的评论索引，便于 My Reviews 展示
                  const userKey = `userReviews_${userId}`;
                  const myReviews = JSON.parse(localStorage.getItem(userKey) || '[]');
                  myReviews.push({ eventId: reviewBooking.event.id, rating, comment: reviewText, date: newReview.date });
                  localStorage.setItem(userKey, JSON.stringify(myReviews));

                  setReviewBooking(null);
                }}
                className="flex-1 px-6 py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#FFBE54' }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBookings;
