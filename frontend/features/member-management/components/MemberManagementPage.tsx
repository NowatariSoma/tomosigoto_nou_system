'use client';

import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { Users, Shield, UserCheck, Filter, Search, Loader2, AlertCircle, Edit, Save, X } from 'lucide-react';
import { useMemberManagement } from '../hooks/useMemberManagement';
import { MemberSummary } from '../types';
import { formatRelativeLastActive } from '@/shared/utils/format';

const ROLE_LABELS: Record<'admin' | 'basic' | 'viewer', string> = {
  admin: '管理者',
  basic: '基本権限',
  viewer: '閲覧のみ'
};

const ROLE_BADGE_STYLES: Record<'admin' | 'basic' | 'viewer', string> = {
  admin: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border bg-purple-600 text-white border-purple-600 shadow-sm',
  basic: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border bg-blue-600 text-white border-blue-600 shadow-sm',
  viewer: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border bg-gray-600 text-white border-gray-600 shadow-sm'
};

const ROLE_BUTTON_STYLES: Record<'admin' | 'basic' | 'viewer', { active: string; inactive: string }> = {
  admin: {
    active: 'border border-purple-600 bg-purple-600 text-white shadow-sm',
    inactive: 'border border-purple-200 text-purple-700 bg-white hover:bg-purple-50'
  },
  basic: {
    active: 'border border-blue-600 bg-blue-600 text-white shadow-sm',
    inactive: 'border border-blue-200 text-blue-700 bg-white hover:bg-blue-50'
  },
  viewer: {
    active: 'border border-gray-600 bg-gray-600 text-white shadow-sm',
    inactive: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
  }
};

const INSTRUCTOR_BADGE_STYLES: Record<'instructor' | 'member', string> = {
  instructor: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border bg-amber-600 text-white border-amber-600 shadow-sm',
  member: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border bg-gray-500 text-white border-gray-500 shadow-sm'
};

const INSTRUCTOR_BUTTON_STYLES: Record<'instructor' | 'member', { active: string; inactive: string }> = {
  instructor: {
    active: 'border border-amber-600 bg-amber-600 text-white shadow-sm',
    inactive: 'border border-amber-200 text-amber-700 bg-white hover:bg-amber-50'
  },
  member: {
    active: 'border border-gray-500 bg-gray-500 text-white shadow-sm',
    inactive: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
  }
};

const instructorFilterOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'only', label: '指導者のみ' },
  { value: 'exclude', label: '指導者以外' },
] as const;

const roleOptions: MemberSummary['role'][] = ['admin', 'basic', 'viewer'];
const instructorOptions = [
  { value: true, label: '指導者' },
  { value: false, label: '一般' },
] as const;

type DraftChange = Partial<Pick<MemberSummary, 'role' | 'is_instructor'>>;

