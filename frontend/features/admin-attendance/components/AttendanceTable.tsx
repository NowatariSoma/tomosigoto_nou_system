'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, Attendance, PracticeSchedule, AttendanceCreate, UserWithAttendanceResponse } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS, UI_TEXT } from '../constants';
import { Calendar, Filter, Save, X, Search, Edit } from 'lucide-react';
import { ApiError } from '../../../lib/api';
import { useAdminAttendance } from '../hooks/use-admin-attendance';

interface AttendanceTableProps {
  practiceSchedules: PracticeSchedule[];
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  practiceSchedules,
}) => {
  const {
    practiceSchedules: schedulesFromHook,
    usersWithAttendance,
    fetchUsersWithAttendance,
    upsertAttendance,
  } = useAdminAttendance();
  
  // practiceSchedulesはpropsから取得、なければhookから取得
  const displayPracticeSchedules = practiceSchedules.length > 0 ? practiceSchedules : schedulesFromHook;

  const [filterPracticeId, setFilterPracticeId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUserName, setFilterUserName] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // 編集モード/閲覧モード
  const [isEditMode, setIsEditMode] = useState(false);

  // 編集中のデータを保持（userId -> 変更データ）
  const [editedChanges, setEditedChanges] = useState<Record<string, {
    status?: 'present' | 'absent' | 'late' | 'no_show';
    availableFrom?: string;
    availableTo?: string;
    notes?: string;
  }>>({});

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

  const selectedPractice = displayPracticeSchedules.find(p => p.id === filterPracticeId);

  const getStatusLabel = (status: string) => {
    return ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS] || status;
  };

  const getStatusColor = (status: string) => {
    return ATTENDANCE_STATUS_COLORS[status as keyof typeof ATTENDANCE_STATUS_COLORS] || 'text-gray-600 bg-gray-50';
  };

  // 編集モード切り替え
  const handleEditModeToggle = () => {
    if (isEditMode) {
      // 編集モードを終了する場合、確認
      if (Object.keys(editedChanges).length > 0) {
        if (!confirm('保存されていない変更があります。編集モードを終了しますか？')) {
          return;
        }
      }
      setEditedChanges({});
    }
    setIsEditMode(!isEditMode);
  };

  // 編集モードでの出席状況変更（ローカルステートのみ）
  const handleLocalStatusChange = (userId: string, status: 'present' | 'absent' | 'late' | 'no_show') => {
    setEditedChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        status,
      }
    }));
  };

  // 編集モードでの時間変更
  const handleLocalTimeChange = (userId: string, field: 'availableFrom' | 'availableTo', value: string) => {
    setEditedChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      }
    }));
  };

  // 編集モードでの備考変更
  const handleLocalNotesChange = (userId: string, notes: string) => {
    setEditedChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        notes,
      }
    }));
  };

  // 一括保存
  const handleSaveAllChanges = async () => {
    if (!filterPracticeId) return;

    setSaving(true);
    try {
      const promises = Object.entries(editedChanges).map(([userId, changes]) => {
        const item = tableData.find(d => d.user.id === userId);
        const currentAttendance = item?.attendance;

        const updateData: AttendanceCreate = {
          practice_schedule_id: filterPracticeId,
          user_id: userId,
          status: changes.status || currentAttendance?.status || ATTENDANCE_STATUS.PRESENT,
          notes: changes.notes !== undefined ? changes.notes : currentAttendance?.notes || undefined,
        };

        // 遅刻の場合は参加可能時間を設定
        if (updateData.status === ATTENDANCE_STATUS.LATE) {
          updateData.available_from = changes.availableFrom !== undefined ? changes.availableFrom : currentAttendance?.available_from || undefined;
          updateData.available_to = changes.availableTo !== undefined ? changes.availableTo : currentAttendance?.available_to || undefined;
        } else {
          updateData.available_from = null;
          updateData.available_to = null;
        }

        return upsertAttendance(updateData);
      });

      await Promise.all(promises);
      setEditedChanges({});
      setIsEditMode(false);
      alert('変更を保存しました');
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.message
        : error instanceof Error
        ? error.message
        : String(error);

      console.error('Failed to save changes:', error);
      alert(`変更の保存に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // キャンセル
  const handleCancelChanges = () => {
    if (Object.keys(editedChanges).length > 0) {
      if (!confirm('保存されていない変更があります。キャンセルしますか？')) {
        return;
      }
    }
    setEditedChanges({});
    setIsEditMode(false);
  };

  // 現在の値を取得（編集中の変更 or 元のデータ）
  const getCurrentValue = (userId: string, field: 'status' | 'availableFrom' | 'availableTo' | 'notes') => {
    const item = tableData.find(d => d.user.id === userId);
    const changes = editedChanges[userId];

    if (changes && changes[field] !== undefined) {
      return changes[field];
    }

    if (field === 'status') {
      return item?.attendance?.status || null;
    }

    // フィールド名をsnake_caseに変換
    const fieldMap = {
      availableFrom: 'available_from',
      availableTo: 'available_to',
      notes: 'notes'
    } as const;

    const dbField = fieldMap[field as keyof typeof fieldMap];
    return item?.attendance?.[dbField] || '';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">
            {UI_TEXT.ATTENDANCE_TABLE}
          </h2>
        </div>

        {/* モード切り替えと保存ボタン */}
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <button
                onClick={handleCancelChanges}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                キャンセル
              </button>
              <button
                onClick={handleSaveAllChanges}
                disabled={saving || Object.keys(editedChanges).length === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : `変更を保存 ${Object.keys(editedChanges).length > 0 ? `(${Object.keys(editedChanges).length})` : ''}`}
              </button>
            </>
          ) : (
            <button
              onClick={handleEditModeToggle}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Edit className="h-4 w-4" />
              編集モード
            </button>
          )}
        </div>
      </div>

      {/* 編集モード表示 */}
      {isEditMode && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <Edit className="h-4 w-4" />
            <span className="font-medium">編集モード：</span>
            <span>変更を加えた後、「変更を保存」ボタンをクリックしてください。</span>
          </div>
        </div>
      )}

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
            <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th style={{ width: '180px', minWidth: '180px', maxWidth: '180px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {UI_TEXT.USER_NAME}
                </th>
                <th style={isEditMode ? { minWidth: '312px' } : { width: '150px', minWidth: '150px', maxWidth: '150px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {UI_TEXT.STATUS}
                </th>
                <th style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  参加可能時間
                </th>
                <th style={isEditMode ? { width: '240px', minWidth: '240px', maxWidth: '240px' } : { minWidth: '240px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {UI_TEXT.NOTES}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {UI_TEXT.NO_ATTENDANCE_DATA}
                  </td>
                </tr>
              ) : (
                tableData.map((item) => {
                  const user = item.user;
                  const currentStatus = getCurrentValue(user.id, 'status') as string | null;
                  const currentAvailableFrom = getCurrentValue(user.id, 'availableFrom') as string;
                  const currentAvailableTo = getCurrentValue(user.id, 'availableTo') as string;
                  const currentNotes = getCurrentValue(user.id, 'notes') as string;

                  return (
                    <tr key={user.id} className="hover:bg-gray-100/20">
                      {/* ユーザー名 */}
                      <td style={{ width: '180px', maxWidth: '180px' }} className="px-6 py-4 overflow-hidden">
                        <div className="w-full min-w-0 overflow-hidden">
                          <div className="text-sm font-medium text-gray-900 truncate" title={user.name}>{user.name}</div>
                          <div className="text-sm text-gray-500 truncate" title={user.email}>{user.email}</div>
                        </div>
                      </td>

                      {/* 出席状況 */}
                      <td className="px-6 py-4 whitespace-nowrap" style={isEditMode ? { minWidth: '312px' } : { width: '150px', maxWidth: '150px' }}>
                        {isEditMode ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.PRESENT)}
                              className={`flex-1 min-w-[60px] px-2 py-1.5 text-xs font-medium rounded-md border transition-all whitespace-nowrap text-center ${
                                currentStatus === ATTENDANCE_STATUS.PRESENT
                                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                              }`}
                            >
                              出席
                            </button>
                            <button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.ABSENT)}
                              className={`flex-1 min-w-[60px] px-2 py-1.5 text-xs font-medium rounded-md border transition-all whitespace-nowrap text-center ${
                                currentStatus === ATTENDANCE_STATUS.ABSENT
                                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                              }`}
                            >
                              欠席
                            </button>
                            <button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.LATE)}
                              className={`flex-1 min-w-[60px] px-2 py-1.5 text-xs font-medium rounded-md border transition-all whitespace-nowrap text-center ${
                                currentStatus === ATTENDANCE_STATUS.LATE
                                  ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm'
                                  : 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50'
                              }`}
                            >
                              遅刻
                            </button>
                            <button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.NO_SHOW)}
                              className={`flex-1 min-w-[60px] px-2 py-1.5 text-xs font-medium rounded-md border transition-all whitespace-nowrap text-center ${
                                currentStatus === ATTENDANCE_STATUS.NO_SHOW
                                  ? 'bg-red-700 text-white border-red-700 shadow-sm'
                                  : 'bg-white text-red-800 border-red-400 hover:bg-red-50'
                              }`}
                            >
                              無断欠席
                            </button>
                          </div>
                        ) : (
                          <div>
                            {currentStatus === ATTENDANCE_STATUS.PRESENT && (
                              <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-md border bg-green-600 text-white border-green-600 shadow-sm">
                                出席
                              </span>
                            )}
                            {currentStatus === ATTENDANCE_STATUS.ABSENT && (
                              <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-md border bg-red-600 text-white border-red-600 shadow-sm">
                                欠席
                              </span>
                            )}
                            {currentStatus === ATTENDANCE_STATUS.LATE && (
                              <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-md border bg-yellow-500 text-white border-yellow-500 shadow-sm">
                                遅刻
                              </span>
                            )}
                            {currentStatus === ATTENDANCE_STATUS.NO_SHOW && (
                              <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-md border bg-red-700 text-white border-red-700 shadow-sm">
                                無断欠席
                              </span>
                            )}
                            {!currentStatus && (
                              <span className="text-sm text-gray-400">未登録</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 参加可能時間 */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditMode && currentStatus === ATTENDANCE_STATUS.LATE ? (
                          // 編集モード & 遅刻の場合：時間入力フィールド
                          <div className="flex gap-1 items-center text-xs">
                            <input
                              type="time"
                              value={currentAvailableFrom}
                              onChange={(e) => handleLocalTimeChange(user.id, 'availableFrom', e.target.value)}
                              className="w-20 px-1 py-1 border border-gray-300 rounded text-xs"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={currentAvailableTo}
                              onChange={(e) => handleLocalTimeChange(user.id, 'availableTo', e.target.value)}
                              className="w-20 px-1 py-1 border border-gray-300 rounded text-xs"
                            />
                          </div>
                        ) : (
                          // 閲覧モード or 遅刻以外：表示のみ
                          currentStatus === ATTENDANCE_STATUS.LATE && currentAvailableFrom && currentAvailableTo ? (
                            <div className="text-sm text-gray-900">
                              {currentAvailableFrom.substring(0, 5)} - {currentAvailableTo.substring(0, 5)}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )
                        )}
                      </td>

                      {/* 備考 */}
                      <td className="px-6 py-4">
                        {isEditMode ? (
                          // 編集モード：テキスト入力
                          <input
                            type="text"
                            value={currentNotes}
                            onChange={(e) => handleLocalNotesChange(user.id, e.target.value)}
                            placeholder="備考を入力"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          // 閲覧モード：表示のみ
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={currentNotes}>
                            {currentNotes || '-'}
                          </div>
                        )}
                      </td>
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
                const currentStatus = getCurrentValue(user.id, 'status') as string | null;
                const currentAvailableFrom = getCurrentValue(user.id, 'availableFrom') as string;
                const currentAvailableTo = getCurrentValue(user.id, 'availableTo') as string;
                const currentNotes = getCurrentValue(user.id, 'notes') as string;

                return (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* ユーザー情報 */}
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-900 mb-1">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>

                    {/* 出席状況 */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-2">出席状況</div>
                      {isEditMode ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.PRESENT)}
                            className={`px-2 py-2 text-xs font-medium rounded-md border transition-all ${
                              currentStatus === ATTENDANCE_STATUS.PRESENT
                                ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                : 'bg-white text-green-700 border-green-300'
                            }`}
                          >
                            出席
                          </button>
                          <button
                            onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.ABSENT)}
                            className={`px-2 py-2 text-xs font-medium rounded-md border transition-all ${
                              currentStatus === ATTENDANCE_STATUS.ABSENT
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : 'bg-white text-red-700 border-red-300'
                            }`}
                          >
                            欠席
                          </button>
                          <button
                            onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.LATE)}
                            className={`px-2 py-2 text-xs font-medium rounded-md border transition-all ${
                              currentStatus === ATTENDANCE_STATUS.LATE
                                ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm'
                                : 'bg-white text-yellow-700 border-yellow-300'
                            }`}
                          >
                            遅刻
                          </button>
                          <button
                            onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.NO_SHOW)}
                            className={`px-2 py-2 text-xs font-medium rounded-md border transition-all ${
                              currentStatus === ATTENDANCE_STATUS.NO_SHOW
                                ? 'bg-red-700 text-white border-red-700 shadow-sm'
                                : 'bg-white text-red-800 border-red-400'
                            }`}
                          >
                            無断欠席
                          </button>
                        </div>
                      ) : (
                        <div>
                          {currentStatus === ATTENDANCE_STATUS.PRESENT && (
                            <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-md border bg-green-600 text-white border-green-600 shadow-sm">
                              出席
                            </span>
                          )}
                          {currentStatus === ATTENDANCE_STATUS.ABSENT && (
                            <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-md border bg-red-600 text-white border-red-600 shadow-sm">
                              欠席
                            </span>
                          )}
                          {currentStatus === ATTENDANCE_STATUS.LATE && (
                            <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-md border bg-yellow-500 text-white border-yellow-500 shadow-sm">
                              遅刻
                            </span>
                          )}
                          {currentStatus === ATTENDANCE_STATUS.NO_SHOW && (
                            <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-md border bg-red-700 text-white border-red-700 shadow-sm">
                              無断欠席
                            </span>
                          )}
                          {!currentStatus && (
                            <span className="text-xs text-gray-400">未登録</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 参加可能時間 */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">参加可能時間</div>
                      {isEditMode && currentStatus === ATTENDANCE_STATUS.LATE ? (
                        // 編集モード & 遅刻の場合：時間入力フィールド
                        <div className="flex gap-1 items-center text-xs">
                          <input
                            type="time"
                            value={currentAvailableFrom}
                            onChange={(e) => handleLocalTimeChange(user.id, 'availableFrom', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={currentAvailableTo}
                            onChange={(e) => handleLocalTimeChange(user.id, 'availableTo', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      ) : (
                        // 閲覧モード or 遅刻以外：表示のみ
                        <div className="text-xs text-gray-900">
                          {currentStatus === ATTENDANCE_STATUS.LATE && currentAvailableFrom && currentAvailableTo
                            ? `${currentAvailableFrom.substring(0, 5)} - ${currentAvailableTo.substring(0, 5)}`
                            : '-'}
                        </div>
                      )}
                    </div>

                    {/* 備考 */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">備考</div>
                      {isEditMode ? (
                        // 編集モード：テキスト入力
                        <input
                          type="text"
                          value={currentNotes}
                          onChange={(e) => handleLocalNotesChange(user.id, e.target.value)}
                          placeholder="備考を入力"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        // 閲覧モード：表示のみ
                        <div className="text-xs text-gray-900 break-words">
                          {currentNotes || '-'}
                        </div>
                      )}
                    </div>
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

