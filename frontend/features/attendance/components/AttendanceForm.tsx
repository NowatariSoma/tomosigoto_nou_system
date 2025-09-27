'use client';

import React, { useState, useEffect } from 'react';
import { Attendance, AttendanceFormData, AttendanceFormErrors, PracticeSchedule } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, UI_TEXT, VALIDATION, INITIAL_ATTENDANCE_FORM } from '../constants';
import { Calendar, Clock, MapPin, FileText, Save, X } from 'lucide-react';

interface AttendanceFormProps {
  attendance?: Attendance | null;
  practiceSchedules: PracticeSchedule[];
  userId: string;
  onSubmit: (data: AttendanceFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({
  attendance,
  practiceSchedules,
  userId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<AttendanceFormData>(
    attendance ? {
      practice_schedule_id: attendance.practice_schedule_id,
      status: attendance.status,
      notes: attendance.notes || '',
    } : INITIAL_ATTENDANCE_FORM
  );

  const [errors, setErrors] = useState<AttendanceFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: AttendanceFormErrors = {};

    if (!formData.practice_schedule_id) {
      newErrors.practice_schedule_id = '練習予定は必須です';
    }

    if (!formData.status) {
      newErrors.status = '出席状況は必須です';
    }

    if (formData.notes && formData.notes.length > VALIDATION.MAX_NOTES_LENGTH) {
      newErrors.notes = `備考は${VALIDATION.MAX_NOTES_LENGTH}文字以内で入力してください`;
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

  const handleInputChange = (field: keyof AttendanceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const selectedPractice = practiceSchedules.find(p => p.id === formData.practice_schedule_id);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {attendance ? '出席記録を編集' : '出席登録'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 練習予定選択 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4" />
            <span>{UI_TEXT.PRACTICE} <span className="text-red-500">*</span></span>
          </label>
          <select
            value={formData.practice_schedule_id}
            onChange={(e) => handleInputChange('practice_schedule_id', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.practice_schedule_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">練習予定を選択してください</option>
            {practiceSchedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {new Date(schedule.schedule_date).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })} {schedule.start_time}-{schedule.end_time} {schedule.title || schedule.description || '練習'}
              </option>
            ))}
          </select>
          {errors.practice_schedule_id && (
            <p className="mt-1 text-sm text-red-600">{errors.practice_schedule_id}</p>
          )}
        </div>

        {/* 選択された練習予定の詳細 */}
        {selectedPractice && (
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              選択された練習予定
            </h3>
            <div className="space-y-6">
              {/* 日付と時間 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">日付</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {new Date(selectedPractice.schedule_date).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">時間</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedPractice.start_time} - {selectedPractice.end_time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 会場情報 */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">会場</p>
                    <p className="text-lg font-semibold text-slate-900">
                      練習会場（詳細は後日連絡）
                    </p>
                  </div>
                </div>
              </div>
              
              {/* タイトル */}
              {selectedPractice.title && (
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">練習タイトル</h4>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {selectedPractice.title}
                  </p>
                </div>
              )}

              {/* 説明 */}
              {selectedPractice.description && (
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">練習内容</h4>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedPractice.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 出席状況選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {UI_TEXT.STATUS} <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ATTENDANCE_STATUS).map(([key, value]) => (
              <label
                key={key}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 ${
                  formData.status === value
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={formData.status === value}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="sr-only"
                />
                {ATTENDANCE_STATUS_LABELS[value as keyof typeof ATTENDANCE_STATUS_LABELS]}
              </label>
            ))}
          </div>
          {errors.status && (
            <p className="mt-2 text-sm text-red-600">{errors.status}</p>
          )}
        </div>

        {/* 備考 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4" />
            <span>{UI_TEXT.NOTES}</span>
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            placeholder="備考があれば入力してください（任意）"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.notes ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
          )}
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200 font-medium shadow-sm"
          >
            <X className="h-4 w-4" />
            <span>{UI_TEXT.CANCEL}</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-all duration-200 font-medium shadow-sm disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? '保存中...' : UI_TEXT.SAVE}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
