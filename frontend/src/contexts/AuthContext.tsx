import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, login as loginAPI, register as registerAPI, registerEmployee as registerEmployeeAPI, updateProfile as updateProfileAPI } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, first_name?: string, last_name?: string, phone?: string, address?: string) => Promise<void>;
  registerEmployee: (email: string, password: string, first_name?: string, last_name?: string, phone?: string, employee_code?: string) => Promise<void>;
  updateProfile: (updates: Partial<Omit<User, 'customer_id' | 'email' | 'date_registered'>>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const userData = await loginAPI(email, password);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const register = async (
    email: string,
    password: string,
    first_name?: string,
    last_name?: string,
    phone?: string,
    address?: string
  ) => {
    const userData = await registerAPI(email, password, first_name, last_name, phone, address);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const registerEmployee = async (
    email: string,
    password: string,
    first_name?: string,
    last_name?: string,
    phone?: string,
    employee_code?: string
  ) => {
    const userData = await registerEmployeeAPI(email, password, first_name, last_name, phone, employee_code);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateProfile = async (updates: Partial<Omit<User, 'customer_id' | 'email' | 'date_registered'>>) => {
    if (!user) throw new Error('No user logged in');
    if (!user.customer_id) throw new Error('Invalid user: missing customer_id');
    // Include email in the update request for verification
    const updatedUser = await updateProfileAPI(user.customer_id, { ...updates, email: user.email });
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerEmployee, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

