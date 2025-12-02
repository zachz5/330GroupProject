import { useState, useEffect, FormEvent } from 'react';
import { User, Mail, MapPin, Phone, Edit, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from '../components/Link';
import { getOrdersByCustomer, Order } from '../lib/orders';
import { getFurnitureEmoji } from '../lib/emojis';
import { formatPhoneInput, validatePhone } from '../lib/phoneFormatter';
import { migrateLocalStorageOrders, getCustomerTransactions, Transaction } from '../lib/api';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previousOrders, setPreviousOrders] = useState<Order[]>([]);
  const [databaseOrders, setDatabaseOrders] = useState<Transaction[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      
      // Get localStorage orders
      const localStorageOrders = getOrdersByCustomer(user.email);
      
      // Fetch orders from database and migrate localStorage orders
      if (user.customer_id) {
        setLoadingOrders(true);
        
        // First, fetch database orders
        getCustomerTransactions(user.customer_id)
          .then(transactions => {
            console.log(`Fetched ${transactions.length} transactions from database`);
            setDatabaseOrders(transactions);
            
            // Filter out localStorage orders that have already been migrated
            // Match by total amount and item count
            const unmigratedOrders = localStorageOrders.filter(localOrder => {
              const localItemCount = localOrder.items.reduce((sum, item) => sum + item.quantity, 0);
              const localItemIds = localOrder.items.map(item => `${item.item.furniture_id}:${item.quantity}`).sort().join(',');
              
              const isMigrated = transactions.some(dbTransaction => {
                const dbItemCount = dbTransaction.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                const dbItemIds = dbTransaction.items?.map((item: any) => `${item.furniture_id}:${item.quantity}`).sort().join(',') || '';
                
                return Math.abs(dbTransaction.total_amount - localOrder.total) < 0.01 &&
                       dbItemCount === localItemCount &&
                       dbItemIds === localItemIds;
              });
              
              return !isMigrated;
            });
            
            setPreviousOrders(unmigratedOrders);
            
            // If there are unmigrated orders, migrate them
            if (unmigratedOrders.length > 0) {
              console.log(`Found ${unmigratedOrders.length} unmigrated orders in localStorage, migrating...`);
              return migrateLocalStorageOrders();
            }
            
            return { success: 0, failed: 0, skipped: 0 };
          })
          .then(result => {
            if (result && result.success > 0) {
              console.log(`Migration complete: ${result.success} succeeded, ${result.failed} failed, ${result.skipped} skipped`);
              // Refresh database orders after migration
              return getCustomerTransactions(user.customer_id);
            }
            return null;
          })
          .then(transactions => {
            if (transactions) {
              setDatabaseOrders(transactions);
              // Re-filter localStorage orders after migration
              const localStorageOrders = getOrdersByCustomer(user.email);
              const unmigratedOrders = localStorageOrders.filter(localOrder => {
                const localItemCount = localOrder.items.reduce((sum, item) => sum + item.quantity, 0);
                const localItemIds = localOrder.items.map(item => `${item.item.furniture_id}:${item.quantity}`).sort().join(',');
                
                const isMigrated = transactions.some((dbTransaction: Transaction) => {
                  const dbItemCount = dbTransaction.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                  const dbItemIds = dbTransaction.items?.map((item: any) => `${item.furniture_id}:${item.quantity}`).sort().join(',') || '';
                  
                  return Math.abs(dbTransaction.total_amount - localOrder.total) < 0.01 &&
                         dbItemCount === localItemCount &&
                         dbItemIds === localItemIds;
                });
                
                return !isMigrated;
              });
              setPreviousOrders(unmigratedOrders);
            }
            setLoadingOrders(false);
          })
          .catch(err => {
            console.error('❌ Failed to fetch/migrate orders:', err);
            setLoadingOrders(false);
          });
      } else {
        // No customer_id, just show localStorage orders
        setPreviousOrders(localStorageOrders);
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (formData.phone && !validatePhone(formData.phone)) {
      setError('Phone number must be in format (XXX) XXX-XXXX');
      return;
    }

    setLoading(true);

    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
    setIsEditing(false);
    setError('');
  };

  const fullName = user.first_name || user.last_name
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : 'Not set';

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  const getTotalItemsInOrder = (order: Order): number => {
    return order.items.reduce((total, orderItem) => total + orderItem.quantity, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Delivered': return 'bg-emerald-100 text-emerald-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Edit size={18} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <User className="text-gray-400" size={24} />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Name</p>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="First name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                    />
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Last name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                    />
                  </div>
                ) : (
                  <p className="font-medium text-gray-900">{fullName}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="text-gray-400" size={24} />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="text-gray-400" size={24} />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user.phone || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="text-gray-400" size={24} />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Address</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City, State ZIP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user.address || 'Not provided'}</p>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Orders</h2>

          {loadingOrders ? (
            <p className="text-gray-600">Loading orders...</p>
          ) : databaseOrders.length > 0 || previousOrders.length > 0 ? (
            <div className="space-y-3">
              {/* Show database orders first (most recent) */}
              {databaseOrders.map((transaction) => {
                const totalItems = transaction.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                return (
                  <div
                    key={`db-${transaction.transaction_id}`}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedOrder(expandedOrder === `db-${transaction.transaction_id}` ? null : `db-${transaction.transaction_id}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">Order #{transaction.transaction_id}</p>
                            {transaction.status && (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {transaction.status}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right ml-auto">
                          <p className="font-bold text-emerald-600">{formatPrice(transaction.total_amount)}</p>
                          <p className="text-sm text-gray-600">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {expandedOrder === `db-${transaction.transaction_id}` ? (
                        <ChevronUp className="text-gray-400" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400" size={20} />
                      )}
                    </div>
                    
                    {expandedOrder === `db-${transaction.transaction_id}` && transaction.items && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-2 mb-4">
                          {transaction.items.map((orderItem) => (
                            <div key={orderItem.furniture_id} className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                                {getFurnitureEmoji({ name: orderItem.name || '', category: orderItem.category || '' })}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{orderItem.name || 'Unknown Item'}</p>
                                <p className="text-sm text-gray-600">
                                  Quantity: {orderItem.quantity} × {formatPrice(orderItem.price_each)}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                {formatPrice(orderItem.quantity * orderItem.price_each)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Payment Method:</p>
                          <p className="text-sm text-gray-900">{transaction.payment_method}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Show localStorage orders that haven't been migrated yet */}
              {previousOrders.map((order) => {
                const totalItems = getTotalItemsInOrder(order);
                return (
                  <div
                    key={order.orderId}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div>
                          <p className="font-semibold text-gray-900">Order {order.orderId}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right ml-auto">
                          <p className="font-bold text-emerald-600">{formatPrice(order.total)}</p>
                          <p className="text-sm text-gray-600">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {expandedOrder === order.orderId ? (
                        <ChevronUp className="text-gray-400" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400" size={20} />
                      )}
                    </div>
                    
                    {expandedOrder === order.orderId && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-2 mb-4">
                          {order.items.map((orderItem) => (
                            <div key={orderItem.item.furniture_id} className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                                {getFurnitureEmoji(orderItem.item)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{orderItem.item.name}</p>
                                <p className="text-gray-600 text-xs">
                                  {formatPrice(orderItem.item.price)} × {orderItem.quantity}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {formatPrice(orderItem.item.price * orderItem.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                        {order.shippingAddress && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-600 mb-1">Shipping Address:</p>
                            <p className="text-sm text-gray-900">{order.shippingAddress}</p>
                          </div>
                        )}
                        {order.paymentMethod && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Payment Method:</p>
                            <p className="text-sm text-gray-900 capitalize">{order.paymentMethod}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
              <Link
                to="/browse"
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Browse Furniture
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
