import { MemberSummary } from '@/features/member-management/types';

export const ROLE_LABELS: Record<'admin' | 'basic' | 'viewer', string> = {
  admin: '管理者',
  basic: '基本権限',
  viewer: '閲覧のみ'
};

export const ROLE_BADGE_STYLES: Record<'admin' | 'basic' | 'viewer', string> = {
  admin: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-admin shadow-sm',
  basic: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-basic shadow-sm',
  viewer: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-viewer shadow-sm'
};

export const ROLE_BUTTON_STYLES: Record<'admin' | 'basic' | 'viewer', { active: string; inactive: string }> = {
  admin: {
    active: 'border border-yellow-400 bg-yellow-300 text-black shadow-sm',
    inactive: 'border border-blue-300 text-black bg-white hover:bg-blue-50'
  },
  basic: {
    active: 'border border-yellow-400 bg-yellow-300 text-black shadow-sm',
    inactive: 'border border-blue-200 text-black bg-white hover:bg-blue-50'
  },
  viewer: {
    active: 'border border-yellow-400 bg-yellow-300 text-black shadow-sm',
    inactive: 'border border-blue-200 text-black bg-white hover:bg-blue-50'
  }
};

export const INSTRUCTOR_BADGE_STYLES: Record<'instructor' | 'member', string> = {
  instructor: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-instructor shadow-sm',
  member: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-viewer shadow-sm'
};

export const INSTRUCTOR_BUTTON_STYLES: Record<'instructor' | 'member', { active: string; inactive: string }> = {
  instructor: {
    active: 'border border-yellow-400 bg-yellow-300 text-black shadow-sm',
    inactive: 'border border-blue-200 text-black bg-white hover:bg-blue-50'
  },
  member: {
    active: 'border border-yellow-400 bg-yellow-300 text-black shadow-sm',
    inactive: 'border border-blue-200 text-black bg-white hover:bg-blue-50'
  }
};

export const instructorFilterOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'only', label: '指導者のみ' },
  { value: 'exclude', label: '指導者以外' },
] as const;

export const roleOptions: MemberSummary['role'][] = ['admin', 'basic', 'viewer'];

export const instructorOptions = [
  { value: true, label: '指導者' },
  { value: false, label: '一般' },
] as const;

export type DraftChange = Partial<Pick<MemberSummary, 'role' | 'is_instructor'>>;
