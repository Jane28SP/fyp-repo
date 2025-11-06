import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, PromoCode } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

interface CartItem {
  event: Event;
  quantity: number;
}

interface ShoppingCartProps {
  cartItems: CartItem[];
  onRemoveItem: (eventId: string) => void;
  onUpdateQuantity: (eventId: string, quantity: number) => void;
  onCheckoutSuccess: () => void;
  onClose: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onCheckoutSuccess,
  onClose,
}) => {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.event.price * item.quantity, 0);
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;

    const subtotal = calculateSubtotal();
    
    // Check minimum purchase
    if (appliedPromo.min_purchase && subtotal < appliedPromo.min_purchase) {
      return 0;
    }

    // Check validity
    const now = new Date();
    const validFrom = new Date(appliedPromo.valid_from);
    const validUntil = new Date(appliedPromo.valid_until);
    if (now < validFrom || now > validUntil) {
      return 0;
    }

    // Check usage limit
    if (appliedPromo.usage_limit && appliedPromo.usage_count >= appliedPromo.usage_limit) {
      return 0;
    }

    let discount = 0;
    if (appliedPromo.discount_type === 'percentage') {
      discount = (subtotal * appliedPromo.discount_value) / 100;
      // Apply max discount if set
      if (appliedPromo.max_discount && discount > appliedPromo.max_discount) {
        discount = appliedPromo.max_discount;
      }
    } else {
      discount = appliedPromo.discount_value;
    }

    return Math.min(discount, subtotal); // Can't discount more than total
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - calculateDiscount());
  };

  const validateAndApplyPromo = async () => {
    try {
      setPromoError('');
      if (!promoCode.trim()) {
        setPromoError('Please enter a promo code');
        return;
      }

      // Check mock mode
      const mockUser = localStorage.getItem('mockUser');
      const useMockMode = !!mockUser;

      if (useMockMode) {
        const mockPromoCodes = JSON.parse(localStorage.getItem('mockPromoCodes') || '[]');
        const code = mockPromoCodes.find((c: PromoCode) => 
          c.code.toUpperCase() === promoCode.toUpperCase() && c.is_active
        );

        if (!code) {
          setPromoError('Invalid promo code');
          return;
        }

        // Validate date
        const now = new Date();
        const validFrom = new Date(code.valid_from);
        const validUntil = new Date(code.valid_until);
        if (now < validFrom || now > validUntil) {
          setPromoError('Promo code has expired');
          return;
        }

        // Validate usage limit
        if (code.usage_limit && code.usage_count >= code.usage_limit) {
          setPromoError('Promo code usage limit reached');
          return;
        }

        setAppliedPromo(code);
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

        const code = data as PromoCode;
        const now = new Date();
        const validFrom = new Date(code.valid_from);
        const validUntil = new Date(code.valid_until);
        if (now < validFrom || now > validUntil) {
          setPromoError('Promo code has expired');
          return;
        }

        if (code.usage_limit && code.usage_count >= code.usage_limit) {
          setPromoError('Promo code usage limit reached');
          return;
        }

        setAppliedPromo(code);
      }
    } catch (error: any) {
      setPromoError(error.message || 'Failed to validate promo code');
    }
  };

  const handleCheckout = () => {
    // Prepare checkout data
    const checkoutData = {
      cartItems,
      subtotal: calculateSubtotal(),
      discount: calculateDiscount(),
      total: calculateTotal(),
      appliedPromo,
    };

    // Store checkout data for the checkout page
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    // Navigate to checkout page
    navigate('/checkout', { state: checkoutData });
    onClose(); // Close the cart sidebar
  };

  if (cartItems.length === 0) {
    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={onClose}
        />
        {/* Sidebar */}
        <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slideInRight">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-600 text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-500 text-sm mb-6">Add events to your cart to get started</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.map((item) => (
            <div key={item.event.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200">
              {item.event.image_url && (
                <img
                  src={item.event.image_url}
                  alt={item.event.title}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{item.event.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{item.event.location}</p>
                <p className="text-sm text-gray-600 mb-3">
                  {new Date(item.event.date).toLocaleDateString()}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQuantity(item.event.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.event.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      RM {(item.event.price * item.quantity).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">RM {item.event.price.toLocaleString()} each</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.event.id)}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-6 border-t border-gray-200 space-y-4 flex-shrink-0 bg-white">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Promo Code / Voucher
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={!!appliedPromo}
              />
              {!appliedPromo ? (
                <button
                  onClick={validateAndApplyPromo}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Apply
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoCode('');
                    setPromoError('');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            {promoError && (
              <p className="text-sm text-red-600">{promoError}</p>
            )}
            {appliedPromo && (
              <p className="text-sm text-green-600">
                Promo code "{appliedPromo.code}" applied!
              </p>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>RM {calculateSubtotal().toLocaleString()}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedPromo.code}):</span>
                <span>-RM {calculateDiscount().toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
              <span>Total:</span>
              <span>RM {calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </>
  );
};

export default ShoppingCart;

