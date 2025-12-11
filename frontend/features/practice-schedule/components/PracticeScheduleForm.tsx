'use client';

import React, { useState, useEffect } from 'react';
import { PracticeSchedule, PracticeScheduleFormData } from '../types';
import { Room } from '../../room-settings/types';
import { StageData } from '../../parts-setting/types';
import { UI_TEXT, INITIAL_PRACTICE_SCHEDULE_FORM } from '../constants';
import { validatePracticeScheduleForm, ValidationErrors } from '../types/schemas';
import { Calendar, Clock, MapPin, FileText, Save, X, Theater } from 'lucide-react';
import RoomSelection from './RoomSelection';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';

interface PracticeScheduleFormProps {
  schedule?: PracticeSchedule | null;
  venues: Room[];
  stages: StageData[];
  onSubmit: (data: PracticeScheduleFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const PracticeScheduleForm: React.FC<PracticeScheduleFormProps> = ({
  schedule,
  venues,
  stages,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<PracticeScheduleFormData>(
    schedule ? {
      date: schedule.date,
      startTime: schedule.startTime ? schedule.startTime.substring(0, 5) : '', // HH:MM:SS -> HH:MM
      endTime: schedule.endTime ? schedule.endTime.substring(0, 5) : '', // HH:MM:SS -> HH:MM
      venueId: schedule.venueId,
      title: schedule.title || '',
      description: schedule.description || '',
      venueIds: schedule.venueIds || [schedule.venueId],
        selectedVenues: (schedule.venues as Room[]) || (schedule.venueId ? [{
          id: schedule.venueId,
          name: schedule.venueName,
          campus: schedule.campus as '今出川' | '京田辺',
          capacity: 0,
          danceAllowed: false,
        }] : []),
      stageId: schedule.stageId || '',
    } : INITIAL_PRACTICE_SCHEDULE_FORM
  );

  const [errors, setErrors] = useState<ValidationErrors>({});

  // scheduleが変更された時にformDataを更新
  useEffect(() => {
    if (schedule) {
      console.log('PracticeScheduleForm - schedule data:', {
        id: schedule.id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        date: schedule.date,
        stageId: schedule.stageId
      });
      setFormData({
        date: schedule.date,
        startTime: schedule.startTime ? schedule.startTime.substring(0, 5) : '', // HH:MM:SS -> HH:MM
        endTime: schedule.endTime ? schedule.endTime.substring(0, 5) : '', // HH:MM:SS -> HH:MM
        venueId: schedule.venueId,
        title: schedule.title || '',
        description: schedule.description || '',
        venueIds: schedule.venueIds || [schedule.venueId],
        selectedVenues: (schedule.venues as Room[]) || (schedule.venueId ? [{
          id: schedule.venueId,
          name: schedule.venueName,
          campus: schedule.campus as '今出川' | '京田辺',
          capacity: 0,
          danceAllowed: false,
        }] : []),
        stageId: schedule.stageId || '',
      });
    } else {
      setFormData(INITIAL_PRACTICE_SCHEDULE_FORM);
    }
  }, [schedule]);

  // 新規作成時、stagesが読み込まれたら最新のステージをデフォルトで選択
  useEffect(() => {
    if (!schedule && stages.length > 0 && !formData.stageId) {
      // 日付で降順ソートして最新のステージを取得
      const sortedStages = [...stages].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestStage = sortedStages[0];
      if (latestStage) {
        setFormData(prev => ({ ...prev, stageId: latestStage.id }));
      }
    }
  }, [schedule, stages, formData.stageId]);

  // formDataが変更された時にデバッグ出力
  useEffect(() => {
    console.log('PracticeScheduleForm - formData:', {
      startTime: formData.startTime,
      endTime: formData.endTime,
      date: formData.date
    });
  }, [formData]);

  // Zodスキーマを使用したバリデーション
  const validateForm = (): boolean => {
    const result = validatePracticeScheduleForm(formData);

    if (result.success) {
      setErrors({});
      return true;
    }

    setErrors(result.errors);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof PracticeScheduleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddRooms = (rooms: Room[]) => {
    const newVenueIds = rooms.map(room => room.id);
    
    setFormData(prev => ({
      ...prev,
      venueIds: newVenueIds,
      selectedVenues: rooms,
      // 最初の部屋をメインのvenueIdとして設定（後方互換性のため）
      venueId: newVenueIds[0] || '',
    }));
    
    // エラーをクリア
    if (errors.venueId) {
      setErrors(prev => ({ ...prev, venueId: undefined }));
    }
  };

  const handleRemoveRoom = (roomId: string) => {
    const newSelectedVenues = formData.selectedVenues.filter(venue => venue.id !== roomId);
    const newVenueIds = newSelectedVenues.map(venue => venue.id);
    
    setFormData(prev => ({
      ...prev,
      venueIds: newVenueIds,
      selectedVenues: newSelectedVenues,
      // 最初の部屋をメインのvenueIdとして設定（後方互換性のため）
      venueId: newVenueIds[0] || '',
    }));
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="modal-container p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title-xl">
            {schedule ? UI_TEXT.UPDATE_SCHEDULE : UI_TEXT.CREATE_SCHEDULE}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 日付選択 */}
        <div>
          <label className="label-form flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4" />
            <span>{UI_TEXT.DATE} <span className="text-black">*</span></span>
          </label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="input-field"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-black">{errors.date}</p>
          )}
        </div>

        {/* 舞台選択 */}
        <div>
          <label className="label-form flex items-center space-x-2 mb-2">
            <Theater className="h-4 w-4" />
            <span>{UI_TEXT.STAGE} <span className="text-black">*</span></span>
          </label>
          <select
            value={formData.stageId}
            onChange={(e) => handleInputChange('stageId', e.target.value)}
            className="input-field"
          >
            <option value="">{UI_TEXT.SELECT_STAGE}</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.stageName}
              </option>
            ))}
          </select>
          {errors.stageId && (
            <p className="mt-1 text-sm text-black">{errors.stageId}</p>
          )}
          {!errors.stageId && stages.length === 0 && (
            <p className="mt-1 text-sm text-black">{UI_TEXT.NO_STAGE_DATA}</p>
          )}
        </div>

        {/* 時間選択 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-form flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4" />
              <span>{UI_TEXT.START_TIME} <span className="text-black">*</span></span>
            </label>
            <Select
              value={formData.startTime}
              onValueChange={(value) => handleInputChange('startTime', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.startTime && (
              <p className="mt-1 text-sm text-black">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label className="label-form flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4" />
              <span>{UI_TEXT.END_TIME} <span className="text-black">*</span></span>
            </label>
            <Select
              value={formData.endTime}
              onValueChange={(value) => handleInputChange('endTime', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.endTime && (
              <p className="mt-1 text-sm text-black">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* 会場選択（複数選択対応） */}
        <div>
          <label className="label-form flex items-center space-x-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span>{UI_TEXT.VENUE} <span className="text-black">*</span></span>
          </label>
          <RoomSelection
            selectedRooms={formData.selectedVenues}
            onAddRoom={handleAddRooms}
            onRemoveRoom={handleRemoveRoom}
            availableRooms={venues}
          />
          {errors.venueId && (
            <p className="mt-1 text-sm text-black">{errors.venueId}</p>
          )}
        </div>

        {/* タイトル */}
        <div>
          <label className="label-form flex items-center space-x-2 mb-2">
            <FileText className="h-4 w-4" />
            <span>{UI_TEXT.TITLE} <span className="text-black">*</span></span>
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="練習のタイトルを入力してください"
            className="input-field"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-black">{errors.title}</p>
          )}
        </div>

        {/* 説明 */}
        <div>
          <label className="label-form flex items-center space-x-2 mb-2">
            <FileText className="h-4 w-4" />
            <span>{UI_TEXT.DESCRIPTION}</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            placeholder="練習内容や注意事項を入力してください（任意）"
            className="input-field"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-black">{errors.description}</p>
          )}
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-blue-200">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            className="px-6 py-2"
          >
            {UI_TEXT.CANCEL}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? '保存中...' : UI_TEXT.SAVE}</span>
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
};
