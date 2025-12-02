import { useState, useEffect } from 'react';
import HomePage from '../pages/HomePage';
import BrowsePage from '../pages/BrowsePage';
import ItemPage from '../pages/ItemPage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import InventoryPage from '../pages/InventoryPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import DashboardPage from '../pages/DashboardPage';
import UsersPage from '../pages/UsersPage';
import OrdersPage from '../pages/OrdersPage';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, requireEmployee = false, requireCustomer = false }: { children: JSX.Element; requireEmployee?: boolean; requireCustomer?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You must be logged in to access this page.</p>
            <a href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (requireEmployee && !user.isEmployee) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Only employees can access this page.</p>
            <a href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (requireCustomer && user.isEmployee) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Employees cannot access customer pages.</p>
            <a href="/inventory" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Go to Inventory
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const routes: { [key: string]: JSX.Element } = {
    '/': <HomePage />,
    '/browse': <ProtectedRoute requireCustomer={true}><BrowsePage /></ProtectedRoute>,
    '/item': <ProtectedRoute requireCustomer={true}><ItemPage /></ProtectedRoute>,
    '/register': <RegisterPage />,
    '/login': <LoginPage />,
    '/profile': <ProfilePage />,
    '/inventory': <ProtectedRoute requireEmployee={true}><InventoryPage /></ProtectedRoute>,
    '/dashboard': <ProtectedRoute requireEmployee={true}><DashboardPage /></ProtectedRoute>,
    '/users': <ProtectedRoute requireEmployee={true}><UsersPage /></ProtectedRoute>,
    '/orders': <ProtectedRoute requireEmployee={true}><OrdersPage /></ProtectedRoute>,
    '/cart': <ProtectedRoute requireCustomer={true}><CartPage /></ProtectedRoute>,
    '/checkout': <ProtectedRoute requireCustomer={true}><CheckoutPage /></ProtectedRoute>,
  };

  return routes[currentPath] || routes['/'];
}

