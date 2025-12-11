'use client';

import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { Users, Shield, UserCheck, Filter, Search, Loader2, AlertCircle, Edit, Save, X } from 'lucide-react';
import { useMemberManagement } from '../hooks/useMemberManagement';
import { MemberSummary } from '../types';
import { formatRelativeLastActive } from '@/shared/utils/format';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/data-display/table';

const ROLE_LABELS: Record<'admin' | 'basic' | 'viewer', string> = {
  admin: '管理者',
  basic: '基本権限',
  viewer: '閲覧のみ'
};

const ROLE_BADGE_STYLES: Record<'admin' | 'basic' | 'viewer', string> = {
  admin: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-admin shadow-sm',
  basic: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-basic shadow-sm',
  viewer: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-viewer shadow-sm'
};

const ROLE_BUTTON_STYLES: Record<'admin' | 'basic' | 'viewer', { active: string; inactive: string }> = {
  admin: {
    active: 'border badge-admin shadow-sm',
    inactive: 'border border-blue-300 text-blue-700 bg-white hover:bg-blue-50'
  },
  basic: {
    active: 'border badge-basic shadow-sm',
    inactive: 'border border-blue-200 text-blue-600 bg-white hover:bg-blue-50'
  },
  viewer: {
    active: 'border badge-viewer shadow-sm',
    inactive: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
  }
};

const INSTRUCTOR_BADGE_STYLES: Record<'instructor' | 'member', string> = {
  instructor: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-instructor shadow-sm',
  member: 'inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border badge-viewer shadow-sm'
};

const INSTRUCTOR_BUTTON_STYLES: Record<'instructor' | 'member', { active: string; inactive: string }> = {
  instructor: {
    active: 'border badge-instructor shadow-sm',
    inactive: 'border border-accent-200 text-accent-700 bg-white hover:bg-accent-50'
  },
  member: {
    active: 'border badge-viewer shadow-sm',
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
            <Button
              key={option}
              type="button"
              variant="outline"
              onClick={() => updateDraft(member.id, { role: option })}
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${styles}`}
            >
              {ROLE_LABELS[option]}
            </Button>
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
            <Button
              key={option.label}
              type="button"
              variant="outline"
              onClick={() => updateDraft(member.id, { is_instructor: option.value })}
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${styles}`}
            >
              {option.label}
            </Button>
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
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleSaveChanges}
              disabled={pendingChangeCount === 0 || isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '保存中...' : `変更を保存${pendingChangeCount ? ` (${pendingChangeCount})` : ''}`}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={handleEnterEditMode}
            disabled={isLoading || members.length === 0}
            className="gap-2 bg-blue-400 hover:bg-blue-500"
          >
            <Edit className="h-4 w-4" />
            編集モード
          </Button>
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
          icon={<Shield className="w-6 h-6 text-blue-600" />}
          title="管理者"
          value={`${adminCount}名`}
          description="アプリ設定を操作可能"
          accent="bg-blue-50"
        />
        <SummaryCard
          icon={<UserCheck className="w-6 h-6 text-accent-500" />}
          title="指導者 / ビューアー"
          value={`${instructorCount}名 / ${viewerCount}名`}
          description="特別ロールの状況"
          accent="bg-accent-50"
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
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="admin">管理者</SelectItem>
                <SelectItem value="basic">基本権限</SelectItem>
                <SelectItem value="viewer">閲覧のみ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">指導者</label>
            <Select value={instructorFilter} onValueChange={(value) => setInstructorFilter(value as typeof instructorFilter)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                {instructorFilterOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">キーワード</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="氏名・メールで検索"
                className="pl-9"
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
          <Table className="min-w-full divide-y divide-gray-200">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">メンバー</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">ロール</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">指導者</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最終アクティブ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <p>読み込み中...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-16 text-center text-gray-500">
                    条件に一致するメンバーがいません
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map(member => (
                  <TableRow key={member.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900">{member.name}</span>
                        <span className="text-xs text-gray-500">{member.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 align-top">
                      {renderRoleCell(member)}
                    </TableCell>
                    <TableCell className="px-6 py-4 align-top">
                      {renderInstructorCell(member)}
                    </TableCell>
                    <TableCell className="px-6 py-4 align-top">
                      <span className="text-sm text-gray-700">{formatRelativeLastActive(member.last_active_at)}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
                              <Button
                                key={option}
                                type="button"
                                variant="outline"
                                onClick={() => updateDraft(member.id, { role: option })}
                                className={`px-2 py-1.5 text-xs font-medium transition-colors ${styles}`}
                              >
                                {ROLE_LABELS[option]}
                              </Button>
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
                              <Button
                                key={option.label}
                                type="button"
                                variant="outline"
                                onClick={() => updateDraft(member.id, { is_instructor: option.value })}
                                className={`px-2 py-1.5 text-xs font-medium transition-colors ${styles}`}
                              >
                                {option.label}
                              </Button>
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

