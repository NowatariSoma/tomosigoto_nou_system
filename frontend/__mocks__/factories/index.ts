/**
 * テストデータファクトリ
 * 各featureのテストデータ生成を集約
 */

// --- Room / Venue ---
export function createRoom(overrides: Record<string, unknown> = {}) {
  return {
    id: 'room-1',
    name: 'テスト教室A',
    campus: '今出川' as const,
    capacity: 30,
    danceAllowed: false,
    description: '',
    ...overrides,
  };
}

export function createVenueResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'venue-1',
    name: 'テスト教室A',
    code: 'ROOM_001',
    address: '今出川キャンパス',
    capacity: 30,
    campus: '今出川',
    description: '',
    latitude: 35.0,
    longitude: 135.0,
    can_mai: false,
    desk: 0,
    chair: 30,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- Stage ---
export function createStageData(overrides: Record<string, unknown> = {}) {
  return {
    id: 'stage-1',
    date: '2024-06-15',
    stageName: 'テスト公演',
    description: 'テスト説明',
    status: 'active' as const,
    parts: ['シテ', 'ワキ', '地謡'],
    partCount: 3,
    ...overrides,
  };
}

export function createSupabaseStageResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'stage-1',
    name: 'テスト公演',
    performance_date: '2024-06-15',
    status: 'active' as const,
    description: 'テスト説明',
    parts: [
      { id: 'part-1', name: 'シテ' },
      { id: 'part-2', name: 'ワキ' },
      { id: 'part-3', name: '地謡' },
    ],
    ...overrides,
  };
}

// --- Part ---
export function createPart(overrides: Record<string, unknown> = {}) {
  return {
    id: 'part-1',
    name: 'シテ',
    stage_id: 'stage-1',
    description: '',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- User ---
export function createUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'テスト 太郎',
    email: 'test@example.com',
    first_name_kanji: '太郎',
    last_name_kanji: 'テスト',
    first_name_katakana: 'タロウ',
    last_name_katakana: 'テスト',
    ...overrides,
  };
}

export function createUserProfile(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 'user-1',
    first_name_katakana: 'タロウ',
    last_name_katakana: 'テスト',
    first_name_kanji: '太郎',
    last_name_kanji: 'テスト',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- Attendance ---
export function createAttendance(overrides: Record<string, unknown> = {}) {
  return {
    id: 'att-1',
    practice_schedule_id: 'ps-1',
    user_id: 'user-1',
    status: 'present' as const,
    notes: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'user-1',
    updated_by: 'user-1',
    ...overrides,
  };
}

// --- PracticeSchedule ---
export function createPracticeSchedule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ps-1',
    date: '2024-06-15',
    startTime: '09:00',
    endTime: '17:00',
    venueId: 'venue-1',
    venueName: 'テスト教室A',
    campus: '今出川',
    title: 'テスト稽古',
    description: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createPracticeScheduleApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ps-1',
    schedule_date: '2024-06-15',
    start_time: '09:00',
    end_time: '17:00',
    division_count: 6,
    title: 'テスト稽古',
    description: '',
    schedule_type: 'regular',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'user-1',
    updated_by: 'user-1',
    venues: [{ id: 'venue-1', name: 'テスト教室A', campus: '今出川' }],
    ...overrides,
  };
}

// --- MemberAssignment ---
export function createMemberAssignmentData(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ma-1',
    user_id: 'user-1',
    part_id: 'part-1',
    category: 'utai' as const,
    display_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createMemberAssignmentWithDetails(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ma-1',
    user_id: 'user-1',
    part_id: 'part-1',
    category: 'utai' as const,
    display_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      name: 'テスト タロウ',
      email: 'test@example.com',
      first_name_katakana: 'タロウ',
      last_name_katakana: 'テスト',
      first_name_kanji: '太郎',
      last_name_kanji: 'テスト',
    },
    part: {
      id: 'part-1',
      name: 'シテ',
      stage: {
        id: 'stage-1',
        name: 'テスト公演',
        performance_date: '2024-06-15',
      },
    },
    ...overrides,
  };
}

// --- Contact ---
export function createContact(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contact-1',
    user_id: 'user-1',
    name: 'テスト太郎',
    category: 'bug' as const,
    content: 'テスト内容',
    status: 'pending' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- MemberSummary (member-management) ---
export function createMemberSummary(overrides: Record<string, unknown> = {}) {
  return {
    id: 'member-1',
    name: 'テスト太郎',
    email: 'test@example.com',
    role: 'basic' as const,
    is_instructor: false,
    last_active_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}
