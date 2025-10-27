'use client';

import React, { useState, useEffect } from 'react';
import { useAttendance } from '../hooks';
import { usePracticeSchedule as useAllPracticeSchedules } from '../hooks/use-practice-schedule';
import { SimpleAttendanceForm } from './SimpleAttendanceForm';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

interface PracticeAttendancePageProps {
  practiceId: string;
}

export const PracticeAttendancePage: React.FC<PracticeAttendancePageProps> = ({
  practiceId,
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { practiceSchedules, loading: practiceLoading, error: practiceError } = useAllPracticeSchedules();
  const { upsertAttendance } = useAttendance();
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>(practiceId);
  const [formLoading, setFormLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedPractice = practiceSchedules.find(p => p.id === selectedPracticeId);

  const handleSubmit = async (data: { status: string; notes: string; userId: string; practiceScheduleId: string; availableFrom?: string; availableTo?: string }) => {
    if (!user) return;

    try {
      setFormLoading(true);
      setSubmitError(null);

      await upsertAttendance({
        practice_schedule_id: data.practiceScheduleId,
        user_id: data.userId,
        status: data.status as 'present' | 'absent' | 'late' | 'no_show',
        notes: data.notes,
        available_from: data.availableFrom,
        available_to: data.availableTo,
      });
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      setSubmitError('出席登録に失敗しました。もう一度お試しください。');
    } finally {
      setFormLoading(false);
    }
  };

  // ローディング中
  if (authLoading || practiceLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {authLoading ? '認証情報を確認中...' : '練習情報を読み込み中...'}
          </p>
        </div>
      </div>
    );
  }

  // 認証エラー
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">ログインが必要です</h2>
          <p className="text-red-600">出席登録を行うにはログインしてください。</p>
        </div>
      </div>
    );
  }

  // データ取得エラー
  if (practiceError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600">{practiceError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* エラーメッセージ */}
      {submitError && (
        <div className="mb-6 bg-white border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      {/* 出席フォーム */}
      {selectedPractice && (
        <SimpleAttendanceForm
          practiceSchedules={[selectedPractice]}
          users={[]}
          currentUserId={user.id}
          onSubmit={handleSubmit}
          loading={formLoading}
        />
      )}
    </div>
  );
};
