import { useState, useEffect } from 'react';
import { Edit, X, Save, Search, UserPlus, UserX, UserCheck } from 'lucide-react';
import { getAllCustomers, updateCustomer, deactivateCustomer, Customer } from '../lib/api';
import { formatPhoneInput } from '../lib/phoneFormatter';
import ConfirmModal from '../components/ConfirmModal';

export default function UsersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deactivateConfirm, setDeactivateConfirm] = useState<{ isOpen: boolean; customerId: number | null; customerName?: string; isActive: boolean }>({
    isOpen: false,
    customerId: null,
    isActive: true,
  });
  const [bulkDeactivateConfirm, setBulkDeactivateConfirm] = useState<{ isOpen: boolean; count: number; isActive: boolean }>({
    isOpen: false,
    count: 0,
    isActive: false,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      // Always fetch all customers, we'll filter on the frontend
      const data = await getAllCustomers(true);
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [showInactiveOnly]);

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.customer_id);
    setEditForm({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
  };

  const handleSave = async (id: number) => {
    try {
      const updated = await updateCustomer(id, editForm);
      // Update the customer in the list and keep them visible
      setCustomers(customers.map(c => c.customer_id === id ? { ...updated, is_active: c.is_active } : c));
      setEditingId(null);
      setEditForm({});
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer');
    }
  };

  const handleDeactivateClick = (id: number) => {
    const customer = customers.find(c => c.customer_id === id);
    const customerName = customer 
      ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email
      : 'this customer';
    const isActive = customer?.is_active === 1 || customer?.is_active === true;
    setDeactivateConfirm({ isOpen: true, customerId: id, customerName, isActive: !isActive });
  };

  const handleDeactivate = async () => {
    if (!deactivateConfirm.customerId) return;

    try {
      const updated = await deactivateCustomer(deactivateConfirm.customerId, deactivateConfirm.isActive);
      // Update the customer in the list
      setCustomers(customers.map(c => c.customer_id === deactivateConfirm.customerId ? updated : c));
      
      // If deactivating and showing only active, remove from list
      if (!deactivateConfirm.isActive && !showInactiveOnly) {
        setCustomers(customers.filter(c => c.customer_id !== deactivateConfirm.customerId));
      }
      
      // If activating and showing only inactive, remove from list
      if (deactivateConfirm.isActive && showInactiveOnly) {
        setCustomers(customers.filter(c => c.customer_id !== deactivateConfirm.customerId));
      }
      
      setDeactivateConfirm({ isOpen: false, customerId: null, isActive: true });
      setError(''); // Clear any previous errors
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer status';
      setError(errorMessage);
      setDeactivateConfirm({ isOpen: false, customerId: null, isActive: true });
      console.error('Deactivate error:', err);
    }
  };

  const handleBulkDeactivateClick = () => {
    if (selectedIds.size === 0) return;
    setBulkDeactivateConfirm({ isOpen: true, count: selectedIds.size, isActive: false });
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;

    try {
      // Deactivate all selected customers
      await Promise.all(Array.from(selectedIds).map(id => deactivateCustomer(id, false)));
      // Remove from state (since we only show active customers)
      const updatedCustomers = customers.filter(c => !selectedIds.has(c.customer_id));
      setCustomers(updatedCustomers);
      setSelectedIds(new Set());
      setBulkDeactivateConfirm({ isOpen: false, count: 0, isActive: false });
      setError(''); // Clear any previous errors
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate customers';
      setError(errorMessage);
      setBulkDeactivateConfirm({ isOpen: false, count: 0, isActive: false });
      console.error('Bulk deactivate error:', err);
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
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.customer_id)));
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      customer.email.toLowerCase().includes(searchLower) ||
      (customer.first_name?.toLowerCase().includes(searchLower) ?? false) ||
      (customer.last_name?.toLowerCase().includes(searchLower) ?? false)
    );
    
    // Filter by status: if showInactiveOnly is true, only show inactive; otherwise only show active
    const isActive = customer.is_active === 1 || customer.is_active === true;
    const matchesStatus = showInactiveOnly ? !isActive : isActive;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
            <UserPlus size={20} />
            Add New User
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={() => setShowInactiveOnly(!showInactiveOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showInactiveOnly
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showInactiveOnly ? 'Show Active Customers' : 'Show Inactive Customers'}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-yellow-800 font-medium">
              {selectedIds.size} customer(s) selected
            </span>
            <button
              onClick={handleBulkDeactivateClick}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Deactivate Selected
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading users...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Email</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Phone</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Address</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Registered</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const isEditing = editingId === customer.customer_id;
                    return (
                      <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(customer.customer_id)}
                            onChange={() => toggleSelect(customer.customer_id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-4 px-6">
                          {isEditing ? (
                            <span className="font-medium text-gray-900">
                              <input
                                type="text"
                                value={editForm.first_name || ''}
                                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                placeholder="First"
                                className="inline-block w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-transparent"
                              />
                              {' '}
                              <input
                                type="text"
                                value={editForm.last_name || ''}
                                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                placeholder="Last"
                                className="inline-block w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-transparent"
                              />
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">
                              {customer.first_name || customer.last_name
                                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                                : 'N/A'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-700">{customer.email}</td>
                        <td className="py-4 px-6">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.phone || ''}
                              onChange={(e) => setEditForm({ ...editForm, phone: formatPhoneInput(e.target.value) })}
                              placeholder="(555) 123-4567"
                              maxLength={14}
                              className="inline-block w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-transparent text-gray-700"
                            />
                          ) : (
                            <span className="text-gray-700">{customer.phone || 'N/A'}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.address || ''}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              placeholder="Address"
                              className="inline-block w-full max-w-md px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-transparent text-gray-700"
                            />
                          ) : (
                            <span className="text-gray-700">{customer.address || 'N/A'}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            (customer.is_active === 1 || customer.is_active === true)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {(customer.is_active === 1 || customer.is_active === true) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600 text-sm">
                          {customer.date_registered
                            ? new Date(customer.date_registered).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSave(customer.customer_id)}
                                className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                                title="Save"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditForm({});
                                }}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(customer)}
                                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              {(customer.is_active === 1 || customer.is_active === true) ? (
                                <button
                                  onClick={() => handleDeactivateClick(customer.customer_id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Deactivate"
                                >
                                  <UserX size={18} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeactivateClick(customer.customer_id)}
                                  className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                  title="Activate"
                                >
                                  <UserCheck size={18} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Deactivate Confirmation Modal */}
        <ConfirmModal
          isOpen={deactivateConfirm.isOpen}
          title={deactivateConfirm.isActive ? "Reactivate Customer" : "Deactivate Customer"}
          message={deactivateConfirm.isActive 
            ? `Are you sure you want to reactivate ${deactivateConfirm.customerName || 'this customer'}? They will be able to log in again.`
            : `Are you sure you want to deactivate ${deactivateConfirm.customerName || 'this customer'}? They will not be able to log in, but all their transactions will be preserved.`}
          confirmText={deactivateConfirm.isActive ? "Reactivate" : "Deactivate"}
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateConfirm({ isOpen: false, customerId: null, isActive: true })}
        />

        {/* Bulk Deactivate Confirmation Modal */}
        <ConfirmModal
          isOpen={bulkDeactivateConfirm.isOpen}
          title="Deactivate Customers"
          message={`Are you sure you want to deactivate ${bulkDeactivateConfirm.count} customer(s)? They will not be able to log in, but all their transactions will be preserved.`}
          confirmText="Deactivate All"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleBulkDeactivate}
          onCancel={() => setBulkDeactivateConfirm({ isOpen: false, count: 0, isActive: false })}
        />
      </div>
    </div>
  );
}

