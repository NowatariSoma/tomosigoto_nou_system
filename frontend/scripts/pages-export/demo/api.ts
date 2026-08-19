/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の FastAPI 互換モックハンドラ。
 *
 * `https://demo.invalid/api/v1/...` 宛のリクエストを、実際のバックエンドと
 * 同じ形の JSON で応答する。GET は fixtures.ts の架空データ、
 * POST/PUT/PATCH/DELETE はインメモリストア（store.ts）だけを書き換える。
 */

import { mockData as materialPlaylists } from '@/features/materials/data/material_data';
import { playlistVideos as materialSubPlaylists } from '@/features/materials/data/playlist_data';
import { videos as materialVideos } from '@/features/materials/data/video_data';

import {
  DEMO_USER,
  DEPARTMENTS,
  DemoAttendance,
  DemoSchedule,
  departmentByCode,
  fullNameKanji,
  slotsOf,
  ts,
} from './fixtures';
import { demoId, nowIso, store } from './store';

export interface DemoApiResult {
  status: number;
  body: unknown;
}

const ok = (body: unknown): DemoApiResult => ({ status: 200, body });
const created = (body: unknown): DemoApiResult => ({ status: 201, body });
const noContent = (): DemoApiResult => ({ status: 204, body: null });
const notFound = (message = 'リソースが見つかりません'): DemoApiResult => ({
  status: 404,
  body: { detail: { error_code: 'NOT_FOUND', error_msg: message } },
});

const hhmmss = (time: string) => (time.length === 5 ? `${time}:00` : time);

// ---------------------------------------------------------------------------
// レスポンス組み立て
// ---------------------------------------------------------------------------

function venueResponse(venue: (typeof store.venues)[number]) {
  return {
    name: venue.name,
    capacity: venue.capacity,
    campus: venue.campus,
    is_active: venue.is_active,
    code: venue.code,
    address: venue.address,
    latitude: venue.latitude,
    longitude: venue.longitude,
    description: venue.description,
    can_mai: venue.can_mai,
    desk: venue.desk,
    chair: venue.chair,
    id: venue.id,
    created_at: ts('2026-04-01'),
    updated_at: ts('2026-04-01'),
  };
}

function scheduleResponse(schedule: DemoSchedule, withVenues: boolean) {
  const venues = withVenues
    ? schedule.venue_ids
        .map((id) => store.venues.find((v) => v.id === id))
        .filter(Boolean)
        .map((v) => ({ id: v!.id, name: v!.name, campus: v!.campus }))
    : null;

  return {
    schedule_date: schedule.schedule_date,
    start_time: hhmmss(schedule.start_time),
    end_time: hhmmss(schedule.end_time),
    division_count: schedule.division_count,
    title: schedule.title,
    description: schedule.description,
    schedule_type: schedule.schedule_type,
    status: schedule.status,
    id: schedule.id,
    created_at: ts(schedule.schedule_date),
    updated_at: ts(schedule.schedule_date),
    created_by: null,
    updated_by: null,
    venue_ids: withVenues ? schedule.venue_ids : null,
    venues,
    stage_id: schedule.stage_id,
    stage: null,
  };
}

function attendanceResponse(attendance: DemoAttendance) {
  return {
    practice_schedule_id: attendance.practice_schedule_id,
    user_id: attendance.user_id,
    status: attendance.status,
    notes: attendance.notes || null,
    available_from: attendance.available_from ? hhmmss(attendance.available_from) : null,
    available_to: attendance.available_to ? hhmmss(attendance.available_to) : null,
    id: attendance.id,
    created_at: attendance.created_at,
    updated_at: attendance.updated_at,
    created_by: attendance.created_by,
    updated_by: attendance.updated_by,
    user_name: attendance.user_name,
    user_email: attendance.user_email,
    user_year: attendance.user_year,
  };
}

const SCHEDULE_COLORS: Record<string, string> = {
  regular_practice: '#3B82F6',
  camp: '#10B981',
  dress_rehearsal: '#8B5CF6',
  final_rehearsal: '#EF4444',
  meeting: '#6B7280',
};

function calendarEvent(schedule: DemoSchedule) {
  return {
    id: schedule.id,
    title: schedule.title || '稽古',
    date: schedule.schedule_date,
    start_time: hhmmss(schedule.start_time),
    end_time: hhmmss(schedule.end_time),
    description: schedule.description || '',
    schedule_type: schedule.schedule_type,
    status: schedule.status,
    venues: schedule.venue_ids.map(
      (id) => store.venues.find((v) => v.id === id)?.name || '不明な会場'
    ),
    session_count: store.sessions.filter((s) => s.schedule_id === schedule.id).length,
    division_count: schedule.division_count,
    color: SCHEDULE_COLORS[schedule.schedule_type] || '#3B82F6',
    is_all_day: false,
    category: 'practice',
  };
}

/** ideal 形式（練習表テーブル用） */
function idealFor(schedule: DemoSchedule, withFetchLogs: boolean) {
  const availableVenues = store.availableVenues.filter((av) => av.schedule_id === schedule.id);
  const slots = slotsOf(schedule);
  const sessions = store.sessions.filter((s) => s.schedule_id === schedule.id);

  const venues = availableVenues.map((av) => {
    const venue = store.venues.find((v) => v.id === av.venue_id);
    return {
      id: av.id,
      venue_id: av.venue_id,
      name: venue?.name || '不明な会場',
      is_preferred: av.is_preferred,
      priority: av.priority,
      color: venue?.color || '#4ECDC4',
    };
  });

  const timeSchedule: Record<string, Record<string, unknown[]>> = {};
  for (const slot of slots) {
    const row: Record<string, unknown[]> = {};
    for (const av of availableVenues) {
      const cell = sessions
        .filter((s) => s.slot_order === slot.slot_order && s.schedule_available_venue_id === av.id)
        .map((s) => {
          const part = store.parts.find((p) => p.id === s.part_id);
          const absentMembers = store.attendances
            .filter(
              (a) =>
                a.practice_schedule_id === schedule.id &&
                (a.status === 'absent' || a.status === 'late' || a.status === 'no_show') &&
                store.memberAssignments.some(
                  (ma) => ma.user_id === a.user_id && ma.part_id === s.part_id
                )
            )
            .map((a) => ({
              user_id: a.user_id,
              name: a.user_name,
              status: a.status,
              notes: a.notes || null,
              attendance_id: a.id,
            }));

          const instructorNames = store.sessionInstructors
            .filter(
              (si) =>
                si.schedule_id === schedule.id &&
                si.slot_order === s.slot_order &&
                si.schedule_available_venue_id === av.id
            )
            .map((si) => {
              const member = store.members.find((m) => m.id === si.user_id);
              return member ? fullNameKanji(member) : '';
            })
            .filter(Boolean);

          return {
            part_id: s.id,
            part_name: s.part_name,
            part_color: part?.color || '#FFD700',
            session_title: s.title,
            instructors: instructorNames,
            participants: Math.min(
              store.memberAssignments.filter((ma) => ma.part_id === s.part_id).length + 2,
              15
            ),
            status: 'confirmed',
            slot_order: s.slot_order,
            schedule_available_venue_id: av.id,
            absent_members: absentMembers,
          };
        });
      row[av.id] = cell;
    }
    timeSchedule[slot.start_time] = row;
  }

  const debugInfo: Record<string, unknown> = {
    sessions_count: sessions.length,
    sessions_data: [],
    venues_count: venues.length,
    division_count: schedule.division_count,
    session_processing_details: [],
  };
  if (withFetchLogs) {
    debugInfo.fetch_logs = [
      `Searching for schedule with date: ${schedule.schedule_date}`,
      `Sessions fetched: ${sessions.length} items`,
      `Venues fetched: ${venues.length} items`,
    ];
  }

  return {
    schedule_info: {
      id: schedule.id,
      schedule_date: schedule.schedule_date,
      start_time: hhmmss(schedule.start_time),
      end_time: hhmmss(schedule.end_time),
      title: schedule.title,
      description: schedule.description,
    },
    venues,
    time_schedule: timeSchedule,
    debug_info: debugInfo,
  };
}

