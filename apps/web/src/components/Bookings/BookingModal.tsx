import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Event } from '../../lib/supabase';
import QRCode from '../Events/QRCode';

interface BookingModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ event, isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'free'>('stripe');
  const [showPayment, setShowPayment] = useState(false);
  
  // Personal information form
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  if (!isOpen || !event) return null;

  const handleBooking = async () => {
    console.log('handleBooking called', { price: event.price, showPayment });
    
    // Validate personal information
    if (!personalInfo.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!personalInfo.email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!personalInfo.phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalInfo.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if user is logged in first (supports mock and Supabase session)
    const mockUserStr = localStorage.getItem('mockUser');
    let sessionUser: any = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      sessionUser = session?.user ?? null;
    } catch (_e) {
      // Ignore network issues; we'll fall back to mock
      sessionUser = null;
    }
    if (!mockUserStr && !sessionUser) {
      setError('Please login first to book this event.');
      return;
    }
    
    // If event has a price, show payment options first
    if (event.price > 0 && !showPayment) {
      console.log('Showing payment options');
      setShowPayment(true);
      return;
    }

    try {
      console.log('Starting booking process');
      setLoading(true);
      setError('');

      // Process payment if event is not free
      if (event.price > 0) {
        console.log('Processing payment');
        await processPayment();
      }

      if (mockUserStr) {
        // Mock mode path
        console.log('Using mock mode');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockUser = JSON.parse(mockUserStr);
        const mockBookingId = `mock-booking-${Date.now()}`;
        console.log('Generated booking ID:', mockBookingId);

        // Store event in mockEvents if not exists
        const mockEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
        if (!mockEvents.find((e: any) => e.id === event.id)) {
          mockEvents.push(event);
          localStorage.setItem('mockEvents', JSON.stringify(mockEvents));
        }

        // Store full booking object (not just event ID) for organizer to see
        const mockBookingsArray = JSON.parse(localStorage.getItem('mockBookingsArray') || '[]');
        const newBooking = {
          id: mockBookingId,
          user_id: mockUser.id,
          event_id: event.id,
          status: 'confirmed' as const,
          rsvp_status: 'going' as const,
          created_at: new Date().toISOString(),
          event: event,
          attendee_name: personalInfo.name,
          attendee_email: personalInfo.email,
          attendee_phone: personalInfo.phone,
        };
        mockBookingsArray.push(newBooking);
        localStorage.setItem('mockBookingsArray', JSON.stringify(mockBookingsArray));

        // Also update simple array for attendee view (allow multiple bookings)
        const mockBookings = JSON.parse(localStorage.getItem('mockBookings') || '[]');
        mockBookings.push(event.id);
        localStorage.setItem('mockBookings', JSON.stringify(mockBookings));

        // Trigger storage event for real-time updates
        window.dispatchEvent(new Event('storage'));

        setBookingId(mockBookingId);
        setLoading(false);
        onSuccess();
        console.log('Booking completed successfully (mock)');
      } else if (sessionUser) {
        // Real Supabase path
        const { data, error } = await supabase
          .from('bookings')
          .insert([
            {
              user_id: sessionUser.id,
              event_id: event.id,
              status: 'confirmed',
              attendee_name: personalInfo.name,
              attendee_email: personalInfo.email,
              attendee_phone: personalInfo.phone,
            }
          ])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setBookingId(data.id);
          setLoading(false);
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      setError(error.message || 'Failed to complete booking. Please try again.');
      setLoading(false);
    }
  };

  const processPayment = async () => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (paymentMethod === 'stripe') {
      console.log('Processing Stripe payment for RM' + event.price);
    } else if (paymentMethod === 'paypal') {
      console.log('Processing PayPal payment for RM' + event.price);
    }
  };

  const handleClose = () => {
    setBookingId(null);
    setShowPayment(false);
    setPaymentMethod('stripe');
    setError('');
    setPersonalInfo({ name: '', email: '', phone: '' });
    onClose();
  };

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get current user ID
  const getUserId = () => {
    const mockUserStr = localStorage.getItem('mockUser');
    if (mockUserStr) {
      try {
        const mockUser = JSON.parse(mockUserStr);
        return mockUser.id;
      } catch {
        return 'unknown';
      }
    }
    return 'unknown';
  };
  const userId = getUserId();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl transform transition-all overflow-hidden">
        {!bookingId ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Confirm Booking</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Event Details */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFBE54' }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Date & Time</p>
                      <p className="font-semibold">{formatDate(event.date)} • {event.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E4281F' }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="font-semibold">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Price</p>
                      <p className="font-bold text-lg" style={{ color: '#E4281F' }}>
                        {event.price === 0 ? 'Free' : `RM ${event.price}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information Form */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" style={{ color: '#FFBE54' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={personalInfo.name}
                      onChange={handlePersonalInfoChange}
                      required
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={personalInfo.email}
                      onChange={handlePersonalInfoChange}
                      required
                      placeholder="Enter your email"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={personalInfo.phone}
                      onChange={handlePersonalInfoChange}
                      required
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Options for Paid Events */}
              {event.price > 0 && showPayment && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" style={{ color: '#FFBE54' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Select Payment Method
                  </h4>
                  <div className="space-y-3">
                    <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'stripe' 
                        ? 'border-orange-400 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value="stripe"
                          checked={paymentMethod === 'stripe'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                          className="w-5 h-5"
                          style={{ accentColor: '#FFBE54' }}
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-6 bg-blue-600 rounded-md text-white text-sm flex items-center justify-center font-bold">
                            S
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                            <p className="text-xs text-gray-500">Powered by Stripe</p>
                          </div>
                        </div>
                      </div>
                      {paymentMethod === 'stripe' && (
                        <svg className="w-5 h-5" style={{ color: '#FFBE54' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                    
                    <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'paypal' 
                        ? 'border-orange-400 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'paypal')}
                          className="w-5 h-5"
                          style={{ accentColor: '#FFBE54' }}
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-6 bg-blue-500 rounded-md text-white text-sm flex items-center justify-center font-bold">
                            PP
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">PayPal</p>
                            <p className="text-xs text-gray-500">Fast & secure</p>
                          </div>
                        </div>
                      </div>
                      {paymentMethod === 'paypal' && (
                        <svg className="w-5 h-5" style={{ color: '#FFBE54' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl mb-6 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#E4281F' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">{error}</span>
                  </div>
                  {error.includes('login') && (
                    <button
                      onClick={() => {
                        handleClose();
                        navigate('/login');
                      }}
                      className="w-full px-4 py-2.5 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                      style={{ backgroundColor: '#FFBE54' }}
                    >
                      Go to Login
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                  style={{ backgroundColor: loading ? '#9CA3AF' : '#FFBE54' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    showPayment && event.price > 0 ? `Pay RM ${event.price}` : 'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: '#10B981' }}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Successful!</h2>
                <p className="text-gray-600">Your ticket has been confirmed</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Your Check-in QR Code</p>
                <div className="flex justify-center bg-white p-4 rounded-xl inline-block mx-auto shadow-md">
                  <QRCode
                    bookingId={bookingId}
                    eventId={event.id}
                    userId={userId}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-4">Show this QR code at the event entrance</p>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-6 py-4 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#FFBE54' }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
