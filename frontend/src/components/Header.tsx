import { Home, User, LogOut, ShoppingCart } from 'lucide-react';
import { Link } from './Link';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

  const handleLogout = () => {
    logout();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Home className="text-emerald-600" size={28} />
            <span className="text-xl font-bold text-gray-900">Campus ReHome</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              Home
            </Link>
            {!user?.isEmployee && (
              <Link to="/browse" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                Browse
              </Link>
            )}
            {user?.isEmployee && (
              <>
                <Link to="/inventory" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                  Inventory
                </Link>
                <Link to="/dashboard" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/users" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                  Users
                </Link>
                <Link to="/orders" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                  Orders
                </Link>
              </>
            )}
            {user && !user.isEmployee && (
              <Link to="/profile" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                Profile
              </Link>
            )}
            {!user?.isEmployee && (
              <Link to="/cart" className="relative text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                <ShoppingCart size={20} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-2 text-gray-700">
                  <User size={18} />
                  <span className="font-medium">
                    {user.first_name || user.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  <LogOut size={18} />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {!user?.isEmployee && (
            <Link
              to="/cart"
              className="md:hidden relative p-2 text-gray-700 hover:text-emerald-600"
            >
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

