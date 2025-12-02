import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Search } from 'lucide-react';
import { getItems, deleteItem, updateItem, Item } from '../lib/api';
import { getFurnitureEmoji } from '../lib/emojis';

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Item>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteItem(id);
      setItems(items.filter((item) => item.furniture_id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleEdit = (item: Item) => {
    setEditingId(item.furniture_id);
    setEditForm({
      name: item.name,
      category: item.category || '',
      description: item.description || '',
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      condition_status: item.condition_status,
      quantity: item.quantity,
    });
  };

  const handleSave = async (id: number) => {
    try {
      const updated = await updateItem(id, editForm);
      setItems(items.map(item => item.furniture_id === id ? updated : item));
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} item(s)?`)) return;

    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteItem(id)));
      setItems(items.filter(item => !selectedIds.has(item.furniture_id)));
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete items');
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
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.furniture_id)));
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCondition = !conditionFilter || item.condition_status === conditionFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'out' && item.quantity === 0) ||
      (statusFilter === 'low' && item.quantity > 0 && item.quantity < 5) ||
      (statusFilter === 'in' && item.quantity >= 5);
    return matchesSearch && matchesCondition && matchesStatus;
  });

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  const getStatus = (quantity: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity < 3) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusColor = (quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity < 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Like New': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-emerald-100 text-emerald-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
            <Plus size={20} />
            Add New Item
          </button>
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
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">All Conditions</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="out">Out of Stock</option>
              <option value="low">Low Stock</option>
              <option value="in">In Stock</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-yellow-800 font-medium">
              {selectedIds.size} item(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No items in inventory.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Item</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Quantity</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Condition</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Price</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const isEditing = editingId === item.furniture_id;
                    return (
                    <tr key={item.furniture_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.furniture_id)}
                          onChange={() => toggleSelect(item.furniture_id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">
                              {getFurnitureEmoji(item)}
                            </div>
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                              placeholder="Item name"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">
                              {getFurnitureEmoji(item)}
                            </div>
                            <span className="font-medium text-gray-900">{item.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.quantity || 0}
                            onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                            min="0"
                          />
                        ) : (
                          <span className="text-gray-700">{item.quantity}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <select
                            value={editForm.condition_status || 'Good'}
                            onChange={(e) => setEditForm({ ...editForm, condition_status: e.target.value as Item['condition_status'] })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                          >
                            <option value="New">New</option>
                            <option value="Like New">Like New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(item.condition_status)}`}>
                            {item.condition_status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.price || 0}
                              onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                              min="0"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-900">{formatPrice(item.price)}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.quantity)}`}>
                          {getStatus(item.quantity)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(item.furniture_id)}
                              className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                              title="Save"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.furniture_id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
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
      </div>
    </div>
  );
}
