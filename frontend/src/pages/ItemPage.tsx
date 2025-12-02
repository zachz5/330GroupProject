import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Link } from '../components/Link';
import { getItem, Item } from '../lib/api';
import { getFurnitureEmoji } from '../lib/emojis';
import { useCart } from '../contexts/CartContext';
import Toast from '../components/Toast';

export default function ItemPage() {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [inputValue, setInputValue] = useState('1');
  const [addedQuantity, setAddedQuantity] = useState(1);
  const [cartError, setCartError] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (itemId) {
      loadItem(parseInt(itemId));
    } else {
      setError('No item ID provided');
      setLoading(false);
    }
  }, []);

  // Reset quantity when item changes
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setInputValue('1');
    }
  }, [item]);

  const loadItem = async (id: number) => {
    try {
      setLoading(true);
      const data = await getItem(id);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 text-gray-600">Loading item...</div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Browse
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Item not found'}</p>
            <Link
              to="/browse"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Return to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Browse
        </Link>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative">
                <span className="text-8xl">{getFurnitureEmoji(item)}</span>
                {item.quantity === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 text-white font-bold text-2xl px-8 py-3 rounded shadow-lg transform -rotate-12">
                      SOLD OUT!
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {item.name}
              </h1>

              <div className="mb-6">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  item.condition_status === 'New' ? 'bg-blue-100 text-blue-800' :
                  item.condition_status === 'Like New' ? 'bg-green-100 text-green-800' :
                  item.condition_status === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                  item.condition_status === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.condition_status}
                </span>
              </div>

              <p className="text-4xl font-bold text-emerald-600 mb-6">
                {formatPrice(item.price)}
              </p>

              {item.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )}

              <div className="mb-6 space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-gray-900">{item.category || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Quantity Available</span>
                  <span className="font-medium text-gray-900">{item.quantity}</span>
                </div>
                {item.date_added && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Date Added</span>
                    <span className="font-medium text-gray-900">
                      {new Date(item.date_added).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const newQty = Math.max(1, quantity - 1);
                      setQuantity(newQty);
                      setInputValue(newQty.toString());
                    }}
                    disabled={quantity <= 1}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string and partial numbers while typing
                      if (value === '' || /^\d*$/.test(value)) {
                        setInputValue(value);
                        // Update quantity if it's a valid number
                        if (value !== '') {
                          const numValue = parseInt(value, 10);
                          if (!isNaN(numValue) && numValue > 0) {
                            const maxQuantity = Math.max(1, item.quantity);
                            const clampedValue = Math.min(numValue, maxQuantity);
                            setQuantity(clampedValue);
                          }
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure valid value when input loses focus
                      const numValue = parseInt(e.target.value, 10);
                      if (isNaN(numValue) || numValue < 1 || e.target.value === '') {
                        setQuantity(1);
                        setInputValue('1');
                      } else {
                        const maxQuantity = Math.max(1, item.quantity);
                        const clampedValue = Math.min(numValue, maxQuantity);
                        setQuantity(clampedValue);
                        setInputValue(clampedValue.toString());
                      }
                    }}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={() => {
                      const newQty = Math.min(item.quantity, quantity + 1);
                      setQuantity(newQty);
                      setInputValue(newQty.toString());
                    }}
                    disabled={quantity >= item.quantity}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600 ml-2">
                    (Max: {item.quantity})
                  </span>
                </div>
              </div>

              {cartError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {cartError}
                </div>
              )}
              <button
                onClick={() => {
                  if (item) {
                    setCartError('');
                    try {
                      const qtyToAdd = quantity;
                      addToCart(item, qtyToAdd);
                      setAddedQuantity(qtyToAdd);
                      setShowToast(true);
                      setQuantity(1); // Reset quantity after adding
                      setInputValue('1'); // Reset input value
                    } catch (err) {
                      setCartError(err instanceof Error ? err.message : 'Failed to add item to cart');
                    }
                  }
                }}
                disabled={item.quantity === 0 || quantity > item.quantity}
                className="w-full bg-emerald-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={24} />
                Add {quantity} {quantity === 1 ? 'item' : 'items'} to cart
              </button>
              {item.quantity === 0 && (
                <p className="text-sm text-red-600 text-center mt-2">This item is out of stock</p>
              )}
              {quantity > item.quantity && item.quantity > 0 && (
                <p className="text-sm text-red-600 text-center mt-2">
                  Only {item.quantity} {item.quantity === 1 ? 'item' : 'items'} available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {showToast && (
        <Toast
          message={`${addedQuantity} ${addedQuantity === 1 ? 'item' : 'items'} added to cart!`}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

