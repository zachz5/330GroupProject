import { useState, FormEvent } from 'react';
import { Link } from '../components/Link';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login updates the auth context
      const userData = await login(email, password);
      // Navigate to inventory page for employees, profile page for customers
      if (userData.isEmployee) {
        window.history.pushState({}, '', '/inventory');
      } else {
        window.history.pushState({}, '', '/profile');
      }
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Log in to your Campus ReHome account
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@university.edu"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo Accounts Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Demo Accounts
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2">Demo User Account</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-20">Email:</span>
                  <span className="text-gray-900 font-mono">demo@campusrehome.com</span>
                  <button
                    onClick={() => {
                      setEmail('demo@campusrehome.com');
                      setPassword('demo123');
                    }}
                    className="ml-auto text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 transition-colors"
                  >
                    Fill
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-20">Password:</span>
                  <span className="text-gray-900 font-mono">demo123</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2">Demo Admin Account</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-20">Email:</span>
                  <span className="text-gray-900 font-mono">admin@campusrehome.com</span>
                  <button
                    onClick={() => {
                      setEmail('admin@campusrehome.com');
                      setPassword('admin123');
                    }}
                    className="ml-auto text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 transition-colors"
                  >
                    Fill
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-20">Password:</span>
                  <span className="text-gray-900 font-mono">admin123</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Role: Administrator (has employee privileges)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

