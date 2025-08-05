'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, LoginCredentials, User } from '@/app/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (credentials: LoginCredentials) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = authService.getToken();
      // console.log('🔍 AuthContext - Stored token:', storedToken);
      
      if (storedToken) {
        setToken(storedToken);
        try {
          const userData = await authService.getProfile();
          // console.log('🔍 AuthContext - User data from stored token:', userData);
          // API returns {user: {...}}, so we set the entire object
          setUser(userData);
        } catch (error) {
          console.error('🔍 AuthContext - Auth check failed:', error);
          authService.removeToken();
          setToken(null);
        }
      } else {
        console.log('🔍 AuthContext - No stored token found');
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      // console.log('🔍 AuthContext - Login credentials:', credentials);
      
      const response = await authService.login(credentials);
      // console.log('🔍 AuthContext - Login response:', response);
      
      authService.setToken(response.token);
      setToken(response.token);
      
      // Get user profile after successful login
      const userData = await authService.getProfile();
      // console.log('🔍 AuthContext - User profile data:', userData);
      // API returns {user: {...}}, so we set the entire object
      setUser(userData);
    } catch (error) {
      console.error('🔍 AuthContext - Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.removeToken();
      setToken(null);
      setUser(null);
    }
  };

  const register = async (credentials: LoginCredentials) => {
    try {
      await authService.register(credentials);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    token,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
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