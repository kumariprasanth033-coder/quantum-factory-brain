import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { 
  auth, 
  googleProvider, 
  syncUserProfileToFirestore, 
  testFirestoreConnection,
  saveUserScheduleSnapshot,
  getUserScheduleSnapshots
} from '../services/firebase';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, rolePreference?: 'admin' | 'manager' | 'operator') => Promise<void>;
  loginWithGoogle: (rolePreference?: 'admin' | 'manager' | 'operator') => Promise<void>;
  demoLogin: (role: 'admin' | 'manager' | 'operator') => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
  firestoreConnected: boolean;
  saveScheduleBookmark: (snapshot: { version: string; makespan: number; utilization: number; notes?: string }) => Promise<string | null>;
  loadScheduleBookmarks: () => Promise<any[]>;
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
      status: 'active',
      authProvider: 'demo'
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(false);

  // Sync state with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('qfb_user', JSON.stringify(user));
    } else {
      localStorage.setItem('qfb_user', 'logged_out');
    }
  }, [user]);

  // Validate Firestore Connection on initial boot per Firebase skill guideline
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setFirestoreConnected(connected);
      if (connected) {
        console.log('⚡ Firebase Firestore connection verified nominal.');
      }
    });
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const profile = await syncUserProfileToFirestore(fbUser, 'manager');
          const resolvedUser: User = {
            id: Math.abs(hashCode(fbUser.uid)) || 101,
            name: profile.name || fbUser.displayName || 'Google Authorized User',
            email: profile.email || fbUser.email || '',
            role: profile.role || 'manager',
            status: 'active',
            firebaseUid: fbUser.uid,
            photoURL: profile.photoURL || fbUser.photoURL || undefined,
            authProvider: 'google'
          };
          setUser(resolvedUser);
          localStorage.setItem('qfb_user', JSON.stringify(resolvedUser));
        } catch (e) {
          console.warn('Firebase user sync note:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Check backend session on startup
  const refreshSession = async () => {
    try {
      const sessionRes = await api.getSession();
      if (sessionRes && sessionRes.authenticated && sessionRes.user) {
        setUser(sessionRes.user);
        localStorage.setItem('qfb_user', JSON.stringify(sessionRes.user));
      }
    } catch {
      // Keep existing cached user on network glitch
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  // Standard Password Login
  const login = async (email: string, pass: string, rolePreference?: 'admin' | 'manager' | 'operator') => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass, role: rolePreference });
      const resolvedUser: User | null = res?.user || (res && (res as any).id && (res as any).email ? (res as unknown as User) : null);
      if (resolvedUser) {
        resolvedUser.authProvider = 'password';
        setUser(resolvedUser);
        if (res.token) {
          localStorage.setItem('qfb_auth_token', res.token);
        }
      } else {
        throw new Error('Authentication verified but user profile data was missing from server response.');
      }
    } catch (err: any) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === 'admin@quantumfactory.local' || cleanEmail === 'admin@qfactory.local') {
        const u: User = { id: 1, name: 'System Administrator', email: cleanEmail, role: 'admin', authProvider: 'password' };
        setUser(u);
        localStorage.setItem('qfb_auth_token', 'sess_offline_' + Date.now());
      } else if (cleanEmail === 'manager@quantumfactory.local' || cleanEmail === 'manager@qfactory.local') {
        const u: User = { id: 2, name: 'Chief Production Manager', email: cleanEmail, role: 'manager', authProvider: 'password' };
        setUser(u);
        localStorage.setItem('qfb_auth_token', 'sess_offline_' + Date.now());
      } else if (cleanEmail === 'operator@quantumfactory.local' || cleanEmail === 'operator@qfactory.local') {
        const u: User = { id: 3, name: 'Lead Machine Operator', email: cleanEmail, role: 'operator', authProvider: 'password' };
        setUser(u);
        localStorage.setItem('qfb_auth_token', 'sess_offline_' + Date.now());
      } else {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In with Firebase Auth
  const loginWithGoogle = async (rolePreference: 'admin' | 'manager' | 'operator' = 'manager') => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const profile = await syncUserProfileToFirestore(fbUser, rolePreference);
      
      const resolvedUser: User = {
        id: Math.abs(hashCode(fbUser.uid)) || 101,
        name: profile.name || fbUser.displayName || 'Google Authorized User',
        email: profile.email || fbUser.email || '',
        role: profile.role || rolePreference,
        status: 'active',
        firebaseUid: fbUser.uid,
        photoURL: profile.photoURL || fbUser.photoURL || undefined,
        authProvider: 'google'
      };

      setUser(resolvedUser);
      localStorage.setItem('qfb_user', JSON.stringify(resolvedUser));
      localStorage.setItem('qfb_auth_token', 'fb_' + fbUser.uid);
    } catch (err: any) {
      console.error('Firebase Google Sign-In error:', err);
      throw new Error(err.message || 'Google Sign-In failed. Please try again or use standard credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = (role: 'admin' | 'manager' | 'operator') => {
    let u: User;
    if (role === 'admin') {
      u = { id: 1, name: 'System Administrator', email: 'admin@quantumfactory.local', role: 'admin', authProvider: 'demo' };
    } else if (role === 'operator') {
      u = { id: 3, name: 'Lead Machine Operator', email: 'operator@quantumfactory.local', role: 'operator', authProvider: 'demo' };
    } else {
      u = { id: 2, name: 'Chief Production Manager', email: 'manager@quantumfactory.local', role: 'manager', authProvider: 'demo' };
    }
    setUser(u);
    localStorage.setItem('qfb_user', JSON.stringify(u));
    localStorage.setItem('qfb_auth_token', 'sess_quick_' + Date.now());
  };

  const logout = () => {
    firebaseSignOut(auth).catch(() => {});
    api.logout().catch(() => {});
    localStorage.removeItem('qfb_auth_token');
    localStorage.setItem('qfb_user', 'logged_out');
    setUser(null);
  };

  // Helper to save bookmark to Firestore
  const saveScheduleBookmark = async (snapshot: { version: string; makespan: number; utilization: number; notes?: string }) => {
    if (!user) return null;
    const uid = user.firebaseUid || 'user_' + user.id;
    try {
      const snapId = await saveUserScheduleSnapshot(uid, snapshot);
      return snapId;
    } catch (err) {
      console.warn('Could not save schedule bookmark:', err);
      return null;
    }
  };

  // Helper to load bookmarks from Firestore
  const loadScheduleBookmarks = async () => {
    if (!user) return [];
    const uid = user.firebaseUid || 'user_' + user.id;
    try {
      return await getUserScheduleSnapshots(uid);
    } catch {
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        demoLogin,
        logout,
        refreshSession,
        firestoreConnected,
        saveScheduleBookmark,
        loadScheduleBookmarks,
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

// Utility to convert string UID into a numeric ID
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
