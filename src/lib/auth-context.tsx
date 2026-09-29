'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser } from '@/types';
import { ApiService } from './api-service';

interface AuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = ApiService.token;
      if (token) {
        try {
          const res = await ApiService.get('/admin/me');
          if (res.success && res.data) {
            const user = res.data;
            user.uid = user.id || user.uid;
            setAdminUser(user);
          } else {
            setAdminUser(null);
            localStorage.removeItem('admin_token');
          }
        } catch (error) {
          console.error('Error verifying admin token:', error);
          setAdminUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = (token: string, user: AdminUser) => {
    localStorage.setItem('admin_token', token);
    setAdminUser(user);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        loading,
        isAdmin: !!adminUser && (adminUser.role as string) !== 'student',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
