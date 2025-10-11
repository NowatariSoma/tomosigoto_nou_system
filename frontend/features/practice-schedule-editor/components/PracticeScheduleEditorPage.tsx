'use client';

import React, { useState } from 'react';
import { SessionEditorTableSimpleDnd } from './SessionEditorTableSimpleDnd';
import { SessionEditorModal } from './SessionEditorModal';
import { ScheduleSelector } from './ScheduleSelector';
import { ScheduleTimeEditor } from './ScheduleTimeEditor';
import { useSessionEditor } from '../hooks/use-session-editor';
import { UI_TEXT } from '../constants';
import { Edit, Eye, Plus, Calendar, ArrowLeft } from 'lucide-react';

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
  const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('17:00');

  const {
    sessions,
    venues,
    time_slots,
    parts,
    selected_session,
    is_modal_open,
    edit_mode,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    moveSession,
    selectSession,
    openModal,
    closeModal,
    toggleEditMode,
  } = useSessionEditor(currentScheduleId);

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = () => {
    setIsCreating(true);
    selectSession(null);
    openModal();
  };

  const handleEditSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setIsCreating(false);
      selectSession(session);
      openModal();
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

  // スケジュールが選択されていない場合は選択画面を表示
  if (!isScheduleSelected) {
    return <ScheduleSelector onScheduleSelect={handleScheduleSelect} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  if (error) {
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
            onClick={handleCreateSession}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{UI_TEXT.ADD_SESSION}</span>
          </button>
        </div>
      </div>

      {/* 編集テーブル */}
      <SessionEditorTableSimpleDnd
        sessions={sessions}
        venues={venues}
        time_slots={time_slots}
        edit_mode={edit_mode}
        onEditSession={handleEditSession}
        onDeleteSession={handleDeleteSession}
        onMoveSession={handleSessionMove}
      />

      {/* セッション編集モーダル */}
      {is_modal_open && (
        <SessionEditorModal
          session={selected_session}
          venues={venues}
          time_slots={time_slots}
          parts={parts}
          is_creating={isCreating}
          onSubmit={handleSessionSubmit}
          onCancel={closeModal}
          loading={loading}
        />
      )}
    </div>
  );
};
