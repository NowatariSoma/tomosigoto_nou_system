'use client';

import React from 'react';
import { useAdminAttendance } from '../hooks/use-admin-attendance';
import { AttendanceTable } from './AttendanceTable';
import { Loader2, AlertCircle } from 'lucide-react';

export const AdminAttendancePage: React.FC = () => {
  const {
    practiceSchedules,
    loading,
    error,
  } = useAdminAttendance();

  // 一時的に管理者権限チェックを無効化（一般ユーザーでもアクセス可能）

  if (loading && practiceSchedules.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error && practiceSchedules.length === 0) {
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
        practiceSchedules={practiceSchedules}
        isEditable={true}
      />
    </div>
  );
};

