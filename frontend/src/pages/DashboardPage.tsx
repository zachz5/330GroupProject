import { useState, useEffect } from 'react';
import { Users, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { getItems } from '../lib/api';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  ordersAwaitingShipment: number;
  lowStockItems: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    ordersAwaitingShipment: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState<Array<{ id: number; name: string; quantity: number }>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { getAllCustomers, getAllTransactions } = await import('../lib/api');
      
      const [items, customers, transactions] = await Promise.all([
        getItems(),
        getAllCustomers().catch(() => []),
        getAllTransactions().catch(() => []),
      ]);
      
      const lowStock = items.filter(item => item.quantity < 5);
      
      setLowStockAlerts(lowStock.map(item => ({
        id: item.furniture_id,
        name: item.name,
        quantity: item.quantity,
      })));

      setStats({
        totalUsers: customers.length,
        totalOrders: transactions.length,
        ordersAwaitingShipment: transactions.filter((t: any) => 
          t.status === 'Pending' || t.status === 'Processing'
        ).length,
        lowStockItems: lowStock.length,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <ShoppingCart className="text-emerald-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Awaiting Shipment</p>
                <p className="text-3xl font-bold text-gray-900">{stats.ordersAwaitingShipment}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Package className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900">{stats.lowStockItems}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={20} />
              Low Stock Alerts
            </h2>
            <div className="space-y-2">
              {lowStockAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-yellow-600" size={18} />
                    <span className="font-medium text-gray-900">
                      {alert.quantity === 0 
                        ? `⚠️ Item "${alert.name}" is out of stock.`
                        : `⚠️ Item "${alert.name}" is low on stock (${alert.quantity} left).`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/inventory"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Management</h3>
            <p className="text-gray-600 text-sm">Manage furniture items and stock levels</p>
          </a>
          <a
            href="/users"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-gray-600 text-sm">View and manage customer accounts</p>
          </a>
          <a
            href="/orders"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Management</h3>
            <p className="text-gray-600 text-sm">Track and manage customer orders</p>
          </a>
        </div>
      </div>
    </div>
  );
}

