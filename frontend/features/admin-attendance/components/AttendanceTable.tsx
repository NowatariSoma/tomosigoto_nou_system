'use client';

import React, { useState, useEffect } from 'react';
import { PracticeSchedule } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, UI_TEXT } from '../constants';
import { Calendar, Filter, Save, X, Search, Edit } from 'lucide-react';
import { useAdminAttendance } from '../hooks/use-admin-attendance';
import { useAttendanceEdits } from '../hooks/useAttendanceEdits';
import { AttendanceStatusEditButtons, AttendanceStatusBadge } from './AttendanceStatusButtons';
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

  const displayPracticeSchedules = practiceSchedules.length > 0 ? practiceSchedules : schedulesFromHook;

  const [filterPracticeId, setFilterPracticeId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUserName, setFilterUserName] = useState<string>('');

  const tableData = usersWithAttendance;

  const {
    isEditMode,
    editedChanges,
    saving,
    handleEditModeToggle,
    handleLocalStatusChange,
    handleLocalTimeChange,
    handleLocalNotesChange,
    handleSaveAllChanges,
    handleCancelChanges,
    getCurrentValue,
  } = useAttendanceEdits(tableData, filterPracticeId, upsertAttendance);

  // フィルタ変更時にAPIを呼び出す
  useEffect(() => {
    if (!filterPracticeId) return;

    const params: {
      practice_schedule_id?: string;
      status?: string;
      user_name?: string;
      page?: number;
      limit?: number;
    } = { page: 1, limit: 100, practice_schedule_id: filterPracticeId };

    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterUserName) params.user_name = filterUserName;

    fetchUsersWithAttendance(params);
  }, [filterPracticeId, filterStatus, filterUserName, fetchUsersWithAttendance]);

  const selectedPractice = displayPracticeSchedules.find(p => p.id === filterPracticeId);

  return (
    <>
      <div className="panel-info p-3 sm:p-6">
      {/* ツールバー */}
      <div className="flex justify-end mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button onClick={handleCancelChanges} disabled={saving} variant="outline" className="flex items-center gap-1.5">
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
            <Button onClick={handleEditModeToggle} className="flex items-center gap-1.5">
              <Edit className="h-4 w-4" />
              編集モード
            </Button>
          )}
        </div>
      </div>

      {/* フィルタリング */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4 p-3 sm:p-4 card-blue">
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
          <h3 className="text-xs sm:text-sm font-semibold text-black">フィルタ</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="label-form block mb-1.5 sm:mb-2">
              {UI_TEXT.PRACTICE}
              <span className="text-black ml-1">※</span>
              <span className="text-black text-xs ml-1">（必須）</span>
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
          <div>
            <label className="label-form block mb-1.5 sm:mb-2">{UI_TEXT.FILTER_BY_STATUS}</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={UI_TEXT.ALL_STATUS} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{UI_TEXT.ALL_STATUS}</SelectItem>
                <SelectItem value="unregistered">未登録</SelectItem>
                {Object.entries(ATTENDANCE_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-form block mb-1.5 sm:mb-2">ユーザー名</label>
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" />
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
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 card-blue">
          <h3 className="text-xs sm:text-sm font-semibold text-black mb-1.5 sm:mb-2">練習情報</h3>
          <div className="text-xs sm:text-sm text-black space-y-1">
            <p>日付: {new Date(selectedPractice.schedule_date).toLocaleDateString('ja-JP', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
            })}</p>
            <p>時間: {selectedPractice.start_time} - {selectedPractice.end_time}</p>
            {selectedPractice.title && <p>タイトル: {selectedPractice.title}</p>}
          </div>
        </div>
      )}

      {/* データ表示 */}
      {filterPracticeId ? (
        <>
          {/* デスクトップ用テーブル */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-full table-fixed divide-y divide-gray-200">
            <TableHeader className="bg-white">
              <TableRow>
                <TableHead style={{ width: '180px', minWidth: '180px', maxWidth: '180px' }} className="table-header-cell px-6 py-3 text-left uppercase tracking-wider">{UI_TEXT.USER_NAME}</TableHead>
                <TableHead style={isEditMode ? { width: '280px', minWidth: '280px', maxWidth: '280px' } : { width: '150px', minWidth: '150px', maxWidth: '150px' }} className="table-header-cell px-6 py-3 text-left uppercase tracking-wider">{UI_TEXT.STATUS}</TableHead>
                <TableHead style={{ width: '180px', minWidth: '180px', maxWidth: '180px' }} className="table-header-cell px-6 py-3 text-left uppercase tracking-wider">参加可能時間</TableHead>
                <TableHead style={{ minWidth: '240px' }} className="table-header-cell px-6 py-3 text-left uppercase tracking-wider">{UI_TEXT.NOTES}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-8 text-center text-black">{UI_TEXT.NO_ATTENDANCE_DATA}</TableCell>
                </TableRow>
              ) : (
                tableData.map((item) => {
                  const user = item.user;
                  const currentStatus = getCurrentValue(user.id, 'status');
                  const currentAvailableFrom = getCurrentValue(user.id, 'availableFrom') as string;
                  const currentAvailableTo = getCurrentValue(user.id, 'availableTo') as string;
                  const currentNotes = getCurrentValue(user.id, 'notes') as string;

                  return (
                    <TableRow key={user.id} className="hover-subtle">
                      <TableCell style={{ width: '180px', maxWidth: '180px' }} className="px-6 py-4 overflow-hidden">
                        <div className="w-full min-w-0 overflow-hidden">
                          <div className="text-sm font-medium text-black truncate" title={user.name}>{user.name}</div>
                          <div className="text-sm text-black truncate" title={user.email}>{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap" style={isEditMode ? { width: '280px', maxWidth: '280px' } : { width: '150px', maxWidth: '150px' }}>
                        {isEditMode ? (
                          <AttendanceStatusEditButtons currentStatus={currentStatus} onStatusChange={(s) => handleLocalStatusChange(user.id, s)} />
                        ) : (
                          <AttendanceStatusBadge status={currentStatus} />
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap" style={{ width: '180px', maxWidth: '180px' }}>
                        {isEditMode && currentStatus === ATTENDANCE_STATUS.LATE ? (
                          <div className="flex gap-1 items-center text-xs">
                            <Input type="time" value={currentAvailableFrom} onChange={(e) => handleLocalTimeChange(user.id, 'availableFrom', e.target.value)} className="w-20 px-1 py-1 text-xs h-8" />
                            <span>-</span>
                            <Input type="time" value={currentAvailableTo} onChange={(e) => handleLocalTimeChange(user.id, 'availableTo', e.target.value)} className="w-20 px-1 py-1 text-xs h-8" />
                          </div>
                        ) : currentStatus === ATTENDANCE_STATUS.LATE && currentAvailableFrom && currentAvailableTo ? (
                          <div className="text-sm text-black">{currentAvailableFrom.substring(0, 5)} - {currentAvailableTo.substring(0, 5)}</div>
                        ) : (
                          <span className="text-sm text-black">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {isEditMode ? (
                          <Input type="text" value={currentNotes} onChange={(e) => handleLocalNotesChange(user.id, e.target.value)} placeholder="備考を入力" className="px-2 py-1 text-sm h-8" />
                        ) : (
                          <div className="text-sm text-black max-w-xs truncate" title={currentNotes}>{currentNotes || '-'}</div>
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
              <div className="text-center py-8 text-black">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-black" />
                <p className="text-sm">{UI_TEXT.NO_ATTENDANCE_DATA}</p>
              </div>
            ) : (
              tableData.map((item) => {
                const user = item.user;
                const currentStatus = getCurrentValue(user.id, 'status');
                const currentAvailableFrom = getCurrentValue(user.id, 'availableFrom') as string;
                const currentAvailableTo = getCurrentValue(user.id, 'availableTo') as string;
                const currentNotes = getCurrentValue(user.id, 'notes') as string;

                return (
                  <div key={user.id} className="p-3">
                    {isEditMode ? (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-black">{user.name}</div>
                        <div>
                          <p className="text-xs font-medium text-black mb-1">出席状況</p>
                          <AttendanceStatusEditButtons currentStatus={currentStatus} onStatusChange={(s) => handleLocalStatusChange(user.id, s)} layout="grid" useShortLabels />
                        </div>
                        {currentStatus === ATTENDANCE_STATUS.LATE && (
                          <div>
                            <p className="text-xs font-medium text-black mb-1">参加可能時間</p>
                            <div className="flex gap-1 items-center text-xs">
                              <Input type="time" value={currentAvailableFrom} onChange={(e) => handleLocalTimeChange(user.id, 'availableFrom', e.target.value)} className="flex-1 px-2 py-1 text-xs h-8" />
                              <span>-</span>
                              <Input type="time" value={currentAvailableTo} onChange={(e) => handleLocalTimeChange(user.id, 'availableTo', e.target.value)} className="flex-1 px-2 py-1 text-xs h-8" />
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-black mb-1">備考</p>
                          <Input type="text" value={currentNotes} onChange={(e) => handleLocalNotesChange(user.id, e.target.value)} placeholder="備考を入力" className="px-2 py-1 text-xs h-8" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-black truncate flex-shrink min-w-0">{user.name}</span>
                        <div className="flex-shrink-0">
                          <AttendanceStatusBadge status={currentStatus} size="sm" />
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
        <div className="text-center py-8 sm:py-12 text-black">
          <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-black" />
          <p className="text-sm sm:text-base">{UI_TEXT.SELECT_PRACTICE}</p>
        </div>
      )}
      </div>
    </>
  );
};
