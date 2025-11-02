import * as React from 'react';
import { cn } from '@/lib/utils';
import { InformationProps } from '@/features/practice-slots/types/schedule';
import { useEffect, useState } from 'react';
import { usePracticeSchedule } from '../hooks';
import { AttendanceWithUser } from '@/features/attendance/types/attendance';
import { PracticeNote } from '@/features/practice-notes/types';
import { attendanceService } from '@/features/attendance/services/attendance-service';
import { practiceNotesService } from '@/features/practice-notes/services/practice-notes-service';

const Information: React.FC<InformationProps> = ({
  className,
  currentDate = new Date()
}) => {

  // 練習スケジュール管理フック
  const { scheduleData, loading, error, fetchPracticeScheduleByDate } = usePracticeSchedule();

  // 欠席メンバーと備考の状態管理
  const [absentMembers, setAbsentMembers] = useState<AttendanceWithUser[]>([]);
  const [notes, setNotes] = useState<PracticeNote[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  // 日付が変更されたときにスケジュールデータを取得
  useEffect(() => {
    const dateString = currentDate.toISOString().split('T')[0];
    fetchPracticeScheduleByDate(dateString);
  }, [currentDate, fetchPracticeScheduleByDate]);

  // スケジュールIDが取得できたら、欠席メンバーと備考を取得
  useEffect(() => {
    const fetchExtras = async () => {
      if (!scheduleData?.id) {
        setAbsentMembers([]);
        setNotes([]);
        return;
      }

      setLoadingExtras(true);
      try {
        // 出席データを取得
        const attendances = await attendanceService.getAttendancesByPracticeWithUsers(scheduleData.id);
        // 欠席者のみをフィルタリング
        const absent = attendances.filter(a => a.status === 'absent');
        setAbsentMembers(absent);

        // 備考を取得
        const practiceNotes = await practiceNotesService.getNotesByPractice(scheduleData.id);
        setNotes(practiceNotes);
      } catch (error) {
        console.error('欠席メンバーまたは備考の取得に失敗:', error);
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchExtras();
  }, [scheduleData?.id]);

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

        {/* 備考セクション */}
        {scheduleData && notes.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-800 mb-2">備考:</h3>
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <h4 className="font-semibold text-gray-800 text-sm">{note.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 欠席メンバーセクション */}
        {scheduleData && absentMembers.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-800 mb-2">欠席メンバー（{absentMembers.length}名）:</h3>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <ul className="space-y-1 text-xs">
                {absentMembers.map((attendance) => {
                  const profile = attendance.user_profiles;
                  const userName = profile
                    ? `${profile.last_name_kanji || ''} ${profile.first_name_kanji || ''}`
                    : '不明';

                  return (
                    <li key={attendance.id} className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <div className="flex-1">
                        <span className="font-medium">{userName.trim() || '不明'}</span>
                        {attendance.notes && (
                          <span className="text-gray-600 ml-2">（{attendance.notes}）</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {loadingExtras && (
          <div className="text-center text-gray-500 text-xs mt-4">
            欠席情報・備考を読み込み中...
          </div>
        )}
      </div>
    </div>
  );
};

Information.displayName = 'Information';

export { Information };
