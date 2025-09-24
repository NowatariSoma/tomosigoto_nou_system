'use client';

import React, { useState, useEffect } from 'react';
import { useAttendance } from '../hooks';
import { usePracticeSchedule as useAllPracticeSchedules } from '../hooks/use-practice-schedule';
import { SimpleAttendanceForm } from './SimpleAttendanceForm';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';

interface PracticeAttendancePageProps {
  practiceId: string;
}

export const PracticeAttendancePage: React.FC<PracticeAttendancePageProps> = ({
  practiceId,
}) => {
  const { practiceSchedules, loading: practiceLoading, error: practiceError } = useAllPracticeSchedules();
  const { upsertAttendance } = useAttendance();
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>(practiceId);
  const [formLoading, setFormLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedPractice = practiceSchedules.find(p => p.id === selectedPracticeId);

  // モックユーザーデータ（開発用）
  const mockUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    name: 'テストユーザー',
  };

  const handleSubmit = async (data: { status: string; notes: string }) => {
    if (!selectedPractice) return;

    try {
      setFormLoading(true);
      setSubmitError(null);

      await upsertAttendance({
        practice_schedule_id: selectedPractice.id,
        user_id: mockUser.id,
        status: data.status as 'present' | 'absent' | 'late' | 'excused',
        notes: data.notes,
      });
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      setSubmitError('出席登録に失敗しました。もう一度お試しください。');
    } finally {
      setFormLoading(false);
    }
  };

  if (practiceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">練習情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (practiceError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">{practiceError}</p>
        </div>
      </div>
    );
  }

  return (
    <AppTemplate
      title="出席登録"
      description="練習の出席状況を登録してください"
      maxWidth="2xl"
    >
      {/* エラーメッセージ */}
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      {/* 練習選択 */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          練習を選択
        </label>
        <select
          value={selectedPracticeId}
          onChange={(e) => setSelectedPracticeId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {practiceSchedules.map((schedule) => (
            <option key={schedule.id} value={schedule.id}>
              {schedule.date} {schedule.startTime}-{schedule.endTime} {schedule.title || ''}
            </option>
          ))}
        </select>
      </div>

      {/* 出席フォーム */}
      {selectedPractice && (
        <SimpleAttendanceForm
          practiceSchedule={selectedPractice}
          onSubmit={handleSubmit}
          loading={formLoading}
        />
      )}

      {/* フッター */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>出席登録に関するお問い合わせは管理者までご連絡ください。</p>
      </div>
    </AppTemplate>
  );
};
