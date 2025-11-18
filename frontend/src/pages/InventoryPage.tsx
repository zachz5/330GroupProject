import { Plus, Edit, Trash2 } from 'lucide-react';

export default function InventoryPage() {
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

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Item</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Quantity</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Condition</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Price</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                          {'{{ img }}'}
                        </div>
                        <span className="font-medium text-gray-900">{'{{ item_name }}'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{'{{ quantity }}'}</td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                        {'{{ condition }}'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">{'{{ price }}'}</td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                        {'{{ status }}'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                          <Edit size={18} />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

