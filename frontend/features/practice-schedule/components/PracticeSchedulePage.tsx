'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PracticeSchedule, PracticeScheduleFormData } from '../types';
import { PracticeScheduleList } from './PracticeScheduleList';
import { PracticeScheduleForm } from './PracticeScheduleForm';
import { ScheduleSearchFilter } from './ScheduleSearchFilter';
import { ScheduleEditorView } from './ScheduleEditorView';
import { usePracticeSchedules, useVenues, usePracticeScheduleRouting } from '../hooks';
import { UI_TEXT } from '../constants';
import { StageData } from '../../parts-setting/types';
import { stageService } from '../../parts-setting/services/stage-service';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';

export const PracticeSchedulePage: React.FC = () => {
  const { currentScheduleId, isEditMode, navigateToSchedule, navigateToList } = usePracticeScheduleRouting();
  const { schedules, loading, error, createSchedule, updateSchedule, deleteSchedule, fetchSchedules } = usePracticeSchedules();
  const { venues, loading: venuesLoading, error: venuesError } = useVenues();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PracticeSchedule | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');
  const [stages, setStages] = useState<StageData[]>([]);

  // ステージ（舞台）一覧を取得
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const stageData = await stageService.getStages();
        setStages(stageData);
      } catch (error) {
        console.error('舞台データの取得に失敗しました:', error);
        setStages([]);
      }
    };
    fetchStages();
  }, []);

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

  const handleScheduleClick = useCallback((schedule: PracticeSchedule) => {
    navigateToSchedule(schedule);
  }, [navigateToSchedule]);

  // 編集モード時の表示
  if (isEditMode && currentScheduleId) {
    return (
      <ScheduleEditorView
        editingScheduleId={currentScheduleId}
        schedules={schedules}
        listLoading={loading}
        updateSchedule={updateSchedule}
        fetchSchedules={fetchSchedules}
        navigateToList={navigateToList}
      />
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
        <Calendar className="h-12 w-12 text-black mx-auto mb-4" />
        <div className="text-black text-lg mb-2">
          {UI_TEXT.NO_VENUE_DATA}
        </div>
        <p className="text-black text-sm">
          まず会場を登録してから練習予定を作成してください
        </p>
      </div>
    );
  }

  // フィルタリングされたスケジュール
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.venueName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = selectedDate === 'all' || schedule.date === selectedDate;

    return matchesSearch && matchesDate;
  });

  // 日付の一覧を取得（重複を除く）
  const availableDates = Array.from(new Set(schedules.map(s => s.date))).sort();

  // 重複を除去した実際の件数を計算
  const uniqueSchedules = filteredSchedules.filter((schedule, index, self) =>
    index === self.findIndex(s => s.id === schedule.id)
  );

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
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
