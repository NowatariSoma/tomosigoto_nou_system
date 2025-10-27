'use client';

import React, { useState, useEffect } from 'react';
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
  currentUserId?: string;
  onSubmit: (data: { status: string; notes: string; userId: string; practiceScheduleId: string; availableFrom?: string; availableTo?: string }) => Promise<void>;
  loading?: boolean;
}

export const SimpleAttendanceForm: React.FC<SimpleAttendanceFormProps> = ({
  practiceSchedules,
  users,
  currentUserId,
  onSubmit,
  loading = false,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId || '');
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availableFrom, setAvailableFrom] = useState<string>('');
  const [availableTo, setAvailableTo] = useState<string>('');
  const [errors, setErrors] = useState<{ selectedUserId?: string; selectedPracticeId?: string; status?: string; notes?: string; availableFrom?: string; availableTo?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 練習が1つだけの場合は自動選択
  useEffect(() => {
    if (practiceSchedules.length === 1 && !selectedPracticeId) {
      setSelectedPracticeId(practiceSchedules[0].id);
    }
  }, [practiceSchedules, selectedPracticeId]);

  const validateForm = (): boolean => {
    const newErrors: { selectedUserId?: string; selectedPracticeId?: string; status?: string; notes?: string; availableFrom?: string; availableTo?: string } = {};

    if (!selectedUserId) {
      newErrors.selectedUserId = 'ユーザーを選択してください';
    }

    if (!selectedPracticeId) {
      newErrors.selectedPracticeId = '練習を選択してください';
    }

    if (!status) {
      newErrors.status = '出席状況を選択してください';
    }

    if (status === ATTENDANCE_STATUS.LATE) {
      if (!availableFrom && !availableTo) {
        newErrors.availableFrom = '参加可能時間を入力してください';
      } else if (availableFrom && availableTo && availableFrom >= availableTo) {
        newErrors.availableFrom = '開始時刻は終了時刻より前にしてください';
      }
    }

    if (status === ATTENDANCE_STATUS.ABSENT) {
      if (!notes || notes.trim().length === 0) {
        newErrors.notes = '欠席の場合は謝罪文を入力してください';
      } else if (notes.trim().length < 30) {
        newErrors.notes = '謝罪文は30文字以上入力してください';
      } else if (notes.length > VALIDATION.MAX_NOTES_LENGTH) {
        newErrors.notes = `謝罪文は${VALIDATION.MAX_NOTES_LENGTH}文字以内で入力してください`;
      }
    } else if (notes && notes.length > VALIDATION.MAX_NOTES_LENGTH) {
      newErrors.notes = `備考は${VALIDATION.MAX_NOTES_LENGTH}文字以内で入力してください`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await onSubmit({
          userId: selectedUserId,
          practiceScheduleId: selectedPracticeId,
          status,
          notes,
          availableFrom: status === ATTENDANCE_STATUS.LATE && availableFrom ? availableFrom : undefined,
          availableTo: status === ATTENDANCE_STATUS.LATE && availableTo ? availableTo : undefined
        });
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
    // 遅刻以外の場合は時間フィールドをクリア
    if (newStatus !== ATTENDANCE_STATUS.LATE) {
      setAvailableFrom('');
      setAvailableTo('');
      setErrors(prev => ({ ...prev, availableFrom: undefined, availableTo: undefined }));
    }
  };

  const handleAvailableFromChange = (value: string) => {
    setAvailableFrom(value);
    if (errors.availableFrom) {
      setErrors(prev => ({ ...prev, availableFrom: undefined }));
    }
  };

  const handleAvailableToChange = (value: string) => {
    setAvailableTo(value);
    if (errors.availableTo) {
      setErrors(prev => ({ ...prev, availableTo: undefined }));
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
    <div>
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

        {/* ユーザー選択（currentUserIdが指定されていない場合のみ表示） */}
        {!currentUserId && (
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
        )}

        {/* 出席状況選択 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <label className="block text-lg font-semibold text-slate-900 mb-6">
            出席状況 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-4">
            {/* 出席（全幅） */}
            <label
              className={`group relative inline-flex items-center justify-center w-full px-6 py-4 rounded-lg text-lg font-medium cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                status === ATTENDANCE_STATUS.PRESENT
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 scale-105'
                  : 'bg-white text-slate-700 hover:bg-blue-50 border-2 border-slate-300 hover:border-blue-400 shadow-sm hover:shadow-md'
              }`}
            >
              <input
                type="radio"
                name="status"
                value={ATTENDANCE_STATUS.PRESENT}
                checked={status === ATTENDANCE_STATUS.PRESENT}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="sr-only"
              />
              <span className="relative z-10">
                {ATTENDANCE_STATUS_LABELS[ATTENDANCE_STATUS.PRESENT]}
              </span>
              {status === ATTENDANCE_STATUS.PRESENT && (
                <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-10 group-hover:opacity-20 transition-opacity"></div>
              )}
            </label>

            {/* 遅刻と欠席（横並び） */}
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`group relative inline-flex items-center justify-center px-6 py-4 rounded-lg text-lg font-medium cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                  status === ATTENDANCE_STATUS.LATE
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 scale-105'
                    : 'bg-white text-slate-700 hover:bg-blue-50 border-2 border-slate-300 hover:border-blue-400 shadow-sm hover:shadow-md'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={ATTENDANCE_STATUS.LATE}
                  checked={status === ATTENDANCE_STATUS.LATE}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="sr-only"
                />
                <span className="relative z-10">
                  {ATTENDANCE_STATUS_LABELS[ATTENDANCE_STATUS.LATE]}
                </span>
                {status === ATTENDANCE_STATUS.LATE && (
                  <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-10 group-hover:opacity-20 transition-opacity"></div>
                )}
              </label>

              <label
                className={`group relative inline-flex items-center justify-center px-6 py-4 rounded-lg text-lg font-medium cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                  status === ATTENDANCE_STATUS.ABSENT
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 scale-105'
                    : 'bg-white text-slate-700 hover:bg-blue-50 border-2 border-slate-300 hover:border-blue-400 shadow-sm hover:shadow-md'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={ATTENDANCE_STATUS.ABSENT}
                  checked={status === ATTENDANCE_STATUS.ABSENT}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="sr-only"
                />
                <span className="relative z-10">
                  {ATTENDANCE_STATUS_LABELS[ATTENDANCE_STATUS.ABSENT]}
                </span>
                {status === ATTENDANCE_STATUS.ABSENT && (
                  <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-10 group-hover:opacity-20 transition-opacity"></div>
                )}
              </label>
            </div>
          </div>
          {errors.status && (
            <p className="mt-3 text-sm text-red-600 font-medium">{errors.status}</p>
          )}
        </div>

        {/* 参加可能時間入力（遅刻の場合のみ表示） */}
        {status === ATTENDANCE_STATUS.LATE && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <label className="flex items-center space-x-3 text-lg font-semibold text-slate-900 mb-4">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <span>参加可能時間 <span className="text-red-500">*</span></span>
            </label>
            {selectedPracticeId && (
              <p className="text-sm text-gray-600 mb-4">
                練習時間: {practiceSchedules.find(p => p.id === selectedPracticeId)?.start_time} - {practiceSchedules.find(p => p.id === selectedPracticeId)?.end_time}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  何時から
                </label>
                <input
                  type="time"
                  value={availableFrom}
                  onChange={(e) => handleAvailableFromChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base transition-colors ${
                    errors.availableFrom
                      ? 'border-red-500 bg-red-50 focus:ring-red-500'
                      : 'border-slate-300 focus:border-blue-500 hover:border-slate-400 bg-white focus:ring-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  何時まで
                </label>
                <input
                  type="time"
                  value={availableTo}
                  onChange={(e) => handleAvailableToChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base transition-colors ${
                    errors.availableTo
                      ? 'border-red-500 bg-red-50 focus:ring-red-500'
                      : 'border-slate-300 focus:border-blue-500 hover:border-slate-400 bg-white focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>
            {errors.availableFrom && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.availableFrom}</p>
            )}
            {errors.availableTo && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.availableTo}</p>
            )}
          </div>
        )}

        {/* 備考 / 謝罪文 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <label className="flex items-center space-x-3 text-lg font-semibold text-slate-900 mb-4">
            <div className={`p-2 rounded-lg ${
              status === ATTENDANCE_STATUS.ABSENT
                ? 'bg-red-100'
                : 'bg-slate-100'
            }`}>
              <FileText className={`h-5 w-5 ${
                status === ATTENDANCE_STATUS.ABSENT
                  ? 'text-red-600'
                  : 'text-slate-600'
              }`} />
            </div>
            <span>
              {status === ATTENDANCE_STATUS.ABSENT ? '謝罪文' : '備考（任意）'}
              {status === ATTENDANCE_STATUS.ABSENT && <span className="text-red-500"> *</span>}
            </span>
          </label>
          {status === ATTENDANCE_STATUS.ABSENT && (
            <p className="text-sm text-red-700 mb-3 font-medium">
              欠席の場合は謝罪文を30文字以上入力してください（現在: {notes.trim().length}文字）
            </p>
          )}
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={status === ATTENDANCE_STATUS.ABSENT ? 6 : 4}
            placeholder={status === ATTENDANCE_STATUS.ABSENT ? '謝罪文を入力してください（30文字以上）' : '備考があれば入力してください'}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base resize-none transition-colors ${
              errors.notes
                ? 'border-red-500 bg-red-50 focus:ring-red-500'
                : status === ATTENDANCE_STATUS.ABSENT
                ? 'border-red-300 focus:border-red-500 hover:border-red-400 bg-white focus:ring-red-500'
                : 'border-slate-300 focus:border-blue-500 hover:border-slate-400 focus:ring-blue-500'
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
