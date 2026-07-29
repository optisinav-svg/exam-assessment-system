import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * Backend sunucusunun adresi.
 *
 * ÖNEMLİ: Railway (veya seçtiğiniz sunucu servisi) üzerinden backend'i
 * yayına aldıktan sonra, size verilen adresi (örn. https://xxx.up.railway.app)
 * aşağıdaki değerin yerine yazmanız yeterlidir.
 */
export const API_BASE_URL = 'https://REPLACE_WITH_YOUR_BACKEND_URL/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Her istekte, cihazda saklanan oturum anahtarını (token) otomatik ekle
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function saveUser(user: AuthUser) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function registerRequest(email: string, password: string, fullName: string) {
  const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/register', {
    email,
    password,
    fullName,
    role: 'teacher',
  });
  return data;
}
