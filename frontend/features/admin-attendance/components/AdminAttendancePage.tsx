'use client';

import React, { useState } from 'react';
import { useAdminAttendance } from '../hooks/use-admin-attendance';
import { BulkAttendanceForm } from './BulkAttendanceForm';
import { AttendanceTable } from './AttendanceTable';
import { AttendanceCreate } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

export const AdminAttendancePage: React.FC = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const {
    users,
    attendances,
    practiceSchedules,
    loading,
    error,
    fetchAttendancesByPractice,
    bulkUpdateAttendances,
    upsertAttendance,
  } = useAdminAttendance();

  const [selectedPracticeId, setSelectedPracticeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'bulk' | 'table'>('bulk');

  // 権限チェック
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600">このページは管理者のみアクセスできます。</p>
        </div>
      </div>
    );
  }

  const handleBulkSubmit = async (practiceScheduleId: string, attendances: AttendanceCreate[]) => {
    await bulkUpdateAttendances(practiceScheduleId, attendances);
    // 更新後に出席記録を再取得
    await fetchAttendancesByPractice(practiceScheduleId);
    setSelectedPracticeId(practiceScheduleId);
    setActiveTab('table');
  };

  const handlePracticeChange = async (practiceId: string) => {
    setSelectedPracticeId(practiceId);
    if (practiceId) {
      await fetchAttendancesByPractice(practiceId);
    }
  };

  const handleAttendanceUpdate = async (attendance: AttendanceCreate) => {
    await upsertAttendance(attendance);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* タブ切り替え */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bulk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            一括登録
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'table'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            出席一覧
          </button>
        </nav>
      </div>

      {/* コンテンツ */}
      {activeTab === 'bulk' ? (
        <BulkAttendanceForm
          practiceSchedules={practiceSchedules}
          users={users}
          onSubmit={handleBulkSubmit}
          loading={loading}
        />
      ) : (
        <AttendanceTable
          users={users}
          attendances={attendances}
          practiceSchedules={practiceSchedules}
          selectedPracticeId={selectedPracticeId}
          onPracticeChange={handlePracticeChange}
          onAttendanceUpdate={handleAttendanceUpdate}
          isEditable={true}
        />
      )}
    </div>
  );
};

