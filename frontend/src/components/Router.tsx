import { useState, useEffect } from 'react';
import HomePage from '../pages/HomePage';
import BrowsePage from '../pages/BrowsePage';
import ItemPage from '../pages/ItemPage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import InventoryPage from '../pages/InventoryPage';
import { useAuth } from '../contexts/AuthContext';

function ProtectedInventoryRoute() {
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

  if (!user.isEmployee) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Only employees can access the inventory page.</p>
            <a href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <InventoryPage />;
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
    '/browse': <BrowsePage />,
    '/item': <ItemPage />,
    '/register': <RegisterPage />,
    '/login': <LoginPage />,
    '/profile': <ProfilePage />,
    '/inventory': <ProtectedInventoryRoute />,
  };

  return routes[currentPath] || routes['/'];
}

