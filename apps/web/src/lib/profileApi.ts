// Talks to /api/profile. Every call needs the login token, and the backend
// only accepts users whose email is already verified.

import { ApiError, getToken } from './authApi';

export interface AvailabilitySlot {
  dayOfWeek: number;    // Sunday = 0 ... Saturday = 6
  startMinute: number;  // minutes after midnight (540 = 9:00 AM)
  endMinute: number;
}

export interface Profile {
  major: string;
  courses: string[];    // e.g. ["COP4331", "CDA3103"]
  availability: AvailabilitySlot[];
  gender?: string;
}

async function request<T>(method: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/profile', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken() ?? ''}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.message || 'Something went wrong. Please try again.');
  }
  return data as T;
}

// Returns null when the student hasn't set up a profile yet
export async function getProfile(): Promise<Profile | null> {
  const data = await request<{ profile: Profile | null }>('GET');
  return data.profile?.major ? data.profile : null;
}

// First time: POST creates the profile. If one already exists (409), PATCH updates it.
export async function saveProfile(profile: Profile): Promise<Profile> {
  try {
    return (await request<{ profile: Profile }>('POST', profile)).profile;
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return (await request<{ profile: Profile }>('PATCH', profile)).profile;
    }
    throw error;
  }
}

// Change only some fields, e.g. updateProfile({ courses: [...] })
export async function updateProfile(changes: Partial<Profile>): Promise<Profile> {
  return (await request<{ profile: Profile }>('PATCH', changes)).profile;
}

// 570 -> "09:30" (for <input type="time">)
export function minutesToTimeInput(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// "09:30" (from <input type="time">) -> 570
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export const DAY_NUMBERS: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};
