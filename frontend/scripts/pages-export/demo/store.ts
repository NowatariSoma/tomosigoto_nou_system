/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用のインメモリストア。
 *
 * fixtures.ts の内容を複製して保持し、POST/PUT/PATCH/DELETE はここだけを書き換える。
 * ページをリロードすると初期状態に戻る（永続化は一切しない）。
 */

import {
  ATTENDANCES,
  AVAILABLE_VENUES,
  DemoAttendance,
  DemoAvailableVenue,
  DemoMemberAssignment,
  DemoPart,
  DemoSchedule,
  DemoSession,
  DemoSessionInstructor,
  DemoStage,
  DemoVenue,
  MEMBERS,
  MEMBER_ASSIGNMENTS,
  PARTS,
  SCHEDULES,
  SESSIONS,
  SESSION_INSTRUCTORS,
  STAGES,
  VENUES,
  DemoMember,
  DemoRole,
} from './fixtures';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export interface DemoFavorite {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
  updated_at: string;
}

export interface DemoStore {
  members: DemoMember[];
  roles: Record<string, { role: DemoRole; is_instructor: boolean }>;
  venues: DemoVenue[];
  stages: DemoStage[];
  parts: DemoPart[];
  memberAssignments: DemoMemberAssignment[];
  schedules: DemoSchedule[];
  availableVenues: DemoAvailableVenue[];
  attendances: DemoAttendance[];
  sessions: DemoSession[];
  sessionInstructors: DemoSessionInstructor[];
  favorites: DemoFavorite[];
  contacts: Record<string, unknown>[];
}

export const store: DemoStore = {
  members: clone(MEMBERS),
  roles: MEMBERS.reduce<Record<string, { role: DemoRole; is_instructor: boolean }>>((acc, m) => {
    acc[m.id] = { role: m.role, is_instructor: m.isInstructor };
    return acc;
  }, {}),
  venues: clone(VENUES),
  stages: clone(STAGES),
  parts: clone(PARTS),
  memberAssignments: clone(MEMBER_ASSIGNMENTS),
  schedules: clone(SCHEDULES),
  availableVenues: clone(AVAILABLE_VENUES),
  attendances: clone(ATTENDANCES),
  sessions: clone(SESSIONS),
  sessionInstructors: clone(SESSION_INSTRUCTORS),
  favorites: [],
  contacts: [],
};

let idCounter = 0;

/** デモ用の擬似 UUID（crypto に依存しない） */
export function demoId(prefix = 'demo'): string {
  idCounter += 1;
  const rand = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${prefix}-${Date.now().toString(16)}-${idCounter.toString(16)}-${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
