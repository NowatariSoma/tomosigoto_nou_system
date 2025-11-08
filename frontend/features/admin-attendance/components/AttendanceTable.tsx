'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, Attendance, PracticeSchedule, AttendanceCreate, UserWithAttendanceResponse } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS, UI_TEXT } from '../constants';
import { Calendar, Filter, Edit2, Clock, FileText, Save, X, Search } from 'lucide-react';
import { ApiError } from '../../../lib/api';
import { useAdminAttendance } from '../hooks/use-admin-attendance';

interface AttendanceTableProps {
  practiceSchedules: PracticeSchedule[];
  isEditable?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  practiceSchedules,
  isEditable = true,
}) => {
  const {
    practiceSchedules: schedulesFromHook,
    usersWithAttendance,
    loading,
    fetchUsersWithAttendance,
    upsertAttendance,
  } = useAdminAttendance();
  
  // practiceSchedulesはpropsから取得、なければhookから取得
  const displayPracticeSchedules = practiceSchedules.length > 0 ? practiceSchedules : schedulesFromHook;

  const [filterPracticeId, setFilterPracticeId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUserName, setFilterUserName] = useState<string>('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{
    availableFrom: string;
    availableTo: string;
    notes: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // フィルタ変更時にAPIを呼び出す（練習IDが選択されている場合のみ）
  useEffect(() => {
    if (!filterPracticeId) {
      // 練習IDが選択されていない場合は空の配列を設定
      return;
    }

    const params: {
      practice_schedule_id?: string;
      status?: string;
      user_name?: string;
      page?: number;
      limit?: number;
    } = {
      page: 1,
      limit: 100,
    };

    params.practice_schedule_id = filterPracticeId;
    
    if (filterStatus !== 'all') {
      params.status = filterStatus;
    }
    if (filterUserName) {
      params.user_name = filterUserName;
    }

    fetchUsersWithAttendance(params);
  }, [filterPracticeId, filterStatus, filterUserName, fetchUsersWithAttendance]);

  // テーブルデータ（バックエンドから取得したデータをそのまま使用）
  const tableData = usersWithAttendance;

  const handleStatusChange = async (userId: string, status: 'present' | 'absent' | 'late' | 'no_show') => {
    if (!filterPracticeId) return;

    setSavingUserId(userId);
    try {
      const item = tableData.find(d => d.user.id === userId);
      const currentAttendance = item?.attendance;
      
      // 遅刻の場合は参加可能時間を保持、それ以外の場合はnullに設定
      const updateData: AttendanceCreate = {
        practice_schedule_id: filterPracticeId,
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
      
      await upsertAttendance(updateData);
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
        practiceScheduleId: filterPracticeId
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
    if (!editingData || !editingUserId || !filterPracticeId) return;

    setSaving(true);
    try {
      const item = tableData.find(d => d.user.id === editingUserId);
      const currentAttendance = item?.attendance;
      const currentStatus = currentAttendance?.status || ATTENDANCE_STATUS.PRESENT;
      
      // 遅刻の場合は参加可能時間を送信、それ以外の場合はnullに設定
      const updateData: AttendanceCreate = {
        practice_schedule_id: filterPracticeId,
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
      
      await upsertAttendance(updateData);
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
        practiceScheduleId: filterPracticeId
      });
      // エラーをユーザーに通知（必要に応じてトースト通知などを追加可能）
      alert(`出席詳細の更新に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedPractice = displayPracticeSchedules.find(p => p.id === filterPracticeId);

  const getStatusLabel = (status: string) => {
    return ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS] || status;
  };

  const getStatusColor = (status: string) => {
    return ATTENDANCE_STATUS_COLORS[status as keyof typeof ATTENDANCE_STATUS_COLORS] || 'text-gray-600 bg-gray-50';
  };

  const editingUser = editingUserId ? tableData.find(item => item.user.id === editingUserId)?.user : null;
  const editingAttendance = editingUserId ? tableData.find(item => item.user.id === editingUserId)?.attendance : null;

  return (
    <>
      {/* 編集モーダル */}
      {editingUserId && editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10">
              <h2 className="text-base sm:text-xl font-semibold text-gray-900">
                {editingUser?.name} の出席詳細を編集
              </h2>
              <button
                onClick={handleEditCancel}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* 参加可能時間 */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                <label className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600" />
                  <span>参加可能時間</span>
                </label>
                {selectedPractice && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    練習時間: {selectedPractice.start_time} - {selectedPractice.end_time}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
              <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-sm">
                <label className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm font-semibold text-slate-900 mb-3 sm:mb-4">
                  <div className="bg-slate-100 p-1.5 sm:p-2 rounded-lg">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
                  </div>
                  <span>備考（任意）</span>
                </label>
                <textarea
                  value={editingData.notes}
                  onChange={(e) => setEditingData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  rows={4}
                  placeholder="備考があれば入力してください"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base transition-colors hover:border-slate-400"
                />
              </div>

              {/* ボタン */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={saving}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200 font-medium shadow-sm disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>キャンセル</span>
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={saving}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-all duration-200 font-medium shadow-sm disabled:cursor-not-allowed"
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{saving ? '保存中...' : '保存'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-6">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
        <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
        </div>
        <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">
          {UI_TEXT.ATTENDANCE_TABLE}
        </h2>
      </div>

      {/* フィルタリング */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900">フィルタ</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* 練習選択 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              {UI_TEXT.PRACTICE}
              <span className="text-red-500 ml-1">※</span>
              <span className="text-red-500 text-xs ml-1">（必須）</span>
            </label>
            <select
              value={filterPracticeId}
              onChange={(e) => setFilterPracticeId(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="">未選択</option>
              {displayPracticeSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.title || '練習'} - {new Date(schedule.schedule_date).toLocaleDateString('ja-JP')}
                </option>
              ))}
            </select>
          </div>

          {/* 出席状況フィルタ */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              {UI_TEXT.FILTER_BY_STATUS}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
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

          {/* ユーザー名フィルタ */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              ユーザー名
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                value={filterUserName}
                onChange={(e) => setFilterUserName(e.target.value)}
                placeholder="ユーザー名で検索"
                className="w-full pl-8 sm:pl-10 pr-2.5 sm:pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 選択された練習の情報 */}
      {selectedPractice && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-white border border-blue-200 rounded-lg">
          <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1.5 sm:mb-2">練習情報</h3>
          <div className="text-xs sm:text-sm text-blue-800 space-y-1">
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
      {filterPracticeId ? (
        <>
          {/* デスクトップ用テーブル */}
          <div className="hidden md:block overflow-x-auto">
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
                tableData.map((item) => {
                  const user = item.user;
                  const attendance = item.attendance;
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

          {/* モバイル用カード */}
          <div className="md:hidden space-y-3">
            {tableData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">{UI_TEXT.NO_ATTENDANCE_DATA}</p>
              </div>
            ) : (
              tableData.map((item) => {
                const user = item.user;
                const attendance = item.attendance;
                const isSaving = savingUserId === user.id;
                const currentStatus = attendance?.status || null;

                return (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* ユーザー情報 */}
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-900 mb-1">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>

                    {/* 出席状況ボタン */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-2">出席状況</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStatusChange(user.id, ATTENDANCE_STATUS.PRESENT)}
                          disabled={isSaving || loading}
                          className={`px-2 py-2 text-xs font-medium rounded-md border transition-all ${
                            currentStatus === ATTENDANCE_STATUS.PRESENT
                              ? 'bg-green-600 text-white border-green-600 shadow-sm'
                              : 'bg-white text-green-700 border-green-300'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          出席
                        </button>
                        <button
                          onClick={() => handleStatusChange(user.id, ATTENDANCE_STATUS.ABSENT)}
                          disabled={isSaving || loading}
                          className={`px-2 py-2 text-xs font-medium rounded-md border transition-all ${
                            currentStatus === ATTENDANCE_STATUS.ABSENT
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-white text-red-700 border-red-300'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          欠席
                        </button>
                        <button
                          onClick={() => handleStatusChange(user.id, ATTENDANCE_STATUS.LATE)}
                          disabled={isSaving || loading}
                          className={`px-2 py-2 text-xs font-medium rounded-md border transition-all ${
                            currentStatus === ATTENDANCE_STATUS.LATE
                              ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm'
                              : 'bg-white text-yellow-700 border-yellow-300'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          遅刻
                        </button>
                        <button
                          onClick={() => handleStatusChange(user.id, ATTENDANCE_STATUS.NO_SHOW)}
                          disabled={isSaving || loading}
                          className={`px-2 py-2 text-xs font-medium rounded-md border transition-all ${
                            currentStatus === ATTENDANCE_STATUS.NO_SHOW
                              ? 'bg-red-700 text-white border-red-700 shadow-sm'
                              : 'bg-white text-red-800 border-red-400'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          無断欠席
                        </button>
                      </div>
                    </div>

                    {/* 参加可能時間 */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">参加可能時間</div>
                      <div className="text-xs text-gray-900">
                        {attendance?.status === ATTENDANCE_STATUS.LATE && attendance?.available_from && attendance?.available_to
                          ? `${attendance.available_from} - ${attendance.available_to}`
                          : '-'}
                      </div>
                    </div>

                    {/* 備考 */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">備考</div>
                      <div className="text-xs text-gray-900 break-words">
                        {attendance?.notes || '-'}
                      </div>
                    </div>

                    {/* 操作ボタン */}
                    {isEditable && (
                      <div className="pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleEditClick(user.id)}
                          disabled={loading}
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>操作</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12 text-gray-500">
          <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
          <p className="text-sm sm:text-base">{UI_TEXT.SELECT_PRACTICE}</p>
        </div>
      )}
      </div>
    </>
  );
};

