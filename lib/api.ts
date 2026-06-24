const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

// ── Types ──────────────────────────────────────────────────────────

export interface MobileUser {
  id: number;
  full_name: string;
  phone_number: string | null;
  age: number | null;
  gender: string | null;
}

export interface ProfileResponse {
  user: MobileUser;
  subscriptions: Record<string, string | null>;
  freeUsage: { russian: number; english: number; turkish: number };
}

export interface ChatResponse {
  reply: string;
  freeLeft: number | null;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  pendingPayments: number;
  confirmedToday: number;
}

export interface MobilePayment {
  id: number;
  user_id: number;
  user_name: string;
  pay_type: string;
  language: string | null;
  level: string | null;
  amount_uzs: number;
  status: string;
  receipt_image: string | null;
  created_at: string;
}

// ── Auth / Profile ─────────────────────────────────────────────────

export async function apiRegister(
  userId: number, fullName: string, phone: string, age: number, gender: string
): Promise<MobileUser> {
  const d = await req<{ user: MobileUser }>("/api/mobile/register", {
    method: "POST",
    body: JSON.stringify({ userId, fullName, phone, age, gender }),
  });
  return d.user;
}

export async function apiGetProfile(userId: number): Promise<ProfileResponse> {
  return req<ProfileResponse>(`/api/mobile/profile/${userId}`);
}

// ── Chat ───────────────────────────────────────────────────────────

export async function apiChat(
  userId: number,
  language: string,
  personality: string,
  message: string,
  history: { role: string; content: string }[]
): Promise<ChatResponse> {
  return req<ChatResponse>("/api/mobile/chat", {
    method: "POST",
    body: JSON.stringify({ userId, language, personality, message, history }),
  });
}

// ── Payment ────────────────────────────────────────────────────────

export async function apiSubmitPayment(
  userId: number,
  userName: string,
  payType: string,
  language: string | null,
  level: string | null,
  receiptBase64: string
): Promise<{ paymentId: number }> {
  return req<{ paymentId: number }>("/api/mobile/payment/submit", {
    method: "POST",
    body: JSON.stringify({ userId, userName, payType, language, level, receiptBase64 }),
  });
}

export async function apiGetPaymentInfo(): Promise<{
  cardNumber: string;
  prices: { tutor: number; ielts: number; cert: number };
  adminUsername: string;
}> {
  return req("/api/mobile/payment/info");
}

// ── Admin ──────────────────────────────────────────────────────────

function adminHeaders(key: string): HeadersInit {
  return { Authorization: `Bearer ${key}` };
}

export async function apiAdminStats(key: string): Promise<{ stats: AdminStats }> {
  return req<{ stats: AdminStats }>("/api/mobile/admin/stats", {
    headers: adminHeaders(key),
  });
}

export async function apiAdminPayments(key: string): Promise<{ payments: MobilePayment[] }> {
  return req<{ payments: MobilePayment[] }>("/api/mobile/admin/payments", {
    headers: adminHeaders(key),
  });
}

export async function apiConfirmPayment(paymentId: number, key: string): Promise<void> {
  await req(`/api/mobile/admin/confirm/${paymentId}`, {
    method: "POST",
    headers: adminHeaders(key),
  });
}

export async function apiRejectPayment(paymentId: number, key: string): Promise<void> {
  await req(`/api/mobile/admin/reject/${paymentId}`, {
    method: "POST",
    headers: adminHeaders(key),
    body: JSON.stringify({}),
  });
}

// ── Exams ──────────────────────────────────────────────────────────

export async function apiGetIeltsExam(): Promise<{ exam: unknown }> {
  return req("/api/mobile/exam/ielts");
}

export async function apiGetCertExam(level: string): Promise<{ exam: unknown }> {
  return req(`/api/mobile/exam/cert/${level}`);
}

export async function apiSubmitExam(
  userId: number,
  examType: string,
  level: string | null,
  answers: Record<string, string>
): Promise<unknown> {
  return req("/api/mobile/exam/submit", {
    method: "POST",
    body: JSON.stringify({ userId, examType, level, answers }),
  });
}
