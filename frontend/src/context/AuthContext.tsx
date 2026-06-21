/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'Employee' | 'Manager' | 'HR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  title: string;
  avatar?: string;
  managerId?: string;
}

interface TokenSet {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (ms)
}

interface AuthContextType {
  user: User | null;
  tokens: TokenSet | null;
  signIn: (name: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  tokenExpiresIn: number | null; // seconds remaining
}

// ── Context ────────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<TokenSet | null>(() => {
    try {
      const stored = localStorage.getItem('elms_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session.tokens && session.tokens.expiresAt > Date.now()) {
          return session.tokens;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('elms_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session.tokens && session.tokens.expiresAt > Date.now()) {
          return session.user;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number | null>(null);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    setTokenExpiresIn(null);
    localStorage.removeItem('elms_session');
  }, []);

  // ── Token countdown timer (auto-logout on expiry) ────────────────────────────
  useEffect(() => {
    if (!tokens) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((tokens.expiresAt - Date.now()) / 1000));
      setTokenExpiresIn(remaining);
      if (remaining <= 0) {
        logout();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tokens, logout]);

  // ── Unified Simple Sign-in ───────────────────────────────────────
  const signIn = useCallback(async (name: string, role: UserRole) => {
    setIsLoading(true);
    
    // Simulate minor API delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 600));

    const expiresInSec = 3600;
    const expiresAt = Date.now() + expiresInSec * 1000;
    const tokenSet: TokenSet = {
      idToken: `session-${Date.now()}`,
      accessToken: `session-${Date.now()}`,
      refreshToken: 'refresh-token-placeholder',
      expiresAt,
    };

    const userObj: User = {
      id: `usr-${Date.now()}`,
      name: name,
      email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@company.com`,
      role: role,
      department: role === 'HR' ? 'People Operations' : role === 'Manager' ? 'Management' : 'Engineering',
      title: role === 'Employee' ? 'Software Engineer' : role === 'Manager' ? 'Team Lead' : 'HR Administrator',
    };

    setUser(userObj);
    setTokens(tokenSet);
    localStorage.setItem('elms_session', JSON.stringify({ user: userObj, tokens: tokenSet }));
    setIsLoading(false);
    return { success: true, message: 'Authenticated successfully.' };
  }, []);

  return (
    <AuthContext.Provider value={{ user, tokens, signIn, logout, isLoading, tokenExpiresIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
