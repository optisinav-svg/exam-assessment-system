import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuthUser,
  getToken,
  saveToken,
  clearToken,
  saveUser,
  getStoredUser,
  loginRequest,
  registerRequest,
} from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean; // uygulama açılırken kayıtlı oturum kontrol ediliyor mu
  isSubmitting: boolean; // giriş/kayıt isteği gönderiliyor mu
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Uygulama açıldığında, cihazda daha önce kaydedilmiş bir oturum var mı bak.
    // NOT: Cihazda ekran kilidi/güvenli depolama yoksa SecureStore hata verebilir,
    // bu durumda çökme yerine "oturum yok" kabul edip devam ediyoruz.
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.warn('Kayıtlı oturum okunamadı:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const data = await loginRequest(email, password);
      await saveToken(data.token);
      await saveUser(data.user);
      setUser(data.user);
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setIsSubmitting(true);
    try {
      const data = await registerRequest(email, password, fullName);
      await saveToken(data.token);
      await saveUser(data.user);
      setUser(data.user);
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await clearToken();
    } catch (error) {
      console.warn('Oturum temizlenemedi:', error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isSubmitting, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  }
  return ctx;
}
