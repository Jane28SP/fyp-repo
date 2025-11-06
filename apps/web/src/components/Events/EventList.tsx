import React, { useState, useEffect, useMemo } from 'react';
import { Event, supabase } from '../../lib/supabase';
import EventCard from './EventCard';
import EventSearch, { EventFilters } from './EventSearch';

interface EventListProps {
  onBook: (event: Event) => void;
  onAddToCart: (event: Event) => void;
  userBookings?: string[];
}

const EventList: React.FC<EventListProps> = ({ onBook, onAddToCart, userBookings = [] }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    category: 'All',
    location: '',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
  });

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !event.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category !== 'All' && event.category !== filters.category) {
        return false;
      }

      // Location filter
      if (filters.location && !event.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (filters.startDate && new Date(event.date) < new Date(filters.startDate)) {
        console.log('Event filtered out by start date:', {
          eventTitle: event.title,
          eventDate: event.date,
          startDateFilter: filters.startDate,
          eventDateObj: new Date(event.date),
          startDateObj: new Date(filters.startDate)
        });
        return false;
      }
      if (filters.endDate && new Date(event.date) > new Date(filters.endDate)) {
        console.log('Event filtered out by end date:', {
          eventTitle: event.title,
          eventDate: event.date,
          endDateFilter: filters.endDate
        });
        return false;
      }

      // Price range filter
      if (filters.minPrice && event.price < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && event.price > parseFloat(filters.maxPrice)) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  useEffect(() => {
    fetchEvents();
    
    // Set up realtime subscription for events
    const eventsChannel = supabase
      .channel('events_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          console.log('Event changed:', payload);
          fetchEvents(); // Refresh events when changed
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      // Check for mock mode
      const mockUser = localStorage.getItem('mockUser');
      const mockEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
      
      // Try to fetch from Supabase first
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setEvents(data);
          setLoading(false);
          return;
        }
      } catch (dbError: any) {
        console.log('Supabase fetch failed, using mock/localStorage data:', dbError);
      }

      // Fallback to mock data or localStorage
      if (mockEvents.length > 0) {
        setEvents(mockEvents);
      } else {
        // Default mock events if nothing in localStorage
        const defaultMockEvents: Event[] = [
          {
            id: '1',
            title: 'Tech Talk: React 19 New Features',
            description: 'Deep dive into React 19\'s latest features, including concurrent rendering, automatic batching, and other major updates. Perfect for frontend developers.',
            date: '2026-03-15',
            time: '14:00-16:00',
            location: 'Kuala Lumpur Convention Centre, Hall 1',
            capacity: 50,
            price: 0,
            category: 'Technology',
            image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
            created_at: '2024-01-01T00:00:00Z',
            organizer_id: 'mock-organizer-1'
          },
          {
            id: '2',
            title: 'Startup Investment Forum',
            description: 'Face-to-face networking with renowned investors, learn about the latest investment trends and startup opportunities.',
            date: '2025-06-20',
            time: '09:00-17:00',
            location: 'Petaling Jaya Convention Centre, Selangor',
            capacity: 100,
            price: 299,
            category: 'Business',
            image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
            created_at: '2024-01-01T00:00:00Z',
            organizer_id: 'mock-organizer-2'
          },
          {
            id: '3',
            title: 'Yoga Workshop',
            description: 'Professional yoga instructor guidance, suitable for beginners and advanced practitioners. Relax your mind and body, improve your quality of life.',
            date: '2026-01-25',
            time: '10:00-12:00',
            location: 'Penang Yoga Studio, George Town',
            capacity: 30,
            price: 150,
            category: 'Health & Wellness',
            image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
            created_at: '2024-01-01T00:00:00Z',
            organizer_id: 'mock-organizer-3'
          }
        ];
        setEvents(defaultMockEvents);
        // Store in localStorage for consistency
        localStorage.setItem('mockEvents', JSON.stringify(defaultMockEvents));
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch event data:', error);
      setError(error.message || 'Error loading events');
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: EventFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
        </div>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
        <p className="mt-4 text-gray-600 font-medium">Loading amazing events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Failed</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchEvents}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No events available</div>
        <button
          onClick={fetchEvents}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div id="event-list-section" className="space-y-8">
      <EventSearch onFilterChange={handleFilterChange} />
      
      {filteredEvents.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900">Discover Events</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              {filteredEvents.length} events
            </span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onBook={onBook}
            onAddToCart={onAddToCart}
            isBooked={false}
          />
        ))}
      </div>
      
      {filteredEvents.length === 0 && (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching events found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria or browse all events</p>
            <button
              onClick={() => setFilters({
                search: '',
                category: 'All',
                location: '',
                startDate: '',
                endDate: '',
                minPrice: '',
                maxPrice: '',
              })}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;