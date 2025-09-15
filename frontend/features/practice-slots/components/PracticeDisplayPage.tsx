'use client';

import React, { useEffect } from 'react';
import { usePracticeDisplay } from '../hooks/usePracticeDisplay';
import { PracticeScheduleCard } from './PracticeScheduleCard';
import { PracticeDisplayTable } from './PracticeDisplayTable';
import { SessionList } from './SessionList';
import { VenueList } from './VenueList';
import { UI_TEXT } from '../constants/practice-display';

interface PracticeDisplayPageProps {
  scheduleId: string;
}

export const PracticeDisplayPage: React.FC<PracticeDisplayPageProps> = ({
  scheduleId,
}) => {
  const { schedule, loading, error, fetchPracticeSchedule } = usePracticeDisplay();

  useEffect(() => {
    if (scheduleId) {
      fetchPracticeSchedule(scheduleId);
    }
  }, [scheduleId, fetchPracticeSchedule]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{UI_TEXT.LOADING_TEXT}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{UI_TEXT.NO_SCHEDULE_DATA}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* スケジュール基本情報 */}
      <PracticeScheduleCard schedule={schedule} />

      {/* 練習表テーブル（既存UIスタイル） */}
      {schedule.sessions.length > 0 && (
        <PracticeDisplayTable schedule={schedule} />
      )}

      {/* 利用可能会場 */}
      {schedule.available_venues.length > 0 && (
        <VenueList venues={schedule.available_venues} />
      )}

      {/* セッション詳細一覧 */}
      {schedule.sessions.length > 0 && (
        <SessionList sessions={schedule.sessions} />
      )}

      {schedule.sessions.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-gray-500">{UI_TEXT.NO_SESSIONS}</div>
        </div>
      )}
    </div>
  );
};