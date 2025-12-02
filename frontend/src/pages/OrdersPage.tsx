import { useState, useEffect, Fragment } from 'react';
import { Edit, Trash2, X, Save, Search, Package, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { getAllTransactions, updateTransactionStatus, deleteTransaction, Transaction } from '../lib/api';
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
  const [editForm, setEditForm] = useState<{ status: string; notes?: string }>({ status: '' });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [refundConfirm, setRefundConfirm] = useState<{ isOpen: boolean; transactionId: number | null; orderId?: number }>({
    isOpen: false,
    transactionId: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; transactionId: number | null; orderId?: number }>({
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
    });
  };

  const handleSave = async (id: number) => {
    try {
      const updated = await updateTransactionStatus(id, editForm.status, editForm.notes);
      // Ensure we preserve all transaction properties and update with the response
      setTransactions(transactions.map(t => {
        if (t.transaction_id === id) {
          return {
            ...t,
            ...updated,
            // Ensure items are preserved if not in response
            items: updated.items || t.items
          };
        }
        return t;
      }));
      setEditingId(null);
      setEditForm({ status: '' });
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      console.error('Update error:', err);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirm({ isOpen: true, transactionId: id, orderId: id });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.transactionId) return;

    try {
      await deleteTransaction(deleteConfirm.transactionId);
      setTransactions(transactions.filter(t => t.transaction_id !== deleteConfirm.transactionId));
      setDeleteConfirm({ isOpen: false, transactionId: null });
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
      setDeleteConfirm({ isOpen: false, transactionId: null });
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Update ${selectedIds.size} order(s) to "${status}"?`)) return;

    try {
      await Promise.all(Array.from(selectedIds).map(id => updateTransactionStatus(id, status)));
      await loadTransactions();
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update orders');
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.transaction_id)));
    }
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

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
            <span className="text-yellow-800 font-medium">
              {selectedIds.size} order(s) selected
            </span>
            <div className="flex gap-2 flex-wrap">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Bulk Update Status...</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (confirm(`Delete ${selectedIds.size} order(s)? Items will be restocked.`)) {
                    Promise.all(Array.from(selectedIds).map(id => deleteTransaction(id)))
                      .then(() => {
                        loadTransactions();
                        setSelectedIds(new Set());
                      })
                      .catch(err => setError(err.message));
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

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
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Order ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Customer</th>
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
                            <input
                              type="checkbox"
                              checked={selectedIds.has(transaction.transaction_id)}
                              onChange={() => toggleSelect(transaction.transaction_id)}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
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
                          <td className="py-4 px-6 text-gray-700 text-sm">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-gray-900">{formatPrice(transaction.total_amount)}</p>
                            <p className="text-sm text-gray-600">{totalItems} item(s)</p>
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
                                  <button
                                    onClick={() => handleDeleteClick(transaction.transaction_id)}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && transaction.items && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 mb-2">Order Items:</h4>
                                {transaction.items.map((item) => (
                                  <div key={item.detail_id} className="flex items-center gap-3 p-2 bg-white rounded">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                                      {getFurnitureEmoji({ name: item.name || '', category: item.category || '' })}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{item.name || 'Unknown Item'}</p>
                                      <p className="text-sm text-gray-600">
                                        Quantity: {item.quantity} × {formatPrice(item.price_each)}
                                      </p>
                                    </div>
                                    <p className="font-semibold text-gray-900">
                                      {formatPrice(item.quantity * item.price_each)}
                                    </p>
                                  </div>
                                ))}
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

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete Order"
          message={`Are you sure you want to delete order #${deleteConfirm.orderId}? Items will be restocked and the order will be permanently removed.`}
          confirmText="Delete Order"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm({ isOpen: false, transactionId: null })}
        />
      </div>
    </div>
  );
}

