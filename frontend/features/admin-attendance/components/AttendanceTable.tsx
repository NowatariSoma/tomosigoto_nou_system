'use client';

import React, { useState, useMemo } from 'react';
import { User, Attendance, PracticeSchedule, AttendanceCreate } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS, UI_TEXT } from '../constants';
import { Calendar, Filter, Edit2, Save, X, Clock, FileText } from 'lucide-react';

interface AttendanceTableProps {
  users: User[];
  attendances: Attendance[];
  practiceSchedules: PracticeSchedule[];
  selectedPracticeId?: string;
  onPracticeChange?: (practiceId: string) => void;
  onAttendanceUpdate?: (attendance: AttendanceCreate) => Promise<void>;
  isEditable?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  users,
  attendances,
  practiceSchedules,
  selectedPracticeId,
  onPracticeChange,
  onAttendanceUpdate,
  isEditable = true,
}) => {
  const [filterPracticeId, setFilterPracticeId] = useState<string>(selectedPracticeId || '');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{
    status: string;
    notes: string;
    availableFrom: string;
    availableTo: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

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
      data = data.filter(item => {
        if (!item.attendance) return false;
        return item.attendance.status === filterStatus;
      });
    }

    return data;
  }, [users, attendances, displayPracticeId, filterStatus]);

  const handleEdit = (userId: string) => {
    const item = tableData.find(d => d.user.id === userId);
    if (item) {
      setEditingUserId(userId);
      setEditingData({
        status: item.attendance?.status || '',
        notes: item.attendance?.notes || '',
        availableFrom: item.attendance?.available_from || '',
        availableTo: item.attendance?.available_to || '',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingData(null);
  };

  const handleSave = async (userId: string) => {
    if (!editingData || !displayPracticeId || !onAttendanceUpdate) return;

    setSaving(true);
    try {
      await onAttendanceUpdate({
        practice_schedule_id: displayPracticeId,
        user_id: userId,
        status: editingData.status as 'present' | 'absent' | 'late' | 'no_show',
        notes: editingData.notes || undefined,
        available_from: editingData.status === ATTENDANCE_STATUS.LATE && editingData.availableFrom
          ? editingData.availableFrom
          : undefined,
        available_to: editingData.status === ATTENDANCE_STATUS.LATE && editingData.availableTo
          ? editingData.availableTo
          : undefined,
      });
      setEditingUserId(null);
      setEditingData(null);
    } catch (error) {
      console.error('Failed to update attendance:', error);
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {UI_TEXT.ATTENDANCE_TABLE}
          </h2>
        </div>
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
                  const isEditing = editingUserId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editingData?.status || ''}
                            onChange={(e) => setEditingData(prev => prev ? { ...prev, status: e.target.value } : null)}
                            className="text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">選択</option>
                            {Object.entries(ATTENDANCE_STATUS_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendance?.status || '')}`}>
                            {attendance ? getStatusLabel(attendance.status) : '未登録'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          editingData?.status === ATTENDANCE_STATUS.LATE ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={editingData.availableFrom}
                                onChange={(e) => setEditingData(prev => prev ? { ...prev, availableFrom: e.target.value } : null)}
                                className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-gray-500">-</span>
                              <input
                                type="time"
                                value={editingData.availableTo}
                                onChange={(e) => setEditingData(prev => prev ? { ...prev, availableTo: e.target.value } : null)}
                                className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )
                        ) : (
                          attendance?.status === ATTENDANCE_STATUS.LATE ? (
                            <div className="text-sm text-gray-900">
                              {attendance.available_from && attendance.available_to
                                ? `${attendance.available_from} - ${attendance.available_to}`
                                : '-'}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <textarea
                            value={editingData?.notes || ''}
                            onChange={(e) => setEditingData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                            rows={2}
                            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="備考"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={attendance?.notes}>
                            {attendance?.notes || '-'}
                          </div>
                        )}
                      </td>
                      {isEditable && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSave(user.id)}
                                disabled={saving}
                                className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                              >
                                <Save className="h-5 w-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                          )}
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