function displayFor(schedule: DemoSchedule) {
  const availableVenues = store.availableVenues.filter((av) => av.schedule_id === schedule.id);
  return {
    id: schedule.id,
    schedule_date: schedule.schedule_date,
    start_time: hhmmss(schedule.start_time),
    end_time: hhmmss(schedule.end_time),
    description: schedule.description,
    schedule_type: schedule.schedule_type,
    status: schedule.status,
    available_venues: availableVenues.map((av) => ({
      id: av.id,
      name: store.venues.find((v) => v.id === av.venue_id)?.name || '不明な会場',
      is_preferred: av.is_preferred,
      priority: av.priority,
      notes: av.notes,
    })),
    sessions: store.sessions
      .filter((s) => s.schedule_id === schedule.id)
      .sort((a, b) => a.slot_order - b.slot_order)
      .map((s) => ({
        id: s.id,
        title: s.title,
        slot_order: s.slot_order,
        part_name: s.part_name,
        venue_name: store.venues.find((v) => v.id === s.venue_id)?.name || '不明な会場',
        priority: s.priority,
        instructors: [],
      })),
  };
}

function sessionInstructorWithDetails(si: (typeof store.sessionInstructors)[number]) {
  const attendance = store.attendances.find((a) => a.id === si.attendance_id);
  const schedule = store.schedules.find((s) => s.id === si.schedule_id);
  const av = store.availableVenues.find((a) => a.id === si.schedule_available_venue_id);
  const venue = av ? store.venues.find((v) => v.id === av.venue_id) : undefined;
  const session = store.sessions.find(
    (s) =>
      s.schedule_id === si.schedule_id &&
      s.slot_order === si.slot_order &&
      s.schedule_available_venue_id === si.schedule_available_venue_id
  );
  const member = store.members.find((m) => m.id === si.user_id);

  return {
    attendance_id: si.attendance_id,
    schedule_id: si.schedule_id,
    schedule_available_venue_id: si.schedule_available_venue_id,
    slot_order: si.slot_order,
    id: si.id,
    created_at: si.created_at,
    updated_at: si.updated_at,
    user_name: member ? fullNameKanji(member) : null,
    user_email: member?.email ?? null,
    attendance_status: attendance?.status ?? null,
    schedule_date: schedule?.schedule_date ?? null,
    schedule_title: schedule?.title ?? null,
    schedule_start_time: schedule ? hhmmss(schedule.start_time) : null,
    schedule_end_time: schedule ? hhmmss(schedule.end_time) : null,
    venue_name: venue?.name ?? null,
    venue_address: venue?.address ?? null,
    part_name: session?.part_name ?? null,
  };
}

function bundleFor(schedule: DemoSchedule) {
  const availableVenues = store.availableVenues.filter((av) => av.schedule_id === schedule.id);
  const entries = store.attendances.filter((a) => a.practice_schedule_id === schedule.id);
  const myEntry = entries.find((a) => a.user_id === DEMO_USER.id) || null;

  const instructorsBySlot: Record<string, unknown[]> = {};
  for (const si of store.sessionInstructors.filter((s) => s.schedule_id === schedule.id)) {
    const key = String(si.slot_order);
    if (!instructorsBySlot[key]) instructorsBySlot[key] = [];
    instructorsBySlot[key].push(sessionInstructorWithDetails(si));
  }

  return {
    schedule: {
      id: schedule.id,
      schedule_date: schedule.schedule_date,
      start_time: hhmmss(schedule.start_time),
      end_time: hhmmss(schedule.end_time),
      title: schedule.title,
      description: schedule.description,
      division_count: schedule.division_count,
      venues: availableVenues.map((av) => {
        const venue = store.venues.find((v) => v.id === av.venue_id);
        return {
          id: av.id,
          venue_id: av.venue_id,
          name: venue?.name || '不明な会場',
          color: venue?.color || '#4ECDC4',
          is_preferred: av.is_preferred,
          priority: av.priority,
          campus: venue?.campus ?? null,
        };
      }),
    },
    ideal: idealFor(schedule, false),
    attendance: {
      entries: entries.map(attendanceResponse),
      my_entry: myEntry ? attendanceResponse(myEntry) : null,
    },
    users: store.members.map((m) => ({
      id: m.id,
      name: fullNameKanji(m),
      email: m.email,
    })),
    session_instructors: instructorsBySlot,
    meta: { generated_at: nowIso(), version: 1 },
  };
}

function profileFor(userId: string) {
  const member = store.members.find((m) => m.id === userId) || DEMO_USER;
  const dept = departmentByCode(member.departmentCode);
  return {
    id: `profile-${member.id}`,
    user_id: member.id,
    student_id: member.studentId,
    first_name_kanji: member.firstKanji,
    first_name_katakana: member.firstKana,
    last_name_kanji: member.lastKanji,
    last_name_katakana: member.lastKana,
    year: member.grade,
    department_code: dept.department_code,
    department_name: dept.department_name,
    email: member.email,
    avatar_url: null,
    preferences: {},
    created_at: ts('2026-04-01'),
    updated_at: ts('2026-04-01'),
  };
}

