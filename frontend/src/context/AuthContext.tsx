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
  login: (name: string, email: string, role: UserRole, otp: string) => Promise<{ success: boolean; message: string }>;
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
      // ignore JSON parse or localStorage errors
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
      // ignore JSON parse or localStorage errors
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('elms_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session.tokens && session.tokens.expiresAt > Date.now()) {
          return Math.max(0, Math.floor((session.tokens.expiresAt - Date.now()) / 1000));
        }
      }
    } catch {
      // ignore JSON parse or localStorage errors
    }
    return null;
  });

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

  // ── Passwordless Login using AWS API Gateway verify-otp ──────────────────────────
  const VERIFY_OTP_URL = '/api/verify-otp';

  const login = useCallback(async (name: string, email: string, role: UserRole, otp: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const response = await fetch(VERIFY_OTP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      if (!response.ok) {
        setIsLoading(false);
        let message = 'Verification failed.';
        try {
          const data = await response.json();
          message = data.message || message;
        } catch { /* response may not be JSON */ }
        return { success: false, message };
      }

      // Try to parse response data (token, user) if available
      let token = '';
      let backendUser = null;
      try {
        const data = await response.json();
        token = data.token || '';
        backendUser = data.user || null;
      } catch { /* Lambda may return empty/non-JSON body on success */ }

      const expiresInSec = 3600; // 1 Hour
      const expiresAt = Date.now() + expiresInSec * 1000;

      const tokenSet: TokenSet = {
        idToken: token || `session-${Date.now()}`,
        accessToken: token || `session-${Date.now()}`,
        refreshToken: 'refresh-token-placeholder',
        expiresAt,
      };

      // If backend returns a user object, use it; otherwise construct from input
      const userObj: User = backendUser || {
        id: `cognito-${Date.now()}`,
        name: name,
        email: email,
        role: role,
        department: role === 'HR' ? 'People Operations' : role === 'Manager' ? 'Management' : 'Engineering',
        title: role === 'Employee' ? 'Software Engineer' : role === 'Manager' ? 'Team Lead' : 'HR Administrator',
      };

      setUser(userObj);
      setTokens(tokenSet);
      localStorage.setItem('elms_session', JSON.stringify({ user: userObj, tokens: tokenSet }));

      setIsLoading(false);
      return { success: true, message: 'Authenticated successfully.' };
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      console.error('OTP verification failed:', err);
      return { success: false, message };
    }
  }, []);



  return (
    <AuthContext.Provider value={{ user, tokens, login, logout, isLoading, tokenExpiresIn }}>
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
