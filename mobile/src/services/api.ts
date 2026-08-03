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

export type UserRole = 'teacher' | 'student';

export async function loginRequest(email: string, password: string, role: UserRole = 'teacher') {
  const endpoint = role === 'teacher' ? '/auth/login' : '/student-auth/login';
  const { data } = await api.post<{ token: string; user: AuthUser }>(endpoint, {
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

export interface StudentRegisterInput {
  email: string;
  password: string;
  fullName: string;
  studentNo?: string;
  teacherEmail: string;
}

export async function studentRegisterRequest(input: StudentRegisterInput) {
  const { data } = await api.post<{ message: string; studentId: number }>(
    '/student-auth/register',
    input
  );
  return data;
}

export interface PendingStudent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  studentNo: string | null;
  createdAt: string;
}

export async function getPendingStudents() {
  const { data } = await api.get<PendingStudent[]>('/students/pending');
  return data;
}

export async function approveStudent(id: number, options?: { classId?: number; studentNo?: string }) {
  const { data } = await api.post(`/students/${id}/approve`, options || {});
  return data;
}

export async function rejectStudent(id: number) {
  const { data } = await api.post(`/students/${id}/reject`);
  return data;
}

// ─── Dersler ──────────────────────────────────────────────────────────────────

export interface Subject {
  id: number;
  name: string;
  code: string | null;
  color: string | null;
}

export async function getSubjects() {
  const { data } = await api.get<Subject[]>('/subjects');
  return data;
}

export async function createSubject(name: string) {
  const { data } = await api.post<Subject>('/subjects', { name });
  return data;
}

// ─── Sınavlar ─────────────────────────────────────────────────────────────────

export interface Exam {
  id: number;
  title: string;
  subjectId: number | null;
  examDate: string;
  duration: number | null;
  totalQuestions: number;
  correctAnswers: Record<string, string>;
  optionCount: number;
  negativeMarking: boolean;
  status: string;
  createdAt: string;
}

export interface CreateExamInput {
  title: string;
  subjectId?: number;
  examDate: string; // ISO tarih (YYYY-MM-DD)
  totalQuestions: number;
  correctAnswers: Record<string, string>;
  optionCount: 3 | 4 | 5;
  negativeMarking: boolean;
}

export async function getExams() {
  const { data } = await api.get<Exam[]>('/exams');
  return data;
}

export async function createExam(input: CreateExamInput) {
  const { data } = await api.post<Exam>('/exams', input);
  return data;
}
