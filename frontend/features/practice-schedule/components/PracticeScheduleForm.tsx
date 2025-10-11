'use client';

import React, { useState, useEffect } from 'react';
import { PracticeSchedule, PracticeScheduleFormData } from '../types';
import { Room } from '../../room-settings/types';
import { UI_TEXT, VALIDATION, INITIAL_PRACTICE_SCHEDULE_FORM } from '../constants';
import { Calendar, Clock, MapPin, FileText, Save, X } from 'lucide-react';
import RoomSelection from './RoomSelection';

interface PracticeScheduleFormProps {
  schedule?: PracticeSchedule | null;
  venues: Room[];
  onSubmit: (data: PracticeScheduleFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const PracticeScheduleForm: React.FC<PracticeScheduleFormProps> = ({
  schedule,
  venues,
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
    } : INITIAL_PRACTICE_SCHEDULE_FORM
  );

  const [errors, setErrors] = useState<Partial<PracticeScheduleFormData>>({});

  // scheduleが変更された時にformDataを更新
  useEffect(() => {
    if (schedule) {
      console.log('PracticeScheduleForm - schedule data:', {
        id: schedule.id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        date: schedule.date
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
      });
    } else {
      setFormData(INITIAL_PRACTICE_SCHEDULE_FORM);
    }
  }, [schedule]);

  // formDataが変更された時にデバッグ出力
  useEffect(() => {
    console.log('PracticeScheduleForm - formData:', {
      startTime: formData.startTime,
      endTime: formData.endTime,
      date: formData.date
    });
  }, [formData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PracticeScheduleFormData> = {};

    if (!formData.date) {
      newErrors.date = '日付は必須です';
    } else if (!VALIDATION.DATE_FORMAT.test(formData.date)) {
      newErrors.date = '正しい日付形式で入力してください';
    }

    if (!formData.startTime) {
      newErrors.startTime = '開始時間は必須です';
    } else if (!VALIDATION.TIME_FORMAT.test(formData.startTime)) {
      newErrors.startTime = '正しい時間形式で入力してください';
    }

    if (!formData.endTime) {
      newErrors.endTime = '終了時間は必須です';
    } else if (!VALIDATION.TIME_FORMAT.test(formData.endTime)) {
      newErrors.endTime = '正しい時間形式で入力してください';
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = '終了時間は開始時間より後である必要があります';
    }

    if (!formData.venueId && formData.venueIds.length === 0) {
      newErrors.venueId = '会場は必須です';
    }

    if (!formData.title) {
      newErrors.title = 'タイトルは必須です';
    }

    if (formData.description && formData.description.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `説明は${VALIDATION.MAX_DESCRIPTION_LENGTH}文字以内で入力してください`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (errors[field]) {
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
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {schedule ? UI_TEXT.UPDATE_SCHEDULE : UI_TEXT.CREATE_SCHEDULE}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 日付選択 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4" />
            <span>{UI_TEXT.DATE} <span className="text-red-500">*</span></span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>

        {/* 時間選択 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4" />
              <span>{UI_TEXT.START_TIME} <span className="text-red-500">*</span></span>
            </label>
            <select
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">選択してください</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4" />
              <span>{UI_TEXT.END_TIME} <span className="text-red-500">*</span></span>
            </label>
            <select
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">選択してください</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.endTime && (
              <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* 会場選択（複数選択対応） */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4" />
            <span>{UI_TEXT.VENUE} <span className="text-red-500">*</span></span>
          </label>
          <RoomSelection
            selectedRooms={formData.selectedVenues}
            onAddRoom={handleAddRooms}
            onRemoveRoom={handleRemoveRoom}
            availableRooms={venues}
          />
          {errors.venueId && (
            <p className="mt-1 text-sm text-red-600">{errors.venueId}</p>
          )}
        </div>

        {/* タイトル */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4" />
            <span>{UI_TEXT.TITLE} <span className="text-red-500">*</span></span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="練習のタイトルを入力してください"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* 説明 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4" />
            <span>{UI_TEXT.DESCRIPTION}</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            placeholder="練習内容や注意事項を入力してください（任意）"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-slate-400 rounded-lg transition-all duration-200 font-medium"
          >
            {UI_TEXT.CANCEL}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? '保存中...' : UI_TEXT.SAVE}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
