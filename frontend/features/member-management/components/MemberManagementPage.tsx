'use client';

import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { Users, Shield, UserCheck, Filter, RefreshCw, Search, Loader2, AlertCircle } from 'lucide-react';
import { useMemberManagement } from '../hooks/useMemberManagement';
import { formatDateTime } from '@/shared/utils/format';

const ROLE_LABELS: Record<'admin' | 'basic' | 'viewer', string> = {
  admin: '管理者',
  basic: '基本権限',
  viewer: '閲覧のみ'
};

const ROLE_BADGE_STYLES: Record<'admin' | 'basic' | 'viewer', string> = {
  admin: 'bg-purple-100 text-purple-800 border border-purple-200',
  basic: 'bg-blue-100 text-blue-800 border border-blue-200',
  viewer: 'bg-gray-100 text-gray-700 border border-gray-200'
};

const instructorFilterOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'only', label: '指導者のみ' },
  { value: 'exclude', label: '指導者以外' },
] as const;

export function MemberManagementPage() {
  const {
    members,
    isLoading,
    error,
    adminCount,
    handleRoleChange,
    handleInstructorFlagChange,
    fetchMembers,
  } = useMemberManagement();

  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'basic' | 'viewer'>('all');
  const [instructorFilter, setInstructorFilter] = useState<'all' | 'only' | 'exclude'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const totalMembers = members.length;
  const viewerCount = useMemo(() => members.filter(member => member.role === 'viewer').length, [members]);
  const instructorCount = useMemo(() => members.filter(member => member.is_instructor).length, [members]);

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

  const renderRoleSelect = useCallback((memberId: string, role: 'admin' | 'basic' | 'viewer') => (
    <select
      value={role}
      onChange={(e) => handleRoleChange(memberId, e.target.value as 'admin' | 'basic' | 'viewer')}
      className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {Object.entries(ROLE_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  ), [handleRoleChange]);

  const renderInstructorToggle = useCallback((memberId: string, checked: boolean) => (
    <label className="inline-flex items-center cursor-pointer space-x-2">
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => handleInstructorFlagChange(memberId, e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-200 peer-checked:bg-blue-600 transition-colors"></div>
        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow peer-checked:translate-x-full transition-transform"></div>
      </span>
      <span className="text-sm text-gray-600">
        {checked ? '指導者' : '一般'}
      </span>
    </label>
  ), [handleInstructorFlagChange]);

  const renderLastActive = (timestamp: string | null) => (
    timestamp ? (
      <div className="text-sm text-gray-900">{formatDateTime(timestamp)}</div>
    ) : (
      <span className="text-sm text-gray-400">記録なし</span>
    )
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">メンバー管理</h2>
              <p className="text-sm text-gray-600">権限と指導者フラグを効率的に管理します</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchMembers}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
            >
              <RefreshCw className="h-4 w-4" />
              最新情報を取得
            </button>
          </div>
        </div>
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
                  <tr key={member.id} className="hover:bg-gray-50/70">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900">{member.name}</span>
                        <span className="text-xs text-gray-500">{member.email}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 mt-2 text-xs font-medium rounded ${ROLE_BADGE_STYLES[member.role]}`}>
                          {ROLE_LABELS[member.role]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderRoleSelect(member.id, member.role)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderInstructorToggle(member.id, member.is_instructor)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderLastActive(member.last_active_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
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
            filteredMembers.map(member => (
              <div key={member.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${ROLE_BADGE_STYLES[member.role]}`}>
                    {ROLE_LABELS[member.role]}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">ロール</p>
                    {renderRoleSelect(member.id, member.role)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">指導者</p>
                    {renderInstructorToggle(member.id, member.is_instructor)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">最終アクティブ</p>
                    {renderLastActive(member.last_active_at)}
                  </div>
                </div>
              </div>
            ))
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

