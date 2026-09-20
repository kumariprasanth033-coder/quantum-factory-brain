import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: (role: 'admin' | 'manager' | 'operator') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('qfb_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default active demo user: Chief Production Manager
    return {
      id: 2,
      name: 'Dr. Sarah Mitchell',
      email: 'manager@qfactory.local',
      role: 'manager',
      status: 'active'
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('qfb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qfb_user');
    }
  }, [user]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      setUser(res.user);
    } catch (err: any) {
      // Fallback for offline demo credentials
      if (email === 'admin@qfactory.local') {
        setUser({ id: 1, name: 'Chief Systems Administrator', email, role: 'admin' });
      } else if (email === 'manager@qfactory.local') {
        setUser({ id: 2, name: 'Dr. Sarah Mitchell', email, role: 'manager' });
      } else if (email === 'operator@qfactory.local') {
        setUser({ id: 3, name: 'Lead CNC Operator', email, role: 'operator' });
      } else {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = (role: 'admin' | 'manager' | 'operator') => {
    if (role === 'admin') {
      setUser({ id: 1, name: 'Chief Systems Administrator', email: 'admin@qfactory.local', role: 'admin' });
    } else if (role === 'operator') {
      setUser({ id: 3, name: 'Lead CNC Operator', email: 'operator@qfactory.local', role: 'operator' });
    } else {
      setUser({ id: 2, name: 'Dr. Sarah Mitchell', email: 'manager@qfactory.local', role: 'manager' });
    }
  };

  const logout = () => {
    api.logout().catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
