'use client';

import React, { useState } from 'react';
import { useAdminAttendance } from '../hooks/use-admin-attendance';
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
    upsertAttendance,
  } = useAdminAttendance();

  const [selectedPracticeId, setSelectedPracticeId] = useState<string>('');

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
      <AttendanceTable
        users={users}
        attendances={attendances}
        practiceSchedules={practiceSchedules}
        selectedPracticeId={selectedPracticeId}
        onPracticeChange={handlePracticeChange}
        onAttendanceUpdate={handleAttendanceUpdate}
        isEditable={true}
        loading={loading}
      />
    </div>
  );
};

