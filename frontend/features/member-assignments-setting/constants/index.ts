import { MemberAssignmentData } from '../types';

// API関連の定数
export const API_ENDPOINTS = {
  MEMBER_ASSIGNMENTS: '/member-assignments/',
  PARTS: '/parts/',
  USERS: '/users/',
} as const;

export const UI_TEXT = {
  TITLE: 'メンバー所属設定',
  NEW_ASSIGNMENT: '新しく所属を設定する',
  ASSIGNMENT_TITLE: '新規所属設定',
  ASSIGNED_MEMBERS: '所属メンバー',
  NO_ASSIGNMENTS: '所属メンバーは登録されていません',
  START_MESSAGE: '「新しく所属を設定する」ボタンから始めましょう',
  USER_LABEL: 'メンバー',
  PART_LABEL: 'パート',
  CATEGORY_LABEL: '謡舞区分',
  DISPLAY_ORDER_LABEL: '表示順序',
  CANCEL: 'キャンセル',
  ASSIGN: '所属を設定する',
  UPDATE: '更新する',
  DELETE: '削除する',
  NOT_SET: '未設定',
  LOADING_TEXT: '読み込み中...',
  CONFIRM_DELETE: 'この所属設定を削除しますか？',
  CONFIRM_DELETE_TITLE: '削除の確認',
} as const;

export const CATEGORY_OPTIONS = [
  { value: 'utai', label: '謡' },
  { value: 'mai', label: '舞' },
] as const;

export const DISPLAY_ORDER_LIMITS = {
  MIN: 0,
  MAX: 999,
  DEFAULT: 0,
} as const;

export const MOCK_DATA: MemberAssignmentData[] = [
  {
    id: '1',
    user_id: 'user1',
    part_id: 'part1',
    category: 'utai',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user2',
    part_id: 'part1',
    category: 'mai',
    display_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    user_id: 'user3',
    part_id: 'part2',
    category: 'utai',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];
