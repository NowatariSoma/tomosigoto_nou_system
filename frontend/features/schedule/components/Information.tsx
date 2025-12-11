import * as React from 'react';
import { cn } from '@/lib/utils';
import { InformationProps } from '../types/practice-schedule-types';
import { useEffect } from 'react';
import { usePracticeSchedule } from '../hooks/use-practice-schedule-data';
import { formatDateToYYYYMMDD } from '@/shared/utils/format';
import { AttendanceSummary } from './attendance-summary';
import { PracticeDescription } from './practice-description';

const Information: React.FC<InformationProps> = ({
  className,
  currentDate = new Date()
}) => {

  // 練習スケジュール管理フック
  const { scheduleData, loading, error, fetchPracticeScheduleByDate } = usePracticeSchedule();

  // 日付が変更されたときにスケジュールデータを取得
  useEffect(() => {
    const dateString = formatDateToYYYYMMDD(currentDate);
    fetchPracticeScheduleByDate(dateString);
  }, [currentDate, fetchPracticeScheduleByDate]);
  // 日付をフォーマットする関数
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 曜日を取得する関数
  const getWeekday = (date: Date): string => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
  };


  // ローディング状態の表示
  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-6 mt-6 text-center", className)}>
        <div className="text-gray-500">スケジュール情報を読み込み中...</div>
      </div>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-6 mt-6 text-center", className)}>
        <div className="text-gray-600">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-lg p-6 mt-6", className)}>
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        正規練習 {formatDate(currentDate)}（{getWeekday(currentDate)}）
      </h2>
      
      <div className="space-y-3 text-sm text-gray-600 max-w-5xl mx-auto">
        <div className="mb-6">
          <PracticeDescription description={scheduleData?.description} />
        </div>

        {/* 出欠情報詳細 */}
        <div className="mt-6">
          <AttendanceSummary currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
};

Information.displayName = 'Information';

export { Information };