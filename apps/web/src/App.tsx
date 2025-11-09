import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import './App.css';
import UnifiedLogin from './components/Auth/UnifiedLogin';
import EventList from './components/Events/EventList';
import BookingModal from './components/Bookings/BookingModal';
import AccountDashboard from './components/Dashboard/AccountDashboard';
import OrganizerDashboard from './components/Organizer/OrganizerDashboard';
import OrganizerRoute from './components/Auth/OrganizerRoute';
import HeroBanner from './components/Banner/HeroBanner';
import Testimonials from './components/Testimonials/Testimonials';
import ContactSection from './components/Contact/ContactSection';
import Footer from './components/Footer/Footer';
import ShoppingCart from './components/Cart/ShoppingCart';
import CheckoutPage from './components/Checkout/CheckoutPage';
import About from './components/Pages/About';
import EmailVerification from './components/Auth/EmailVerification';
import { Event } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [userBookings, setUserBookings] = useState<string[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  
  const [cartItems, setCartItems] = useState<Array<{ event: Event; quantity: number }>>([]);
  const [showCart, setShowCart] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(false);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
        }
        
        if (session?.user) {
          setUser(session.user);
          
          try {
            const organizerPromise = supabase
              .from('organizers')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 3000)
            );
            
            const { data: organizer } = await Promise.race([
              organizerPromise,
              timeoutPromise
            ]) as any;
            
            setIsOrganizer(!!organizer);
          } catch (orgError) {
            setIsOrganizer(false);
          }
        } else {
          setUser(null);
          setIsOrganizer(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        
        try {
          const { data: organizer } = await supabase
            .from('organizers')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          setIsOrganizer(!!organizer);
        } catch (orgError) {
          setIsOrganizer(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsOrganizer(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserBookings();
      const loadAvatar = async () => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('avatar_url')
            .eq('user_id', user.id)
            .single();

          if (!error && data?.avatar_url) {
            setUserAvatar(data.avatar_url);
          } else {
            const profile = JSON.parse(localStorage.getItem(`userProfile_${user.id}`) || 'null');
            if (profile?.avatarUrl) {
              setUserAvatar(profile.avatarUrl);
            }
          }
        } catch (error) {
          console.error('Error loading avatar:', error);
          const profile = JSON.parse(localStorage.getItem(`userProfile_${user.id}`) || 'null');
          if (profile?.avatarUrl) {
            setUserAvatar(profile.avatarUrl);
          }
        }
      };
      loadAvatar();
    }
  }, [user]);

  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (user && event.detail?.avatarUrl) {
        setUserAvatar(event.detail.avatarUrl);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    };
  }, [user]);

  const fetchUserBookings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('event_id')
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (!error && data) {
        setUserBookings(data.map(booking => booking.event_id));
      }
    } catch (error) {
      console.error('Failed to fetch user bookings:', error);
    }
  };

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      try {
        const localSignOut = supabase.auth.signOut({ scope: 'local' } as any);
        await Promise.race([
          localSignOut,
          new Promise((resolve) => setTimeout(resolve, 600))
        ]);
        Object.keys(localStorage)
          .filter((k) => k.startsWith('sb-') || k.startsWith('supabase'))
          .forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.warn('Local signOut failed:', e);
      }

      try {
        const remoteSignOut = supabase.auth.signOut();
        await Promise.race([
          remoteSignOut,
          new Promise((resolve) => setTimeout(resolve, 1200))
        ]);
      } catch (e) {
        console.warn('Network signOut failed:', e);
      }

      setUser(null);
      setUserBookings([]);
      setIsOrganizer(false);
    } finally {
      setShowLogoutConfirm(false);
      setIsLoggingOut(false);
      setShowLogoutSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    }
  };

  const handleBookEvent = (event: Event) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSelectedEvent(event);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
      fetchUserBookings();
  };

  const handleAddToCart = (event: Event) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setCartItems(prev => {
      const existingItem = prev.find(item => item.event.id === event.id);
      if (existingItem) {
        return prev.map(item =>
          item.event.id === event.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { event, quantity: 1 }];
    });
    setShowCart(true);
  };

  const handleRemoveFromCart = (eventId: string) => {
    setCartItems(prev => prev.filter(item => item.event.id !== eventId));
  };

  const handleUpdateCartQuantity = (eventId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(eventId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.event.id === eventId ? { ...item, quantity } : item
      )
    );
  };

  const handleCartCheckoutSuccess = () => {
    setCartItems([]);
    fetchUserBookings();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/logo.png" 
              alt="JomEvent Logo" 
              className="h-20 w-20 object-contain animate-pulse"
            />
            <h1 className="text-4xl font-black" style={{ color: '#E4281F' }}>
              JomEvent!
            </h1>
          </div>
          <p className="text-gray-600 mb-6">Loading amazing events...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent absolute"></div>
          </div>
        </div>
      </div>
    );
  }

  const Navigation = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isBookingsPage = location.pathname === '/dashboard' && searchParams.get('tab') === 'bookings';
    const isEventsPage = location.pathname === '/';

  return (
        <nav className="bg-white shadow-md border-b border-red-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-3 text-xl font-bold transition-all">
                  <img 
                    src="/logo.png" 
                    alt="JomEvent Logo" 
                    className="w-10 h-10 object-contain transform hover:rotate-6 transition-transform"
                  />
                  <span style={{ color: 'rgb(228, 40, 31)' }}>JomEvent!</span>
                </Link>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                {!isOrganizer && (
                  <>
                    <Link
                      to="/"
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isEventsPage
                        ? 'text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-md border-b-2 border-orange-600' 
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                      Home
                    </Link>
                    
                    {user && (
                      <>
                        <Link
                        to="/dashboard?tab=bookings"
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isBookingsPage
                            ? 'text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-md border-b-2 border-orange-600' 
                            : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M8 2v4"></path>
                            <path d="M16 2v4"></path>
                            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                            <path d="M3 10h18"></path>
                          </svg>
                          My Bookings
                        </Link>
                        <button
                          onClick={() => setShowCart(true)}
                          className="relative flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {cartItems.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                          )}
                        </button>
                      </>
                    )}
                  </>
                )}

              </div>
              
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <div className="hidden sm:flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email?.split('@')[0] || 'User')}&background=E4281F&color=fff&size=32&bold=true`}
                          alt="avatar" 
                          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            const emailPrefix = user.email?.split('@')[0] || 'User';
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emailPrefix)}&background=E4281F&color=fff&size=32&bold=true`;
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">Welcome, {user.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
    );
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <Navigation />

        <Routes>
          <Route path="/verify-email" element={<EmailVerification />} />
          
          <Route path="/checkout" element={
            user ? <CheckoutPage /> : <Navigate to="/login" replace />
          } />
          
          <Route path="/" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {isOrganizer ? (
                <Navigate to="/organizer/dashboard" replace />
              ) : (
                <>
                  <div className="px-4 py-6 sm:px-0">
                    <HeroBanner />
                    
                    <EventList 
                      onBook={handleBookEvent} 
                      onAddToCart={handleAddToCart}
                      userBookings={userBookings} 
                      userId={user?.id}
                    />
                  </div>
                  
                  <Testimonials />
                  
                  <ContactSection />
                </>
              )}
            </main>
          } />
          
          <Route path="/login" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {user ? <Navigate to="/" replace /> : <UnifiedLogin onLoginSuccess={handleLoginSuccess} />}
            </main>
          } />
          
          <Route path="/dashboard" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {isOrganizer ? (
                <Navigate to="/organizer/dashboard" replace />
              ) : (
                user ? <AccountDashboard userId={user.id} userEmail={user.email} /> : <Navigate to="/login" replace />
              )}
            </main>
          } />
          
          <Route path="/organizer/*" element={
            <OrganizerRoute>
              <OrganizerDashboard />
            </OrganizerRoute>
          } />
          
          <Route path="/about" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <About />
            </main>
          } />
        </Routes>

        <Footer />

        <BookingModal
          event={selectedEvent}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />

        {showCart && (
          <ShoppingCart
            cartItems={cartItems}
            onRemoveItem={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onCheckoutSuccess={handleCartCheckoutSuccess}
            onClose={() => setShowCart(false)}
          />
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl transform transition-all animate-scaleIn">
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-orange-100 mb-6">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
      </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign Out?</h3>
                <p className="text-gray-600 mb-8">Are you sure you want to sign out? You'll need to login again to access your bookings.</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={isLoggingOut}
                    className="flex-1 px-6 py-3.5 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex-1 px-6 py-3.5 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    style={{ backgroundColor: isLoggingOut ? '#9CA3AF' : '#E4281F' }}
                  >
                    {isLoggingOut ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing Out...
                      </>
                    ) : (
                      'Yes, Sign Out'
                    )}
        </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showLogoutSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-8 text-center animate-scaleIn">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-bounce">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Signed Out Successfully!</h3>
              <p className="text-gray-600">Redirecting to homepage...</p>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;