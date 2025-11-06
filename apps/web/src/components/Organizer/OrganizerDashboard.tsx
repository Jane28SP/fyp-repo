import React, { useState, useEffect, useMemo } from 'react';
import type { Event, Booking } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import EventForm from '../Events/EventForm';
import BookingAnalytics from './BookingAnalytics';
import PromoCodeManager from './PromoCodeManager';
import SalesRevenueCharts from './SalesRevenueCharts';
import CheckInScanner from './CheckInScanner';

interface DashboardStats {
  totalEvents: number;
  totalBookings: number;
  upcomingEvents: number;
  totalRevenue: number;
}

type TabType = 'overview' | 'events' | 'bookings' | 'checkin' | 'analytics' | 'promotions';

const OrganizerDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalBookings: 0,
    upcomingEvents: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [useMockMode, setUseMockMode] = useState(false);
  const [organizerId, setOrganizerId] = useState<string>('');
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');

  // Filter events based on search and filter - moved outside JSX to fix React Hooks rules
  const filteredEvents = useMemo(() => {
    const now = new Date();
    let result = events;

    // Apply search filter
    if (searchQuery) {
      result = result.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (eventFilter !== 'all') {
      result = result.filter(event => {
        const eventDate = new Date(event.date);
        const eventBookings = bookings.filter(b => b.event_id === event.id && b.status !== 'cancelled');
        const hasBookings = eventBookings.length > 0;
        
        switch (eventFilter) {
          case 'active':
            return eventDate >= now && hasBookings;
          case 'completed':
            return eventDate < now;
          case 'draft':
            return !hasBookings && eventDate >= now;
          default:
            return true;
        }
      });
    }

    return result;
  }, [events, bookings, searchQuery, eventFilter]);

  useEffect(() => {
    fetchOrganizerData();
    
    // Listen for storage changes (for real-time updates)
    const handleStorageChange = () => {
      if (useMockMode) {
        loadMockData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom storage events (same tab)
    window.addEventListener('storage', handleStorageChange);

    // Set up Supabase realtime subscriptions
    const eventsChannel = supabase
      .channel('organizer_events')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchOrganizerData();
        }
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel('organizer_bookings')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchOrganizerData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [useMockMode]);

  const fetchOrganizerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to get current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        // Use mock data if no user
        setUseMockMode(true);
        setOrganizerId('mock-organizer-1');
        loadMockData();
        return;
      }

      setOrganizerId(userId);

      try {
        // Fetch organizer's events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('organizer_id', userId)
          .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;

        // Fetch bookings for these events
        const eventIds = eventsData?.map(e => e.id) || [];
        let bookingsData: Booking[] = [];

        if (eventIds.length > 0) {
          const { data: bookingsDataRes, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .in('event_id', eventIds);

          if (!bookingsError && bookingsDataRes) {
            bookingsData = bookingsDataRes;
          }
        }

        setEvents(eventsData || []);
        setBookings(bookingsData);
        calculateStats(eventsData || [], bookingsData);
        setUseMockMode(false);
      } catch (dbError: any) {
        console.log('Database fetch failed, using mock data:', dbError);
        setUseMockMode(true);
        loadMockData();
      }
    } catch (error: any) {
      console.error('OrganizerDashboard: Failed to fetch data:', error);
      setError(error.message);
      setUseMockMode(true);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Get events from localStorage (synced with Attendee view)
    const localStorageEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
    
    // Filter events for current organizer (in mock mode, check organizer_id)
    const mockOrganizerId = localStorage.getItem('mockOrganizer') === 'true' 
      ? 'mock-organizer-1' 
      : null;
    
    let mockEvents: Event[] = [];
    
    if (mockOrganizerId) {
      // Organizer mode: get only their events
      mockEvents = localStorageEvents.filter((e: Event) => 
        e.organizer_id === mockOrganizerId || e.organizer_id?.startsWith('mock-organizer')
      );
    } else {
      // Get all events (will be filtered by organizer_id in real mode)
      mockEvents = localStorageEvents;
    }

    // Get bookings from localStorage (full booking objects)
    const mockBookingsArray = JSON.parse(localStorage.getItem('mockBookingsArray') || '[]');
    const eventIds = mockEvents.map(e => e.id);
    
    // Filter bookings for this organizer's events
    const mockBookings: Booking[] = mockBookingsArray.filter((b: Booking) => 
      eventIds.includes(b.event_id)
    );

    setEvents(mockEvents);
    setBookings(mockBookings);
    calculateStats(mockEvents, mockBookings);
  };

  const calculateStats = (eventsList: Event[], bookingsList: Booking[]) => {
    const now = new Date();
    const upcomingEvents = eventsList.filter(e => new Date(e.date) >= now).length;
    const totalRevenue = bookingsList.reduce((sum, booking) => {
      const event = eventsList.find(e => e.id === booking.event_id);
      return booking.status !== 'cancelled' ? sum + (event?.price || 0) : sum;
    }, 0);

    setStats({
      totalEvents: eventsList.length,
      totalBookings: bookingsList.filter(b => b.status !== 'cancelled').length,
      upcomingEvents,
      totalRevenue,
    });
  };

  const handleCreateEvent = async (eventData: Partial<Event>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'mock-organizer-1';

      if (useMockMode || !session) {
        // Mock event creation - sync to localStorage
        const now = new Date().toISOString();
        const newEvent: Event = {
          id: `event-${Date.now()}`,
          title: eventData.title || '',
          description: eventData.description || '',
          date: eventData.date || '',
          time: eventData.time || '',
          location: eventData.location || '',
          capacity: eventData.capacity || 0,
          price: eventData.price || 0,
          category: eventData.category || 'Other',
          image_url: eventData.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
          created_at: now,
          updated_at: now,
          organizer_id: userId
        };

        // Add to localStorage for sync with Attendee view
        const mockEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
        mockEvents.push(newEvent);
        localStorage.setItem('mockEvents', JSON.stringify(mockEvents));

        // Trigger update
        window.dispatchEvent(new Event('storage'));

        setEvents([...events, newEvent]);
        calculateStats([...events, newEvent], bookings);
      } else {
        // Real Supabase creation
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('events')
          .insert([{
            ...eventData,
            organizer_id: userId,
            updated_at: now
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setEvents([...events, data]);
          calculateStats([...events, data], bookings);
        }
      }

      setShowEventForm(false);
    } catch (error: any) {
      console.error('Failed to create event:', error);
      throw error;
    }
  };

  const handleUpdateEvent = async (eventData: Partial<Event>) => {
    try {
      if (!editingEvent) return;

      if (useMockMode) {
        const now = new Date().toISOString();
        const updatedEvent = { ...editingEvent, ...eventData, updated_at: now };
        const updatedEvents = events.map(event => event.id === editingEvent.id ? updatedEvent : event);
        
        // Update localStorage for sync with Attendee view
        const mockEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
        const updatedMockEvents = mockEvents.map((e: Event) => 
          e.id === editingEvent.id ? updatedEvent : e
        );
        localStorage.setItem('mockEvents', JSON.stringify(updatedMockEvents));
        
        // Trigger update
        window.dispatchEvent(new Event('storage'));

        setEvents(updatedEvents);
        calculateStats(updatedEvents, bookings);
      } else {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('events')
          .update({ ...eventData, updated_at: now })
          .eq('id', editingEvent.id);

        if (error) throw error;
        const updatedEvent = { ...editingEvent, ...eventData };
        setEvents(events.map(event => event.id === editingEvent.id ? updatedEvent : event));
        calculateStats(events.map(event => event.id === editingEvent.id ? updatedEvent : event), bookings);
      }

      setEditingEvent(null);
      setShowEventForm(false);
    } catch (error: any) {
      console.error('Failed to update event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      if (useMockMode) {
        // Remove from localStorage
        const mockEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
        const filteredEvents = mockEvents.filter((e: Event) => e.id !== eventId);
        localStorage.setItem('mockEvents', JSON.stringify(filteredEvents));
        
        // Also remove related bookings
        const mockBookingsArray = JSON.parse(localStorage.getItem('mockBookingsArray') || '[]');
        const filteredBookings = mockBookingsArray.filter((b: Booking) => b.event_id !== eventId);
        localStorage.setItem('mockBookingsArray', JSON.stringify(filteredBookings));
        
        // Trigger update
        window.dispatchEvent(new Event('storage'));
      } else {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', eventId);

        if (error) throw error;
      }

      const filteredEvents = events.filter(event => event.id !== eventId);
      const filteredBookings = bookings.filter(booking => booking.event_id !== eventId);
      setEvents(filteredEvents);
      setBookings(filteredBookings);
      calculateStats(filteredEvents, filteredBookings);
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#E4281F', borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const menuItems: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'events', label: 'Event Management', icon: '🎫' },
    { id: 'bookings', label: 'Bookings & Orders', icon: '📋' },
    { id: 'checkin', label: 'QR Check-in', icon: '📱' },
    { id: 'analytics', label: 'Analytics & Reports', icon: '📈' },
    { id: 'promotions', label: 'Promotions & Vouchers', icon: '🎟️' },
  ];

  if (showEventForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow-sm rounded-lg p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <EventForm
              event={editingEvent || undefined}
              onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
              onCancel={() => {
                setShowEventForm(false);
                setEditingEvent(null);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 text-white transition-all duration-300 flex flex-col shadow-xl`}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center justify-center ${sidebarOpen ? 'w-auto' : 'w-full'}`}>
              <img 
                src="/logo.png" 
                alt="" 
                className={`${sidebarOpen ? 'h-10 w-auto' : 'h-8 w-8'} object-contain`}
                onError={(e) => {
                  // Hide image if not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center rounded-lg transition-all duration-200 ${
                sidebarOpen 
                  ? 'px-4 py-3 justify-start' 
                  : 'px-0 py-3 justify-center'
              } ${
                activeTab === item.id
                  ? 'text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              style={activeTab === item.id ? { backgroundColor: '#E4281F' } : {}}
            >
              <span className={`text-xl ${sidebarOpen ? 'mr-3' : ''} flex-shrink-0 flex items-center justify-center`}>{item.icon}</span>
              {sidebarOpen && <span className="font-medium text-left whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && useMockMode && (
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs text-amber-300 bg-amber-900/30 p-2 rounded border border-amber-800/50">
              ⚡ Demo Mode Active
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'overview' ? 'Dashboard' : menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">Manage your events and track performance</p>
              </div>
              {activeTab === 'events' && (
                <button
                  onClick={() => setShowEventForm(true)}
                  className="px-5 py-2.5 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                  style={{ backgroundColor: '#E4281F' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c7221a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E4281F'}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Event
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Events</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEvents}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Upcoming Events</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingEvents}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Bookings</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">RM {stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales & Revenue Charts */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Ticket Sales & Revenue Analytics</h3>
                <SalesRevenueCharts events={events} bookings={bookings} />
              </div>

              {/* Quick Analytics Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Analytics Overview</h3>
                <BookingAnalytics events={events} bookings={bookings} />
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Search and Filter Controls */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* Search Bar */}
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Filter Dropdown */}
                  <div className="w-full sm:w-auto">
                    <select
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value as any)}
                      className="block w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="all">All Events</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  {/* Create Event Button */}
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="w-full sm:w-auto px-5 py-2.5 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                    style={{ backgroundColor: '#E4281F' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c7221a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E4281F'}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Event
                  </button>
                </div>
              </div>

              {/* Events Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bookings</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-gray-600 font-medium">
                              {searchQuery || eventFilter !== 'all' ? 'No events match your filters' : 'No events yet'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {searchQuery || eventFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first event to get started!'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((event) => {
                        const eventBookings = bookings.filter(b => b.event_id === event.id && b.status !== 'cancelled');
                        const now = new Date();
                        const eventDate = new Date(event.date);
                        const isCompleted = eventDate < now;
                        const isDraft = eventBookings.length === 0 && eventDate >= now;
                        
                        const status = isCompleted ? 'completed' : isDraft ? 'draft' : 'active';
                        const revenue = eventBookings.reduce((sum, _) => sum + event.price, 0);

                        return (
                          <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {event.image_url && (
                                  <img className="h-10 w-10 rounded-lg object-cover mr-3 shadow-sm" src={event.image_url} alt={event.title} />
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{event.title}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {eventDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-full ${
                                status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                                status === 'completed' ? 'bg-gray-50 text-gray-700 border border-gray-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{eventBookings.length}/{event.capacity}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-900">RM {revenue.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingEvent(event);
                                    setShowEventForm(true);
                                  }}
                                  className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">All Bookings</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendee</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Booking Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">RSVP</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Checked In</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <p className="text-gray-600 font-medium">No bookings yet</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        bookings.map((booking) => {
                          const event = events.find(e => e.id === booking.event_id);
                          return (
                            <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">{event?.title || 'Unknown Event'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {booking.attendee_name || 'N/A'}
                                </div>
                                {booking.attendee_email && (
                                  <div className="text-xs text-gray-500">{booking.attendee_email}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-full border ${
                                  booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                  booking.status === 'checked_in' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {booking.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-600 capitalize">{booking.rsvp_status}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-gray-900">RM {(event?.price || 0).toLocaleString()}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {booking.checked_in_at ? (
                                  <div className="text-xs text-gray-600">
                                    <div className="text-green-600 font-medium">✓ Checked In</div>
                                    <div className="text-gray-500">
                                      {new Date(booking.checked_in_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">Not checked in</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checkin' && (
            <div className="space-y-6">
              {/* Event Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  选择活动 (可选 - 留空可扫描所有活动)
                </label>
                <select
                  value={selectedEventForCheckIn}
                  onChange={(e) => setSelectedEventForCheckIn(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">所有活动</option>
                  {events
                    .filter(event => {
                      const eventDate = new Date(event.date);
                      const now = new Date();
                      return eventDate >= now; // 只显示未来或当天的活动
                    })
                    .map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {new Date(event.date).toLocaleDateString('zh-CN')}
                      </option>
                    ))}
                </select>
              </div>

              {/* QR Scanner */}
              <CheckInScanner
                eventId={selectedEventForCheckIn || undefined}
                onCheckInSuccess={async (booking) => {
                  // 刷新预订列表
                  await fetchOrganizerData();
                  // 显示成功通知
                  console.log('Check-in successful:', booking);
                }}
                onCheckInError={(error) => {
                  console.error('Check-in error:', error);
                }}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <BookingAnalytics events={events} bookings={bookings} />
            </div>
          )}

          {activeTab === 'promotions' && organizerId && (
            <div className="space-y-6">
              <PromoCodeManager
                events={events}
                organizerId={organizerId}
                useMockMode={useMockMode}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
