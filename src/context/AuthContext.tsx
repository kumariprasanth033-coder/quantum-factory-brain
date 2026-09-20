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
      if (saved === 'null' || saved === 'logged_out') return null;
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default active authorized manager for rapid inspection
    return {
      id: 2,
      name: 'Chief Production Manager',
      email: 'manager@quantumfactory.local',
      role: 'manager',
      status: 'active'
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('qfb_user', JSON.stringify(user));
    } else {
      localStorage.setItem('qfb_user', 'logged_out');
    }
  }, [user]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      setUser(res.user);
    } catch (err: any) {
      // Fallback for offline demo credentials
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === 'admin@quantumfactory.local' || cleanEmail === 'admin@qfactory.local') {
        setUser({ id: 1, name: 'System Administrator', email: cleanEmail, role: 'admin' });
      } else if (cleanEmail === 'manager@quantumfactory.local' || cleanEmail === 'manager@qfactory.local') {
        setUser({ id: 2, name: 'Chief Production Manager', email: cleanEmail, role: 'manager' });
      } else if (cleanEmail === 'operator@quantumfactory.local' || cleanEmail === 'operator@qfactory.local') {
        setUser({ id: 3, name: 'Lead Machine Operator', email: cleanEmail, role: 'operator' });
      } else {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = (role: 'admin' | 'manager' | 'operator') => {
    if (role === 'admin') {
      setUser({ id: 1, name: 'System Administrator', email: 'admin@quantumfactory.local', role: 'admin' });
    } else if (role === 'operator') {
      setUser({ id: 3, name: 'Lead Machine Operator', email: 'operator@quantumfactory.local', role: 'operator' });
    } else {
      setUser({ id: 2, name: 'Chief Production Manager', email: 'manager@quantumfactory.local', role: 'manager' });
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
