'use client';

import React, { useState, useEffect } from 'react';
import { Session, VenueInfo, TimeSlot, SessionFormData, AttendanceInfo } from '../types/session-editor';
import { UI_TEXT, INITIAL_SESSION_FORM, VALIDATION } from '../constants';
import { useSessionValidation } from '../hooks/use-session-validation';
import { Save, X, User, MapPin, Clock, Star, FileText } from 'lucide-react';
import { Part } from '../services/part-service';
import { attendanceService } from '../services';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';

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

  const { validateSessionForm } = useSessionValidation(venues);


  // セッション情報でフォームを初期化
  useEffect(() => {
    if (session && !is_creating) {
      const initialFormData = {
        part_id: session.part_id || '',
        instructor_id: '', // TODO: セッションからインストラクター情報を取得
        venue_id: session.schedule_available_venue_id || '',
        time_slot: '',
        priority: session.priority,
        notes: '',
      };
      setFormData(initialFormData);
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
    if (validateForm()) {
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('セッション保存エラー:', error);
        const errorMessage = error instanceof Error ? error.message : 'セッションの保存に失敗しました';
        setApiError(errorMessage);
      }
    }
  };

  const handleInputChange = (field: keyof SessionFormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">
            {is_creating ? UI_TEXT.CREATE_SESSION : UI_TEXT.UPDATE_SESSION}
          </h2>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="icon"
            className="p-2 text-black"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* APIエラー表示 */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">エラー</p>
              <p className="text-sm">{apiError}</p>
            </div>
          )}


          {/* パート選択 */}
          <div>
            <label className="flex items-center space-x-2 label-form mb-2">
              <User className="h-4 w-4" />
              <span>{UI_TEXT.PART_NAME} <span className="text-red-500">*</span></span>
            </label>
            <Select
              value={formData.part_id}
              onValueChange={(value) => handleInputChange('part_id', value)}
            >
              <SelectTrigger className={`w-full ${errors.part_id ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {parts
                  .filter((part) => part.status === 'active')
                  .map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.part_id && (
              <p className="mt-1 text-sm text-red-600">{errors.part_id}</p>
            )}
          </div>

          {/* 会場選択 */}
          <div>
            <label className="flex items-center space-x-2 label-form mb-2">
              <MapPin className="h-4 w-4" />
              <span>{UI_TEXT.VENUE} <span className="text-red-500">*</span></span>
            </label>
            <Select
              value={formData.venue_id}
              onValueChange={(value) => handleInputChange('venue_id', value)}
            >
              <SelectTrigger className={`w-full ${errors.venue_id ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name} {venue.is_preferred && '⭐'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.venue_id && (
              <p className="mt-1 text-sm text-red-600">{errors.venue_id}</p>
            )}
          </div>

          {/* 時間選択 */}
          <div>
            <label className="flex items-center space-x-2 label-form mb-2">
              <Clock className="h-4 w-4" />
              <span>{UI_TEXT.TIME} <span className="text-red-500">*</span></span>
            </label>
            <Select
              value={formData.time_slot}
              onValueChange={(value) => handleInputChange('time_slot', value)}
            >
              <SelectTrigger className={`w-full ${errors.time_slot ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {time_slots.map((slot) => (
                  <SelectItem key={slot.time} value={slot.time}>
                    {slot.display_time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time_slot && (
              <p className="mt-1 text-sm text-red-600">{errors.time_slot}</p>
            )}
          </div>

          {/* 優先度 */}
          <div>
            <label className="flex items-center space-x-2 label-form mb-2">
              <Star className="h-4 w-4" />
              <span>{UI_TEXT.PRIORITY}</span>
            </label>
            <Input
              type="number"
              min="0"
              max="10"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
            />
          </div>

          {/* 備考 */}
          <div>
            <label className="flex items-center space-x-2 label-form mb-2">
              <FileText className="h-4 w-4" />
              <span>{UI_TEXT.NOTES}</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="備考を入力してください（任意）"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.notes ? 'border-red-500' : 'border-black'
              }`}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
            )}
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="px-6 py-2 text-slate-600 bg-slate-100 border-slate-300 hover:border-slate-400 font-medium"
            >
              {UI_TEXT.CANCEL}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 font-medium shadow-sm hover:shadow-md"
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
