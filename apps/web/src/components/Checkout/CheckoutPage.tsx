import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Event, Booking, PromoCode } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import QRCode from '../Events/QRCode';

interface CartItem {
  event: Event;
  quantity: number;
}

interface CheckoutData {
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  appliedPromo: PromoCode | null;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedBookings, setCompletedBookings] = useState<Array<{ id: string; eventId: string; userId: string }>>([]);
  const [showQR, setShowQR] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  
  // Personal information for each booking
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    // Get checkout data from location state
    const state = location.state as CheckoutData;
    if (state) {
      setCheckoutData(state);
      if (state.appliedPromo) {
        setPromoCode(state.appliedPromo.code);
      }
    } else {
      // If no state, try to get from localStorage (for page refresh)
      const storedCheckout = localStorage.getItem('checkoutData');
      if (storedCheckout) {
        const data = JSON.parse(storedCheckout);
        setCheckoutData(data);
        if (data.appliedPromo) {
          setPromoCode(data.appliedPromo.code);
        }
      } else {
        // No checkout data, redirect to home
        navigate('/');
      }
    }
  }, [location, navigate]);

  const calculateSubtotal = () => {
    if (!checkoutData) return 0;
    return checkoutData.cartItems.reduce((sum, item) => sum + item.event.price * item.quantity, 0);
  };

  const calculateDiscount = () => {
    if (!checkoutData || !checkoutData.appliedPromo) return 0;
    const subtotal = calculateSubtotal();
    
    // Check minimum purchase
    if (checkoutData.appliedPromo.min_purchase && subtotal < checkoutData.appliedPromo.min_purchase) {
      return 0;
    }

    // Check validity
    const now = new Date();
    const validFrom = new Date(checkoutData.appliedPromo.valid_from);
    const validUntil = new Date(checkoutData.appliedPromo.valid_until);
    if (now < validFrom || now > validUntil) {
      return 0;
    }

    // Check usage limit
    if (checkoutData.appliedPromo.usage_limit && checkoutData.appliedPromo.usage_count >= checkoutData.appliedPromo.usage_limit) {
      return 0;
    }

    let discount = 0;
    if (checkoutData.appliedPromo.discount_type === 'percentage') {
      discount = (subtotal * checkoutData.appliedPromo.discount_value) / 100;
      if (checkoutData.appliedPromo.max_discount && discount > checkoutData.appliedPromo.max_discount) {
        discount = checkoutData.appliedPromo.max_discount;
      }
    } else {
      discount = checkoutData.appliedPromo.discount_value;
    }

    return Math.min(discount, subtotal);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - calculateDiscount());
  };

  const validateAndApplyPromo = async () => {
    if (!checkoutData) return;
    
    try {
      setPromoError('');
      if (!promoCode.trim()) {
        setPromoError('Please enter a promo code');
        return;
      }

      const mockUser = localStorage.getItem('mockUser');
      const useMockMode = !!mockUser;

      let promo: PromoCode | null = null;

      if (useMockMode) {
        const mockPromoCodes = JSON.parse(localStorage.getItem('mockPromoCodes') || '[]');
        promo = mockPromoCodes.find((c: PromoCode) => 
          c.code.toUpperCase() === promoCode.toUpperCase() && c.is_active
        );

        if (!promo) {
          setPromoError('Invalid promo code');
          return;
        }

        const now = new Date();
        const validFrom = new Date(promo.valid_from);
        const validUntil = new Date(promo.valid_until);
        if (now < validFrom || now > validUntil) {
          setPromoError('Promo code has expired');
          return;
        }

        if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
          setPromoError('Promo code usage limit reached');
          return;
        }
      } else {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('code', promoCode.toUpperCase())
          .eq('is_active', true)
          .single();

        if (error || !data) {
          setPromoError('Invalid promo code');
          return;
        }

        promo = data as PromoCode;
        const now = new Date();
        const validFrom = new Date(promo.valid_from);
        const validUntil = new Date(promo.valid_until);
        if (now < validFrom || now > validUntil) {
          setPromoError('Promo code has expired');
          return;
        }

        if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
          setPromoError('Promo code usage limit reached');
          return;
        }
      }

      // Update checkout data with new promo
      const subtotal = calculateSubtotal();
      const discount = calculateDiscountForPromo(subtotal, promo);
      const total = Math.max(0, subtotal - discount);

      const updatedData: CheckoutData = {
        ...checkoutData,
        appliedPromo: promo,
        discount,
        total,
      };

      setCheckoutData(updatedData);
      localStorage.setItem('checkoutData', JSON.stringify(updatedData));
    } catch (error: any) {
      setPromoError(error.message || 'Failed to validate promo code');
    }
  };

  const calculateDiscountForPromo = (subtotal: number, promo: PromoCode) => {
    if (promo.min_purchase && subtotal < promo.min_purchase) {
      return 0;
    }

    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = (subtotal * promo.discount_value) / 100;
      if (promo.max_discount && discount > promo.max_discount) {
        discount = promo.max_discount;
      }
    } else {
      discount = promo.discount_value;
    }

    return Math.min(discount, subtotal);
  };

  const removePromo = () => {
    if (!checkoutData) return;
    
    const subtotal = calculateSubtotal();
    const updatedData: CheckoutData = {
      ...checkoutData,
      appliedPromo: null,
      discount: 0,
      total: subtotal,
    };

    setCheckoutData(updatedData);
    setPromoCode('');
    setPromoError('');
    localStorage.setItem('checkoutData', JSON.stringify(updatedData));
  };

  const handlePayPalCheckout = async () => {
    if (!checkoutData) return;

    // Validate personal information
    if (!personalInfo.name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!personalInfo.email.trim()) {
      alert('Please enter your email address');
      return;
    }
    if (!personalInfo.phone.trim()) {
      alert('Please enter your phone number');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalInfo.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const mockUser = localStorage.getItem('mockUser');
      const useMockMode = !!mockUser;

      const bookings: Partial<Booking>[] = [];
      const createdBookings: Array<{ id: string; eventId: string; userId: string }> = [];
      let currentUserId = '';

      // Process each cart item
      for (const item of checkoutData.cartItems) {
        // Check if promo applies to this event
        let discountAmount = 0;
        let usedPromoCode = '';

        if (checkoutData.appliedPromo) {
          if (!checkoutData.appliedPromo.event_id || checkoutData.appliedPromo.event_id === item.event.id) {
            const itemTotal = item.event.price * item.quantity;
            if (checkoutData.appliedPromo.discount_type === 'percentage') {
              discountAmount = (itemTotal * checkoutData.appliedPromo.discount_value) / 100;
              if (checkoutData.appliedPromo.max_discount) {
                discountAmount = Math.min(discountAmount, checkoutData.appliedPromo.max_discount);
              }
            } else {
              const subtotal = checkoutData.subtotal;
              discountAmount = (itemTotal / subtotal) * checkoutData.appliedPromo.discount_value;
            }
            usedPromoCode = checkoutData.appliedPromo.code;
          }
        }

        const discountPerTicket = discountAmount / item.quantity;

        // Create a booking for each ticket
        for (let i = 0; i < item.quantity; i++) {
          if (useMockMode) {
            const userId = JSON.parse(mockUser!).id;
            currentUserId = userId;
            const bookingId = `mock-booking-${Date.now()}-${Math.random()}-${i}`;
            
            createdBookings.push({
              id: bookingId,
              eventId: item.event.id,
              userId: userId,
            });

            const booking: Partial<Booking> = {
              id: bookingId,
              user_id: userId,
              event_id: item.event.id,
              status: 'confirmed',
              rsvp_status: 'going',
              created_at: new Date().toISOString(),
              promo_code: usedPromoCode || undefined,
              discount_amount: discountPerTicket || undefined,
              attendee_name: personalInfo.name,
              attendee_email: personalInfo.email,
              attendee_phone: personalInfo.phone,
            };

            bookings.push(booking);

            const mockBookingsArray = JSON.parse(localStorage.getItem('mockBookingsArray') || '[]');
            mockBookingsArray.push(booking);
            localStorage.setItem('mockBookingsArray', JSON.stringify(mockBookingsArray));
          } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
              throw new Error('Please log in to checkout');
            }

            currentUserId = session.user.id;
            const { data, error } = await supabase
              .from('bookings')
              .insert([{
                user_id: session.user.id,
                event_id: item.event.id,
                status: 'pending', // Set to pending until PayPal confirms
                promo_code: usedPromoCode || undefined,
                discount_amount: discountPerTicket || undefined,
                attendee_name: personalInfo.name,
                attendee_email: personalInfo.email,
                attendee_phone: personalInfo.phone,
              }])
              .select()
              .single();

            if (error) throw error;
            if (data) {
              createdBookings.push({
                id: data.id,
                eventId: item.event.id,
                userId: session.user.id,
              });
            }
          }
        }

        if (useMockMode) {
          const mockBookings = JSON.parse(localStorage.getItem('mockBookings') || '[]');
          if (!mockBookings.includes(item.event.id)) {
            mockBookings.push(item.event.id);
            localStorage.setItem('mockBookings', JSON.stringify(mockBookings));
          }
        }
      }

      // Update promo code usage count
      if (checkoutData.appliedPromo) {
        if (useMockMode) {
          const mockPromoCodes = JSON.parse(localStorage.getItem('mockPromoCodes') || '[]');
          const updated = mockPromoCodes.map((c: PromoCode) =>
            c.id === checkoutData.appliedPromo!.id ? { ...c, usage_count: c.usage_count + 1 } : c
          );
          localStorage.setItem('mockPromoCodes', JSON.stringify(updated));
        } else {
          await supabase
            .from('promo_codes')
            .update({ usage_count: checkoutData.appliedPromo.usage_count + 1 })
            .eq('id', checkoutData.appliedPromo.id);
        }
      }

      // For demo mode, show QR immediately
      if (useMockMode) {
        setCompletedBookings(createdBookings);
        setShowQR(true);
        // Clear checkout data from localStorage
        localStorage.removeItem('checkoutData');
      } else {
        // For real PayPal integration, redirect to PayPal
        // In production, you would generate a PayPal payment URL with your API credentials
        // For now, we'll simulate it by storing bookings and redirecting
        const paypalUrl = generatePayPalUrl(checkoutData.total, createdBookings);
        
        // Store bookings temporarily for when user returns from PayPal
        localStorage.setItem('pendingBookings', JSON.stringify(createdBookings));
        localStorage.setItem('paypalReturnUrl', window.location.origin + '/checkout/success');
        
        // Redirect to PayPal
        window.location.href = paypalUrl;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to process payment');
      setLoading(false);
    }
  };

  const generatePayPalUrl = (amount: number, bookings: Array<{ id: string; eventId: string; userId: string }>) => {
    // In production, this would use PayPal SDK to create a payment
    // For demo purposes, we'll create a sandbox URL
    const businessEmail = 'your-paypal-merchant@example.com'; // Replace with your PayPal business email
    const itemName = bookings.length === 1 ? 'Event Ticket' : `${bookings.length} Event Tickets`;
    const returnUrl = encodeURIComponent(window.location.origin + '/checkout/success');
    const cancelUrl = encodeURIComponent(window.location.origin + '/checkout');
    
    // PayPal hosted button/checkout URL (sandbox for testing)
    // In production, you would use PayPal REST API or SDK
    const sandboxUrl = `https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${businessEmail}&item_name=${encodeURIComponent(itemName)}&amount=${amount}&currency_code=MYR&return=${returnUrl}&cancel_return=${cancelUrl}`;
    
    // For demo, return a placeholder URL
    // Replace this with actual PayPal integration
    return sandboxUrl;
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#E4281F', borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (showQR && completedBookings.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Successful!</h2>
              <p className="text-gray-600 mb-6">Your tickets have been booked successfully.</p>
            </div>
            {completedBookings.map((booking) => (
              <div key={booking.id} className="mb-6">
                <QRCode 
                  bookingId={booking.id} 
                  eventId={booking.eventId}
                  userId={booking.userId}
                />
              </div>
            ))}
            <button
              onClick={() => {
                navigate('/dashboard');
              }}
              className="w-full mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Go to My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Cart
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h2>
            
            <div className="space-y-4 mb-6">
              {checkoutData.cartItems.map((item) => (
                <div key={item.event.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200">
                  {item.event.image_url && (
                    <img
                      src={item.event.image_url}
                      alt={item.event.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.event.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">{item.event.location}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(item.event.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} • {item.event.time}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                      <span className="font-semibold text-gray-900">
                        RM {(item.event.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promo Code / Voucher
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={!!checkoutData.appliedPromo}
                />
                {!checkoutData.appliedPromo ? (
                  <button
                    onClick={validateAndApplyPromo}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Apply
                  </button>
                ) : (
                  <button
                    onClick={removePromo}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
              {promoError && (
                <p className="text-sm text-red-600 mt-2">{promoError}</p>
              )}
              {checkoutData.appliedPromo && (
                <div className="mt-3 flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      Promo code "{checkoutData.appliedPromo.code}" applied!
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    -RM {checkoutData.discount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>RM {checkoutData.subtotal.toLocaleString()}</span>
              </div>
              {checkoutData.appliedPromo && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-RM {checkoutData.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-gray-900 pt-2">
                <span>Total:</span>
                <span>RM {checkoutData.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
            
            {/* Personal Information Form */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Attendee Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalInfo.name}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="Enter your email"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center p-4 border-2 border-blue-600 rounded-lg bg-blue-50">
                <div className="w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0">
                  <img 
                    src="/paypal-icon.svg" 
                    alt="PayPal" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center';
                        const span = document.createElement('span');
                        span.className = 'text-white font-bold text-sm';
                        span.textContent = 'PP';
                        fallbackDiv.appendChild(span);
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">PayPal</h3>
                  <p className="text-sm text-gray-600">Pay securely with PayPal</p>
                </div>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="mb-4">
                <div className="flex justify-between text-lg font-semibold text-gray-900 mb-2">
                  <span>Total Amount:</span>
                  <span>RM {checkoutData.total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handlePayPalCheckout}
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <img 
                      src="/paypal-icon.svg" 
                      alt="PayPal" 
                      className="w-6 h-6 mr-2 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    Pay with PayPal
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                By proceeding, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

