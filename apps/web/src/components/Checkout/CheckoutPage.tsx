import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Event, Booking, PromoCode } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import QRCode from '../Events/QRCode';

declare global {
  interface Window {
    paypal: any;
  }
}

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
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const state = location.state as CheckoutData;
    if (state) {
      setCheckoutData(state);
      if (state.appliedPromo) {
        setPromoCode(state.appliedPromo.code);
      }
    } else {
      const storedCheckout = localStorage.getItem('checkoutData');
      if (storedCheckout) {
        const data = JSON.parse(storedCheckout);
        setCheckoutData(data);
        if (data.appliedPromo) {
          setPromoCode(data.appliedPromo.code);
        }
      } else {
        navigate('/');
      }
    }
  }, [location, navigate]);

  useEffect(() => {
    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    const checkPayPal = setInterval(() => {
      if (window.paypal) {
        setPaypalLoaded(true);
        clearInterval(checkPayPal);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkPayPal);
      if (!window.paypal) {
        console.error('PayPal SDK failed to load');
      }
    }, 10000);

    return () => {
      clearInterval(checkPayPal);
      clearTimeout(timeout);
    };
  }, []);

  const isFormValid = () => {
    return personalInfo.name.trim() !== '' && 
           personalInfo.email.trim() !== '' && 
           personalInfo.phone.trim() !== '' &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email);
  };

  useEffect(() => {
    if (!paypalLoaded || !checkoutData || !paypalButtonRef.current) {
      return;
    }

    if (!isFormValid()) {
      if (paypalButtonRef.current) {
        paypalButtonRef.current.innerHTML = '';
      }
      return;
    }

    paypalButtonRef.current.innerHTML = '';
    
    try {
      if (!window.paypal || !window.paypal.Buttons) {
        throw new Error('PayPal SDK not loaded');
      }

      window.paypal.Buttons({
          createOrder: async (data: any, actions: any) => {
            try {
              if (!isFormValid()) {
                throw new Error('Please fill in all required fields');
              }

              if (!checkoutData || checkoutData.total <= 0) {
                throw new Error('Invalid order amount');
              }
              
              const orderData = {
                purchase_units: [{
                  amount: {
                    value: checkoutData.total.toFixed(2),
                    currency_code: 'MYR'
                  },
                  description: checkoutData.cartItems.length === 1 
                    ? checkoutData.cartItems[0].event.title 
                    : `${checkoutData.cartItems.length} Event Tickets`
                }],
                application_context: {
                  shipping_preference: 'NO_SHIPPING'
                }
              };

              return await actions.order.create(orderData);
            } catch (error: any) {
              console.error('PayPal createOrder error:', error);
              throw error;
            }
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const order = await actions.order.capture();
              await handlePayPalSuccess(order);
            } catch (error: any) {
              console.error('Payment capture error:', error);
              alert('Payment failed: ' + (error.message || 'Unknown error'));
              setLoading(false);
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            let errorMessage = 'PayPal payment error occurred. Please try again.';
            
            if (err?.message) {
              errorMessage = `PayPal Error: ${err.message}`;
            } else if (typeof err === 'string') {
              errorMessage = `PayPal Error: ${err}`;
            }
            
            alert(errorMessage);
            setLoading(false);
          },
          onCancel: () => {
            setLoading(false);
          }
        }).render(paypalButtonRef.current).catch((renderError: any) => {
          console.error('PayPal button render error:', renderError);
          if (paypalButtonRef.current) {
            paypalButtonRef.current.innerHTML = '<div class="text-red-600 text-sm p-4">PayPal button failed to load. Please refresh the page.</div>';
          }
        });
      } catch (error: any) {
        console.error('PayPal button initialization error:', error);
        if (paypalButtonRef.current) {
          paypalButtonRef.current.innerHTML = `<div class="text-red-600 text-sm p-4">PayPal Error: ${error.message || 'Failed to initialize PayPal button'}. Please refresh the page.</div>`;
        }
      }
  }, [paypalLoaded, checkoutData, personalInfo]);

  const calculateSubtotal = () => {
    if (!checkoutData) return 0;
    return checkoutData.cartItems.reduce((sum, item) => sum + item.event.price * item.quantity, 0);
  };

  const calculateDiscount = () => {
    if (!checkoutData || !checkoutData.appliedPromo) return 0;
    const subtotal = calculateSubtotal();
    
    if (checkoutData.appliedPromo.min_purchase && subtotal < checkoutData.appliedPromo.min_purchase) {
      return 0;
    }

    const now = new Date();
    const validFrom = new Date(checkoutData.appliedPromo.valid_from);
    const validUntil = new Date(checkoutData.appliedPromo.valid_until);
    if (now < validFrom || now > validUntil) {
      return 0;
    }

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

  const handlePayPalSuccess = async (order: any) => {
    if (!checkoutData) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Please log in to checkout');
      }

      const bookings: Partial<Booking>[] = [];
      const createdBookings: Array<{ id: string; eventId: string; userId: string }> = [];

      // Process each cart item
      for (const item of checkoutData.cartItems) {
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
          const { data, error } = await supabase
            .from('bookings')
            .insert([{
              user_id: session.user.id,
              event_id: item.event.id,
              status: 'confirmed',
              promo_code: usedPromoCode || undefined,
              discount_amount: discountPerTicket || undefined,
              attendee_name: personalInfo.name,
              attendee_email: personalInfo.email,
              attendee_phone: personalInfo.phone,
              payment_id: order.id,
              payment_method: 'paypal'
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

      // Update promo code usage count
      if (checkoutData.appliedPromo) {
        await supabase
          .from('promo_codes')
          .update({ usage_count: checkoutData.appliedPromo.usage_count + 1 })
          .eq('id', checkoutData.appliedPromo.id);
      }

      // Send receipt email
      try {
        await sendReceiptEmail(createdBookings, order);
      } catch (emailError) {
        console.error('Failed to send receipt email:', emailError);
        // Don't block the success flow if email fails
      }

      setCompletedBookings(createdBookings);
      setShowQR(true);
      localStorage.removeItem('checkoutData');
      setLoading(false);
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to process payment');
      setLoading(false);
    }
  };

  const sendReceiptEmail = async (bookings: Array<{ id: string; eventId: string; userId: string }>, order: any) => {
    if (!checkoutData) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const eventIds = bookings.map(b => b.eventId);
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds);

      if (!eventsData) return;

      const eventsMap = new Map(eventsData.map(e => [e.id, e]));

      const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #E4281F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .booking-item { background: white; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #E4281F; }
            .total { background: white; padding: 15px; margin-top: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>JomEvent - Booking Receipt</h1>
            </div>
            <div class="content">
              <p>Dear ${personalInfo.name},</p>
              <p>Thank you for your booking! Your payment has been confirmed.</p>
              
              <h2>Booking Details:</h2>
              ${bookings.map((booking, index) => {
                const event = eventsMap.get(booking.eventId);
                if (!event) return '';
                return `
                  <div class="booking-item">
                    <h3>${event.title}</h3>
                    <p><strong>Date:</strong> ${event.date} at ${event.time}</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                    <p><strong>Booking ID:</strong> ${booking.id}</p>
                    <p><strong>Price:</strong> RM ${event.price}</p>
                  </div>
                `;
              }).join('')}
              
              <div class="total">
                <p>Total Amount: RM ${checkoutData.total.toLocaleString()}</p>
                <p>Payment Method: PayPal</p>
                <p>Transaction ID: ${order.id}</p>
              </div>
              
              <p>Your tickets are confirmed! You can view your bookings and QR codes in your account.</p>
            </div>
            <div class="footer">
              <p>Thank you for choosing JomEvent!</p>
              <p>If you have any questions, please contact us.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { error: receiptError } = await supabase
        .from('email_queue')
        .insert([{
          to_email: personalInfo.email,
          subject: `JomEvent - Booking Receipt #${order.id}`,
          html_content: receiptHtml,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (receiptError) {
        console.error('Failed to queue receipt email:', receiptError);
      }
    } catch (error) {
      console.error('Error sending receipt email:', error);
    }
  };

  const handlePayPalCheckout = async () => {
    if (!checkoutData) return;

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

      for (const item of checkoutData.cartItems) {
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
    const businessEmail = 'your-paypal-merchant@example.com';
    const itemName = bookings.length === 1 ? 'Event Ticket' : `${bookings.length} Event Tickets`;
    const returnUrl = encodeURIComponent(window.location.origin + '/checkout/success');
    const cancelUrl = encodeURIComponent(window.location.origin + '/checkout');
    
    const sandboxUrl = `https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${businessEmail}&item_name=${encodeURIComponent(itemName)}&amount=${amount}&currency_code=MYR&return=${returnUrl}&cancel_return=${cancelUrl}`;
    
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
            
            <div className="pt-4 border-t border-gray-200">
              <div className="mb-4">
                <div className="flex justify-between text-lg font-semibold text-gray-900 mb-2">
                  <span>Total Amount:</span>
                  <span>RM {checkoutData.total.toLocaleString()}</span>
                </div>
              </div>

              {!isFormValid() ? (
                <div className="w-full py-4 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <span className="text-gray-500 text-sm">Please fill in all required fields above to proceed with payment</span>
                </div>
              ) : !paypalLoaded ? (
                <div className="w-full py-4 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600">Loading PayPal...</span>
                </div>
              ) : (
                <div ref={paypalButtonRef} className="w-full"></div>
              )}

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

