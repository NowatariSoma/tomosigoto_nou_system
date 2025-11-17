'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Users, Shield } from 'lucide-react';
import { useMemberManagement } from '../hooks/useMemberManagement';
import { formatDateTime } from '@/shared/utils/format';

const ROLE_LABELS: Record<'admin' | 'basic', string> = {
  admin: '管理者',
  basic: '基本権限',
};

export function MemberManagementPage() {
  const {
    members,
    isLoading,
    error,
    adminCount,
    handleRoleChange,
    fetchMembers,
  } = useMemberManagement();

  const lastUpdated = useMemo(() => {
    const timestamps = members
      .map(member => member.last_active_at ? new Date(member.last_active_at).getTime() : 0)
      .filter(Boolean);
    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps));
  }, [members]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">メンバー管理</h2>
          <p className="text-gray-600">権限の更新を行えます</p>
        </div>
        <Button variant="outline" onClick={fetchMembers} className="w-full sm:w-auto">
          最新情報に更新
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-gray-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-full bg-blue-50 p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">登録メンバー</p>
              <p className="text-2xl font-semibold text-gray-900">{members.length}名</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-full bg-purple-50 p-3">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">管理者</p>
              <p className="text-2xl font-semibold text-gray-900">{adminCount}名</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-full bg-green-50 p-3">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">最終更新</p>
              <p className="text-lg font-semibold text-gray-900">
                {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : '情報なし'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メンバー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    権限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終アクティブ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      読み込み中です…
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      メンバーが登録されていません
                    </td>
                  </tr>
                ) : (
                  members.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{member.name}</span>
                          <span className="text-sm text-gray-500">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'basic')}
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
                        >
                          <option value="admin">{ROLE_LABELS.admin}</option>
                          <option value="basic">{ROLE_LABELS.basic}</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.last_active_at ? formatDateTime(member.last_active_at) : '記録なし'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

