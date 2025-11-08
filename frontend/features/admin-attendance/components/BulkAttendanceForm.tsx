'use client';

import React, { useState, useEffect } from 'react';
import { User, PracticeSchedule, AttendanceCreate } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, UI_TEXT, VALIDATION } from '../constants';
import { Save, Calendar, Users, Clock, FileText, CheckCircle } from 'lucide-react';

interface BulkAttendanceFormProps {
  practiceSchedules: PracticeSchedule[];
  users: User[];
  onSubmit: (practiceScheduleId: string, attendances: AttendanceCreate[]) => Promise<void>;
  loading?: boolean;
  onComplete?: () => void;
  showCompletionMessage?: boolean;
}

export const BulkAttendanceForm: React.FC<BulkAttendanceFormProps> = ({
  practiceSchedules,
  users,
  onSubmit,
  loading = false,
  onComplete,
  showCompletionMessage = true,
}) => {
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>('');
  const [setUnenteredToPresent, setSetUnenteredToPresent] = useState<boolean>(true);
  const [attendanceData, setAttendanceData] = useState<Record<string, {
    status: string;
    notes: string;
    availableFrom: string;
    availableTo: string;
  }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // フォームをリセットする関数
  const resetForm = () => {
    setSelectedPracticeId('');
    setAttendanceData({});
    setErrors({});
    setIsSubmitted(false);
  };

  // 親コンポーネントからフォームが閉じられた時にリセット
  useEffect(() => {
    if (!showCompletionMessage && isSubmitted) {
      // showCompletionMessageがfalseの場合、完了後に自動的にリセット
      const timer = setTimeout(() => {
        resetForm();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, showCompletionMessage]);

  // 選択された練習が変更されたら、未入力のユーザーを出席に設定
  useEffect(() => {
    if (selectedPracticeId && setUnenteredToPresent) {
      const newData: Record<string, {
        status: string;
        notes: string;
        availableFrom: string;
        availableTo: string;
      }> = { ...attendanceData };
      
      users.forEach(user => {
        if (!newData[user.id]) {
          newData[user.id] = {
            status: ATTENDANCE_STATUS.PRESENT,
            notes: '',
            availableFrom: '',
            availableTo: '',
          };
        }
      });
      
      setAttendanceData(newData);
    }
  }, [selectedPracticeId, setUnenteredToPresent, users]);

  const handleStatusChange = (userId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        status,
        // 遅刻以外の場合は時間フィールドをクリア
        availableFrom: status === ATTENDANCE_STATUS.LATE ? prev[userId]?.availableFrom || '' : '',
        availableTo: status === ATTENDANCE_STATUS.LATE ? prev[userId]?.availableTo || '' : '',
      },
    }));
    // エラーをクリア
    if (errors[userId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[userId];
        return newErrors;
      });
    }
  };

  const handleNotesChange = (userId: string, notes: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        notes,
      },
    }));
  };

  const handleTimeChange = (userId: string, field: 'availableFrom' | 'availableTo', value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedPracticeId) {
      newErrors.practice = '練習を選択してください';
    }

    users.forEach(user => {
      const data = attendanceData[user.id];
      if (!data || !data.status) {
        if (!setUnenteredToPresent) {
          newErrors[user.id] = '出席状況を選択してください';
        }
      } else {
        // 遅刻の場合は時間入力が必要
        if (data.status === ATTENDANCE_STATUS.LATE) {
          if (!data.availableFrom && !data.availableTo) {
            newErrors[user.id] = '参加可能時間を入力してください';
          } else if (data.availableFrom && data.availableTo && data.availableFrom >= data.availableTo) {
            newErrors[user.id] = '開始時刻は終了時刻より前にしてください';
          }
        }
        // 欠席の場合は備考が必要
        if (data.status === ATTENDANCE_STATUS.ABSENT) {
          if (!data.notes || data.notes.trim().length === 0) {
            newErrors[user.id] = '欠席の場合は備考を入力してください';
          } else if (data.notes.trim().length < 30) {
            newErrors[user.id] = '備考は30文字以上入力してください';
          }
        }
        // 備考の文字数制限
        if (data.notes && data.notes.length > VALIDATION.MAX_NOTES_LENGTH) {
          newErrors[user.id] = `備考は${VALIDATION.MAX_NOTES_LENGTH}文字以内で入力してください`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const attendances: AttendanceCreate[] = users.map(user => {
        const data = attendanceData[user.id] || {
          status: setUnenteredToPresent ? ATTENDANCE_STATUS.PRESENT : '',
          notes: '',
          availableFrom: '',
          availableTo: '',
        };

        return {
          practice_schedule_id: selectedPracticeId,
          user_id: user.id,
          status: data.status as 'present' | 'absent' | 'late' | 'no_show',
          notes: data.notes || undefined,
          available_from: data.status === ATTENDANCE_STATUS.LATE && data.availableFrom
            ? data.availableFrom
            : undefined,
          available_to: data.status === ATTENDANCE_STATUS.LATE && data.availableTo
            ? data.availableTo
            : undefined,
        };
      }).filter(a => a.status); // ステータスが設定されているもののみ

      await onSubmit(selectedPracticeId, attendances);
      setIsSubmitted(true);
      // 完了コールバックを呼び出す
      if (onComplete) {
        // 少し遅延を入れてからコールバックを呼び出す（完了メッセージを表示する時間を確保）
        setTimeout(() => {
          onComplete();
        }, showCompletionMessage ? 1500 : 0);
      }
    } catch (error) {
      console.error('Failed to submit bulk attendance:', error);
    }
  };

  if (isSubmitted && showCompletionMessage) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-green-50 p-4 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">一括出席登録完了</h2>
            <p className="text-gray-600 leading-relaxed">
              出席状況の一括登録が完了しました。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedPractice = practiceSchedules.find(p => p.id === selectedPracticeId);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {UI_TEXT.BULK_ATTENDANCE_REGISTRATION}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 練習選択 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4" />
            <span>{UI_TEXT.PRACTICE} <span className="text-red-500">*</span></span>
          </label>
          <select
            value={selectedPracticeId}
            onChange={(e) => {
              setSelectedPracticeId(e.target.value);
              setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.practice;
                return newErrors;
              });
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
              errors.practice ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">{UI_TEXT.SELECT_PRACTICE}</option>
            {practiceSchedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.title || '練習'} - {new Date(schedule.schedule_date).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })} {schedule.start_time} - {schedule.end_time}
              </option>
            ))}
          </select>
          {errors.practice && (
            <p className="mt-1 text-sm text-red-600">{errors.practice}</p>
          )}
        </div>

        {/* 選択された練習の詳細 */}
        {selectedPractice && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">練習情報</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p>日付: {new Date(selectedPractice.schedule_date).toLocaleDateString('ja-JP')}</p>
              <p>時間: {selectedPractice.start_time} - {selectedPractice.end_time}</p>
              {selectedPractice.title && <p>タイトル: {selectedPractice.title}</p>}
            </div>
          </div>
        )}

        {/* 未入力を出席にするオプション */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="setUnenteredToPresent"
            checked={setUnenteredToPresent}
            onChange={(e) => setSetUnenteredToPresent(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="setUnenteredToPresent" className="text-sm font-medium text-gray-700">
            {UI_TEXT.SET_UNENTERED_TO_PRESENT}
          </label>
        </div>

        {/* ユーザー一覧 */}
        {selectedPracticeId && users.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                ユーザー一覧 ({users.length}名)
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {users.map((user) => {
                const data = attendanceData[user.id] || {
                  status: setUnenteredToPresent ? ATTENDANCE_STATUS.PRESENT : '',
                  notes: '',
                  availableFrom: '',
                  availableTo: '',
                };
                const userError = errors[user.id];

                return (
                  <div key={user.id} className="border-b border-gray-200 p-4 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      
                      {/* 出席状況 */}
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          出席状況
                        </label>
                        <select
                          value={data.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          className={`text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            userError ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">選択</option>
                          {Object.entries(ATTENDANCE_STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 参加可能時間（遅刻の場合のみ） */}
                      {data.status === ATTENDANCE_STATUS.LATE && (
                        <div className="flex-shrink-0 space-x-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              開始
                            </label>
                            <input
                              type="time"
                              value={data.availableFrom}
                              onChange={(e) => handleTimeChange(user.id, 'availableFrom', e.target.value)}
                              className="text-sm px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              終了
                            </label>
                            <input
                              type="time"
                              value={data.availableTo}
                              onChange={(e) => handleTimeChange(user.id, 'availableTo', e.target.value)}
                              className="text-sm px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* 備考 */}
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          備考
                        </label>
                        <textarea
                          value={data.notes}
                          onChange={(e) => handleNotesChange(user.id, e.target.value)}
                          rows={2}
                          placeholder={data.status === ATTENDANCE_STATUS.ABSENT ? '欠席理由を入力（30文字以上）' : '備考（任意）'}
                          className={`w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                            userError ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                    {userError && (
                      <p className="mt-1 text-xs text-red-600">{userError}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 送信ボタン */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || !selectedPracticeId}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? '保存中...' : UI_TEXT.BULK_SAVE}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

