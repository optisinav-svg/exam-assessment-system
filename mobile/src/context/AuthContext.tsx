import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuthUser,
  UserRole,
  getToken,
  saveToken,
  clearToken,
  saveUser,
  getStoredUser,
  loginRequest,
  registerRequest,
  RegisterInput,
} from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean; // uygulama açılırken kayıtlı oturum kontrol ediliyor mu
  isSubmitting: boolean; // giriş/kayıt isteği gönderiliyor mu
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Kullanıcı tercihi: uygulama her açıldığında giriş ekranı gösterilsin,
    // önceki oturum otomatik açılmasın. "Beni Hatırla" işaretliyse
    // LoginScreen, kayıtlı e-posta/şifreyi kendisi doldurur (bkz. api.ts).
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole = 'teacher') => {
    setIsSubmitting(true);
    try {
      const data = await loginRequest(email, password, role);
      await saveToken(data.token);
      await saveUser(data.user);
      setUser(data.user);
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (input: RegisterInput) => {
    setIsSubmitting(true);
    try {
      // Artık kayıt sonrası otomatik giriş yapılmıyor — e-posta onayı gerekiyor.
      await registerRequest(input);
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
