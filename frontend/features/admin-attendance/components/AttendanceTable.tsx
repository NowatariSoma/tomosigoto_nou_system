'use client';

import React, { useState, useMemo } from 'react';
import { User, Attendance, PracticeSchedule, AttendanceCreate } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS, UI_TEXT } from '../constants';
import { Calendar, Filter } from 'lucide-react';

interface AttendanceTableProps {
  users: User[];
  attendances: Attendance[];
  practiceSchedules: PracticeSchedule[];
  selectedPracticeId?: string;
  onPracticeChange?: (practiceId: string) => void;
  onAttendanceUpdate?: (attendance: AttendanceCreate) => Promise<void>;
  isEditable?: boolean;
  loading?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  users,
  attendances,
  practiceSchedules,
  selectedPracticeId,
  onPracticeChange,
  onAttendanceUpdate,
  isEditable = true,
  loading = false,
}) => {
  const [filterPracticeId, setFilterPracticeId] = useState<string>(selectedPracticeId || '');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  // フィルタリングされた練習スケジュール
  const filteredPracticeSchedules = useMemo(() => {
    let filtered = practiceSchedules;

    if (filterStartDate) {
      filtered = filtered.filter(p => new Date(p.schedule_date) >= new Date(filterStartDate));
    }
    if (filterEndDate) {
      filtered = filtered.filter(p => new Date(p.schedule_date) <= new Date(filterEndDate));
    }

    return filtered;
  }, [practiceSchedules, filterStartDate, filterEndDate]);

  // 表示する練習を決定
  const displayPracticeId = filterPracticeId || selectedPracticeId || '';

  // ユーザーと出席記録をマージ
  const tableData = useMemo(() => {
    if (!displayPracticeId) return [];

    const practiceAttendances = attendances.filter(
      a => a.practice_schedule_id === displayPracticeId
    );

    let data = users.map(user => {
      const attendance = practiceAttendances.find(a => a.user_id === user.id);
      return {
        user,
        attendance,
      };
    });

    // 出席状況でフィルタ
    if (filterStatus !== 'all') {
      if (filterStatus === 'unregistered') {
        data = data.filter(item => !item.attendance);
      } else {
        data = data.filter(item => {
          if (!item.attendance) return false;
          return item.attendance.status === filterStatus;
        });
      }
    }

    return data;
  }, [users, attendances, displayPracticeId, filterStatus]);

  const handleStatusChange = async (userId: string, status: 'present' | 'absent' | 'late' | 'no_show') => {
    if (!displayPracticeId || !onAttendanceUpdate) return;

    setSavingUserId(userId);
    try {
      await onAttendanceUpdate({
        practice_schedule_id: displayPracticeId,
        user_id: userId,
        status,
        notes: undefined,
        available_from: undefined,
        available_to: undefined,
      });
    } catch (error) {
      console.error('Failed to update attendance:', error);
    } finally {
      setSavingUserId(null);
    }
  };

  const selectedPractice = practiceSchedules.find(p => p.id === displayPracticeId);

  const getStatusLabel = (status: string) => {
    return ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS] || status;
  };

  const getStatusColor = (status: string) => {
    return ATTENDANCE_STATUS_COLORS[status as keyof typeof ATTENDANCE_STATUS_COLORS] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {UI_TEXT.ATTENDANCE_TABLE}
        </h2>
      </div>

      {/* フィルタリング */}
      <div className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">フィルタ</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 練習選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.PRACTICE}
            </label>
            <select
              value={filterPracticeId}
              onChange={(e) => {
                setFilterPracticeId(e.target.value);
                if (onPracticeChange) {
                  onPracticeChange(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">すべての練習</option>
              {filteredPracticeSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.title || '練習'} - {new Date(schedule.schedule_date).toLocaleDateString('ja-JP')}
                </option>
              ))}
            </select>
          </div>

          {/* 出席状況フィルタ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.FILTER_BY_STATUS}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">{UI_TEXT.ALL_STATUS}</option>
              <option value="unregistered">未登録</option>
              {Object.entries(ATTENDANCE_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 開始日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.START_DATE}
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* 終了日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.END_DATE}
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* 選択された練習の情報 */}
      {selectedPractice && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">練習情報</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>日付: {new Date(selectedPractice.schedule_date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}</p>
            <p>時間: {selectedPractice.start_time} - {selectedPractice.end_time}</p>
            {selectedPractice.title && <p>タイトル: {selectedPractice.title}</p>}
          </div>
        </div>
      )}

      {/* テーブル */}
      {displayPracticeId ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {UI_TEXT.USER_NAME}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {UI_TEXT.STATUS}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  参加可能時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {UI_TEXT.NOTES}
                </th>
                {isEditable && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={isEditable ? 5 : 4} className="px-6 py-8 text-center text-gray-500">
                    {UI_TEXT.NO_ATTENDANCE_DATA}
                  </td>
                </tr>
              ) : (
                tableData.map(({ user, attendance }) => {
                  const isSaving = savingUserId === user.id;
                  const currentStatus = attendance?.status || null;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendance?.status || '')}`}>
                          {attendance ? getStatusLabel(attendance.status) : '未登録'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendance?.status === ATTENDANCE_STATUS.LATE ? (
                          <div className="text-sm text-gray-900">
                            {attendance.available_from && attendance.available_to
                              ? `${attendance.available_from} - ${attendance.available_to}`
                              : '-'}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={attendance?.notes}>
                          {attendance?.notes || '-'}
                        </div>
                      </td>
                      {isEditable && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleStatusChange(user.id, ATTENDANCE_STATUS.PRESENT)}
                              disabled={isSaving || loading}
                              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                                currentStatus === ATTENDANCE_STATUS.PRESENT
                                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              出席
                            </button>
                            <button
                              onClick={() => handleStatusChange(user.id, ATTENDANCE_STATUS.ABSENT)}
                              disabled={isSaving || loading}
                              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                                currentStatus === ATTENDANCE_STATUS.ABSENT
                                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              欠席
                            </button>
                            <button
                              onClick={() => handleStatusChange(user.id, ATTENDANCE_STATUS.LATE)}
                              disabled={isSaving || loading}
                              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                                currentStatus === ATTENDANCE_STATUS.LATE
                                  ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm'
                                  : 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              遅刻
                            </button>
                            <button
                              onClick={() => handleStatusChange(user.id, ATTENDANCE_STATUS.NO_SHOW)}
                              disabled={isSaving || loading}
                              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                                currentStatus === ATTENDANCE_STATUS.NO_SHOW
                                  ? 'bg-red-700 text-white border-red-700 shadow-sm'
                                  : 'bg-white text-red-800 border-red-400 hover:bg-red-50'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              無断欠席
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>{UI_TEXT.SELECT_PRACTICE}</p>
        </div>
      )}
    </div>
  );
};

