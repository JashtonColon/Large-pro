// All communication with the backend's /api/auth routes lives in this file.
// Pages call these functions and never use fetch() directly, so if the API
// changes, only this file needs updating.
//
// Paths are relative ("/api/..."):
// - In development, Vite forwards /api to the Express server on port 5000
//   (see vite.config.ts), so the browser never makes a cross-origin request.
// - In production, the web app and API should be served from the same domain.

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface MessageResponse {
  message: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

// An error that keeps the HTTP status code (400, 401, 403, 409, 500...)
// so pages can react differently, e.g. 403 = "email not verified yet".
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // fetch() itself only fails when the server can't be reached at all
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // The backend always answers errors as { message: "..." }
    throw new ApiError(response.status, data.message || 'Something went wrong. Please try again.');
  }

  return data as T;
}

// ---------- Auth API calls ----------

export function register(data: RegisterData): Promise<MessageResponse> {
  return post('/api/auth/register', data);
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return post('/api/auth/login', { email, password });
}

export function sendVerification(email: string): Promise<MessageResponse> {
  return post('/api/auth/send-verification', { email });
}

export function verifyEmail(email: string, code: string): Promise<MessageResponse> {
  return post('/api/auth/verify-email', { email, code });
}

export function forgotPassword(email: string): Promise<MessageResponse> {
  return post('/api/auth/forgot-password', { email });
}

export function resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
  return post('/api/auth/reset-password', { token, newPassword });
}

// ---------- Logged-in session (stored in the browser) ----------

export function saveSession(token: string, user: User): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Turns any caught error into a message that is safe to show to the user.
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
