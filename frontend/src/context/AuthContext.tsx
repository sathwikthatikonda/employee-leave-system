/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand } from "@aws-sdk/client-cognito-identity-provider";
import { COGNITO_REGION, COGNITO_CLIENT_ID } from '../config';

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
  requestOtp: (name: string, email: string, role: UserRole) => Promise<{ success: boolean; message: string; session?: string }>;
  verifyOtp: (name: string, email: string, role: UserRole, otp: string, session: string) => Promise<{ success: boolean; message: string }>;
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

  // ── Request OTP via Cognito InitiateAuth ──────────────────────────
  const requestOtp = useCallback(async (name: string, email: string, role: UserRole) => {
    setIsLoading(true);
    
    // DEV MODE BYPASS
    if (!COGNITO_CLIENT_ID || import.meta.env.DEV) {
      setIsLoading(false);
      return { success: true, message: 'DEV MODE: OTP sent', session: 'dev-session-id' };
    }

    try {
      const cognitoClient = new CognitoIdentityProviderClient({ region: COGNITO_REGION });
      const command = new InitiateAuthCommand({
        AuthFlow: 'CUSTOM_AUTH',
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
        },
      });
      const response = await cognitoClient.send(command);
      setIsLoading(false);
      return { success: true, message: 'OTP sent successfully', session: response.Session };
    } catch (err: any) {
      setIsLoading(false);
      console.error('Request OTP failed:', err);
      if (err.name === 'UserNotFoundException') {
         return { success: false, message: 'User not found in directory. Please contact HR to be provisioned.' };
      }
      return { success: false, message: err.message || 'Failed to send OTP.' };
    }
  }, []);

  // ── Verify OTP via Cognito RespondToAuthChallenge ──────────────────────────
  const verifyOtp = useCallback(async (name: string, email: string, role: UserRole, otp: string, session: string) => {
    setIsLoading(true);
    
    // DEV MODE BYPASS
    if (!COGNITO_CLIENT_ID || import.meta.env.DEV) {
      const expiresInSec = 3600;
      const expiresAt = Date.now() + expiresInSec * 1000;
      const tokenSet: TokenSet = {
        idToken: `dev-session-${Date.now()}`,
        accessToken: `dev-session-${Date.now()}`,
        refreshToken: 'refresh-token-placeholder',
        expiresAt,
      };
      const userObj: User = {
        id: `dev-${Date.now()}`,
        name: name || email.split('@')[0],
        email: email,
        role: role,
        department: role === 'HR' ? 'People Operations' : role === 'Manager' ? 'Management' : 'Engineering',
        title: role === 'Employee' ? 'Software Engineer' : role === 'Manager' ? 'Team Lead' : 'HR Administrator',
      };
      setUser(userObj);
      setTokens(tokenSet);
      localStorage.setItem('elms_session', JSON.stringify({ user: userObj, tokens: tokenSet }));
      setIsLoading(false);
      return { success: true, message: 'Authenticated successfully (DEV MODE).' };
    }

    try {
      const cognitoClient = new CognitoIdentityProviderClient({ region: COGNITO_REGION });
      const command = new RespondToAuthChallengeCommand({
        ChallengeName: 'CUSTOM_CHALLENGE',
        ClientId: COGNITO_CLIENT_ID,
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          ANSWER: otp,
        },
      });

      const response = await cognitoClient.send(command);
      
      if (response.AuthenticationResult) {
        const expiresInSec = response.AuthenticationResult.ExpiresIn || 3600;
        const expiresAt = Date.now() + expiresInSec * 1000;

        const tokenSet: TokenSet = {
          idToken: response.AuthenticationResult.IdToken || '',
          accessToken: response.AuthenticationResult.AccessToken || '',
          refreshToken: response.AuthenticationResult.RefreshToken || '',
          expiresAt,
        };

        const userObj: User = {
          id: email,
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
      } else {
        setIsLoading(false);
        return { success: false, message: 'Invalid OTP or challenge failed.' };
      }

    } catch (err: any) {
      setIsLoading(false);
      console.error('Verify OTP failed:', err);
      return { success: false, message: err.message || 'Authentication failed.' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, tokens, requestOtp, verifyOtp, logout, isLoading, tokenExpiresIn }}>
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
