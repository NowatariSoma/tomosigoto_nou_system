'use client';

import React, { useState, useMemo } from 'react';
import { User, Attendance, PracticeSchedule, AttendanceCreate } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS, UI_TEXT } from '../constants';
import { Calendar, Filter, Edit2, Clock, FileText, Save, X } from 'lucide-react';
import { ApiError } from '../../../lib/api';

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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{
    availableFrom: string;
    availableTo: string;
    notes: string;
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
      const item = tableData.find(d => d.user.id === userId);
      const currentAttendance = item?.attendance;
      
      // 遅刻の場合は参加可能時間を保持、それ以外の場合はnullに設定
      const updateData: AttendanceCreate = {
        practice_schedule_id: displayPracticeId,
        user_id: userId,
        status,
        notes: currentAttendance?.notes || undefined,
      };
      
      if (status === ATTENDANCE_STATUS.LATE) {
        updateData.available_from = currentAttendance?.available_from || undefined;
        updateData.available_to = currentAttendance?.available_to || undefined;
      } else {
        // 遅刻以外の場合は参加可能時間をnullに設定（既存の記録をクリアするため）
        updateData.available_from = null;
        updateData.available_to = null;
      }
      
      await onAttendanceUpdate(updateData);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : String(error);
      
      console.error('Failed to update attendance:', {
        error,
        errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        userId,
        status,
        practiceScheduleId: displayPracticeId
      });
      // エラーをユーザーに通知（必要に応じてトースト通知などを追加可能）
      alert(`出席状況の更新に失敗しました: ${errorMessage}`);
    } finally {
      setSavingUserId(null);
    }
  };

  const handleEditClick = (userId: string) => {
    const item = tableData.find(d => d.user.id === userId);
    if (item) {
      setEditingUserId(userId);
      setEditingData({
        availableFrom: item.attendance?.available_from || '',
        availableTo: item.attendance?.available_to || '',
        notes: item.attendance?.notes || '',
      });
    }
  };

  const handleEditCancel = () => {
    setEditingUserId(null);
    setEditingData(null);
  };

  const handleEditSave = async () => {
    if (!editingData || !editingUserId || !displayPracticeId || !onAttendanceUpdate) return;

    setSaving(true);
    try {
      const item = tableData.find(d => d.user.id === editingUserId);
      const currentAttendance = item?.attendance;
      const currentStatus = currentAttendance?.status || ATTENDANCE_STATUS.PRESENT;
      
      // 遅刻の場合は参加可能時間を送信、それ以外の場合はnullに設定
      const updateData: AttendanceCreate = {
        practice_schedule_id: displayPracticeId,
        user_id: editingUserId,
        status: currentStatus,
        notes: editingData.notes?.trim() || undefined,
      };
      
      if (currentStatus === ATTENDANCE_STATUS.LATE) {
        // 遅刻の場合のみ参加可能時間を送信（値がある場合のみ、空文字列の場合はundefined）
        const availableFrom = editingData.availableFrom?.trim();
        const availableTo = editingData.availableTo?.trim();
        if (availableFrom) {
          updateData.available_from = availableFrom;
        }
        if (availableTo) {
          updateData.available_to = availableTo;
        }
      } else {
        // 遅刻以外の場合は参加可能時間をnullに設定（既存の記録をクリアするため）
        updateData.available_from = null;
        updateData.available_to = null;
      }
      
      await onAttendanceUpdate(updateData);
      setEditingUserId(null);
      setEditingData(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : String(error);
      
      console.error('Failed to update attendance:', {
        error,
        errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        userId: editingUserId,
        practiceScheduleId: displayPracticeId
      });
      // エラーをユーザーに通知（必要に応じてトースト通知などを追加可能）
      alert(`出席詳細の更新に失敗しました: ${errorMessage}`);
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

  const editingUser = editingUserId ? users.find(u => u.id === editingUserId) : null;
  const editingAttendance = editingUserId ? attendances.find(a => a.user_id === editingUserId && a.practice_schedule_id === displayPracticeId) : null;

  return (
    <>
      {/* 編集モーダル */}
      {editingUserId && editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser?.name} の出席詳細を編集
              </h2>
              <button
                onClick={handleEditCancel}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 参加可能時間 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>参加可能時間</span>
                </label>
                {selectedPractice && (
                  <p className="text-sm text-gray-600 mb-3">
                    練習時間: {selectedPractice.start_time} - {selectedPractice.end_time}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      何時から
                    </label>
                    <input
                      type="time"
                      value={editingData.availableFrom}
                      onChange={(e) => setEditingData(prev => prev ? { ...prev, availableFrom: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      何時まで
                    </label>
                    <input
                      type="time"
                      value={editingData.availableTo}
                      onChange={(e) => setEditingData(prev => prev ? { ...prev, availableTo: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 備考 */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <label className="flex items-center space-x-3 text-sm font-semibold text-slate-900 mb-4">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <FileText className="h-4 w-4 text-slate-600" />
                  </div>
                  <span>備考（任意）</span>
                </label>
                <textarea
                  value={editingData.notes}
                  onChange={(e) => setEditingData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  rows={4}
                  placeholder="備考があれば入力してください"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base transition-colors hover:border-slate-400"
                />
              </div>

              {/* ボタン */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200 font-medium shadow-sm disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  <span>キャンセル</span>
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-all duration-200 font-medium shadow-sm disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? '保存中...' : '保存'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
      <div className="mb-6 space-y-4 p-4 bg-white rounded-lg border border-gray-200">
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
        <div className="mb-4 p-4 bg-white border border-blue-200 rounded-lg">
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
            <thead className="bg-white">
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
                    <tr key={user.id} className="hover:bg-white">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
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
                          <button
                            onClick={() => handleEditClick(user.id)}
                            disabled={loading}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span>操作</span>
                          </button>
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
    </>
  );
};

