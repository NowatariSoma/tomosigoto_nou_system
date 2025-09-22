'use client';

import React, { useState } from 'react';
import { usePracticeSchedule, useAttendance } from '../hooks';
import { SimpleAttendanceForm } from './SimpleAttendanceForm';
import { AlertCircle, Loader2 } from 'lucide-react';

interface PracticeAttendancePageProps {
  practiceId: string;
}

export const PracticeAttendancePage: React.FC<PracticeAttendancePageProps> = ({
  practiceId,
}) => {
  const { practiceSchedule, loading: practiceLoading, error: practiceError } = usePracticeSchedule(practiceId);
  const { upsertAttendance } = useAttendance();
  const [formLoading, setFormLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // モックユーザーデータ（開発用）
  const mockUser = {
    id: 'mock-user-1',
    email: 'test@example.com',
    name: 'テストユーザー',
  };

  const handleSubmit = async (data: { status: string; notes: string }) => {
    if (!practiceSchedule) return;

    try {
      setFormLoading(true);
      setSubmitError(null);
      
      await upsertAttendance({
        practice_schedule_id: practiceSchedule.id,
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

  if (practiceError || !practiceSchedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">
            {practiceError || '練習情報が見つかりませんでした。'}
          </p>
          <p className="text-sm text-gray-500">
            練習ID: {practiceId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* エラーメッセージ */}
        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        {/* 出席フォーム */}
        <SimpleAttendanceForm
          practiceSchedule={practiceSchedule}
          onSubmit={handleSubmit}
          loading={formLoading}
        />

        {/* フッター */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>出席登録に関するお問い合わせは管理者までご連絡ください。</p>
        </div>
      </div>
    </div>
  );
};
