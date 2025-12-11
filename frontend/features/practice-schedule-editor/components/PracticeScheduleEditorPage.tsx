'use client';

import React, { useState, useEffect } from 'react';
import { SessionEditorTableSimpleDnd } from './SessionEditorTableSimpleDnd';
import { SessionEditorModal } from './SessionEditorModal';
import { InstructorEditorModal } from './InstructorEditorModal';
import { ScheduleSelector } from './ScheduleSelector';
import { ScheduleTimeEditor } from './ScheduleTimeEditor';
import { OptimizationModal } from './OptimizationModal';
import { useSessionEditor } from '../hooks/use-session-editor';
import { UI_TEXT } from '../constants';
import { Edit, Eye, Plus, Calendar, ArrowLeft, Sparkles } from 'lucide-react';
import { sessionInstructorService, practiceScheduleEditorService } from '../services';
import { VenueInfo } from '../types/session-editor';

interface PracticeScheduleEditorPageProps {
  scheduleId?: string;
  scheduleDate?: string;
}

export const PracticeScheduleEditorPage: React.FC<PracticeScheduleEditorPageProps> = ({
  scheduleId: initialScheduleId,
  scheduleDate: initialScheduleDate,
}) => {
  const [currentScheduleId, setCurrentScheduleId] = useState(initialScheduleId || '');
  const [currentScheduleDate, setCurrentScheduleDate] = useState(initialScheduleDate || '');
  const [isScheduleSelected, setIsScheduleSelected] = useState(!!initialScheduleId);
  const [availableRooms, setAvailableRooms] = useState<VenueInfo[]>([]);
  
  console.log('PracticeScheduleEditorPage初期化:', {
    initialScheduleId,
    initialScheduleDate,
    currentScheduleId,
    isScheduleSelected,
    currentScheduleIdLength: currentScheduleId?.length,
    currentScheduleIdTrim: currentScheduleId?.trim()
  });
  const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('17:00');

  const {
    sessions,
    instructors,
    venues,
    time_slots,
    parts,
    selected_session,
    is_modal_open,
    edit_mode,
    loading,
    error,
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
  } = useSessionEditor(currentScheduleId);

  const [isCreating, setIsCreating] = useState(false);
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [isCreatingInstructor, setIsCreatingInstructor] = useState(false);

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

  // スケジュールの開始/終了時間をAPIから同期
  useEffect(() => {
    if (!currentScheduleId) {
      return;
    }

    let isMounted = true;

    const syncScheduleTimes = async () => {
      try {
        const basicSchedule = await practiceScheduleEditorService.getBasicSchedule(currentScheduleId);
        if (!basicSchedule || !isMounted) {
          return;
        }

        if (basicSchedule.start_time) {
          setScheduleStartTime(basicSchedule.start_time.substring(0, 5));
        }
        if (basicSchedule.end_time) {
          setScheduleEndTime(basicSchedule.end_time.substring(0, 5));
        }
      } catch (error) {
        console.error('スケジュール時間の取得に失敗しました:', error);
      }
    };

    syncScheduleTimes();

    return () => {
      isMounted = false;
    };
  }, [currentScheduleId]);

  const handleCreateSession = () => {
    setIsCreating(true);
    selectSession(null);
    openModal();
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
        schedule_id: currentScheduleId,
        schedule_available_venue_id: data.venue_id,
        slot_order: slotOrder,
      };

      await sessionInstructorService.createSessionInstructor(instructorData);
      
      // スケジュール詳細を再取得
      fetchScheduleDetails();
      
      setIsCreatingInstructor(false);
    } catch (error) {
      console.error('監督者追加エラー:', error);
      alert('監督者の追加に失敗しました');
    }
  };

  const handleEditSession = (sessionId: string) => {
    console.log('handleEditSession called with sessionId:', sessionId);
    console.log('Available sessions:', sessions);
    const session = sessions.find(s => s.id === sessionId);
    console.log('Found session:', session);
    if (session) {
      setIsCreating(false);
      selectSession(session);
      openModal();
    } else {
      console.error('Session not found:', sessionId);
      alert('セッション情報が見つかりません');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
  };

  const handleSessionSubmit = async (formData: any) => {
    if (isCreating) {
      await createSession(formData);
    } else if (selected_session) {
      await updateSession(selected_session.id, formData);
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
      const { sessionInstructorService } = await import('../services/session-instructor-service');
      await sessionInstructorService.deleteSessionInstructor(instructorId);
      // 削除後、スケジュール詳細を再取得
      fetchScheduleDetails();
    } catch (error) {
      console.error('監督者削除エラー:', error);
      alert('監督者の削除に失敗しました');
    }
  };

  const handleScheduleSelect = (scheduleId: string, scheduleDate: string) => {
    setCurrentScheduleId(scheduleId);
    setCurrentScheduleDate(scheduleDate);
    setIsScheduleSelected(true);
  };

  const handleScheduleTimeUpdate = async (startTime: string, endTime: string) => {
    try {
      const { practiceScheduleEditorService } = await import('../services');
      await practiceScheduleEditorService.updateScheduleTime(
        currentScheduleId,
        `${startTime}:00`,
        `${endTime}:00`
      );
      setScheduleStartTime(startTime);
      setScheduleEndTime(endTime);
      await fetchScheduleDetails();
    } catch (error) {
      console.error('スケジュール時間の更新に失敗しました:', error);
      alert('スケジュール時間の更新に失敗しました');
    }
  };

  const handleBackToSelection = () => {
    setIsScheduleSelected(false);
    setCurrentScheduleId('');
    setCurrentScheduleDate('');
  };

  const handleAddTimeSlot = async () => {
    try {
      const { practiceScheduleEditorService } = await import('../services');
      
      // 現在のdivision_countとstart_time/end_timeをAPIから取得
      const basicSchedule = await practiceScheduleEditorService.getBasicSchedule(currentScheduleId);
      const currentDivisionCount = basicSchedule?.division_count || time_slots.length || 6;
      const newDivisionCount = currentDivisionCount + 1;
      
      // 実際のスケジュールの時間を使用（stateは初期値のままの可能性があるため）
      const actualStartTime = basicSchedule?.start_time || `${scheduleStartTime}:00`;
      const actualEndTime = basicSchedule?.end_time || `${scheduleEndTime}:00`;
      
      if (newDivisionCount > 24) {
        alert('時間スロットは最大24個までです');
        return;
      }
      
      // division_countを更新（時間は既存の値を使用）
      await practiceScheduleEditorService.updateScheduleTime(
        currentScheduleId,
        actualStartTime,
        actualEndTime,
        newDivisionCount
      );
      
      // テーブルのみ再読み込み
      await fetchScheduleDetails();
    } catch (error) {
      console.error('時間スロットの追加に失敗しました:', error);
      alert('時間スロットの追加に失敗しました');
    }
  };

  const handleRemoveTimeSlot = async () => {
    try {
      const { practiceScheduleEditorService } = await import('../services');
      
      // 実際の時間スロット数を使用（division_countと一致しない可能性があるため）
      const currentSlotCount = time_slots.length;
      
      if (currentSlotCount <= 1) {
        alert('時間スロットは最低1個必要です');
        return;
      }
      
      const newDivisionCount = currentSlotCount - 1;
      
      // 現在のstart_time/end_timeをAPIから取得
      const basicSchedule = await practiceScheduleEditorService.getBasicSchedule(currentScheduleId);
      const actualStartTime = basicSchedule?.start_time || `${scheduleStartTime}:00`;
      const actualEndTime = basicSchedule?.end_time || `${scheduleEndTime}:00`;
      
      // division_countを更新（時間は既存の値を使用）
      await practiceScheduleEditorService.updateScheduleTime(
        currentScheduleId,
        actualStartTime,
        actualEndTime,
        newDivisionCount
      );
      
      // テーブルのみ再読み込み
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

  // スケジュールが選択されていない場合は選択画面を表示
  if (!isScheduleSelected) {
    return <ScheduleSelector onScheduleSelect={handleScheduleSelect} />;
  }

  // 初回読み込み中のみローディングスピナーを表示
  // データが既にある場合（sessions.length > 0）、またはモーダルが開いている場合は、
  // 操作中でもテーブル/モーダルを表示し続ける
  if (loading && sessions.length === 0 && !is_modal_open) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  if (error && sessions.length === 0 && !is_modal_open) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        エラー: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToSelection}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>スケジュール選択に戻る</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">練習表編集</h1>
            <p className="text-gray-600 mt-1">
              {currentScheduleDate} の練習スケジュールを編集します
            </p>
            <div className="mt-2">
              <ScheduleTimeEditor
                startTime={scheduleStartTime}
                endTime={scheduleEndTime}
                onUpdate={handleScheduleTimeUpdate}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAutoOptimize}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>自動最適化</span>
          </button>
          <button
            onClick={handleCreateSession}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{UI_TEXT.ADD_SESSION}</span>
          </button>
          <button
            onClick={handleCreateInstructor}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>監督者を追加</span>
          </button>
        </div>
      </div>

      {/* 編集テーブル */}
      <SessionEditorTableSimpleDnd
        sessions={sessions}
        instructors={instructors}
        venues={venues}
        availableRooms={availableRooms}
        time_slots={time_slots}
        edit_mode={edit_mode}
        scheduleId={currentScheduleId}
        onEditSession={handleEditSession}
        onDeleteSession={handleDeleteSession}
        onMoveSession={handleSessionMove}
        onMoveInstructor={handleInstructorMove}
        onDeleteInstructor={handleDeleteInstructor}
        onAddTimeSlot={handleAddTimeSlot}
        onRemoveTimeSlot={handleRemoveTimeSlot}
        onUpdateTimeSlot={updateTimeSlot}
        onAddVenues={addVenues}
        onRemoveVenue={removeVenue}
        onUpdateVenue={updateVenue}
        fallbackInstructors={[]} // フォールバック用のインストラクター名配列（必要に応じて設定）
      />

      {/* セッション編集モーダル */}
      {is_modal_open && (
        <SessionEditorModal
          session={selected_session}
          venues={venues}
          time_slots={time_slots}
          parts={parts}
          scheduleId={currentScheduleId}
          is_creating={isCreating}
          onSubmit={handleSessionSubmit}
          onCancel={closeModal}
          loading={loading}
        />
      )}

      {/* 自動最適化モーダル */}
      {isOptimizationModalOpen && (
        <OptimizationModal
          scheduleId={currentScheduleId}
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
          venues={venues}
          time_slots={time_slots}
          scheduleId={currentScheduleId}
        />
      )}
    </div>
  );
};
