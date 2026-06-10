/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

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

// ── Cognito Configuration ──────────────────────────────────────────────────────
const REGION = 'ap-southeast-2';
const CLIENT_ID = '182uf74po0mj65nf34cve61i07';
const USER_POOL_ID = 'ap-southeast-2_BowIQ4Xb9';

// ── Helper: generate Mock JWT Token (1 hour validity) ───────────────────────
function generateMockJwt(name: string, email: string, role: string, expiresInSec = 3600): string {
  const header = { alg: "HS256", typ: "JWT" };
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    sub: `mock-user-${Math.random().toString(36).substring(2, 9)}`,
    name: name,
    email: email,
    "cognito:groups": [role],
    email_verified: true,
    auth_time: nowSec,
    iss: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
    aud: CLIENT_ID,
    exp: nowSec + expiresInSec,
    iat: nowSec
  };
  
  const base64UrlEncode = (obj: Record<string, unknown>) => {
    const str = JSON.stringify(obj);
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };
  
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.mock_signature`;
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
  const login = useCallback(async (name: string, email: string, role: UserRole, otp: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      if (API_BASE_URL.includes('your-api-id')) {
        throw new Error('PLACEHOLDER_URL');
      }

      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otpEntered: otp,
          name,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setIsLoading(false);
        return { success: false, message: data.message || 'Verification failed.' };
      }

      const { token, user: backendUser } = data;
      const expiresInSec = 3600; // 1 Hour
      const expiresAt = Date.now() + expiresInSec * 1000;

      const tokenSet: TokenSet = {
        idToken: token,
        accessToken: token,
        refreshToken: 'refresh-token-placeholder',
        expiresAt,
      };

      setUser(backendUser);
      setTokens(tokenSet);
      localStorage.setItem('elms_session', JSON.stringify({ user: backendUser, tokens: tokenSet }));

      setIsLoading(false);
      return { success: true, message: 'Authenticated successfully.' };
    } catch (err: unknown) {
      if (err instanceof Error && (err.message === 'PLACEHOLDER_URL' || err.name === 'TypeError')) {
        console.warn('AWS API Gateway not configured or unreachable. Logging in with mock sandbox token.');
        
        // Mock Sandbox login fallback
        const mockToken = generateMockJwt(name, email, role);
        const expiresInSec = 3600; // 1 Hour
        const expiresAt = Date.now() + expiresInSec * 1000;

        const tokenSet: TokenSet = {
          idToken: mockToken,
          accessToken: mockToken,
          refreshToken: 'mock-refresh-token-1hr-expiry',
          expiresAt,
        };

        const userObj: User = {
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
        return { success: true, message: 'Authenticated successfully via local fallback.' };
      }

      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Authentication failed.';
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
