'use client';

import React, { useState, useEffect } from 'react';
import { Session, VenueInfo, TimeSlot, SessionFormData, AttendanceInfo } from '../types/session-editor';
import { UI_TEXT, INITIAL_SESSION_FORM, VALIDATION } from '../constants';
import { useSessionValidation } from '../hooks/use-session-validation';
import { Save, X, User, MapPin, Clock, Star, FileText, Users } from 'lucide-react';
import { Part } from '../services/part-service';
import { attendanceService } from '../services';

interface SessionEditorModalProps {
  session?: Session | null;
  venues: VenueInfo[];
  time_slots: TimeSlot[];
  parts: Part[];
  scheduleId: string;
  is_creating: boolean;
  onSubmit: (formData: SessionFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const SessionEditorModal: React.FC<SessionEditorModalProps> = ({
  session,
  venues,
  time_slots,
  parts,
  scheduleId,
  is_creating,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<SessionFormData>(INITIAL_SESSION_FORM);
  const [errors, setErrors] = useState<Partial<SessionFormData>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [availableAttendees, setAvailableAttendees] = useState<AttendanceInfo[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  const { validateSessionForm } = useSessionValidation(venues);

  // 出席者データを取得
  useEffect(() => {
    const fetchAttendees = async () => {
      if (!scheduleId) return;
      
      setAttendeesLoading(true);
      try {
        const attendees = await attendanceService.getAttendancesByPractice(scheduleId);
        setAvailableAttendees(attendees);
      } catch (error) {
        console.error('出席者データの取得に失敗しました:', error);
        setAvailableAttendees([]);
      } finally {
        setAttendeesLoading(false);
      }
    };

    fetchAttendees();
  }, [scheduleId]);

  // セッション情報でフォームを初期化
  useEffect(() => {
    if (session && !is_creating) {
      setFormData({
        title: session.title,
        part_id: session.part_id || '',
        instructor_ids: [],
        venue_id: session.schedule_available_venue_id || '',
        time_slot: '',
        priority: session.priority,
        notes: '',
      });
    } else {
      setFormData(INITIAL_SESSION_FORM);
    }
  }, [session, is_creating]);

  const validateForm = (): boolean => {
    const validation = validateSessionForm(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    console.log('フォーム送信:', formData);
    if (validateForm()) {
      console.log('バリデーションOK、API呼び出し開始');
      try {
        await onSubmit(formData);
        console.log('セッション作成成功');
      } catch (error) {
        console.error('セッション作成エラー:', error);
        const errorMessage = error instanceof Error ? error.message : 'セッションの保存に失敗しました';
        setApiError(errorMessage);
      }
    } else {
      console.log('バリデーションエラー:', errors);
    }
  };

  const handleInputChange = (field: keyof SessionFormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInstructorToggle = (attendanceId: string) => {
    setFormData(prev => ({
      ...prev,
      instructor_ids: prev.instructor_ids.includes(attendanceId)
        ? prev.instructor_ids.filter(id => id !== attendanceId)
        : [...prev.instructor_ids, attendanceId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {is_creating ? UI_TEXT.CREATE_SESSION : UI_TEXT.UPDATE_SESSION}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* APIエラー表示 */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">エラー</p>
              <p className="text-sm">{apiError}</p>
            </div>
          )}

          {/* セッション名 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4" />
              <span>{UI_TEXT.SESSION_TITLE} <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="セッション名を入力してください"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* パート選択 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4" />
              <span>{UI_TEXT.PART_NAME} <span className="text-red-500">*</span></span>
            </label>
            <select
              value={formData.part_id}
              onChange={(e) => handleInputChange('part_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.part_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">選択してください</option>
              {parts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name}
                </option>
              ))}
            </select>
            {errors.part_id && (
              <p className="mt-1 text-sm text-red-600">{errors.part_id}</p>
            )}
          </div>

          {/* 会場選択 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{UI_TEXT.VENUE} <span className="text-red-500">*</span></span>
            </label>
            <select
              value={formData.venue_id}
              onChange={(e) => handleInputChange('venue_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.venue_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">選択してください</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} {venue.is_preferred && '⭐'}
                </option>
              ))}
            </select>
            {errors.venue_id && (
              <p className="mt-1 text-sm text-red-600">{errors.venue_id}</p>
            )}
          </div>

          {/* 時間選択 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4" />
              <span>{UI_TEXT.TIME} <span className="text-red-500">*</span></span>
            </label>
            <select
              value={formData.time_slot}
              onChange={(e) => handleInputChange('time_slot', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.time_slot ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">選択してください</option>
              {time_slots.map((slot) => (
                <option key={slot.time} value={slot.time}>
                  {slot.display_time}
                </option>
              ))}
            </select>
            {errors.time_slot && (
              <p className="mt-1 text-sm text-red-600">{errors.time_slot}</p>
            )}
          </div>

          {/* 優先度 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Star className="h-4 w-4" />
              <span>{UI_TEXT.PRIORITY}</span>
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* インストラクター選択 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4" />
              <span>インストラクター</span>
            </label>
            {attendeesLoading ? (
              <div className="text-sm text-gray-500">出席者データを読み込み中...</div>
            ) : availableAttendees.length > 0 ? (
              <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {availableAttendees.map((attendee) => (
                    <label key={attendee.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.instructor_ids.includes(attendee.id)}
                        onChange={() => handleInstructorToggle(attendee.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {attendee.user_name}
                        {attendee.user_email && (
                          <span className="text-gray-500 ml-1">({attendee.user_email})</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-3 border border-gray-300 rounded-md">
                この練習に出席予定の参加者がいません
              </div>
            )}
            {formData.instructor_ids.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {formData.instructor_ids.length}名のインストラクターが選択されています
              </div>
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
              placeholder="備考を入力してください（任意）"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
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
