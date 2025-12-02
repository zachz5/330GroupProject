import { useState, useEffect } from 'react';
import { Link } from '../components/Link';
import { useCart } from '../contexts/CartContext';
import { getFurnitureEmoji } from '../lib/emojis';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getItem } from '../lib/api';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [cartItemsWithStock, setCartItemsWithStock] = useState(cartItems);

  // Refresh stock data for cart items
  useEffect(() => {
    const refreshStock = async () => {
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
      }
    };

    if (cartItems.length > 0) {
      refreshStock();
    } else {
      setCartItemsWithStock([]);
    }
  }, [cartItems]);

  const handleCheckout = () => {
    if (!user) {
      // Redirect to login with return URL to checkout
      window.history.pushState({}, '', '/login?returnTo=/checkout');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      // Navigate to checkout
      window.history.pushState({}, '', '/checkout');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center mb-8">
            <p className="text-gray-600 mb-4">Your cart is empty.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Clear Cart
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-4">
            {cartItemsWithStock.map((cartItem) => {
              const isOutOfStock = cartItem.item.quantity === 0;
              const exceedsStock = cartItem.quantity > cartItem.item.quantity;
              
              return (
                <div
                  key={cartItem.item.furniture_id}
                  className={`flex items-center gap-4 p-4 border rounded-lg ${
                    exceedsStock ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                    {getFurnitureEmoji(cartItem.item)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{cartItem.item.name}</h3>
                    <p className="text-emerald-600 font-bold">{formatPrice(cartItem.item.price)}</p>
                    {exceedsStock && (
                      <p className="text-sm text-red-600 mt-1">
                        Only {cartItem.item.quantity} {cartItem.item.quantity === 1 ? 'item' : 'items'} available
                      </p>
                    )}
                    {isOutOfStock && (
                      <p className="text-sm text-red-600 mt-1">Out of stock</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setError('');
                          try {
                            updateQuantity(cartItem.item.furniture_id, cartItem.quantity - 1);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to update quantity');
                          }
                        }}
                        className="w-8 h-8 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-medium">{cartItem.quantity}</span>
                      <button
                        onClick={() => {
                          setError('');
                          try {
                            updateQuantity(cartItem.item.furniture_id, cartItem.quantity + 1);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to update quantity');
                          }
                        }}
                        disabled={cartItem.quantity >= cartItem.item.quantity}
                        className="w-8 h-8 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(cartItem.item.furniture_id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax (Alabama 4%):</span>
              <span>{formatPrice(Math.round(getTotalPrice() * 0.04 * 100) / 100)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-emerald-600">{formatPrice(getTotalPrice() + Math.round(getTotalPrice() * 0.04 * 100) / 100)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cartItemsWithStock.some((ci) => ci.quantity > ci.item.quantity || ci.item.quantity === 0)}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Checkout
          </button>
          {cartItemsWithStock.some((ci) => ci.quantity > ci.item.quantity || ci.item.quantity === 0) && (
            <p className="text-sm text-red-600 text-center mt-2">
              Please adjust quantities to match available stock before checkout
            </p>
          )}
          {!user && (
            <p className="text-sm text-gray-500 text-center mt-2">
              You'll need to log in to complete your purchase
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

