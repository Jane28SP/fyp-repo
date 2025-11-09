import React, { useState, useEffect, useMemo } from 'react';
import { Event, supabase } from '../../lib/supabase';
import EventCard from './EventCard';
import EventSearch, { EventFilters } from './EventSearch';

interface EventListProps {
  onBook: (event: Event) => void;
  onAddToCart: (event: Event) => void;
  userBookings?: string[];
  userId?: string;
}

const EventList: React.FC<EventListProps> = ({ onBook, onAddToCart, userBookings = [], userId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 events per page
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    category: 'All',
    location: '',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      // Use direct REST API for better reliability (same approach as UserBookings)
      const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmpleHV1eWRuaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzg4NjEsImV4cCI6MjA3MDE1NDg2MX0.TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4';

      // Fetch events using REST API
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/events?select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load events: ${response.status}`);
      }

      const data = await response.json();

      // Sort by date ascending (client-side)
      const sortedData = (data || []).sort((a: Event, b: Event) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });

      setEvents(sortedData);
      if (!sortedData || sortedData.length === 0) {
        console.warn('No events found in database. Please add events to the Supabase events table.');
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch event data:', error);
      setError(error.message || 'Error loading events');
      setLoading(false);
      setEvents([]);
    }
  };

  const handleFilterChange = (newFilters: EventFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleRefreshClick = () => {
    fetchEvents();
  };

  useEffect(() => {
    let isMounted = true;
    console.log('EventList mounted, calling fetchEvents...');
    
    const loadEvents = async () => {
      if (isMounted) {
        await fetchEvents();
      }
    };
    
    loadEvents();
    
    return () => {
      isMounted = false;
    };
  }, []);

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
        return false;
      }
      if (filters.endDate && new Date(event.date) > new Date(filters.endDate)) {
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

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
            onClick={handleRefreshClick}
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

  if (events.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Available</h3>
          <p className="text-gray-600 mb-4">
            {error 
              ? 'Unable to load events. Please check your connection and try again.'
              : 'There are no events in the database. Please add events to the Supabase events table.'}
          </p>
        <button
            onClick={handleRefreshClick}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          Refresh
        </button>
        </div>
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
            {totalPages > 1 && (
              <span className="text-sm text-gray-500">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginatedEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onBook={onBook}
            onAddToCart={onAddToCart}
            isBooked={false}
            userId={userId}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="px-2 text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Next
          </button>
        </div>
      )}
      
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