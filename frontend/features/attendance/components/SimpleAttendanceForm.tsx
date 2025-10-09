'use client';

import React, { useState } from 'react';
import { PracticeSchedule } from '../types';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, UI_TEXT, VALIDATION } from '../constants';
import { Calendar, Clock, MapPin, FileText, Save, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface SimpleAttendanceFormProps {
  practiceSchedules: PracticeSchedule[];
  users: User[];
  onSubmit: (data: { status: string; notes: string; userId: string; practiceScheduleId: string }) => Promise<void>;
  loading?: boolean;
}

export const SimpleAttendanceForm: React.FC<SimpleAttendanceFormProps> = ({
  practiceSchedules,
  users,
  onSubmit,
  loading = false,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<{ selectedUserId?: string; selectedPracticeId?: string; status?: string; notes?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { selectedUserId?: string; selectedPracticeId?: string; status?: string; notes?: string } = {};

    if (!selectedUserId) {
      newErrors.selectedUserId = 'ユーザーを選択してください';
    }

    if (!selectedPracticeId) {
      newErrors.selectedPracticeId = '練習を選択してください';
    }

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
        await onSubmit({ userId: selectedUserId, practiceScheduleId: selectedPracticeId, status, notes });
        setIsSubmitted(true);
      } catch (error) {
        console.error('Failed to submit attendance:', error);
      }
    }
  };

  const handleUserChange = (value: string) => {
    setSelectedUserId(value);
    if (errors.selectedUserId) {
      setErrors(prev => ({ ...prev, selectedUserId: undefined }));
    }
  };

  const handlePracticeChange = (value: string) => {
    setSelectedPracticeId(value);
    if (errors.selectedPracticeId) {
      setErrors(prev => ({ ...prev, selectedPracticeId: undefined }));
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


      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 練習選択 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <label className="block text-lg font-semibold text-slate-900 mb-4">
            練習選択 <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedPracticeId}
            onChange={(e) => handlePracticeChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base transition-colors ${
              errors.selectedPracticeId 
                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                : 'border-slate-300 focus:border-blue-500 hover:border-slate-400'
            }`}
          >
            <option value="">練習を選択してください</option>
            {practiceSchedules.map((practice) => (
              <option key={practice.id} value={practice.id}>
                {practice.title} - {new Date(practice.schedule_date).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })} {practice.start_time} - {practice.end_time}
              </option>
            ))}
          </select>
          {errors.selectedPracticeId && (
            <p className="mt-2 text-sm text-red-600 font-medium">{errors.selectedPracticeId}</p>
          )}
        </div>

        {/* ユーザー選択 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <label className="block text-lg font-semibold text-slate-900 mb-4">
            ユーザー選択 <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => handleUserChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base transition-colors ${
              errors.selectedUserId 
                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                : 'border-slate-300 focus:border-blue-500 hover:border-slate-400'
            }`}
          >
            <option value="">ユーザーを選択してください</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          {errors.selectedUserId && (
            <p className="mt-2 text-sm text-red-600 font-medium">{errors.selectedUserId}</p>
          )}
        </div>

        {/* 出席状況選択 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
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
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
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
