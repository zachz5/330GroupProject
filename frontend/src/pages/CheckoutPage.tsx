import { useState, FormEvent, useEffect } from 'react';
import { Link } from '../components/Link';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getFurnitureEmoji } from '../lib/emojis';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Toast from '../components/Toast';
import { saveOrder } from '../lib/orders';
import { getItem, createTransaction } from '../lib/api';
import { formatPhoneInput } from '../lib/phoneFormatter';

export default function CheckoutPage() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cartItemsWithStock, setCartItemsWithStock] = useState(cartItems);
  const [validatingStock, setValidatingStock] = useState(false);

  // Refresh stock data for cart items
  useEffect(() => {
    const refreshStock = async () => {
      if (cartItems.length === 0) {
        setCartItemsWithStock([]);
        return;
      }

      setValidatingStock(true);
      try {
        const updatedItems = await Promise.all(
          cartItems.map(async (cartItem) => {
            try {
              const currentItem = await getItem(cartItem.item.furniture_id);
              return { ...cartItem, item: currentItem };
            } catch {
              return cartItem; // Keep old data if fetch fails
            }
          })
        );
        setCartItemsWithStock(updatedItems);
      } catch (err) {
        setCartItemsWithStock(cartItems);
      } finally {
        setValidatingStock(false);
      }
    };

    refreshStock();
  }, [cartItems]);

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  const validateStock = () => {
    for (const cartItem of cartItemsWithStock) {
      if (cartItem.quantity > cartItem.item.quantity) {
        return {
          valid: false,
          message: `${cartItem.item.name}: Only ${cartItem.item.quantity} ${cartItem.item.quantity === 1 ? 'item' : 'items'} available, but ${cartItem.quantity} ${cartItem.quantity === 1 ? 'item' : 'items'} in cart.`,
        };
      }
      if (cartItem.item.quantity === 0) {
        return {
          valid: false,
          message: `${cartItem.item.name} is out of stock.`,
        };
      }
    }
    return { valid: true };
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate stock before placing order
    const stockValidation = validateStock();
    if (!stockValidation.valid) {
      setError(stockValidation.message || 'Some items in your cart exceed available stock.');
      return;
    }

    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const shippingAddress = formData.get('shippingAddress') as string;
    const paymentMethod = formData.get('paymentMethod') as string;

    // Save order to database and local storage
    if (user && user.customer_id) {
      // Calculate total from the items being saved to ensure accuracy
      const orderTotal = cartItemsWithStock.reduce(
        (total, cartItem) => total + cartItem.item.price * cartItem.quantity,
        0
      );
      
      try {
        console.log('Creating transaction for customer:', user.customer_id);
        console.log('Items:', cartItemsWithStock.map(cartItem => ({
          furniture_id: cartItem.item.furniture_id,
          quantity: cartItem.quantity,
          price: cartItem.item.price,
        })));
        
        // Save to database
        const transaction = await createTransaction({
          customer_id: user.customer_id,
          items: cartItemsWithStock.map(cartItem => ({
            furniture_id: cartItem.item.furniture_id,
            quantity: cartItem.quantity,
            price: cartItem.item.price,
          })),
          total_amount: orderTotal,
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
        });
        
        console.log('Transaction created successfully:', transaction);
        
        // Also save to local storage for frontend display
        saveOrder({
          customerEmail: user.email,
          items: cartItemsWithStock,
          total: orderTotal,
          shippingAddress,
          paymentMethod,
        });
        
        setLoading(false);
        setShowSuccess(true);
        clearCart();
      } catch (err) {
        console.error('Error creating transaction:', err);
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to process order. Please try again.');
      }
    } else if (user && user.isEmployee) {
      setLoading(false);
      setError('Employees cannot make purchases. Please use a customer account.');
    } else {
      setLoading(false);
      setError('User information not available. Please log in again.');
    }
  };

  // Redirect to login if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h1>
            <p className="text-gray-600 mb-4">Please log in to proceed with checkout.</p>
            <Link
              to="/login"
              className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-4">Add items to your cart before checkout.</p>
            <Link
              to="/browse"
              className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Browse Furniture
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-600" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been confirmed.</p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/browse"
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                to="/profile"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-semibold mb-1">Cannot place order:</p>
            <p>{error}</p>
            <Link
              to="/cart"
              className="text-red-700 hover:text-red-800 font-medium underline mt-2 inline-block"
            >
              Return to cart to adjust quantities
            </Link>
          </div>
        )}

        {validatingStock && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
            Validating stock availability...
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              {cartItemsWithStock.map((cartItem) => {
                const exceedsStock = cartItem.quantity > cartItem.item.quantity;
                return (
                  <div
                    key={cartItem.item.furniture_id}
                    className={`flex items-center gap-3 p-2 rounded ${exceedsStock ? 'bg-red-50' : ''}`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      {getFurnitureEmoji(cartItem.item)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{cartItem.item.name}</p>
                      <p className="text-gray-600 text-xs">
                        {formatPrice(cartItem.item.price)} × {cartItem.quantity}
                      </p>
                      {exceedsStock && (
                        <p className="text-red-600 text-xs mt-1">
                          Only {cartItem.item.quantity} available
                        </p>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatPrice(cartItem.item.price * cartItem.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-emerald-600">{formatPrice(getTotalPrice())}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue={user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : ''}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user.email}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={user.phone || ''}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.value = formatPhoneInput(target.value);
                  }}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Address
                </label>
                <textarea
                  name="shippingAddress"
                  defaultValue={user.address || ''}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Select payment method</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Cash">Cash on Pickup</option>
                  <option value="Venmo">Venmo</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || validatingStock || cartItemsWithStock.some((ci) => ci.quantity > ci.item.quantity || ci.item.quantity === 0)}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : validatingStock ? 'Validating...' : 'Place Order'}
              </button>
              {cartItemsWithStock.some((ci) => ci.quantity > ci.item.quantity || ci.item.quantity === 0) && (
                <p className="text-sm text-red-600 text-center mt-2">
                  Cannot place order: Some items exceed available stock
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

