'use client';

import React, { useState } from 'react';
import { PracticeSchedule, User } from '../../types/attendance';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, UI_TEXT, VALIDATION } from '../../constants/attendance';
import { Check, Clock, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';

interface SimpleAttendanceFormProps {
  practiceScheduleId: string;
  practiceSchedule?: PracticeSchedule;
  users: User[];
  currentUserId?: string;
  onSubmit: (data: { status: string; notes: string; userId: string; practiceScheduleId: string; availableFrom?: string; availableTo?: string }) => Promise<void>;
  loading?: boolean;
  existingAttendance?: any;
  timeSlotCount?: number; // コマ数が分かる場合はスロット順序UIを表示
}

/** スロット順序 N (1始まり) を "0N:00" センチネル文字列にエンコード */
const encodeSlotOrder = (order: number): string =>
  String(order).padStart(2, '0') + ':00';

/** "0N:00" センチネル文字列を "N限目" に変換（デコード失敗時はそのまま返す） */
const decodeSlotSentinel = (value: string, slotCount: number): string => {
  const match = value.match(/^(\d{2}):00$/);
  if (match) {
    const order = parseInt(match[1], 10);
    if (order >= 1 && order <= slotCount) {
      return `${order}限目`;
    }
  }
  return value;
};

export const SimpleAttendanceForm: React.FC<SimpleAttendanceFormProps> = ({
  practiceScheduleId,
  practiceSchedule,
  users,
  currentUserId,
  onSubmit,
  loading = false,
  existingAttendance,
  timeSlotCount,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId || '');
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availableFrom, setAvailableFrom] = useState<string>('');
  const [availableTo, setAvailableTo] = useState<string>('');
  const [errors, setErrors] = useState<{ selectedUserId?: string; status?: string; notes?: string; availableFrom?: string; availableTo?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { selectedUserId?: string; status?: string; notes?: string; availableFrom?: string; availableTo?: string } = {};

    if (!selectedUserId) {
      newErrors.selectedUserId = 'ユーザーを選択してください';
    }

    if (!status) {
      newErrors.status = '出席状況を選択してください';
    }

    if (status === ATTENDANCE_STATUS.LATE) {
      if (!availableFrom && !availableTo) {
        newErrors.availableFrom = timeSlotCount ? '参加開始コマを選択してください' : '参加可能時間を入力してください';
      } else if (!timeSlotCount && availableFrom && availableTo && availableFrom >= availableTo) {
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
          practiceScheduleId: practiceScheduleId,
          status,
          notes,
          availableFrom: status === ATTENDANCE_STATUS.LATE && availableFrom ? availableFrom : undefined,
          availableTo: status === ATTENDANCE_STATUS.LATE && availableTo ? availableTo : undefined
        });
        setIsSubmitted(true);
        setIsEditing(false);
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

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (errors.status) {
      setErrors(prev => ({ ...prev, status: undefined }));
    }
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

  // 編集モードを開く
  const handleEditClick = () => {
    if (existingAttendance) {
      setSelectedUserId(existingAttendance.user_id || currentUserId || '');
      setStatus(existingAttendance.status || '');
      setNotes(existingAttendance.notes || '');
      setAvailableFrom(existingAttendance.available_from || '');
      setAvailableTo(existingAttendance.available_to || '');
      setIsEditing(true);
    }
  };

  // 出席済みまたは登録完了時の表示
  if ((existingAttendance || isSubmitted) && !isEditing) {
    const statusLabel = existingAttendance
      ? ATTENDANCE_STATUS_LABELS[existingAttendance.status as keyof typeof ATTENDANCE_STATUS_LABELS]
      : '出席';

    const isLate = existingAttendance?.status === ATTENDANCE_STATUS.LATE;
    const hasTimeRange = existingAttendance?.available_from || existingAttendance?.available_to;

    return (
      <div className="w-full max-w-7xl mx-auto flex justify-end">
        <Button
          variant="ghost"
          onClick={handleEditClick}
          className="bg-white rounded-lg shadow-md overflow-hidden max-w-xs hover:shadow-lg transition-shadow cursor-pointer h-auto p-0"
        >
          <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200 w-full">
            <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-sm flex-shrink-0">
              <Check className="h-3 w-3 text-slate-600" strokeWidth={2.5} />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h3 className="text-sm font-semibold text-[#1E293B]">登録済み</h3>
                <span className="text-xs text-slate-600 font-medium">({statusLabel})</span>
                {isLate && hasTimeRange && (
                  <span className="text-xs text-slate-600">
                    {existingAttendance.available_from && (
                      timeSlotCount
                        ? decodeSlotSentinel(existingAttendance.available_from, timeSlotCount)
                        : existingAttendance.available_from
                    )}
                    {existingAttendance.available_from && existingAttendance.available_to && ' 〜 '}
                    {existingAttendance.available_to && (
                      timeSlotCount
                        ? decodeSlotSentinel(existingAttendance.available_to, timeSlotCount)
                        : existingAttendance.available_to
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* ヘッダー */}
          <div className="px-6 py-6 bg-blue-400">
            <h2 className="text-lg font-semibold text-white">出席登録</h2>
            <p className="text-sm text-black mt-1.5">出欠状況を選択してください</p>
          </div>

          <div className="px-6 py-8 space-y-7 bg-[#F9FAFB]">
            {/* ユーザー選択 */}
            {!currentUserId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  ユーザー選択
                </label>
                <Select value={selectedUserId} onValueChange={handleUserChange}>
                  <SelectTrigger className={`w-full h-11 px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1E293B] shadow-sm ${
                    errors.selectedUserId ? 'ring-2 ring-red-500/30 border-red-300' : ''
                  }`}>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.selectedUserId && (
                  <p className="mt-2 text-xs text-red-600">{errors.selectedUserId}</p>
                )}
              </div>
            )}

            {/* 出欠選択 */}
            <div>
              <div className="grid grid-cols-3 gap-3">
                {/* 出席 */}
                <label
                  className={`relative flex flex-col items-center justify-center gap-4 py-7 rounded-xl cursor-pointer transition-all duration-200 ${
                    status === ATTENDANCE_STATUS.PRESENT
                      ? 'bg-[#D1FAE5] shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] border border-green-300/60'
                      : 'bg-white border border-[#E5E7EB] hover:border-slate-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04)] active:scale-[0.98]'
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
                  <Check
                    className={`transition-colors ${
                      status === ATTENDANCE_STATUS.PRESENT ? 'text-[#16A34A]' : 'text-[#94A3B8]'
                    }`}
                    size={24}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`text-sm font-medium transition-colors ${
                      status === ATTENDANCE_STATUS.PRESENT ? 'text-[#1E293B]' : 'text-slate-500'
                    }`}
                  >
                    {ATTENDANCE_STATUS_LABELS[ATTENDANCE_STATUS.PRESENT]}
                  </span>
                </label>

                {/* 遅刻 */}
                <label
                  className={`relative flex flex-col items-center justify-center gap-4 py-7 rounded-xl cursor-pointer transition-all duration-200 ${
                    status === ATTENDANCE_STATUS.LATE
                      ? 'bg-[#FEF3C7] shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] border border-yellow-300/60'
                      : 'bg-white border border-[#E5E7EB] hover:border-slate-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04)] active:scale-[0.98]'
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
                  <Clock
                    className={`transition-colors ${
                      status === ATTENDANCE_STATUS.LATE ? 'text-[#CA8A04]' : 'text-[#94A3B8]'
                    }`}
                    size={24}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`text-sm font-medium transition-colors ${
                      status === ATTENDANCE_STATUS.LATE ? 'text-[#1E293B]' : 'text-slate-500'
                    }`}
                  >
                    {ATTENDANCE_STATUS_LABELS[ATTENDANCE_STATUS.LATE]}
                  </span>
                </label>

                {/* 欠席 */}
                <label
                  className={`relative flex flex-col items-center justify-center gap-4 py-7 rounded-xl cursor-pointer transition-all duration-200 ${
                    status === ATTENDANCE_STATUS.ABSENT
                      ? 'bg-[#FECACA] shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] border border-red-300/60'
                      : 'bg-white border border-[#E5E7EB] hover:border-slate-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04)] active:scale-[0.98]'
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
                  <X
                    className={`transition-colors ${
                      status === ATTENDANCE_STATUS.ABSENT ? 'text-[#DC2626]' : 'text-[#94A3B8]'
                    }`}
                    size={24}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`text-sm font-medium transition-colors ${
                      status === ATTENDANCE_STATUS.ABSENT ? 'text-[#1E293B]' : 'text-slate-500'
                    }`}
                  >
                    {ATTENDANCE_STATUS_LABELS[ATTENDANCE_STATUS.ABSENT]}
                  </span>
                </label>
              </div>
              {errors.status && <p className="mt-3 text-xs text-red-600">{errors.status}</p>}
            </div>

            {/* 参加可能コマ / 時間（遅刻の場合のみ表示） */}
            {status === ATTENDANCE_STATUS.LATE && (
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-3">
                  参加可能{timeSlotCount ? 'コマ' : '時間'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlotCount ? (
                    /* スロット順序ドロップダウン */
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          何限目から
                        </label>
                        <Select
                          value={availableFrom}
                          onValueChange={(v) => handleAvailableFromChange(v)}
                        >
                          <SelectTrigger className={`w-full h-11 px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1E293B] shadow-sm ${errors.availableFrom ? 'ring-2 ring-red-500/30 border-red-300' : ''}`}>
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: timeSlotCount }, (_, i) => i + 1).map((n) => (
                              <SelectItem key={n} value={encodeSlotOrder(n)}>
                                {n}限目から
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          何限目まで
                        </label>
                        <Select
                          value={availableTo}
                          onValueChange={(v) => handleAvailableToChange(v)}
                        >
                          <SelectTrigger className={`w-full h-11 px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1E293B] shadow-sm ${errors.availableTo ? 'ring-2 ring-red-500/30 border-red-300' : ''}`}>
                            <SelectValue placeholder="（最後まで）" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: timeSlotCount }, (_, i) => i + 1).map((n) => (
                              <SelectItem key={n} value={encodeSlotOrder(n)}>
                                {n}限目まで
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    /* 時刻入力（スロット数不明の場合） */
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          何時から
                        </label>
                        <Input
                          type="time"
                          value={availableFrom}
                          onChange={(e) => handleAvailableFromChange(e.target.value)}
                          placeholder="何時から"
                          className={`w-full px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1E293B] transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-transparent shadow-sm ${
                            errors.availableFrom ? 'ring-2 ring-red-500/30 border-red-300' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          何時まで
                        </label>
                        <Input
                          type="time"
                          value={availableTo}
                          onChange={(e) => handleAvailableToChange(e.target.value)}
                          placeholder="何時まで"
                          className={`w-full px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1E293B] transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-transparent shadow-sm ${
                            errors.availableTo ? 'ring-2 ring-red-500/30 border-red-300' : ''
                          }`}
                        />
                      </div>
                    </>
                  )}
                </div>
                {errors.availableFrom && (
                  <p className="mt-2 text-xs text-red-600">{errors.availableFrom}</p>
                )}
              </div>
            )}

            {/* 備考 */}
            <div>
              {status === ATTENDANCE_STATUS.ABSENT && (
                <label className="block text-sm font-medium text-[#1E293B] mb-3">
                  謝罪文
                  <span className="ml-2 text-xs text-red-600 font-normal">
                    （30文字以上 / 現在: {notes.trim().length}文字）
                  </span>
                </label>
              )}
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={status === ATTENDANCE_STATUS.ABSENT ? 5 : 3}
                placeholder={
                  status === ATTENDANCE_STATUS.ABSENT
                    ? '謝罪文を入力してください（30文字以上）'
                    : '備考（任意）'
                }
                className={`w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 resize-none transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-transparent shadow-sm ${
                  errors.notes
                    ? 'ring-2 ring-red-500/30 border-red-300'
                    : status === ATTENDANCE_STATUS.ABSENT
                    ? 'ring-2 ring-red-500/20 border-red-200'
                    : ''
                }`}
              />
              {errors.notes && <p className="mt-2 text-xs text-red-600">{errors.notes}</p>}
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="px-6 py-6 bg-[#F9FAFB] border-t border-[#E5E7EB] shadow-[0_-1px_3px_rgba(0,0,0,0.03)]">
            <Button
              type="submit"
              disabled={loading}
              className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-b from-blue-300 to-blue-400 text-white hover:from-blue-400 hover:to-blue-500 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 rounded-xl transition-all duration-200 font-semibold text-base shadow-[0_2px_8px_rgba(131,164,255,0.25)] hover:shadow-[0_4px_12px_rgba(131,164,255,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>送信中...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>出席を登録する</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
