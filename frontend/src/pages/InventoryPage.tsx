import { useState, useEffect } from 'react';
import { Plus, Edit, X, Save, Search, Trash2, RotateCcw } from 'lucide-react';
import { getItems, updateItem, createItem, toggleItemSaleStatus, Item } from '../lib/api';
import { getFurnitureEmoji } from '../lib/emojis';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Item>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '',
    category: '',
    description: '',
    price: undefined,
    condition_status: undefined,
    quantity: undefined,
  });
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🪑');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: number | null; itemName?: string; isForSale: boolean }>({
    isOpen: false,
    itemId: null,
    isForSale: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      // Include inactive items (not for sale) so employees can see and restore them
      const data = await getItems(true);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
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
      emoji: item.emoji || getFurnitureEmoji(item),
      notes: item.notes || '',
    });
  };

  const handleSave = async (id: number) => {
    try {
      setError(''); // Clear any previous errors
      
      // Build update data with all fields from editForm
      const updateData: Partial<Item> = {};
      
      if (editForm.name !== undefined) updateData.name = editForm.name;
      if (editForm.category !== undefined) updateData.category = editForm.category;
      if (editForm.description !== undefined) updateData.description = editForm.description;
      if (editForm.price !== undefined) updateData.price = editForm.price;
      if (editForm.condition_status !== undefined) updateData.condition_status = editForm.condition_status;
      if (editForm.quantity !== undefined) updateData.quantity = editForm.quantity;
      if (editForm.emoji !== undefined) updateData.emoji = editForm.emoji;
      // Always include notes if it exists in editForm (even if empty string)
      if (editForm.hasOwnProperty('notes')) {
        updateData.notes = editForm.notes || '';
      }
      
      // Include employee_id for Inventory_Log foreign key constraint
      // Use type assertion since employee_id is not part of Item interface but needed for backend
      const updateDataWithEmployee = updateData as Partial<Item> & { employee_id?: number };
      if (user?.employee_id) {
        updateDataWithEmployee.employee_id = user.employee_id;
      }
      
      console.log('Saving item:', id, 'with notes:', updateDataWithEmployee.notes, 'employee_id:', updateDataWithEmployee.employee_id);
      
      const updated = await updateItem(id, updateDataWithEmployee);
      
      console.log('Updated item response:', updated);
      
      // Update the items state with the complete updated item
      setItems(items.map(item => 
        item.furniture_id === id 
          ? { ...item, ...updated } 
          : item
      ));
      
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Error saving item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update item');
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

  const handleToggleSaleStatusClick = (id: number) => {
    const item = items.find(i => i.furniture_id === id);
    // Check if item is currently for sale (handle both boolean false and 0 from database)
    const currentlyForSale = item?.is_for_sale !== false && item?.is_for_sale !== 0 && item?.is_for_sale !== undefined;
    setDeleteConfirm({
      isOpen: true,
      itemId: id,
      itemName: item?.name,
      isForSale: !currentlyForSale, // Toggle: if currently for sale, we're marking as not for sale
    });
  };

  const handleToggleSaleStatus = async () => {
    if (!deleteConfirm.itemId) return;

    try {
      const updated = await toggleItemSaleStatus(deleteConfirm.itemId, deleteConfirm.isForSale);
      setItems(items.map(item => 
        item.furniture_id === deleteConfirm.itemId 
          ? { ...item, is_for_sale: updated.is_for_sale }
          : item
      ));
      setDeleteConfirm({ isOpen: false, itemId: null, isForSale: true });
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item sale status');
      setDeleteConfirm({ isOpen: false, itemId: null, isForSale: true });
    }
  };

  const handleAddItem = async () => {
    try {
      setError('');
      
      // Convert undefined to null for database compatibility
      // Condition is required, so it should always be set
      if (!newItem.condition_status) {
        setError('Condition is required');
        return;
      }

      const itemToCreate = {
        name: newItem.name || '',
        category: newItem.category || null,
        description: newItem.description || null,
        price: typeof newItem.price === 'string' ? parseFloat(newItem.price) : (newItem.price ?? 0),
        condition_status: newItem.condition_status,
        quantity: newItem.quantity ?? 0,
        emoji: selectedEmoji,
        added_by_employee_id: user?.employee_id || null,
      };

      const created = await createItem(itemToCreate as Omit<Item, 'furniture_id' | 'date_added'>);
      setItems([created, ...items]);
      setShowAddModal(false);
      setNewItem({
        name: '',
        category: '',
        description: '',
        price: undefined,
        condition_status: undefined,
        quantity: undefined,
      });
      setSelectedEmoji('🪑');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewItem({
      name: '',
      category: '',
      description: '',
      price: undefined,
      condition_status: undefined,
      quantity: undefined,
    });
    setSelectedEmoji('🪑');
    setError('');
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

  const getConditionColor = (condition: string | null | undefined) => {
    const cond = condition || 'Good'; // Default to 'Good' if null/undefined/empty
    switch (cond) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Like New': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-emerald-100 text-emerald-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionDisplay = (condition: string | null | undefined) => {
    return condition || 'Good'; // Default to 'Good' if null/undefined/empty
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
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
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Item</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Quantity</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Condition</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Price</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Sale Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Notes</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const isEditing = editingId === item.furniture_id;
                    const isNotForSale = item.is_for_sale === false;
                    return (
                    <tr key={item.furniture_id} className={`hover:bg-gray-50 transition-colors ${isNotForSale ? 'bg-gray-50 opacity-75' : ''}`}>
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl border-2 border-gray-300">
                                {editForm.emoji || getFurnitureEmoji(item)}
                              </div>
                              <select
                                value={editForm.emoji || getFurnitureEmoji(item)}
                                onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                                className="text-xs px-1 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent outline-none"
                                title="Select emoji"
                              >
                                <option value="🪑">🪑</option>
                                <option value="📋">📋</option>
                                <option value="🛏️">🛏️</option>
                                <option value="🛋️">🛋️</option>
                                <option value="🗄️">🗄️</option>
                                <option value="💡">💡</option>
                                <option value="🪞">🪞</option>
                                <option value="📚">📚</option>
                                <option value="🧶">🧶</option>
                                <option value="🪟">🪟</option>
                                <option value="👔">👔</option>
                                <option value="🪴">🪴</option>
                                <option value="📦">📦</option>
                                <option value="🖼️">🖼️</option>
                                <option value="🪵">🪵</option>
                                <option value="🪶">🪶</option>
                              </select>
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
                            {getConditionDisplay(item.condition_status)}
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
                        {item.is_for_sale === false || item.is_for_sale === 0 ? (
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 font-semibold">
                            ⚠️ Not for Sale
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ For Sale
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        {isEditing ? (
                          <textarea
                            value={editForm.notes || ''}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                            rows={2}
                            placeholder="Add notes..."
                          />
                        ) : (
                          <div className="text-sm text-gray-600">
                            {item.notes ? (
                              <span className="line-clamp-2" title={item.notes}>{item.notes}</span>
                            ) : (
                              <span className="text-gray-400 italic">No notes</span>
                            )}
                          </div>
                        )}
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
                            {(item.is_for_sale === false || item.is_for_sale === 0) ? (
                              <button
                                onClick={() => handleToggleSaleStatusClick(item.furniture_id)}
                                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                title="Restore for Sale"
                              >
                                <RotateCcw size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleSaleStatusClick(item.furniture_id)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Mark as Not for Sale"
                              >
                                <Trash2 size={18} />
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
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add New Item</h2>
              <button
                onClick={handleCloseAddModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Emoji Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Icon
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-5xl border-2 border-gray-300">
                    {selectedEmoji}
                  </div>
                  <select
                    value={selectedEmoji}
                    onChange={(e) => setSelectedEmoji(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg"
                  >
                    <option value="🪑">🪑 Chair</option>
                    <option value="📋">📋 Table/Desk</option>
                    <option value="🛏️">🛏️ Bed</option>
                    <option value="🛋️">🛋️ Sofa/Couch</option>
                    <option value="🗄️">🗄️ Dresser/Cabinet</option>
                    <option value="💡">💡 Lamp/Lighting</option>
                    <option value="🪞">🪞 Mirror</option>
                    <option value="📚">📚 Bookshelf</option>
                    <option value="🧶">🧶 Rug/Carpet</option>
                    <option value="🪟">🪟 Curtain/Window</option>
                    <option value="👔">👔 Wardrobe/Closet</option>
                    <option value="🪴">🪴 Plant/Decor</option>
                    <option value="📦">📦 Storage Box</option>
                    <option value="🖼️">🖼️ Picture Frame</option>
                    <option value="🪵">🪵 Wood Furniture</option>
                    <option value="🪶">🪶 Pillow/Cushion</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Item name"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={newItem.category || ''}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="e.g., Chair, Desk, Table"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Item description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.price ?? ''}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={newItem.quantity ?? ''}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    min="0"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  value={newItem.condition_status || ''}
                  onChange={(e) => setNewItem({ ...newItem, condition_status: e.target.value as Item['condition_status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select condition...</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseAddModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.name || !newItem.price || !newItem.condition_status}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Sale Status Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.isForSale ? "Restore Item for Sale" : "Mark Item as Not for Sale"}
        message={deleteConfirm.isForSale 
          ? `Are you sure you want to restore "${deleteConfirm.itemName || 'this item'}" for sale? Customers will be able to purchase it again.`
          : `Are you sure you want to mark "${deleteConfirm.itemName || 'this item'}" as not for sale? This will hide it from customers, but the item will remain in the database.`}
        confirmText={deleteConfirm.isForSale ? "Restore" : "Mark as Not for Sale"}
        cancelText="Cancel"
        onConfirm={handleToggleSaleStatus}
        onCancel={() => setDeleteConfirm({ isOpen: false, itemId: null, isForSale: true })}
        variant={deleteConfirm.isForSale ? "info" : "danger"}
      />
    </div>
  );
}
