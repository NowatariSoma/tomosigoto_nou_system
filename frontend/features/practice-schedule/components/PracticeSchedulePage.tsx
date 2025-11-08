'use client';

import React, { useState } from 'react';
import { PracticeSchedule, PracticeScheduleFormData } from '../types';
import { PracticeScheduleList } from './PracticeScheduleList';
import { PracticeScheduleForm } from './PracticeScheduleForm';
import { usePracticeSchedules, useVenues } from '../hooks';
import { UI_TEXT } from '../constants';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';

export const PracticeSchedulePage: React.FC = () => {
  const { schedules, loading, error, createSchedule, updateSchedule, deleteSchedule } = usePracticeSchedules();
  const { venues, loading: venuesLoading, error: venuesError } = useVenues();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PracticeSchedule | null>(null);
  const [formLoading, setFormLoading] = useState(false);

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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
      {/* 新規登録ボタン */}
      <div className="text-center">
        <Button
          onClick={handleCreateClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          新規登録
        </Button>
      </div>

      {/* フォーム */}
      {isFormOpen && (
        <PracticeScheduleForm
          schedule={editingSchedule}
          venues={venues}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      )}

      {/* 練習予定一覧 */}
      <div>
        {(() => {
          // 重複を除去した実際の件数を計算
          const uniqueSchedules = schedules.filter((schedule, index, self) => 
            index === self.findIndex(s => s.id === schedule.id)
          );
          return (
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              練習予定一覧 ({uniqueSchedules.length}件)
            </h2>
          );
        })()}
        <PracticeScheduleList
          schedules={schedules}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </div>

    </div>
  );
};
