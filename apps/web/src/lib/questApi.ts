// All communication with /api/quests lives here.
// Every quest route requires login, so each request sends the JWT saved
// at login in the Authorization header: "Bearer <token>".

import { ApiError, getToken } from './authApi';

export interface Quest {
  _id: string;
  title: string;
  subject: string;       // course, e.g. "COP4331"
  location: string;
  description?: string;
  author: string;        // user id of the student who posted it
  day: string;           // ISO date string from the server
  startTime: number;     // minutes after midnight (780 = 1:00 PM)
  endTime: number;
  members: string[];
  joinRequests: string[];
  maxMember: number;
  status: 'open' | 'closed';
}

export interface NewQuest {
  title: string;
  subject: string;
  location: string;
  description: string;
  day: string;           // "MM/DD/YYYY"
  startTime: string;     // "HH:MM AM/PM"
  endTime: string;
  maxMember: number;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
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

// ---------- Quest API calls ----------

// Server-side search: the title matches partially and case-insensitively,
// so "exam" finds "Data Structures Exam Prep". Empty text returns all quests.
export async function searchQuests(text: string): Promise<Quest[]> {
  const params = new URLSearchParams({ title: text.trim() });
  const data = await request<{ quests: Quest[] }>('GET', `/api/quests/search?${params}`);
  return data.quests;
}

export async function createQuest(quest: NewQuest): Promise<Quest> {
  const data = await request<{ quest: Quest }>('POST', '/api/quests', quest);
  return data.quest;
}

export async function updateQuest(id: string, changes: Partial<NewQuest>): Promise<Quest> {
  const data = await request<{ quest: Quest }>('PATCH', `/api/quests/${id}`, changes);
  return data.quest;
}

export function joinQuest(id: string): Promise<{ message: string }> {
  return request('POST', `/api/quests/${id}/join`);
}

export interface JoinRequest {
  _id: string;
  firstName: string;
  lastName: string;
}

// Only the quest's author can see and answer join requests
export async function getJoinRequests(id: string): Promise<JoinRequest[]> {
  const data = await request<{ requests: JoinRequest[] }>('GET', `/api/quests/${id}/join-requests`);
  return data.requests;
}

export function reviewJoinRequest(
  id: string,
  userId: string,
  decision: 'accept' | 'deny',
): Promise<{ message: string }> {
  return request('PATCH', `/api/quests/${id}/join-requests/${userId}`, { decision });
}

export function leaveQuest(id: string): Promise<{ message: string }> {
  return request('POST', `/api/quests/${id}/leave`);
}

export function deleteQuest(id: string): Promise<{ message: string }> {
  return request('DELETE', `/api/quests/${id}`);
}

// ---------- Formatting helpers ----------

// 24-hour "HH:MM" from <input type="time"> -> "h:MM AM/PM" for the server
export function to12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// "YYYY-MM-DD" from <input type="date"> -> "MM/DD/YYYY" for the server
export function toServerDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}

// 780 -> "1:00 PM"
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return to12Hour(`${hours}:${minutes}`);
}

// Server date -> "Tue, Nov 18" (read in UTC, because the server stores
// the calendar day at midnight UTC)
export function formatDay(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// The logged-in user's id, saved at login
export function currentUserId(): string {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').id || '';
  } catch {
    return '';
  }
}
