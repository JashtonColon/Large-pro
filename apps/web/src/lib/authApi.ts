// ===== Types: our API contract in TypeScript =====
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Flip to false once the real backend endpoints work
const USE_MOCK = true;

// An error that remembers the HTTP status code (400, 401, 409...)
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ===== Real backend (used when USE_MOCK = false) =====
async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'Something went wrong');
  }
  return data as T;
}

// ===== Mock backend (DEMO ONLY: fake users saved in this browser) =====
interface MockUser extends User {
  password: string; // plaintext ONLY because this is fake demo data
}

const MOCK_KEY = 'mock_users';

function loadMockUsers(): MockUser[] {
  return JSON.parse(localStorage.getItem(MOCK_KEY) || '[]');
}

function saveMockUsers(users: MockUser[]): void {
  localStorage.setItem(MOCK_KEY, JSON.stringify(users));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mockRegister(data: RegisterData): Promise<{ message: string }> {
  await delay(500); // pretend the network takes half a second
  const users = loadMockUsers();
  const email = data.email.trim().toLowerCase();

  if (users.some((u) => u.email === email)) {
    throw new ApiError(409, 'Email already registered');
  }

  users.push({
    id: crypto.randomUUID(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email,
    password: data.password,
  });
  saveMockUsers(users);
  return { message: 'Account created! You can now log in.' };
}

async function mockLogin(email: string, password: string): Promise<LoginResponse> {
  await delay(500);
  const user = loadMockUsers().find(
    (u) => u.email === email.trim().toLowerCase() && u.password === password,
  );

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return {
    token: 'mock-token-' + user.id,
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
  };
}

// ===== What the pages import =====
export function register(data: RegisterData): Promise<{ message: string }> {
  return USE_MOCK ? mockRegister(data) : post('/api/auth/register', data);
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return USE_MOCK ? mockLogin(email, password) : post('/api/auth/login', { email, password });
}