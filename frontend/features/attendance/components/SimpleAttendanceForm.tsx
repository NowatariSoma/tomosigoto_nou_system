'use client';

import React, { useState } from 'react';
import { PracticeSchedule } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, UI_TEXT, VALIDATION } from '../constants';
import { Calendar, Clock, MapPin, FileText, Save, CheckCircle } from 'lucide-react';

interface SimpleAttendanceFormProps {
  practiceSchedule: PracticeSchedule;
  onSubmit: (data: { status: string; notes: string }) => Promise<void>;
  loading?: boolean;
}

export const SimpleAttendanceForm: React.FC<SimpleAttendanceFormProps> = ({
  practiceSchedule,
  onSubmit,
  loading = false,
}) => {
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<{ status?: string; notes?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { status?: string; notes?: string } = {};

    if (!status) {
      newErrors.status = '出席状況を選択してください';
    }

    if (notes && notes.length > VALIDATION.MAX_NOTES_LENGTH) {
      newErrors.notes = `備考は${VALIDATION.MAX_NOTES_LENGTH}文字以内で入力してください`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await onSubmit({ status, notes });
        setIsSubmitted(true);
      } catch (error) {
        console.error('Failed to submit attendance:', error);
      }
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (errors.status) {
      setErrors(prev => ({ ...prev, status: undefined }));
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (errors.notes) {
      setErrors(prev => ({ ...prev, notes: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-green-50 p-4 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">出席登録完了</h2>
            <p className="text-gray-600 leading-relaxed">
              出席状況の登録が完了しました。<br />
              ありがとうございます。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">出席登録</h1>
        <p className="text-gray-600">練習への出席状況を登録してください</p>
      </div>

      {/* 練習情報表示 */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          練習情報
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
                    {new Date(practiceSchedule.schedule_date).toLocaleDateString('ja-JP', {
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
                    {practiceSchedule.start_time} - {practiceSchedule.end_time}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 会場情報 */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 mb-2">会場</p>
                {practiceSchedule.venues && practiceSchedule.venues.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {practiceSchedule.venues.map(venue => (
                      <span
                        key={venue.id}
                        className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold text-sm"
                      >
                        {venue.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-slate-900">
                    会場未設定
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* 説明 */}
          {practiceSchedule.description && (
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
              <p className="text-slate-700 leading-relaxed">
                {practiceSchedule.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 出席状況選択 */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <label className="block text-lg font-semibold text-slate-900 mb-6">
            出席状況 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(ATTENDANCE_STATUS).map(([key, value]) => (
              <label
                key={key}
                className={`group relative inline-flex items-center justify-center px-6 py-4 rounded-lg text-lg font-medium cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                  status === value
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 scale-105'
                    : 'bg-white text-slate-700 hover:bg-blue-50 border-2 border-slate-300 hover:border-blue-400 shadow-sm hover:shadow-md'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={status === value}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="sr-only"
                />
                <span className="relative z-10">
                  {ATTENDANCE_STATUS_LABELS[value as keyof typeof ATTENDANCE_STATUS_LABELS]}
                </span>
                {status === value && (
                  <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-10 group-hover:opacity-20 transition-opacity"></div>
                )}
              </label>
            ))}
          </div>
          {errors.status && (
            <p className="mt-3 text-sm text-red-600 font-medium">{errors.status}</p>
          )}
        </div>

        {/* 備考 */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <label className="flex items-center space-x-3 text-lg font-semibold text-slate-900 mb-4">
            <div className="bg-slate-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
            <span>備考（任意）</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={4}
            placeholder="備考があれば入力してください"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none transition-colors ${
              errors.notes 
                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                : 'border-slate-300 focus:border-blue-500 hover:border-slate-400'
            }`}
          />
          {errors.notes && (
            <p className="mt-2 text-sm text-red-600 font-medium">{errors.notes}</p>
          )}
        </div>

        {/* 送信ボタン */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 rounded-lg transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-sm"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? '送信中...' : '出席を登録する'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
