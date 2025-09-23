import * as React from 'react';
import { cn } from '@/lib/utils';
import { InformationProps } from '@/features/practice-slots/types/schedule';
import { useEffect } from 'react';
import { usePracticeSchedule } from '../hooks';

const Information: React.FC<InformationProps> = ({ 
  className,
  currentDate = new Date()
}) => {
  
  // 練習スケジュール管理フック
  const { scheduleData, loading, error, fetchPracticeScheduleByDate } = usePracticeSchedule();

  // 日付が変更されたときにスケジュールデータを取得
  useEffect(() => {
    const dateString = currentDate.toISOString().split('T')[0];
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
        <div className="text-red-500">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-lg p-6 mt-6", className)}>
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        正規練習 {formatDate(currentDate)}（{getWeekday(currentDate)}）
      </h2>
      
      {scheduleData && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">スケジュール詳細:</h3>
          {scheduleData.title && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">タイトル:</span> {scheduleData.title}
            </p>
          )}
          <p className="text-sm text-gray-600">
            <span className="font-medium">時間:</span> {scheduleData.start_time} - {scheduleData.end_time}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">内容:</span> {scheduleData.description || '練習'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">タイプ:</span> {scheduleData.schedule_type || '通常'}
          </p>
        </div>
      )}
      
      <div className="space-y-3 text-sm text-gray-600 max-w-4xl mx-auto">        
        <div className="mt-4">
          <h3 className="font-medium text-gray-800 mb-2">練習内容:</h3>
          {scheduleData ? (
            <ul className="space-y-1 text-xs">
              {scheduleData.title && <li>・タイトル: {scheduleData.title}</li>}
              <li>・{scheduleData.description || '練習内容が登録されていません'}</li>
              <li>・練習タイプ: {scheduleData.schedule_type || '未設定'}</li>
              <li>・ステータス: {scheduleData.status || '未設定'}</li>
            </ul>
          ) : (
            <p className="text-gray-500">スケジュールデータがありません</p>
          )}
        </div>
      </div>
    </div>
  );
};

Information.displayName = 'Information';

export { Information };