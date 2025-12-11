'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, Attendance, PracticeSchedule, AttendanceCreate, UserWithAttendanceResponse } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, UI_TEXT } from '../constants';
import { Calendar, Filter, Save, X, Search, Edit } from 'lucide-react';
import { ApiError } from '../../../lib/api';
import { useAdminAttendance } from '../hooks/use-admin-attendance';
import { toast } from 'sonner';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/data-display/table';

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

      // トースト通知を表示
      toast.success('出席を記録しました');
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.message
        : error instanceof Error
        ? error.message
        : String(error);

      console.error('Failed to save changes:', error);
      toast.error(`変更の保存に失敗しました: ${errorMessage}`);
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
      <div className="flex justify-end mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button
                onClick={handleCancelChanges}
                disabled={saving}
                variant="outline"
                className="flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                キャンセル
              </Button>
              <Button
                onClick={handleSaveAllChanges}
                disabled={saving || Object.keys(editedChanges).length === 0}
                className="flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : `変更を保存 ${Object.keys(editedChanges).length > 0 ? `(${Object.keys(editedChanges).length})` : ''}`}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEditModeToggle}
              className="flex items-center gap-1.5"
            >
              <Edit className="h-4 w-4" />
              編集モード
            </Button>
          )}
        </div>
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
              <span className="text-gray-600 ml-1">※</span>
              <span className="text-gray-600 text-xs ml-1">（必須）</span>
            </label>
            <Select value={filterPracticeId} onValueChange={setFilterPracticeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="未選択" />
              </SelectTrigger>
              <SelectContent>
                {displayPracticeSchedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.title || '練習'} - {new Date(schedule.schedule_date).toLocaleDateString('ja-JP')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 出席状況フィルタ */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              {UI_TEXT.FILTER_BY_STATUS}
            </label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={UI_TEXT.ALL_STATUS} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{UI_TEXT.ALL_STATUS}</SelectItem>
                <SelectItem value="unregistered">未登録</SelectItem>
                {Object.entries(ATTENDANCE_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ユーザー名フィルタ */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              ユーザー名
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                type="text"
                value={filterUserName}
                onChange={(e) => setFilterUserName(e.target.value)}
                placeholder="ユーザー名で検索"
                className="pl-8 sm:pl-10 pr-2.5 sm:pr-3 text-xs sm:text-sm"
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
            <Table className="min-w-full table-fixed divide-y divide-gray-200">
            <TableHeader className="bg-white">
              <TableRow>
                <TableHead style={{ width: '180px', minWidth: '180px', maxWidth: '180px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {UI_TEXT.USER_NAME}
                </TableHead>
                <TableHead style={isEditMode ? { width: '280px', minWidth: '280px', maxWidth: '280px' } : { width: '150px', minWidth: '150px', maxWidth: '150px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {UI_TEXT.STATUS}
                </TableHead>
                <TableHead style={{ width: '180px', minWidth: '180px', maxWidth: '180px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  参加可能時間
                </TableHead>
                <TableHead style={{ minWidth: '240px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {UI_TEXT.NOTES}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {UI_TEXT.NO_ATTENDANCE_DATA}
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((item) => {
                  const user = item.user;
                  const currentStatus = getCurrentValue(user.id, 'status') as string | null;
                  const currentAvailableFrom = getCurrentValue(user.id, 'availableFrom') as string;
                  const currentAvailableTo = getCurrentValue(user.id, 'availableTo') as string;
                  const currentNotes = getCurrentValue(user.id, 'notes') as string;

                  return (
                    <TableRow key={user.id} className="hover:bg-gray-100/20">
                      {/* ユーザー名 */}
                      <TableCell style={{ width: '180px', maxWidth: '180px' }} className="px-6 py-4 overflow-hidden">
                        <div className="w-full min-w-0 overflow-hidden">
                          <div className="text-sm font-medium text-gray-900 truncate" title={user.name}>{user.name}</div>
                          <div className="text-sm text-gray-500 truncate" title={user.email}>{user.email}</div>
                        </div>
                      </TableCell>

                      {/* 出席状況 */}
                      <TableCell className="px-6 py-4 whitespace-nowrap" style={isEditMode ? { width: '280px', maxWidth: '280px' } : { width: '150px', maxWidth: '150px' }}>
                        {isEditMode ? (
                          <div className="flex gap-1.5">
                            <Button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.PRESENT)}
                              size="sm"
                              className={`flex-1 px-1.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                                currentStatus === ATTENDANCE_STATUS.PRESENT
                                  ? 'status-present shadow-sm'
                                  : 'status-present-outline'
                              }`}
                            >
                              出席
                            </Button>
                            <Button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.ABSENT)}
                              size="sm"
                              className={`flex-1 px-1.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                                currentStatus === ATTENDANCE_STATUS.ABSENT
                                  ? 'status-absent shadow-sm'
                                  : 'status-absent-outline'
                              }`}
                            >
                              欠席
                            </Button>
                            <Button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.LATE)}
                              size="sm"
                              className={`flex-1 px-1.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                                currentStatus === ATTENDANCE_STATUS.LATE
                                  ? 'status-late shadow-sm'
                                  : 'status-late-outline'
                              }`}
                            >
                              遅刻
                            </Button>
                            <Button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.NO_SHOW)}
                              size="sm"
                              className={`flex-1 px-1.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                                currentStatus === ATTENDANCE_STATUS.NO_SHOW
                                  ? 'status-no-show shadow-sm'
                                  : 'status-no-show-outline'
                              }`}
                            >
                              無断欠席
                            </Button>
                          </div>
                        ) : (
                          <div>
                            {currentStatus === ATTENDANCE_STATUS.PRESENT && (
                              <span className="inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border status-present shadow-sm">
                                出席
                              </span>
                            )}
                            {currentStatus === ATTENDANCE_STATUS.ABSENT && (
                              <span className="inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border status-absent shadow-sm">
                                欠席
                              </span>
                            )}
                            {currentStatus === ATTENDANCE_STATUS.LATE && (
                              <span className="inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border status-late shadow-sm">
                                遅刻
                              </span>
                            )}
                            {currentStatus === ATTENDANCE_STATUS.NO_SHOW && (
                              <span className="inline-flex items-center justify-center w-20 px-3 py-1.5 text-xs font-medium rounded-md border status-no-show shadow-sm">
                                無断欠席
                              </span>
                            )}
                            {!currentStatus && (
                              <span className="text-sm text-gray-400">未登録</span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* 参加可能時間 */}
                      <TableCell className="px-6 py-4 whitespace-nowrap" style={{ width: '180px', maxWidth: '180px' }}>
                        {isEditMode && currentStatus === ATTENDANCE_STATUS.LATE ? (
                          // 編集モード & 遅刻の場合：時間入力フィールド
                          <div className="flex gap-1 items-center text-xs">
                            <Input
                              type="time"
                              value={currentAvailableFrom}
                              onChange={(e) => handleLocalTimeChange(user.id, 'availableFrom', e.target.value)}
                              className="w-20 px-1 py-1 text-xs h-8"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={currentAvailableTo}
                              onChange={(e) => handleLocalTimeChange(user.id, 'availableTo', e.target.value)}
                              className="w-20 px-1 py-1 text-xs h-8"
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
                      </TableCell>

                      {/* 備考 */}
                      <TableCell className="px-6 py-4">
                        {isEditMode ? (
                          // 編集モード：テキスト入力
                          <Input
                            type="text"
                            value={currentNotes}
                            onChange={(e) => handleLocalNotesChange(user.id, e.target.value)}
                            placeholder="備考を入力"
                            className="px-2 py-1 text-sm h-8"
                          />
                        ) : (
                          // 閲覧モード：表示のみ
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={currentNotes}>
                            {currentNotes || '-'}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

          {/* モバイル用リスト */}
          <div className="md:hidden divide-y divide-gray-200">
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
                  <div key={user.id} className="p-3">
                    {isEditMode ? (
                      // 編集モード：縦レイアウト
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">出席状況</p>
                          <div className="grid grid-cols-4 gap-1.5">
                            <Button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.PRESENT)}
                              size="sm"
                              className={`px-1.5 py-1.5 text-xs font-medium ${
                                currentStatus === ATTENDANCE_STATUS.PRESENT
                                  ? 'status-present shadow-sm'
                                  : 'status-present-outline'
                              }`}
                            >
                              出席
                            </Button>
                            <Button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.ABSENT)}
                              size="sm"
                              className={`px-1.5 py-1.5 text-xs font-medium ${
                                currentStatus === ATTENDANCE_STATUS.ABSENT
                                  ? 'status-absent shadow-sm'
                                  : 'status-absent-outline'
                              }`}
                            >
                              欠席
                            </Button>
                            <Button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.LATE)}
                              size="sm"
                              className={`px-1.5 py-1.5 text-xs font-medium ${
                                currentStatus === ATTENDANCE_STATUS.LATE
                                  ? 'status-late shadow-sm'
                                  : 'status-late-outline'
                              }`}
                            >
                              遅刻
                            </Button>
                            <Button
                              onClick={() => handleLocalStatusChange(user.id, ATTENDANCE_STATUS.NO_SHOW)}
                              size="sm"
                              className={`px-1.5 py-1.5 text-xs font-medium ${
                                currentStatus === ATTENDANCE_STATUS.NO_SHOW
                                  ? 'status-no-show shadow-sm'
                                  : 'status-no-show-outline'
                              }`}
                            >
                              無断
                            </Button>
                          </div>
                        </div>
                        {currentStatus === ATTENDANCE_STATUS.LATE && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">参加可能時間</p>
                            <div className="flex gap-1 items-center text-xs">
                              <Input
                                type="time"
                                value={currentAvailableFrom}
                                onChange={(e) => handleLocalTimeChange(user.id, 'availableFrom', e.target.value)}
                                className="flex-1 px-2 py-1 text-xs h-8"
                              />
                              <span>-</span>
                              <Input
                                type="time"
                                value={currentAvailableTo}
                                onChange={(e) => handleLocalTimeChange(user.id, 'availableTo', e.target.value)}
                                className="flex-1 px-2 py-1 text-xs h-8"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">備考</p>
                          <Input
                            type="text"
                            value={currentNotes}
                            onChange={(e) => handleLocalNotesChange(user.id, e.target.value)}
                            placeholder="備考を入力"
                            className="px-2 py-1 text-xs h-8"
                          />
                        </div>
                      </div>
                    ) : (
                      // 通常モード：横一列レイアウト
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate flex-shrink min-w-0">{user.name}</span>
                        <div className="flex-shrink-0">
                          {currentStatus === ATTENDANCE_STATUS.PRESENT && (
                            <span className="inline-flex items-center justify-center w-16 px-2 py-1 text-xs font-medium rounded-md border status-present shadow-sm">
                              出席
                            </span>
                          )}
                          {currentStatus === ATTENDANCE_STATUS.ABSENT && (
                            <span className="inline-flex items-center justify-center w-16 px-2 py-1 text-xs font-medium rounded-md border status-absent shadow-sm">
                              欠席
                            </span>
                          )}
                          {currentStatus === ATTENDANCE_STATUS.LATE && (
                            <span className="inline-flex items-center justify-center w-16 px-2 py-1 text-xs font-medium rounded-md border status-late shadow-sm">
                              遅刻
                            </span>
                          )}
                          {currentStatus === ATTENDANCE_STATUS.NO_SHOW && (
                            <span className="inline-flex items-center justify-center w-16 px-2 py-1 text-xs font-medium rounded-md border status-no-show shadow-sm">
                              無断
                            </span>
                          )}
                          {!currentStatus && (
                            <span className="inline-flex items-center justify-center w-16 px-2 py-1 text-xs font-medium rounded-md border bg-gray-400 text-white border-gray-400 shadow-sm">
                              未登録
                            </span>
                          )}
                        </div>
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

