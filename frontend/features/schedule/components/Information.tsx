import * as React from 'react';
import { cn } from '@/lib/utils';
import { AttendanceSummary } from './AttendanceSummary';
import { PracticeDescription } from './PracticeDescription';
import { PracticeScheduleBundleResponse, PracticeScheduleDisplayResponse } from '../types/practice-schedule-types';
import { Attendance } from '../types/attendance';

interface InformationProps {
  className?: string;
  currentDate?: Date;
  // 軽量データ（練習内容用）- 先にロード
  basicSchedule?: PracticeScheduleDisplayResponse | null;
  basicLoading?: boolean;
  basicError?: string | null;
  // 重いデータ（出欠詳細用）- 後からロード
  bundleData?: PracticeScheduleBundleResponse | null;
  bundleLoading?: boolean;
  bundleError?: string | null;
}

const Information: React.FC<InformationProps> = ({
  className,
  currentDate = new Date(),
  basicSchedule,
  basicLoading = false,
  basicError = null,
  bundleData,
  bundleLoading = false,
  bundleError = null
}) => {
  // 練習内容はbasicScheduleから先に取得、なければbundleDataから
  const description = basicSchedule?.description ?? bundleData?.schedule?.description;
  // 出欠詳細はbundleDataから
  const scheduleData = bundleData?.schedule ?? null;
  const attendances: Attendance[] = bundleData?.attendance?.entries ?? [];
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


  // 練習内容のローディング状態
  if (basicLoading) {
    return (
      <div className={cn("card-blue shadow-lg p-6 mt-6 text-center", className)}>
        <div className="text-black">練習情報を読み込み中...</div>
      </div>
    );
  }

  // 練習内容のエラー状態
  if (basicError) {
    return (
      <div className={cn("card-blue shadow-lg p-6 mt-6 text-center", className)}>
        <div className="text-red-500">エラー: {basicError}</div>
      </div>
    );
  }

  // 練習内容がない場合
  if (!description && !basicSchedule) {
    return null;
  }

  return (
    <div className={cn("card-blue shadow-lg p-6 mt-6", className)}>
      <h2 className="section-title-xl font-bold mb-4 text-center">
        正規練習 {formatDate(currentDate)}（{getWeekday(currentDate)}）
      </h2>

      <div className="space-y-3 text-sm text-black max-w-5xl mx-auto">
        {/* 練習内容（軽量データから先に表示） */}
        <div className="mb-6">
          <PracticeDescription description={description} />
        </div>

        {/* 出欠情報詳細（bundle データから後に表示） */}
        <div className="mt-6">
          <AttendanceSummary
            currentDate={currentDate}
            attendances={attendances}
            practiceSchedule={scheduleData ? {
              id: scheduleData.id,
              schedule_date: scheduleData.schedule_date,
              start_time: scheduleData.start_time || '',
              end_time: scheduleData.end_time || '',
              division_count: scheduleData.division_count || 1,
              title: scheduleData.title,
              description: scheduleData.description,
            } : null}
            loading={bundleLoading}
            error={bundleError}
          />
        </div>
      </div>
    </div>
  );
};

Information.displayName = 'Information';

export { Information };