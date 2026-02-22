'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PracticeSchedule } from '../types';
import { UI_TEXT } from '../constants';
import { Plus, ArrowLeft, Sparkles, Edit2, Save, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { SessionEditorTableSimpleDnd } from '../../practice-schedule-editor/components/SessionEditorTableSimpleDnd';
import { SessionEditorModal } from '../../practice-schedule-editor/components/SessionEditorModal';
import { InstructorEditorModal } from '../../practice-schedule-editor/components/InstructorEditorModal';
import { ScheduleTimeEditor } from '../../practice-schedule-editor/components/ScheduleTimeEditor';
import { OptimizationModal } from '../../practice-schedule-editor/components/OptimizationModal';
import { useSessionEditor } from '../../practice-schedule-editor/hooks';
import { sessionInstructorService, practiceScheduleEditorService } from '../../practice-schedule-editor/services';
import { VenueInfo } from '../../practice-schedule-editor/types/session-editor';

interface ScheduleEditorViewProps {
  editingScheduleId: string;
  schedules: PracticeSchedule[];
  listLoading: boolean;
  updateSchedule: (id: string, data: any) => Promise<any>;
  fetchSchedules: () => Promise<any>;
  navigateToList: () => void;
}

export const ScheduleEditorView: React.FC<ScheduleEditorViewProps> = ({
  editingScheduleId,
  schedules,
  listLoading,
  updateSchedule,
  fetchSchedules,
  navigateToList,
}) => {
  const {
    sessions,
    instructors,
    venues: editorVenues,
    time_slots,
    parts,
    selected_session,
    is_modal_open,
    edit_mode,
    loading: editorLoading,
    error: editorError,
    fetchScheduleDetails,
    createSession,
    updateSession,
    deleteSession,
    moveSession,
    moveInstructor,
    selectSession,
    openModal,
    closeModal,
    toggleEditMode,
    updateTimeSlot,
    addVenues,
    removeVenue,
    updateVenue,
    hasUnsavedChanges,
    isSaving,
    saveAllChanges,
    discardChanges,
    pendingChangesCount,
  } = useSessionEditor(editingScheduleId);

  const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('17:00');
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [isCreatingInstructor, setIsCreatingInstructor] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [availableRooms, setAvailableRooms] = useState<VenueInfo[]>([]);

  const currentSchedule = useMemo(() => {
    return schedules.find(s => s.id === editingScheduleId) ?? null;
  }, [editingScheduleId, schedules]);

  // 利用可能な部屋を取得
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        const venues = await practiceScheduleEditorService.getVenues();
        setAvailableRooms(venues);
      } catch (error) {
        console.error('会場データの取得に失敗しました:', error);
        setAvailableRooms([]);
      }
    };
    fetchAvailableRooms();
  }, []);

  // 編集対象スケジュールの情報が変更された時に状態を更新
  useEffect(() => {
    if (currentSchedule) {
      setDescriptionValue(currentSchedule.description || '');
      if (currentSchedule.startTime) {
        setScheduleStartTime(currentSchedule.startTime.substring(0, 5));
      }
      if (currentSchedule.endTime) {
        setScheduleEndTime(currentSchedule.endTime.substring(0, 5));
      }
    }
  }, [currentSchedule?.id, currentSchedule?.description, currentSchedule?.startTime, currentSchedule?.endTime]);

  // スケジュール詳細を取得
  useEffect(() => {
    if (editingScheduleId) {
      fetchScheduleDetails();
    }
  }, [editingScheduleId, fetchScheduleDetails]);

  // --- ハンドラ ---

  const handleCreateSession = () => {
    selectSession(null);
    openModal();
  };

  const handleEditSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      selectSession(session);
      openModal();
    } else {
      console.error('Session not found:', sessionId);
      alert('セッション情報が見つかりません');
    }
  };

  const handleDeleteSessionClick = async (sessionId: string) => {
    await deleteSession(sessionId);
  };

  const handleSessionSubmit = async (formData: any) => {
    if (selected_session) {
      await updateSession(selected_session.id, formData);
    } else {
      await createSession(formData);
    }
  };

  const handleSessionMove = async (
    sessionId: string,
    venueId: string,
    timeSlot: string,
    slotOrder: number
  ) => {
    await moveSession(sessionId, venueId, timeSlot, slotOrder);
  };

  const handleInstructorMove = async (
    instructorId: string,
    venueId: string,
    slotOrder: number
  ) => {
    await moveInstructor(instructorId, venueId, slotOrder);
  };

  const handleDeleteInstructor = async (instructorId: string) => {
    if (!confirm('監督者を削除しますか？')) return;
    try {
      await sessionInstructorService.deleteSessionInstructor(instructorId);
      fetchScheduleDetails();
    } catch (error) {
      console.error('監督者削除エラー:', error);
      alert('監督者の削除に失敗しました');
    }
  };

  const handleCreateInstructor = () => setIsCreatingInstructor(true);
  const handleCloseInstructorModal = () => setIsCreatingInstructor(false);

  const handleInstructorSubmit = async (data: any) => {
    try {
      const slotIndex = time_slots.findIndex(slot => slot.time === data.time_slot);
      const slotOrder = slotIndex + 1;
      const instructorData = {
        attendance_id: data.attendance_id,
        schedule_id: editingScheduleId,
        schedule_available_venue_id: data.venue_id,
        slot_order: slotOrder,
      };
      await sessionInstructorService.createSessionInstructor(instructorData);
      fetchScheduleDetails();
      setIsCreatingInstructor(false);
    } catch (error) {
      console.error('監督者追加エラー:', error);
      alert('監督者の追加に失敗しました');
    }
  };

  const handleScheduleTimeUpdate = async (startTime: string, endTime: string) => {
    try {
      await practiceScheduleEditorService.updateScheduleTime(
        editingScheduleId,
        `${startTime}:00`,
        `${endTime}:00`
      );
      setScheduleStartTime(startTime);
      setScheduleEndTime(endTime);
      await fetchScheduleDetails();
      await fetchSchedules();
    } catch (error) {
      console.error('スケジュール時間の更新に失敗しました:', error);
      alert('スケジュール時間の更新に失敗しました');
    }
  };

  const handleAddTimeSlot = async () => {
    try {
      const basicSchedule = await practiceScheduleEditorService.getBasicSchedule(editingScheduleId);
      const currentDivisionCount = basicSchedule?.division_count || time_slots.length || 6;
      const newDivisionCount = currentDivisionCount + 1;
      const actualStartTime = basicSchedule?.start_time || `${scheduleStartTime}:00`;
      const actualEndTime = basicSchedule?.end_time || `${scheduleEndTime}:00`;

      if (newDivisionCount > 24) {
        alert('時間スロットは最大24個までです');
        return;
      }

      await practiceScheduleEditorService.updateScheduleTime(
        editingScheduleId,
        actualStartTime,
        actualEndTime,
        newDivisionCount
      );
      await fetchScheduleDetails();
    } catch (error) {
      console.error('時間スロットの追加に失敗しました:', error);
      alert('時間スロットの追加に失敗しました');
    }
  };

  const handleRemoveTimeSlot = async () => {
    try {
      const basicSchedule = await practiceScheduleEditorService.getBasicSchedule(editingScheduleId);
      const currentSlotCount = time_slots.length;

      if (currentSlotCount <= 1) {
        alert('時間スロットは最低1個必要です');
        return;
      }

      const newDivisionCount = currentSlotCount - 1;
      const actualStartTime = basicSchedule?.start_time || `${scheduleStartTime}:00`;
      const actualEndTime = basicSchedule?.end_time || `${scheduleEndTime}:00`;

      await practiceScheduleEditorService.updateScheduleTime(
        editingScheduleId,
        actualStartTime,
        actualEndTime,
        newDivisionCount
      );
      await fetchScheduleDetails();
    } catch (error) {
      console.error('時間スロットの削除に失敗しました:', error);
      alert('時間スロットの削除に失敗しました');
    }
  };

  const handleSaveChanges = async () => {
    const result = await saveAllChanges();
    if (result.success) {
      alert('変更を保存しました');
    } else {
      alert(`保存に失敗しました:\n${result.errors.join('\n')}`);
    }
  };

  const handleDiscardChanges = () => {
    if (confirm('変更を破棄しますか？すべての未保存の変更が失われます。')) {
      discardChanges();
    }
  };

  const handleOptimizationComplete = async () => {
    setIsOptimizationModalOpen(false);
    await fetchScheduleDetails();
  };

  const handleEditDescription = () => setIsEditingDescription(true);

  const handleSaveDescription = async () => {
    try {
      await updateSchedule(editingScheduleId, { description: descriptionValue });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('練習内容の保存に失敗しました:', error);
      alert('練習内容の保存に失敗しました');
    }
  };

  const handleCancelEditDescription = useCallback(() => {
    setDescriptionValue(currentSchedule?.description || '');
    setIsEditingDescription(false);
  }, [currentSchedule?.description]);

  // --- ローディング / エラー ---

  if (listLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  if ((editorLoading || time_slots.length === 0) && sessions.length === 0 && !is_modal_open) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  if (editorError && sessions.length === 0 && !is_modal_open && !listLoading) {
    return (
      <div className="panel-error px-4 py-3 rounded">
        エラー: {editorError}
      </div>
    );
  }

  // --- レンダリング ---

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={navigateToList}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">一覧に戻る</span>
          </Button>
          <div>
            <ScheduleTimeEditor
              startTime={scheduleStartTime}
              endTime={scheduleEndTime}
              onUpdate={handleScheduleTimeUpdate}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsOptimizationModalOpen(true)}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm sm:text-base"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">自動最適化</span>
            <span className="sm:hidden">最適化</span>
          </Button>
          <Button
            onClick={handleCreateSession}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 btn-add text-sm sm:text-base"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">パート追加</span>
            <span className="sm:hidden">パート</span>
          </Button>
          <Button
            onClick={handleCreateInstructor}
            variant="outline"
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm sm:text-base"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">監督者を追加</span>
            <span className="sm:hidden">監督者</span>
          </Button>
          {/* 保存ボタン（PC表示） */}
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving || !hasUnsavedChanges}
            className={`hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm sm:text-base ${
              hasUnsavedChanges ? 'bg-red-600 hover:bg-red-700 text-white' : ''
            }`}
            variant={hasUnsavedChanges ? "default" : "outline"}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? '保存中...' : hasUnsavedChanges ? `保存 (${pendingChangesCount})` : '保存済み'}</span>
          </Button>
        </div>
      </div>

      {/* 未保存の変更がある場合の警告バー（PC表示） */}
      {hasUnsavedChanges && (
        <div className="hidden sm:flex bg-amber-50 border border-amber-200 rounded-lg p-4 items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-700">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">
              {pendingChangesCount}件の未保存の変更があります
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>変更を破棄</span>
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? '保存中...' : '変更を保存'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 編集テーブル */}
      <SessionEditorTableSimpleDnd
        sessions={sessions}
        instructors={instructors}
        venues={editorVenues}
        availableRooms={availableRooms}
        time_slots={time_slots}
        edit_mode={edit_mode}
        scheduleId={editingScheduleId}
        onEditSession={handleEditSession}
        onDeleteSession={handleDeleteSessionClick}
        onMoveSession={handleSessionMove}
        onMoveInstructor={handleInstructorMove}
        onDeleteInstructor={handleDeleteInstructor}
        onAddTimeSlot={handleAddTimeSlot}
        onRemoveTimeSlot={handleRemoveTimeSlot}
        onUpdateTimeSlot={updateTimeSlot}
        onAddVenues={addVenues}
        onRemoveVenue={removeVenue}
        onUpdateVenue={updateVenue}
        fallbackInstructors={[]}
      />

      {/* 練習内容編集セクション */}
      <div className="mt-6 card-blue p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">練習内容</h3>
          {!isEditingDescription && (
            <Button
              onClick={handleEditDescription}
              className="flex items-center space-x-2 px-3 py-2 text-sm"
            >
              <Edit2 className="h-4 w-4" />
              <span>編集</span>
            </Button>
          )}
        </div>
        {isEditingDescription ? (
          <div className="space-y-4">
            <textarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              className="w-full min-h-[200px] p-4 input-field resize-y"
              placeholder="練習内容を入力してください..."
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCancelEditDescription}
                className="flex items-center space-x-2 px-4 py-2 text-sm"
              >
                <X className="h-4 w-4" />
                <span>キャンセル</span>
              </Button>
              <Button
                onClick={handleSaveDescription}
                className="flex items-center space-x-2 px-4 py-2 text-sm btn-save"
              >
                <Save className="h-4 w-4" />
                <span>保存</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm panel-info p-4 border-l-4 border-blue-400 leading-relaxed whitespace-pre-wrap min-h-[100px]">
            {descriptionValue || '練習内容が設定されていません'}
          </div>
        )}
      </div>

      {/* セッション編集モーダル */}
      {is_modal_open && (
        <SessionEditorModal
          session={selected_session}
          venues={editorVenues}
          time_slots={time_slots}
          parts={parts}
          scheduleId={editingScheduleId}
          is_creating={!selected_session}
          onSubmit={handleSessionSubmit}
          onCancel={closeModal}
          loading={editorLoading}
        />
      )}

      {/* 自動最適化モーダル */}
      {isOptimizationModalOpen && (
        <OptimizationModal
          scheduleId={editingScheduleId}
          onOptimizationComplete={handleOptimizationComplete}
          onClose={() => setIsOptimizationModalOpen(false)}
        />
      )}

      {/* 監督者追加モーダル */}
      {isCreatingInstructor && (
        <InstructorEditorModal
          isOpen={isCreatingInstructor}
          onClose={handleCloseInstructorModal}
          onSubmit={handleInstructorSubmit}
          venues={editorVenues}
          time_slots={time_slots}
          scheduleId={editingScheduleId}
        />
      )}

      {/* スマホ用フローティング保存ボタン */}
      {hasUnsavedChanges && (
        <div className="sm:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-amber-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-amber-700 text-sm">
                <span>⚠️</span>
                <span className="font-medium">{pendingChangesCount}件の変更</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDiscardChanges}
                  disabled={isSaving}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>破棄</span>
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? '保存中...' : '保存'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
