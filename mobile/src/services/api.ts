import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * Backend sunucusunun adresi.
 *
 * ÖNEMLİ: Railway (veya seçtiğiniz sunucu servisi) üzerinden backend'i
 * yayına aldıktan sonra, size verilen adresi (örn. https://xxx.up.railway.app)
 * aşağıdaki değerin yerine yazmanız yeterlidir.
 */
export const API_BASE_URL = 'https://optiksinav-backend.onrender.com/api';

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

// ─── Beni Hatırla ───────────────────────────────────────────────────────────
const REMEMBER_KEY = 'remember_credentials';

export interface RememberedCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export async function saveRememberedCredentials(creds: RememberedCredentials) {
  await SecureStore.setItemAsync(REMEMBER_KEY, JSON.stringify(creds));
}

export async function getRememberedCredentials(): Promise<RememberedCredentials | null> {
  const raw = await SecureStore.getItemAsync(REMEMBER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearRememberedCredentials() {
  await SecureStore.deleteItemAsync(REMEMBER_KEY);
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
  profileImage?: string | null;
  accountType?: 'teacher' | 'kurum' | 'rehberlik' | 'egitim_kocu';
  mainBranch?: string | null;
  secondaryBranch?: string | null;
  institutionLevels?: string | null;
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

export async function resendVerificationEmail(email: string, role: UserRole) {
  const endpoint = role === 'teacher' ? '/auth/resend-verification' : '/student-auth/resend-verification';
  const { data } = await api.post<{ message: string }>(endpoint, { email });
  return data;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  accountType: 'teacher' | 'kurum';
  mainBranch?: string;
  secondaryBranch?: string;
  institutionLevels?: string[];
}

export async function registerRequest(input: RegisterInput) {
  const { data } = await api.post<{ message: string; requiresEmailVerification: boolean }>(
    '/auth/register',
    { ...input, role: 'teacher' }
  );
  return data;
}

export interface StudentRegisterInput {
  email: string;
  password: string;
  fullName: string;
  studentNo?: string;
  teacherEmail?: string;
  schoolCode?: string;
  classId?: number;
}

export async function studentRegisterRequest(input: StudentRegisterInput) {
  const { data } = await api.post<{ message: string; studentId: number }>(
    '/student-auth/register',
    input
  );
  return data;
}

export interface SchoolLookupResult {
  schoolId: number;
  schoolName: string;
  classes: { id: number; name: string }[];
}

export async function lookupSchoolByCode(code: string) {
  const { data } = await api.get<SchoolLookupResult>(
    `/student-auth/school-lookup/${encodeURIComponent(code.trim().toUpperCase())}`
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

// ─── Profil ───────────────────────────────────────────────────────────────────

export async function getMyProfile(role: UserRole) {
  const endpoint = role === 'teacher' ? '/auth/me' : '/students/me';
  const { data } = await api.get<AuthUser>(endpoint);
  return data;
}

export async function updateMyProfile(
  role: UserRole,
  input: { fullName?: string; profileImage?: string }
) {
  const endpoint = role === 'teacher' ? '/auth/profile' : '/students/me/profile';
  const { data } = await api.put<AuthUser>(endpoint, input);
  return data;
}

export async function updateMyPassword(
  role: UserRole,
  input: { currentPassword: string; newPassword: string }
) {
  const endpoint = role === 'teacher' ? '/auth/password' : '/students/me/password';
  const { data } = await api.put<{ message: string }>(endpoint, input);
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

export interface LearningOutcome {
  id: number;
  subjectId: number;
  code: string;
  description: string;
  gradeLevel: string | null;
}

export async function searchLearningOutcomes(subjectId: number, query: string, gradeLevel?: string) {
  let qs = `q=${encodeURIComponent(query)}`;
  if (gradeLevel) qs += `&gradeLevel=${encodeURIComponent(gradeLevel)}`;
  const { data } = await api.get<LearningOutcome[]>(
    `/subjects/${subjectId}/learning-outcomes/search?${qs}`
  );
  return data;
}

// ─── Okullar & Sınıflar ─────────────────────────────────────────────────────

export interface School {
  id: number;
  name: string;
  joinCode: string | null;
}

export interface SchoolClass {
  id: number;
  name: string;
  gradeLevel: string | null;
  schoolId: number;
}

export async function getSchools() {
  const { data } = await api.get<School[]>('/schools');
  return data;
}

export async function getClassesBySchool(schoolId: number) {
  const { data } = await api.get<SchoolClass[]>(`/schools/${schoolId}/classes`);
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

export interface ExamQuestionInput {
  questionNumber: number;
  subjectId?: number;
  learningOutcomeId?: number;
  customOutcomeText?: string;
  correctAnswer: string;
}

export interface CreateExamInput {
  title: string;
  subjectId?: number;
  examDate: string; // ISO tarih (YYYY-MM-DD)
  totalQuestions: number;
  correctAnswers: Record<string, string>;
  optionCount: 3 | 4 | 5;
  negativeMarking: boolean;
  examType?: 'TYT' | 'AYT' | 'LGS' | 'custom';
  relatedExamId?: number;
  totalScore?: number;
  classIds?: number[];
  questions?: ExamQuestionInput[];
}

export async function getExams() {
  const { data } = await api.get<Exam[]>('/exams');
  return data;
}

export interface ExamDetail extends Exam {
  examType?: 'TYT' | 'AYT' | 'LGS' | 'custom' | null;
  relatedExamId?: number | null;
  totalScore?: number;
  questions: ExamQuestionInput[];
  classIds: number[];
}

export async function getExamById(id: number) {
  const { data } = await api.get<ExamDetail>(`/exams/${id}`);
  return data;
}

export async function createExam(input: CreateExamInput) {
  const { data } = await api.post<Exam>('/exams', input);
  return data;
}

export async function updateExam(id: number, input: Partial<CreateExamInput>) {
  const { data } = await api.put<Exam>(`/exams/${id}`, input);
  return data;
}