export function MemberManagementPage() {
  const {
    members,
    isLoading,
    error,
    adminCount,
    handleRoleChange,
    handleInstructorFlagChange,
  } = useMemberManagement();

  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'basic' | 'viewer'>('all');
  const [instructorFilter, setInstructorFilter] = useState<'all' | 'only' | 'exclude'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftChanges, setDraftChanges] = useState<Record<string, DraftChange>>({});

  const totalMembers = members.length;
  const viewerCount = useMemo(() => members.filter(member => member.role === 'viewer').length, [members]);
  const instructorCount = useMemo(() => members.filter(member => member.is_instructor).length, [members]);
  const pendingChangeCount = Object.keys(draftChanges).length;

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      if (roleFilter !== 'all' && member.role !== roleFilter) {
        return false;
      }

      if (instructorFilter === 'only' && !member.is_instructor) {
        return false;
      }

      if (instructorFilter === 'exclude' && member.is_instructor) {
        return false;
      }

      if (searchQuery) {
        const keyword = searchQuery.toLowerCase();
        const name = member.name?.toLowerCase() ?? '';
        const email = member.email?.toLowerCase() ?? '';
        if (!name.includes(keyword) && !email.includes(keyword)) {
          return false;
        }
      }

      return true;
    });
  }, [members, roleFilter, instructorFilter, searchQuery]);

  const resolveDraftRole = useCallback((member: MemberSummary) => {
    return draftChanges[member.id]?.role ?? member.role;
  }, [draftChanges]);

  const resolveDraftInstructor = useCallback((member: MemberSummary) => {
    return draftChanges[member.id]?.is_instructor ?? member.is_instructor;
  }, [draftChanges]);

  const updateDraft = useCallback((memberId: string, updates: DraftChange) => {
    setDraftChanges(prev => {
      const target = members.find(member => member.id === memberId);
      if (!target) {
        return prev;
      }

      const merged = { ...prev[memberId], ...updates };
      const nextRole = merged.role ?? target.role;
      const nextInstructor = merged.is_instructor ?? target.is_instructor;

      const roleChanged = nextRole !== target.role;
      const instructorChanged = nextInstructor !== target.is_instructor;

      if (!roleChanged && !instructorChanged) {
        if (!(memberId in prev)) {
          return prev;
        }
        const { [memberId]: _, ...rest } = prev;
        return rest;
      }

      const normalized: DraftChange = {};
      if (roleChanged) {
        normalized.role = nextRole;
      }
      if (instructorChanged) {
        normalized.is_instructor = nextInstructor;
      }

      return {
        ...prev,
        [memberId]: normalized,
      };
    });
  }, [members]);

  const handleEnterEditMode = useCallback(() => {
    setSaveError(null);
    setIsEditMode(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (pendingChangeCount > 0 && !confirm('保存されていない変更があります。キャンセルしますか？')) {
      return;
    }
    setDraftChanges({});
    setSaveError(null);
    setIsEditMode(false);
  }, [pendingChangeCount]);

  const handleSaveChanges = useCallback(async () => {
    if (pendingChangeCount === 0) {
      setIsEditMode(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      for (const [memberId, changes] of Object.entries(draftChanges)) {
        if (changes.role !== undefined) {
          await handleRoleChange(memberId, changes.role);
        }
        if (changes.is_instructor !== undefined) {
          await handleInstructorFlagChange(memberId, changes.is_instructor);
        }
      }

      setDraftChanges({});
      setIsEditMode(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : '変更の保存に失敗しました';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [draftChanges, handleInstructorFlagChange, handleRoleChange, pendingChangeCount]);

  const renderRoleCell = (member: MemberSummary) => {
    const currentRole = resolveDraftRole(member);

    if (!isEditMode) {
      return (
        <span className={ROLE_BADGE_STYLES[currentRole]}>
          {ROLE_LABELS[currentRole]}
        </span>
      );
    }

    return (
      <div className="flex gap-1.5">
        {roleOptions.map(option => {
          const isActive = currentRole === option;
          const styles = isActive ? ROLE_BUTTON_STYLES[option].active : ROLE_BUTTON_STYLES[option].inactive;
          return (
            <button
              key={option}
              type="button"
              onClick={() => updateDraft(member.id, { role: option })}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${styles}`}
            >
              {ROLE_LABELS[option]}
            </button>
          );
        })}
      </div>
    );
  };

  const renderInstructorCell = (member: MemberSummary) => {
    const currentInstructor = resolveDraftInstructor(member);

    if (!isEditMode) {
      const variant = currentInstructor ? 'instructor' : 'member';
      return (
        <span className={INSTRUCTOR_BADGE_STYLES[variant]}>
          {currentInstructor ? '指導者' : '一般'}
        </span>
      );
    }

    return (
      <div className="flex gap-1.5">
        {instructorOptions.map(option => {
          const variant = option.value ? 'instructor' : 'member';
          const isActive = currentInstructor === option.value;
          const styles = isActive ? INSTRUCTOR_BUTTON_STYLES[variant].active : INSTRUCTOR_BUTTON_STYLES[variant].inactive;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => updateDraft(member.id, { is_instructor: option.value })}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${styles}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {isEditMode ? (
          <>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={pendingChangeCount === 0 || isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '保存中...' : `変更を保存${pendingChangeCount ? ` (${pendingChangeCount})` : ''}`}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleEnterEditMode}
            disabled={isLoading || members.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Edit className="h-4 w-4" />
            編集モード
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Users className="w-6 h-6 text-blue-600" />}
          title="登録メンバー"
          value={`${totalMembers}名`}
          description="全ての管理対象メンバー"
          accent="bg-blue-50"
        />
        <SummaryCard
          icon={<Shield className="w-6 h-6 text-purple-600" />}
          title="管理者"
          value={`${adminCount}名`}
          description="アプリ設定を操作可能"
          accent="bg-purple-50"
        />
        <SummaryCard
          icon={<UserCheck className="w-6 h-6 text-green-600" />}
          title="指導者 / ビューアー"
          value={`${instructorCount}名 / ${viewerCount}名`}
          description="特別ロールの状況"
          accent="bg-green-50"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Filter className="h-4 w-4 text-gray-500" />
          絞り込み
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">ロール</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              <option value="admin">管理者</option>
              <option value="basic">基本権限</option>
              <option value="viewer">閲覧のみ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">指導者</label>
            <select
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value as typeof instructorFilter)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {instructorFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">キーワード</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="氏名・メールで検索"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 p-4 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4" />
          {saveError}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">メンバー</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">ロール</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">指導者</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最終アクティブ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <p>読み込み中...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                    条件に一致するメンバーがいません
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900">{member.name}</span>
                        <span className="text-xs text-gray-500">{member.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderRoleCell(member)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderInstructorCell(member)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className="text-sm text-gray-700">{formatRelativeLastActive(member.last_active_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-200">
          {isLoading ? (
            <div className="py-10 text-center text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-3" />
              読み込み中...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              該当するメンバーがいません
            </div>
          ) : (
            filteredMembers.map(member => {
              const currentRole = resolveDraftRole(member);
              const currentInstructor = resolveDraftInstructor(member);
              return (
                <div key={member.id} className="p-3">
                  {isEditMode ? (
                    // 編集モード：縦レイアウト
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-gray-900">{member.name}</div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">ロール</p>
                        <div className="grid grid-cols-3 gap-2">
                          {roleOptions.map(option => {
                            const isActive = currentRole === option;
                            const styles = isActive ? ROLE_BUTTON_STYLES[option].active : ROLE_BUTTON_STYLES[option].inactive;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateDraft(member.id, { role: option })}
                                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${styles}`}
                              >
                                {ROLE_LABELS[option]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">指導者</p>
                        <div className="grid grid-cols-2 gap-2">
                          {instructorOptions.map(option => {
                            const variant = option.value ? 'instructor' : 'member';
                            const isActive = currentInstructor === option.value;
                            const styles = isActive ? INSTRUCTOR_BUTTON_STYLES[variant].active : INSTRUCTOR_BUTTON_STYLES[variant].inactive;
                            return (
                              <button
                                key={option.label}
                                type="button"
                                onClick={() => updateDraft(member.id, { is_instructor: option.value })}
                                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${styles}`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 通常モード：横一列レイアウト
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate flex-shrink min-w-0">
                        <span className="text-sm font-semibold text-gray-900 truncate">{member.name}</span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">({formatRelativeLastActive(member.last_active_at)})</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={ROLE_BADGE_STYLES[currentRole]}>
                          {ROLE_LABELS[currentRole]}
                        </span>
                        <span className={INSTRUCTOR_BADGE_STYLES[currentInstructor ? 'instructor' : 'member']}>
                          {currentInstructor ? '指導者' : '一般'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

type SummaryCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
  accent?: string;
};

function SummaryCard({ icon, title, value, description, accent = 'bg-gray-50' }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className={`p-3 rounded-full ${accent}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