function memberSummary(member: (typeof store.members)[number]) {
  const role = store.roles[member.id] || { role: member.role, is_instructor: member.isInstructor };
  return {
    id: member.id,
    email: member.email,
    name: `${member.lastKanji}${member.firstKanji}`,
    role: role.role,
    is_instructor: role.is_instructor,
    last_active_at: ts('2026-08-18', '12:30:00'),
  };
}

// ---------------------------------------------------------------------------
// 資料庫（materials-youtube）— ローカルのデモデータを API 形式に変換
// ---------------------------------------------------------------------------

const apiPlaylist = (p: (typeof materialPlaylists)[number]) => ({
  title: p.title,
  name: p.stage,
  year: p.year,
  thumbnail_url: p.thumbnailUrl || null,
  id: p.id,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

const apiSubPlaylist = (s: (typeof materialSubPlaylists)[number]) => ({
  title: s.title,
  recorded_date: s.recordedDate,
  phase: s.phase,
  playlist_url: s.playlistUrl,
  thumbnail_url: s.thumbnailUrl || null,
  id: s.id,
  playlist_id: s.playlistId,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

const apiVideo = (v: (typeof materialVideos)[number]) => ({
  title: v.title,
  video_url: v.videoUrl,
  recorded_date: v.recordedDate || null,
  thumbnail_url: v.thumbnailUrl || null,
  id: v.id,
  sub_playlist_id: v.subPlaylistId,
  created_at: v.createdAt,
  updated_at: v.updatedAt,
});

function favoriteVideoDetail(fav: (typeof store.favorites)[number]) {
  const video = materialVideos.find((v) => v.id === fav.video_id);
  const sub = video ? materialSubPlaylists.find((s) => s.id === video.subPlaylistId) : undefined;
  const playlist = sub ? materialPlaylists.find((p) => p.id === sub.playlistId) : undefined;
  if (!video || !sub || !playlist) return null;
  return {
    id: fav.id,
    user_id: fav.user_id,
    video_id: fav.video_id,
    created_at: fav.created_at,
    updated_at: fav.updated_at,
    video: apiVideo(video),
    sub_playlist: apiSubPlaylist(sub),
    playlist: apiPlaylist(playlist),
  };
}

// 初期のお気に入り（デモらしく数件だけ入れておく）
['1', '5', '9'].forEach((videoId, idx) => {
  if (materialVideos.some((v) => v.id === videoId)) {
    store.favorites.push({
      id: `fav-000${idx + 1}`,
      user_id: DEMO_USER.id,
      video_id: videoId,
      created_at: ts('2026-08-01'),
      updated_at: ts('2026-08-01'),
    });
  }
});

// ---------------------------------------------------------------------------
// ルーティング
// ---------------------------------------------------------------------------

/** `/api/v1` 以降のパスを受け取り、モックレスポンスを返す */
export function handleDemoApi(
  method: string,
  path: string,
  query: URLSearchParams,
  body: unknown
): DemoApiResult {
  const verb = method.toUpperCase();
  const segments = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  const [root, ...rest] = segments;

  // ---------------- users ----------------
  if (root === 'users') {
    if (verb === 'GET' && rest[0] === 'me' && rest[1] === 'role') {
      const role = store.roles[DEMO_USER.id];
      return ok({
        id: `role-${DEMO_USER.id}`,
        user_id: DEMO_USER.id,
        role_type: role.role,
        is_visible_to_general: true,
        is_instructor: role.is_instructor,
        created_at: ts('2026-04-01'),
        updated_at: ts('2026-04-01'),
      });
    }
    if (verb === 'GET' && rest[0] === 'me' && rest.length === 1) {
      return ok(demoAuthUser());
    }
    if (verb === 'GET' && rest.length === 0) {
      return ok(
        store.members.map((m) => ({
          email: m.email,
          name: fullNameKanji(m),
          id: m.id,
          created_at: ts('2026-04-01'),
          updated_at: ts('2026-04-01'),
          email_confirmed_at: ts('2026-04-01'),
          last_sign_in_at: ts('2026-08-18', '12:30:00'),
          first_name_kanji: m.firstKanji,
          last_name_kanji: m.lastKanji,
          first_name_katakana: m.firstKana,
          last_name_katakana: m.lastKana,
        }))
      );
    }
    if (verb === 'GET' && rest.length === 1) {
      const member = store.members.find((m) => m.id === rest[0]);
      if (!member) return notFound('ユーザーが見つかりません');
      return ok({
        email: member.email,
        name: fullNameKanji(member),
        id: member.id,
        created_at: ts('2026-04-01'),
        updated_at: ts('2026-04-01'),
        email_confirmed_at: ts('2026-04-01'),
        last_sign_in_at: ts('2026-08-18', '12:30:00'),
      });
    }
  }

  // ---------------- admin/members ----------------
  if (root === 'admin' && rest[0] === 'members') {
    const tail = rest.slice(1);
    if (verb === 'GET' && tail.length === 0) {
      return ok(store.members.map(memberSummary));
    }
    if (verb === 'PATCH' && tail.length === 2) {
      const member = store.members.find((m) => m.id === tail[0]);
      if (!member) return notFound('メンバーが見つかりません');
      const payload = (body || {}) as { role?: string; is_instructor?: boolean };
      const current = store.roles[member.id];
      if (tail[1] === 'role' && payload.role) {
        current.role = payload.role as typeof current.role;
      }
      if (tail[1] === 'instructor' && typeof payload.is_instructor === 'boolean') {
        current.is_instructor = payload.is_instructor;
      }
      return ok(memberSummary(member));
    }
    if (verb === 'DELETE' && tail.length === 1) {
      store.members = store.members.filter((m) => m.id !== tail[0]);
      return noContent();
    }
  }

  // ---------------- account-setting ----------------
  if (root === 'account-setting') {
    if (verb === 'GET' && rest[0] === 'profile' && rest[1] === 'exists') {
      return ok({ exists: true });
    }
    if (verb === 'GET' && rest[0] === 'departments' && rest.length === 1) {
      return ok(
        DEPARTMENTS.map((dep) => ({
          department_code: dep.department_code,
          department_name: dep.department_name,
          id: dep.id,
          is_active: dep.is_active,
          campus: dep.campus,
          created_at: ts('2026-04-01'),
          updated_at: ts('2026-04-01'),
        }))
      );
    }
    if (verb === 'GET' && rest[0] === 'departments' && rest.length === 2) {
      const dep = departmentByCode(rest[1]);
      return ok({
        department_code: dep.department_code,
        department_name: dep.department_name,
        id: dep.id,
        is_active: dep.is_active,
        campus: dep.campus,
        created_at: ts('2026-04-01'),
        updated_at: ts('2026-04-01'),
      });
    }
    if (rest[0] === 'profile' && rest[1] === 'history') {
      return ok([]);
    }
    if (verb === 'GET' && rest[0] === 'profile' && rest.length === 1) {
      return ok(profileFor(DEMO_USER.id));
    }
    if (verb === 'GET' && rest[0] === 'profile-public') {
      return ok(profileFor(query.get('user_id') || DEMO_USER.id));
    }
    if ((verb === 'POST' || verb === 'PUT') && rest[0]?.startsWith('profile')) {
      const base = profileFor(DEMO_USER.id);
      return ok({ ...base, ...(body as Record<string, unknown>), updated_at: nowIso() });
    }
    if (verb === 'POST' && rest[0]?.startsWith('validate')) {
      return ok({ is_valid: true, errors: [], warnings: [] });
    }
    if (verb === 'DELETE' && rest[0] === 'profile') {
      return ok({ message: 'Profile deleted successfully' });
    }
  }

  // ---------------- venues ----------------
  if (root === 'venues') {
    if (verb === 'GET' && rest.length === 0) {
      return ok(store.venues.map(venueResponse));
    }
    if (verb === 'GET' && rest.length === 1) {
      const venue = store.venues.find((v) => v.id === rest[0]);
      return venue ? ok(venueResponse(venue)) : notFound('会場が見つかりません');
    }
    if (verb === 'POST' && rest.length === 0) {
      const payload = (body || {}) as Record<string, unknown>;
      const venue = {
        id: demoId('venue'),
        name: String(payload.name ?? '新しい稽古場'),
        code: String(payload.code ?? demoId('code')),
        campus: String(payload.campus ?? '今出川'),
        address: String(payload.address ?? ''),
        latitude: Number(payload.latitude ?? 35.0312),
        longitude: Number(payload.longitude ?? 135.7681),
        can_mai: Boolean(payload.can_mai),
        capacity: Number(payload.capacity ?? 0),
        desk: Number(payload.desk ?? 0),
        chair: Number(payload.chair ?? 0),
        description: String(payload.description ?? ''),
        is_active: true,
        color: '#64748b',
      };
      store.venues.push(venue);
      return created(venueResponse(venue));
    }
    if ((verb === 'PATCH' || verb === 'PUT') && rest.length === 1) {
      const venue = store.venues.find((v) => v.id === rest[0]);
      if (!venue) return notFound('会場が見つかりません');
      Object.assign(venue, body as Record<string, unknown>);
      return ok(venueResponse(venue));
    }
    if (verb === 'DELETE' && rest.length === 1) {
      store.venues = store.venues.filter((v) => v.id !== rest[0]);
      return ok(null);
    }
  }

  // ---------------- stages ----------------
  if (root === 'stages') {
    const stageResponse = (s: (typeof store.stages)[number]) => ({
      name: s.name,
      description: s.description,
      performance_date: s.performance_date,
      status: s.status,
      id: s.id,
      created_at: ts('2026-04-01'),
      updated_at: ts('2026-04-01'),
    });
    if (verb === 'GET' && rest.length === 0) {
      const filter = query.get('status_filter');
      const list = filter ? store.stages.filter((s) => s.status === filter) : store.stages;
      return ok(list.map(stageResponse));
    }
    if (verb === 'GET' && rest.length === 1) {
      const stage = store.stages.find((s) => s.id === rest[0]);
      return stage ? ok(stageResponse(stage)) : notFound('舞台が見つかりません');
    }
    if (verb === 'GET' && rest[1] === 'parts') {
      return ok(store.parts.filter((p) => p.stage_id === rest[0]).map(partResponse));
    }
    if (verb === 'GET' && rest[1] === 'members') {
      const partIds = store.parts.filter((p) => p.stage_id === rest[0]).map((p) => p.id);
      return ok(
        store.memberAssignments
          .filter((ma) => partIds.includes(ma.part_id))
          .map(memberAssignmentWithDetails)
      );
    }
  }

  // ---------------- parts ----------------
  if (root === 'parts') {
    if (verb === 'GET' && rest.length === 0) {
      return ok(store.parts.map(partResponse));
    }
    if (verb === 'GET' && rest.length === 1) {
      const part = store.parts.find((p) => p.id === rest[0]);
      return part ? ok(partResponse(part)) : notFound('パートが見つかりません');
    }
    if (verb === 'GET' && rest[1] === 'members') {
      return ok(
        store.memberAssignments
          .filter((ma) => ma.part_id === rest[0])
          .map(memberAssignmentWithDetails)
      );
    }
  }

  // ---------------- member-assignments ----------------
  if (root === 'member-assignments') {
    if (verb === 'GET' && rest.length === 0) {
      return ok(store.memberAssignments.map(memberAssignmentResponse));
    }
    if (verb === 'GET' && rest[0] === 'by-user') {
      return ok(
        store.memberAssignments
          .filter((ma) => ma.user_id === rest[1])
          .map(memberAssignmentResponse)
      );
    }
    if (verb === 'DELETE') {
      return ok({ message: 'Member assignment deleted successfully' });
    }
  }

  // ---------------- practice_schedules ----------------
  if (root === 'practice_schedules') {
    const result = handlePracticeSchedules(verb, rest, query, body);
    if (result) return result;
  }

  // ---------------- attendance ----------------
  if (root === 'attendance') {
    const result = handleAttendance(verb, rest, query, body);
    if (result) return result;
  }

  // ---------------- session-instructors ----------------
  if (root === 'session-instructors') {
    const result = handleSessionInstructors(verb, rest, query, body);
    if (result) return result;
  }

  // ---------------- schedule-available-venues ----------------
  if (root === 'schedule-available-venues') {
    const avResponse = (av: (typeof store.availableVenues)[number]) => ({
      schedule_id: av.schedule_id,
      venue_id: av.venue_id,
      is_preferred: av.is_preferred,
      priority: av.priority,
      notes: av.notes,
      id: av.id,
      created_at: av.created_at,
      updated_at: av.updated_at,
    });
    if (verb === 'GET' && rest[0] === 'schedule') {
      return ok(
        store.availableVenues.filter((av) => av.schedule_id === rest[1]).map(avResponse)
      );
    }
    if (verb === 'GET' && rest.length === 0) {
      const scheduleId = query.get('schedule_id');
      const list = scheduleId
        ? store.availableVenues.filter((av) => av.schedule_id === scheduleId)
        : store.availableVenues;
      return ok(
        list.map((av) => {
          const venue = store.venues.find((v) => v.id === av.venue_id);
          const schedule = store.schedules.find((s) => s.id === av.schedule_id);
          return {
            ...avResponse(av),
            venue_name: venue?.name ?? null,
            venue_address: venue?.address ?? null,
            venue_capacity: venue?.capacity ?? null,
            venue_phone: null,
            venue_email: null,
            venue_website: null,
            schedule_date: schedule?.schedule_date ?? null,
            schedule_title: schedule?.title ?? null,
            schedule_start_time: schedule ? hhmmss(schedule.start_time) : null,
            schedule_end_time: schedule ? hhmmss(schedule.end_time) : null,
          };
        })
      );
    }
    if (verb === 'PUT' && rest[0] === 'schedule') {
      return ok({ created_count: 0, updated_count: 0, deleted_count: 0, errors: [] });
    }
    if (verb === 'DELETE') {
      return ok({ message: 'デモのため削除は反映されません', deleted_count: 0 });
    }
  }

  // ---------------- schedule-time-slots ----------------
  if (root === 'schedule-time-slots') {
    const slotResponse = (slot: ReturnType<typeof slotsOf>[number]) => ({
      schedule_id: slot.schedule_id,
      slot_order: slot.slot_order,
      start_time: slot.start_time,
      end_time: slot.end_time,
      id: slot.id,
      created_at: slot.created_at,
      updated_at: slot.updated_at,
    });
    if (verb === 'GET' && rest[0] === 'schedule') {
      const schedule = store.schedules.find((s) => s.id === rest[1]);
      return ok(schedule ? slotsOf(schedule).map(slotResponse) : []);
    }
    if (verb === 'GET' && rest.length === 0) {
      const scheduleId = query.get('schedule_id');
      const schedule = scheduleId ? store.schedules.find((s) => s.id === scheduleId) : undefined;
      return ok(schedule ? slotsOf(schedule).map(slotResponse) : []);
    }
    if (verb === 'POST' && rest[0] === 'bulk') {
      return ok({ created_count: 0, created_items: [], errors: [] });
    }
    if (verb === 'DELETE') {
      return ok({ message: 'デモのため削除は反映されません', deleted_count: 0 });
    }
  }

  // ---------------- scheduling ----------------
  if (root === 'scheduling') {
    if (rest[0] === 'health') {
      return ok({ status: 'healthy', service: 'scheduling_optimization', version: 'demo' });
    }
    const scheduleId = (body as { schedule_id?: string })?.schedule_id || store.schedules[0].id;
    const schedule = store.schedules.find((s) => s.id === scheduleId) || store.schedules[0];
    const sessions = store.sessions.filter((s) => s.schedule_id === schedule.id);
    const common = {
      status: 'success',
      schedule_id: schedule.id,
      objective_value: 42,
      is_optimal: true,
      solve_time_seconds: 0.42,
      instructor_distribution: store.members
        .filter((m) => store.roles[m.id]?.is_instructor)
        .reduce<Record<string, number>>((acc, m, i) => {
          acc[fullNameKanji(m)] = 2 + (i % 3);
          return acc;
        }, {}),
      part_distribution: store.parts
        .filter((p) => p.stage_id === schedule.stage_id)
        .reduce<Record<string, number>>((acc, p, i) => {
          acc[p.name] = 1 + (i % 3);
          return acc;
        }, {}),
    };
    if (rest[0] === 'preview') {
      return ok({
        ...common,
        preview: true,
        sessions_count: sessions.length,
        schedule_matrix: idealFor(schedule, false).time_schedule,
      });
    }
    return ok({ ...common, sessions_created: sessions.length });
  }

  // ---------------- materials-youtube ----------------
  if (root === 'materials-youtube') {
    const result = handleMaterials(verb, rest, query);
    if (result) return result;
  }

  // ---------------- contacts ----------------
  if (root === 'contacts' && verb === 'POST') {
    const payload = (body || {}) as Record<string, unknown>;
    const contact = {
      category: payload.category ?? 'question',
      content: payload.content ?? '',
      id: demoId('contact'),
      user_id: DEMO_USER.id,
      name: fullNameKanji(DEMO_USER),
      status: 'pending',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    store.contacts.push(contact);
    return created(contact);
  }

  // ---------------- auth ----------------
  if (root === 'auth') {
    if (rest[0] === 'login') {
      return ok({
        access_token: DEMO_ACCESS_TOKEN,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'demo-refresh-token',
        user: { id: DEMO_USER.id, email: DEMO_USER.email, name: fullNameKanji(DEMO_USER) },
      });
    }
    if (rest[0] === 'me') {
      return ok(demoAuthUser());
    }
  }

  // ---------------- フォールバック ----------------
  if (verb === 'DELETE') return noContent();
  if (verb === 'POST' || verb === 'PUT' || verb === 'PATCH') {
    return ok({
      ...(typeof body === 'object' && body !== null ? body : {}),
      id: demoId('demo'),
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  }
  return ok([]);
}

// ---------------------------------------------------------------------------
// サブハンドラ
// ---------------------------------------------------------------------------

function partResponse(part: (typeof store.parts)[number]) {
  return {
    name: part.name,
    description: part.description,
    status: part.status,
    stage_id: part.stage_id,
    id: part.id,
    created_at: ts('2026-04-01'),
    updated_at: ts('2026-04-01'),
  };
}

function memberAssignmentResponse(ma: (typeof store.memberAssignments)[number]) {
  return {
    user_id: ma.user_id,
    part_id: ma.part_id,
    category: ma.category,
    display_order: ma.display_order,
    id: ma.id,
    created_at: ma.created_at,
    updated_at: ma.updated_at,
  };
}

function memberAssignmentWithDetails(ma: (typeof store.memberAssignments)[number]) {
  const member = store.members.find((m) => m.id === ma.user_id);
  const part = store.parts.find((p) => p.id === ma.part_id);
  const stage = part ? store.stages.find((s) => s.id === part.stage_id) : undefined;
  return {
    ...memberAssignmentResponse(ma),
    user_name: member ? fullNameKanji(member) : null,
    user_email: member?.email ?? null,
    part_name: part?.name ?? null,
    part_description: part?.description ?? null,
    stage_name: stage?.name ?? null,
    stage_description: stage?.description ?? null,
  };
}

function handlePracticeSchedules(
  verb: string,
  rest: string[],
  query: URLSearchParams,
  body: unknown
): DemoApiResult | null {
  // /practice_schedules/
  if (verb === 'GET' && rest.length === 0) {
    return ok(store.schedules.map((s) => scheduleResponse(s, true)));
  }

  // /practice_schedules/upcoming
  if (verb === 'GET' && rest[0] === 'upcoming' && rest.length === 1) {
    const today = new Date().toISOString().slice(0, 10);
    return ok(
      store.schedules
        .filter((s) => s.schedule_date >= today)
        .map((s) => scheduleResponse(s, true))
    );
  }

  // /practice_schedules/calendar/month/{year}/{month}
  if (verb === 'GET' && rest[0] === 'calendar' && rest[1] === 'month') {
    const year = Number(rest[2]);
    const month = Number(rest[3]);
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const events = store.schedules
      .filter((s) => s.schedule_date.startsWith(prefix))
      .map(calendarEvent);
    return ok({ year, month, events, total_count: events.length });
  }

  // /practice_schedules/calendar/range?start_date=&end_date=
  if (verb === 'GET' && rest[0] === 'calendar' && rest[1] === 'range') {
    const start = query.get('start_date') || '0000-01-01';
    const end = query.get('end_date') || '9999-12-31';
    const events = store.schedules
      .filter((s) => s.schedule_date >= start && s.schedule_date < end)
      .map(calendarEvent);
    return ok({ start_date: start, end_date: end, events, total_count: events.length });
  }

  // /practice_schedules/date/{date}[...]
  if (rest[0] === 'date') {
    const date = rest[1];
    const schedule = store.schedules.find((s) => s.schedule_date === date);
    const sub = rest[2];

    if (sub === 'ideal' || sub === 'details') {
      if (!schedule) {
        return ok({
          error: 'Schedule not found',
          debug_info: { fetch_logs: [`No schedule found for ${date}`] },
        });
      }
      return ok(idealFor(schedule, true));
    }
    if (sub === 'bundle') {
      if (!schedule) return notFound('この日付の練習予定は見つかりませんでした');
      return ok(bundleFor(schedule));
    }
    if (!sub) {
      if (verb === 'POST') {
        return ok(schedule ? scheduleResponse(schedule, true) : notFound().body);
      }
      if (!schedule) return notFound('この日付の練習予定は見つかりませんでした');
      return ok(scheduleResponse(schedule, false));
    }
  }

  // /practice_schedules/sessions/{id}
  if (rest[0] === 'sessions') {
    if (verb === 'GET' && rest.length === 2) {
      const session = store.sessions.find((s) => s.id === rest[1]);
      return session ? ok(sessionResponse(session)) : notFound('セッションが見つかりません');
    }
    if (verb === 'POST') {
      return ok({ ...(body as Record<string, unknown>), id: demoId('session') });
    }
    if (verb === 'DELETE') {
      return ok({ message: 'セッションが正常に削除されました' });
    }
    if (verb === 'PUT') {
      return ok({ ...(body as Record<string, unknown>), id: rest[1] });
    }
  }

  // /practice_schedules/with-sample-data
  if (rest[0] === 'with-sample-data') {
    const target = query.get('target_date');
    const schedule = store.schedules.find((s) => s.schedule_date === target);
    return ok(schedule ? scheduleResponse(schedule, true) : null);
  }

  // /practice_schedules/{id}...
  if (rest.length >= 1) {
    const schedule = store.schedules.find((s) => s.id === rest[0]);
    const sub = rest[1];

    if (verb === 'GET' && schedule && !sub) return ok(scheduleResponse(schedule, true));
    if (verb === 'GET' && schedule && sub === 'display') return ok(displayFor(schedule));
    if (verb === 'GET' && schedule && sub === 'details') return ok(idealFor(schedule, false));
    if (verb === 'GET' && schedule && sub === 'sessions') {
      return ok(
        store.sessions.filter((s) => s.schedule_id === schedule.id).map(sessionResponse)
      );
    }
    if (verb === 'PUT' && schedule) {
      Object.assign(schedule, body as Record<string, unknown>);
      return ok(scheduleResponse(schedule, true));
    }
    if (verb === 'DELETE' && schedule) {
      store.schedules = store.schedules.filter((s) => s.id !== schedule.id);
      return ok({ message: '練習スケジュールが正常に削除されました' });
    }
    if (verb === 'GET' && !schedule) return notFound('練習スケジュールが見つかりません');
  }

  if (verb === 'POST') {
    const payload = (body || {}) as Record<string, unknown>;
    const base = store.schedules[0];
    const schedule: DemoSchedule = {
      id: demoId('sched'),
      schedule_date: String(payload.schedule_date ?? base.schedule_date),
      start_time: String(payload.start_time ?? '18:00').slice(0, 5),
      end_time: String(payload.end_time ?? '21:00').slice(0, 5),
      division_count: Number(payload.division_count ?? 4),
      title: String(payload.title ?? '新しい稽古'),
      description: String(payload.description ?? ''),
      schedule_type: String(payload.schedule_type ?? 'regular_practice'),
      status: 'active',
      stage_id: String(payload.stage_id ?? base.stage_id),
      venue_ids: (payload.venue_ids as string[]) ?? [store.venues[0].id],
    };
    store.schedules.push(schedule);
    return created(scheduleResponse(schedule, true));
  }

  return null;
}

function sessionResponse(session: (typeof store.sessions)[number]) {
  return {
    schedule_id: session.schedule_id,
    part_id: session.part_id,
    part_name: session.part_name,
    slot_order: session.slot_order,
    venue_id: session.venue_id,
    schedule_available_venue_id: session.schedule_available_venue_id,
    priority: session.priority,
    id: session.id,
    created_at: session.created_at,
    updated_at: session.updated_at,
  };
}

function handleAttendance(
  verb: string,
  rest: string[],
  query: URLSearchParams,
  body: unknown
): DemoApiResult | null {
  if (verb === 'GET' && rest.length === 0) {
    return ok(store.attendances.map(attendanceResponse));
  }
  if (verb === 'GET' && rest[0] === 'practice') {
    return ok(
      store.attendances
        .filter((a) => a.practice_schedule_id === rest[1])
        .map(attendanceResponse)
    );
  }
  if (verb === 'GET' && rest[0] === 'user') {
    return ok(store.attendances.filter((a) => a.user_id === rest[1]).map(attendanceResponse));
  }
  if (verb === 'GET' && rest[0] === 'admin' && rest[1] === 'list') {
    const scheduleId = query.get('practice_schedule_id');
    const statusFilter = query.get('status');
    const nameFilter = query.get('user_name');

    let rows = store.members.map((m) => ({
      user: {
        id: m.id,
        name: fullNameKanji(m),
        email: m.email,
        first_name_kanji: m.firstKanji,
        last_name_kanji: m.lastKanji,
        first_name_katakana: m.firstKana,
        last_name_katakana: m.lastKana,
      },
      attendance: scheduleId
        ? store.attendances.find(
            (a) => a.practice_schedule_id === scheduleId && a.user_id === m.id
          ) || null
        : null,
    }));

    if (nameFilter) rows = rows.filter((r) => r.user.name.includes(nameFilter));
    if (statusFilter === 'unregistered') rows = rows.filter((r) => !r.attendance);
    else if (statusFilter) rows = rows.filter((r) => r.attendance?.status === statusFilter);

    return ok(
      rows.map((r) => ({
        user: r.user,
        attendance: r.attendance ? attendanceResponse(r.attendance) : null,
      }))
    );
  }
  if (verb === 'GET' && rest[0] === 'summary') {
    if (rest[1] === 'practice') {
      return ok(
        store.schedules.map((schedule) => {
          const entries = store.attendances.filter(
            (a) => a.practice_schedule_id === schedule.id
          );
          const count = (status: string) => entries.filter((a) => a.status === status).length;
          const present = count('present');
          return {
            practice_schedule_id: schedule.id,
            schedule_date: `${schedule.schedule_date}T00:00:00`,
            description: schedule.description,
            venue_name: store.venues.find((v) => v.id === schedule.venue_ids[0])?.name || null,
            total_people: entries.length,
            present_count: present,
            absent_count: count('absent'),
            late_count: count('late'),
            no_show_count: count('no_show'),
            attendance_rate: entries.length
              ? Math.round((present / entries.length) * 10000) / 100
              : 0,
          };
        })
      );
    }
    return ok([]);
  }

  if (verb === 'POST' && (rest[0] === 'upsert' || rest.length === 0)) {
    const payload = (body || {}) as Record<string, string>;
    const member = store.members.find((m) => m.id === payload.user_id) || DEMO_USER;
    const existing = store.attendances.find(
      (a) =>
        a.practice_schedule_id === payload.practice_schedule_id && a.user_id === payload.user_id
    );
    if (existing) {
      existing.status = (payload.status as DemoAttendance['status']) || existing.status;
      existing.notes = payload.notes ?? existing.notes;
      existing.available_from = payload.available_from ?? existing.available_from;
      existing.available_to = payload.available_to ?? existing.available_to;
      existing.updated_at = nowIso();
      return ok(attendanceResponse(existing));
    }
    const record: DemoAttendance = {
      id: demoId('att'),
      practice_schedule_id: payload.practice_schedule_id,
      user_id: payload.user_id,
      status: (payload.status as DemoAttendance['status']) || 'present',
      notes: payload.notes || '',
      available_from: payload.available_from || null,
      available_to: payload.available_to || null,
      created_at: nowIso(),
      updated_at: nowIso(),
      created_by: payload.user_id,
      updated_by: payload.user_id,
      user_name: fullNameKanji(member),
      user_email: member.email,
      user_year: member.grade,
    };
    store.attendances.push(record);
    return ok(attendanceResponse(record));
  }

  if (verb === 'POST' && rest[0] === 'bulk') {
    const list = Array.isArray(body) ? (body as Record<string, string>[]) : [];
    const out = list.map((item) => {
      const res = handleAttendance('POST', ['upsert'], query, item);
      return res?.body;
    });
    return ok(out);
  }

  if (verb === 'PUT' && rest.length === 1) {
    const record = store.attendances.find((a) => a.id === rest[0]);
    if (!record) return notFound('出欠記録が見つかりません');
    Object.assign(record, body as Record<string, unknown>, { updated_at: nowIso() });
    return ok(attendanceResponse(record));
  }
  if (verb === 'DELETE' && rest.length === 1) {
    store.attendances = store.attendances.filter((a) => a.id !== rest[0]);
    return ok({ message: '出欠記録が正常に削除されました' });
  }
  if (verb === 'GET' && rest.length === 1) {
    const record = store.attendances.find((a) => a.id === rest[0]);
    return record ? ok(attendanceResponse(record)) : notFound('出欠記録が見つかりません');
  }
  return null;
}

function handleSessionInstructors(
  verb: string,
  rest: string[],
  query: URLSearchParams,
  body: unknown
): DemoApiResult | null {
  if (verb === 'GET' && rest[0] === 'candidates') {
    const scheduleId = query.get('practice_schedule_id');
    return ok(
      store.attendances
        .filter(
          (a) =>
            a.practice_schedule_id === scheduleId &&
            (a.status === 'present' || a.status === 'late') &&
            store.roles[a.user_id]?.is_instructor
        )
        .map((a) => {
          const member = store.members.find((m) => m.id === a.user_id)!;
          return {
            user_id: member.id,
            email: member.email,
            first_name_kanji: member.firstKanji,
            last_name_kanji: member.lastKanji,
            student_id: member.studentId,
            grade: member.grade,
            attendance_id: a.id,
            attendance_status: a.status,
          };
        })
    );
  }

  if (verb === 'GET' && rest.length === 0) {
    const scheduleId = query.get('schedule_id');
    const slotOrder = query.get('slot_order');
    return ok(
      store.sessionInstructors
        .filter((si) => (scheduleId ? si.schedule_id === scheduleId : true))
        .filter((si) => (slotOrder ? si.slot_order === Number(slotOrder) : true))
        .map(sessionInstructorWithDetails)
    );
  }

  if (verb === 'GET' && rest[0] === 'schedule') {
    const scheduleId = rest[1];
    const slotOrder = rest[2] === 'slot' ? Number(rest[3]) : undefined;
    return ok(
      store.sessionInstructors
        .filter((si) => si.schedule_id === scheduleId)
        .filter((si) => (slotOrder === undefined ? true : si.slot_order === slotOrder))
        .map((si) => ({
          attendance_id: si.attendance_id,
          schedule_id: si.schedule_id,
          schedule_available_venue_id: si.schedule_available_venue_id,
          slot_order: si.slot_order,
          id: si.id,
          created_at: si.created_at,
          updated_at: si.updated_at,
        }))
    );
  }

  if (verb === 'GET' && rest[0] === 'attendance') {
    return ok(
      store.sessionInstructors
        .filter((si) => si.attendance_id === rest[1])
        .map(sessionInstructorWithDetails)
    );
  }

  if (verb === 'GET' && rest.length === 1) {
    const si = store.sessionInstructors.find((s) => s.id === rest[0]);
    return si ? ok(sessionInstructorWithDetails(si)) : notFound('指導者割当が見つかりません');
  }

  if (verb === 'POST' && rest[0] === 'bulk') {
    const payload = (body || {}) as { attendance_ids?: string[] };
    return ok({
      created_count: payload.attendance_ids?.length ?? 0,
      created_items: [],
      errors: [],
    });
  }
  if (verb === 'POST') {
    return ok({ ...(body as Record<string, unknown>), id: demoId('sinst') });
  }
  if (verb === 'DELETE') {
    return ok({ message: 'デモのため削除は反映されません', deleted_count: 0 });
  }
  return null;
}

function handleMaterials(
  verb: string,
  rest: string[],
  query: URLSearchParams
): DemoApiResult | null {
  // /materials-youtube/favorites
  if (rest[0] === 'favorites') {
    if (rest[1] === 'videos') {
      return ok(store.favorites.map(favoriteVideoDetail).filter(Boolean));
    }
    return ok(store.favorites);
  }

  // /materials-youtube/videos/{videoId}/favorites...
  if (rest[0] === 'videos') {
    const videoId = rest[1];
    const sub = rest[3];
    const existingIndex = store.favorites.findIndex((f) => f.video_id === videoId);

    if (sub === 'status') {
      return ok({
        is_favorited: existingIndex >= 0,
        video_id: videoId,
        user_id: DEMO_USER.id,
      });
    }
    if (sub === 'toggle') {
      if (existingIndex >= 0) {
        store.favorites.splice(existingIndex, 1);
        return ok({ is_favorited: false, message: 'お気に入りを解除しました' });
      }
      const favorite = {
        id: demoId('fav'),
        user_id: DEMO_USER.id,
        video_id: videoId,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      store.favorites.push(favorite);
      return ok({ is_favorited: true, favorite, message: 'お気に入りに追加しました' });
    }
    if (verb === 'POST') {
      const favorite = {
        id: demoId('fav'),
        user_id: DEMO_USER.id,
        video_id: videoId,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      store.favorites.push(favorite);
      return created(favorite);
    }
    if (verb === 'DELETE') {
      if (existingIndex >= 0) store.favorites.splice(existingIndex, 1);
      return ok({ message: 'お気に入りを削除しました', video_id: videoId });
    }
  }

  // /materials-youtube (プレイリスト一覧)
  if (rest.length === 0) {
    if (verb === 'GET') {
      const year = query.get('year');
      const title = query.get('title');
      let list = materialPlaylists;
      if (year) list = list.filter((p) => String(p.year) === year);
      if (title) list = list.filter((p) => p.title.includes(title));
      return ok(list.map(apiPlaylist));
    }
    if (verb === 'POST') {
      return created({
        title: 'デモプレイリスト',
        name: 'デモ舞台',
        year: new Date().getFullYear(),
        thumbnail_url: null,
        id: demoId('playlist'),
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }
  }

  const playlistId = rest[0];

  // /materials-youtube/{playlistId}
  if (rest.length === 1) {
    if (verb === 'GET') {
      const playlist = materialPlaylists.find((p) => p.id === playlistId);
      return playlist ? ok(apiPlaylist(playlist)) : notFound('プレイリストが見つかりません');
    }
    if (verb === 'DELETE') return ok({ message: 'プレイリストを削除しました' });
    if (verb === 'PUT') {
      const playlist = materialPlaylists.find((p) => p.id === playlistId);
      return playlist ? ok(apiPlaylist(playlist)) : notFound('プレイリストが見つかりません');
    }
  }

  // /materials-youtube/{playlistId}/sub-playlists...
  if (rest[1] === 'sub-playlists') {
    const subId = rest[2];

    if (!subId) {
      if (verb === 'GET') {
        return ok(
          materialSubPlaylists
            .filter((s) => s.playlistId === playlistId)
            .map(apiSubPlaylist)
        );
      }
      if (verb === 'POST') {
        return created({
          title: 'デモサブプレイリスト',
          recorded_date: new Date().toISOString().slice(0, 10),
          phase: '稽古',
          playlist_url: 'https://www.youtube.com/playlist?list=demo',
          thumbnail_url: null,
          id: demoId('subplaylist'),
          playlist_id: playlistId,
          created_at: nowIso(),
          updated_at: nowIso(),
          import_result: { imported_count: 0, skipped_count: 0, total_count: 0, warnings: [] },
        });
      }
    }

    if (rest[3] === 'videos') {
      const videoId = rest[4];
      if (!videoId) {
        if (verb === 'GET') {
          return ok(
            materialVideos.filter((v) => v.subPlaylistId === subId).map(apiVideo)
          );
        }
        if (verb === 'POST') {
          return created({
            title: 'デモ動画',
            video_url: 'https://www.youtube.com/watch?v=demo',
            recorded_date: new Date().toISOString().slice(0, 10),
            thumbnail_url: null,
            id: demoId('video'),
            sub_playlist_id: subId,
            created_at: nowIso(),
            updated_at: nowIso(),
          });
        }
      } else {
        if (verb === 'GET') {
          const video = materialVideos.find((v) => v.id === videoId);
          return video ? ok(apiVideo(video)) : notFound('動画が見つかりません');
        }
        if (verb === 'DELETE') return ok({ message: 'ビデオを削除しました' });
        if (verb === 'PUT') {
          const video = materialVideos.find((v) => v.id === videoId);
          return video ? ok(apiVideo(video)) : notFound('動画が見つかりません');
        }
      }
    }

    if (subId) {
      if (verb === 'GET') {
        const sub = materialSubPlaylists.find((s) => s.id === subId);
        return sub ? ok(apiSubPlaylist(sub)) : notFound('サブプレイリストが見つかりません');
      }
      if (verb === 'DELETE') return ok({ message: 'サブプレイリストを削除しました' });
      if (verb === 'PUT') {
        const sub = materialSubPlaylists.find((s) => s.id === subId);
        return sub ? ok(apiSubPlaylist(sub)) : notFound('サブプレイリストが見つかりません');
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 認証まわりで共有する値
// ---------------------------------------------------------------------------

export const DEMO_ACCESS_TOKEN = 'demo-access-token';

export function demoAuthUser() {
  return {
    id: DEMO_USER.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: DEMO_USER.email,
    email_confirmed_at: ts('2026-04-01'),
    phone: '',
    confirmed_at: ts('2026-04-01'),
    last_sign_in_at: nowIso(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { name: fullNameKanji(DEMO_USER) },
    identities: [],
    created_at: ts('2026-04-01'),
    updated_at: nowIso(),
  };
}
