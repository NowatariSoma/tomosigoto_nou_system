'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PracticeSchedule, PracticeScheduleFormData } from '../types';
import { PracticeScheduleList } from './PracticeScheduleList';
import { PracticeScheduleForm } from './PracticeScheduleForm';
import { ScheduleSearchFilter } from './ScheduleSearchFilter';
import { usePracticeSchedules, useVenues, usePracticeScheduleRouting } from '../hooks';
import { UI_TEXT } from '../constants';
import { StageData } from '../../parts-setting/types';
import { stageService } from '../../parts-setting/services/stage-service';
import { Plus, Calendar, ArrowLeft, Sparkles, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { SessionEditorTableSimpleDnd } from '../../practice-schedule-editor/components/SessionEditorTableSimpleDnd';
import { SessionEditorModal } from '../../practice-schedule-editor/components/SessionEditorModal';
import { InstructorEditorModal } from '../../practice-schedule-editor/components/InstructorEditorModal';
import { ScheduleTimeEditor } from '../../practice-schedule-editor/components/ScheduleTimeEditor';
import { OptimizationModal } from '../../practice-schedule-editor/components/OptimizationModal';
import { useSessionEditor } from '../../practice-schedule-editor/hooks';
import { sessionInstructorService, practiceScheduleEditorService } from '../../practice-schedule-editor/services';
import { VenueInfo } from '../../practice-schedule-editor/types/session-editor';

export const PracticeSchedulePage: React.FC = () => {
  const { currentScheduleId, isEditMode, navigateToSchedule, navigateToList } = usePracticeScheduleRouting();
  const { schedules, loading, error, createSchedule, updateSchedule, deleteSchedule, fetchSchedules } = usePracticeSchedules();
  const { venues, loading: venuesLoading, error: venuesError } = useVenues();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PracticeSchedule | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [stages, setStages] = useState<StageData[]>([]);

  // 編集モードのstate（currentScheduleIdから派生）
  const editingScheduleId = currentScheduleId ?? '';
  const [editingScheduleDate, setEditingScheduleDate] = useState<string>('');
  const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('17:00');
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [isCreatingInstructor, setIsCreatingInstructor] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [availableRooms, setAvailableRooms] = useState<VenueInfo[]>([]);

  // 編集用のフック
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
  } = useSessionEditor(editingScheduleId);

  const handleCreateClick = () => {
    setEditingSchedule(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (schedule: PracticeSchedule) => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (schedule: PracticeSchedule) => {
    if (window.confirm('この練習予定を削除しますか？')) {
      try {
        await deleteSchedule(schedule.id);
      } catch (error) {
        console.error('Failed to delete schedule:', error);
      }
    }
  };

  const handleFormSubmit = async (data: PracticeScheduleFormData) => {
    try {
      setFormLoading(true);
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data);
      } else {
        await createSchedule(data);
      }
      setIsFormOpen(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  // 利用可能な部屋を取得
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        console.log('部屋データを取得開始...');
        const venues = await practiceScheduleEditorService.getVenues();
        console.log('取得した会場データ:', venues);
        setAvailableRooms(venues);
      } catch (error) {
        console.error('会場データの取得に失敗しました:', error);
        setAvailableRooms([]);
      }
    };

    fetchAvailableRooms();
  }, []);

  // ステージ（舞台）一覧を取得
  useEffect(() => {
    const fetchStages = async () => {
      try {
        console.log('舞台データを取得開始...');
        const stageData = await stageService.getStages();
        console.log('取得した舞台データ:', stageData);
        setStages(stageData);
      } catch (error) {
        console.error('舞台データの取得に失敗しました:', error);
        setStages([]);
      }
    };

    fetchStages();
  }, []);

  // 編集モード関連のハンドラー（ルーティングフックを使用）
  const handleScheduleClick = useCallback((schedule: PracticeSchedule) => {
    navigateToSchedule(schedule);
  }, [navigateToSchedule]);

  const handleBackToList = useCallback(() => {
    navigateToList();
  }, [navigateToList]);

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
    if (!confirm('監督者を削除しますか？')) {
      return;
    }

    try {
      await sessionInstructorService.deleteSessionInstructor(instructorId);
      fetchScheduleDetails();
    } catch (error) {
      console.error('監督者削除エラー:', error);
      alert('監督者の削除に失敗しました');
    }
  };

  const handleCreateInstructor = () => {
    setIsCreatingInstructor(true);
  };

  const handleCloseInstructorModal = () => {
    setIsCreatingInstructor(false);
  };

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
      const { practiceScheduleEditorService } = await import('../../practice-schedule-editor/services');
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
      const { practiceScheduleEditorService } = await import('../../practice-schedule-editor/services');
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
      const { practiceScheduleEditorService } = await import('../../practice-schedule-editor/services');
      const basicSchedule = await practiceScheduleEditorService.getBasicSchedule(editingScheduleId);
      const currentDivisionCount = basicSchedule?.division_count || time_slots.length || 6;
      const newDivisionCount = currentDivisionCount - 1;
      const actualStartTime = basicSchedule?.start_time || `${scheduleStartTime}:00`;
      const actualEndTime = basicSchedule?.end_time || `${scheduleEndTime}:00`;

      if (newDivisionCount < 1) {
        alert('時間スロットは最低1個必要です');
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
      console.error('時間スロットの削除に失敗しました:', error);
      alert('時間スロットの削除に失敗しました');
    }
  };

  const handleAutoOptimize = () => {
    setIsOptimizationModalOpen(true);
  };

  const handleOptimizationComplete = async () => {
    setIsOptimizationModalOpen(false);
    await fetchScheduleDetails();
  };

  const handleEditDescription = () => {
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    try {
      await updateSchedule(editingScheduleId, {
        description: descriptionValue,
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('練習内容の保存に失敗しました:', error);
      alert('練習内容の保存に失敗しました');
    }
  };

  // 現在の編集対象スケジュールをメモ化（schedulesからIDで検索）
  const currentSchedule = useMemo(() => {
    if (!currentScheduleId) return null;
    return schedules.find(s => s.id === currentScheduleId) ?? null;
  }, [currentScheduleId, schedules]);

  const handleCancelEditDescription = useCallback(() => {
    setDescriptionValue(currentSchedule?.description || '');
    setIsEditingDescription(false);
  }, [currentSchedule?.description]);

  // 編集対象スケジュールの情報が変更された時に状態を更新
  useEffect(() => {
    if (currentSchedule) {
      setEditingScheduleDate(currentSchedule.date);
      setDescriptionValue(currentSchedule.description || '');

      // スケジュールの開始・終了時間を設定
      if (currentSchedule.startTime) {
        setScheduleStartTime(currentSchedule.startTime.substring(0, 5));
      }
      if (currentSchedule.endTime) {
        setScheduleEndTime(currentSchedule.endTime.substring(0, 5));
      }
    } else {
      setEditingScheduleDate('');
    }
  }, [currentSchedule?.id, currentSchedule?.date, currentSchedule?.description, currentSchedule?.startTime, currentSchedule?.endTime]);

  // 編集モードに入った時にスケジュール詳細を取得
  useEffect(() => {
    if (isEditMode && editingScheduleId) {
      fetchScheduleDetails();
    }
  }, [isEditMode, editingScheduleId, fetchScheduleDetails]);

  // フィルタリングされたスケジュール
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.venueName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !selectedDate || schedule.date === selectedDate;

    return matchesSearch && matchesDate;
  });

  // 日付の一覧を取得（重複を除く）
  const availableDates = Array.from(new Set(schedules.map(s => s.date))).sort();

  // 編集モード時の表示
  if (isEditMode) {
    // スケジュール一覧がまだロード中の場合はローディングを表示
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
        </div>
      );
    }

    // 編集データ（セッションや時間スロット）がロード中の場合もローディングを表示
    if ((editorLoading || time_slots.length === 0) && sessions.length === 0 && !is_modal_open) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
        </div>
      );
    }

    if (editorError && sessions.length === 0 && !is_modal_open && !loading) {
      return (
        <div className="panel-error px-4 py-3 rounded">
          エラー: {editorError}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
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
              onClick={handleAutoOptimize}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors text-sm sm:text-base"
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
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-md transition-colors text-sm sm:text-base"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">監督者を追加</span>
              <span className="sm:hidden">監督者</span>
            </Button>
          </div>
        </div>

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
        <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">練習内容</h3>
            {!isEditingDescription && (
              <Button
                onClick={handleEditDescription}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
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
                className="w-full min-h-[200px] p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="練習内容を入力してください..."
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEditDescription}
                  className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md transition-colors"
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
            <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border-l-4 border-blue-500 leading-relaxed whitespace-pre-wrap min-h-[100px]">
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
      </div>
    );
  }

  if (loading || venuesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  if (error || venuesError) {
    return (
      <div className="panel-error px-4 py-3 rounded">
        エラー: {error || venuesError}
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 text-lg mb-2">
          {UI_TEXT.NO_VENUE_DATA}
        </div>
        <p className="text-gray-400 text-sm">
          まず会場を登録してから練習予定を作成してください
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* フォーム */}
      {isFormOpen && (
        <PracticeScheduleForm
          schedule={editingSchedule}
          venues={venues}
          stages={stages}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      )}

      {/* 検索・フィルター */}
      <ScheduleSearchFilter
        searchTerm={searchTerm}
        selectedDate={selectedDate}
        availableDates={availableDates}
        onSearchChange={setSearchTerm}
        onDateChange={setSelectedDate}
      />

      {/* 練習予定一覧 */}
      <div>
        {(() => {
          // 重複を除去した実際の件数を計算
          const uniqueSchedules = filteredSchedules.filter((schedule, index, self) =>
            index === self.findIndex(s => s.id === schedule.id)
          );
          return (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                練習予定一覧 ({uniqueSchedules.length}件)
              </h2>
              <Button
                onClick={handleCreateClick}
                className="btn-add px-4 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                新規登録
              </Button>
            </div>
          );
        })()}
        <PracticeScheduleList
          schedules={filteredSchedules}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onClick={handleScheduleClick}
        />
      </div>

    </div>
  );
};
