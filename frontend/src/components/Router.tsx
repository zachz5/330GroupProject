import { useState, useEffect } from 'react';
import HomePage from '../pages/HomePage';
import BrowsePage from '../pages/BrowsePage';
import ItemPage from '../pages/ItemPage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import InventoryPage from '../pages/InventoryPage';

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
    '/inventory': <InventoryPage />,
  };

  return routes[currentPath] || routes['/'];
}

