import { useState, useEffect, Fragment } from 'react';
import { Edit, X, Save, Search, Package, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { getAllTransactions, updateTransactionStatus, updateTransactionDetails, Transaction } from '../lib/api';
import { getFurnitureEmoji } from '../lib/emojis';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled', 'Refunded'];

export default function OrdersPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ 
    status: string; 
    notes?: string;
    items?: Array<{ detail_id: number; quantity: number; price_each: number }>;
    total_amount?: number;
    payment_method?: string;
    shipping_address?: string;
  }>({ status: '' });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [refundConfirm, setRefundConfirm] = useState<{ isOpen: boolean; transactionId: number | null; orderId?: number }>({
    isOpen: false,
    transactionId: null,
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getAllTransactions();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.transaction_id);
    setEditForm({
      status: transaction.status,
      notes: transaction.notes || '',
      items: transaction.items?.map(item => ({
        detail_id: item.detail_id,
        quantity: item.quantity,
        price_each: item.price_each,
      })) || [],
      total_amount: transaction.total_amount,
      payment_method: transaction.payment_method,
      shipping_address: transaction.shipping_address || '',
    });
  };

  const handleSave = async (id: number) => {
    try {
      // Build update payload - always include shipping_address when editing
      // Use editForm.shipping_address if it exists, otherwise keep current value
      const currentTransaction = transactions.find(t => t.transaction_id === id);
      const shippingAddressToSend = editForm.shipping_address !== undefined 
        ? editForm.shipping_address 
        : (currentTransaction?.shipping_address || '');
      
      const updatePayload: any = {
        status: editForm.status,
        shipping_address: shippingAddressToSend,
      };
      
      if (editForm.notes !== undefined) updatePayload.notes = editForm.notes;
      if (editForm.items !== undefined) updatePayload.items = editForm.items;
      if (editForm.total_amount !== undefined) updatePayload.total_amount = editForm.total_amount;
      if (editForm.payment_method !== undefined) updatePayload.payment_method = editForm.payment_method;
      
      console.log('=== SAVING TRANSACTION ===');
      console.log('Transaction ID:', id);
      console.log('EditForm state:', JSON.stringify(editForm, null, 2));
      console.log('Shipping address from editForm:', editForm.shipping_address);
      console.log('Shipping address being sent:', shippingAddressToSend);
      console.log('Full payload:', JSON.stringify(updatePayload, null, 2));
      const updated = await updateTransactionDetails(id, updatePayload);
      console.log('Updated transaction response:', updated);
      console.log('Response shipping_address:', updated.shipping_address);
      
      // Reload transactions to ensure we have the latest data from the server
      await loadTransactions();
      
      setEditingId(null);
      setEditForm({ status: '' });
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      console.error('Update error:', err);
    }
  };

  const updateItemField = (detailId: number, field: 'quantity' | 'price_each', value: number) => {
    if (!editForm.items) return;
    
    const updatedItems = editForm.items.map(item => 
      item.detail_id === detailId ? { ...item, [field]: value } : item
    );
    
    // Recalculate subtotal, tax, and total amount
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price_each), 0);
    const TAX_RATE = 0.04;
    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
    const newTotal = subtotal + taxAmount;
    
    setEditForm({
      ...editForm,
      items: updatedItems,
      total_amount: newTotal,
    });
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

  const handleRefundClick = (id: number) => {
    setRefundConfirm({ isOpen: true, transactionId: id, orderId: id });
  };

  const handleRefund = async () => {
    if (!refundConfirm.transactionId) return;

    try {
      const updated = await updateTransactionStatus(refundConfirm.transactionId, 'Refunded');
      setTransactions(transactions.map(t => {
        if (t.transaction_id === refundConfirm.transactionId) {
          return {
            ...t,
            ...updated,
            items: updated.items || t.items
          };
        }
        return t;
      }));
      setRefundConfirm({ isOpen: false, transactionId: null });
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refund order');
      setRefundConfirm({ isOpen: false, transactionId: null });
      console.error('Refund error:', err);
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      transaction.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${transaction.first_name} ${transaction.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transaction_id.toString().includes(searchTerm);
    const matchesStatus = !statusFilter || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by customer name, email, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading orders...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Order ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Customer</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Shipping Address</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Total</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const isEditing = editingId === transaction.transaction_id;
                    const isExpanded = expandedId === transaction.transaction_id;
                    const totalItems = transaction.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                    return (
                      <Fragment key={transaction.transaction_id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-gray-400" />
                              <span className="font-medium text-gray-900">#{transaction.transaction_id}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-medium text-gray-900">
                                {transaction.first_name || transaction.last_name
                                  ? `${transaction.first_name || ''} ${transaction.last_name || ''}`.trim()
                                  : 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">{transaction.customer_email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {isEditing ? (
                              <textarea
                                value={editForm.shipping_address || ''}
                                onChange={(e) => setEditForm({ ...editForm, shipping_address: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                                rows={2}
                                placeholder="Enter shipping address"
                              />
                            ) : (
                              <p className="text-sm text-gray-700 max-w-xs">
                                {transaction.shipping_address || 'No address provided'}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-6 text-gray-700 text-sm">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editForm.total_amount || 0}
                                  onChange={(e) => setEditForm({ ...editForm, total_amount: parseFloat(e.target.value) || 0 })}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                />
                                <p className="text-sm text-gray-600">{totalItems} item(s)</p>
                              </div>
                            ) : (
                              <>
                            <p className="font-semibold text-gray-900">{formatPrice(transaction.total_amount)}</p>
                            <p className="text-sm text-gray-600">{totalItems} item(s)</p>
                              </>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {isEditing ? (
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                              >
                                {STATUS_OPTIONS.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status || 'Pending')}`}>
                                {transaction.status || 'Pending'}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => setExpandedId(isExpanded ? null : transaction.transaction_id)}
                                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    title={isExpanded ? "Collapse" : "Expand"}
                                  >
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </button>
                                  <button
                                    onClick={() => handleSave(transaction.transaction_id)}
                                    className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                                    title="Save"
                                  >
                                    <Save size={18} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditForm({ status: '' });
                                      setExpandedId(null);
                                    }}
                                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                    title="Cancel"
                                  >
                                    <X size={18} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setExpandedId(isExpanded ? null : transaction.transaction_id)}
                                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    title={isExpanded ? "Collapse" : "Expand"}
                                  >
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </button>
                                  <button
                                    onClick={() => handleEdit(transaction)}
                                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    title="Edit Status"
                                  >
                                    <Edit size={18} />
                                  </button>
                                  {(transaction.status !== 'Refunded' && transaction.status !== 'Cancelled') && (
                                    <button
                                      onClick={() => handleRefundClick(transaction.transaction_id)}
                                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                      title="Refund Order"
                                    >
                                      <DollarSign size={18} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && transaction.items && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900">Order Items:</h4>
                                  {isEditing && (
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Payment Method:</label>
                                        <select
                                          value={editForm.payment_method || ''}
                                          onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                        >
                                          <option value="Credit Card">Credit Card</option>
                                          <option value="Debit Card">Debit Card</option>
                                          <option value="PayPal">PayPal</option>
                                          <option value="Cash">Cash</option>
                                          <option value="Venmo">Venmo</option>
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {transaction.items.map((item) => {
                                  const editingItem = isEditing && editForm.items?.find(editItem => editItem.detail_id === item.detail_id);
                                  const displayQuantity = editingItem ? editingItem.quantity : item.quantity;
                                  const displayPrice = editingItem ? editingItem.price_each : item.price_each;
                                  
                                  return (
                                    <div key={item.detail_id} className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                                      {getFurnitureEmoji({ name: item.name || '', category: item.category || '' })}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{item.name || 'Unknown Item'}</p>
                                        {isEditing ? (
                                          <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-2">
                                              <label className="text-sm text-gray-600">Qty:</label>
                                              <input
                                                type="number"
                                                min="1"
                                                value={displayQuantity}
                                                onChange={(e) => updateItemField(item.detail_id, 'quantity', parseInt(e.target.value) || 1)}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                              />
                                            </div>
                                            <span className="text-gray-400">×</span>
                                            <div className="flex items-center gap-2">
                                              <label className="text-sm text-gray-600">Price:</label>
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={displayPrice}
                                                onChange={(e) => updateItemField(item.detail_id, 'price_each', parseFloat(e.target.value) || 0)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                      <p className="text-sm text-gray-600">
                                            Quantity: {displayQuantity} × {formatPrice(displayPrice)}
                                          </p>
                                        )}
                                      </div>
                                      <p className="font-semibold text-gray-900 min-w-[80px] text-right">
                                        {formatPrice(displayQuantity * displayPrice)}
                                      </p>
                                    </div>
                                  );
                                })}
                                {/* Order Summary with Tax */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="space-y-2">
                                    {(() => {
                                      const subtotal = (transaction.items || []).reduce((sum, item) => {
                                        const editingItem = isEditing && editForm.items?.find(editItem => editItem.detail_id === item.detail_id);
                                        const qty = editingItem ? editingItem.quantity : item.quantity;
                                        const price = editingItem ? editingItem.price_each : item.price_each;
                                        return sum + (qty * price);
                                      }, 0);
                                      // Calculate tax if not present (for old transactions)
                                      const TAX_RATE = 0.04;
                                      const taxAmount = transaction.tax_amount !== undefined && transaction.tax_amount !== null
                                        ? transaction.tax_amount
                                        : Math.round(subtotal * TAX_RATE * 100) / 100;
                                      return (
                                        <>
                                          <div className="flex justify-between text-gray-700">
                                            <span>Subtotal:</span>
                                            <span>{formatPrice(subtotal)}</span>
                                          </div>
                                          <div className="flex justify-between text-gray-700">
                                            <span>Tax (Alabama 4%):</span>
                                            <span>{formatPrice(taxAmount)}</span>
                                          </div>
                                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                            <span className="font-semibold text-gray-900">Total:</span>
                                            <span className="text-lg font-bold text-emerald-600">{formatPrice(transaction.total_amount)}</span>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                                {isEditing && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Internal Notes:
                                    </label>
                                    <textarea
                                      value={editForm.notes || ''}
                                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                      placeholder="Add internal notes about this order..."
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                      rows={3}
                                    />
                                  </div>
                                )}
                                {transaction.notes && !isEditing && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Internal Notes:</p>
                                    <p className="text-sm text-gray-600">{transaction.notes}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refund Confirmation Modal */}
        <ConfirmModal
          isOpen={refundConfirm.isOpen}
          title="Refund Order"
          message={`Are you sure you want to refund order #${refundConfirm.orderId}? Items will be restocked and the order status will be changed to "Refunded".`}
          confirmText="Refund Order"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleRefund}
          onCancel={() => setRefundConfirm({ isOpen: false, transactionId: null })}
        />
      </div>
    </div>
  );
}

