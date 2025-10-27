'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Users } from 'lucide-react';
import { VenueInfo, TimeSlot } from '../types/session-editor';
import { sessionInstructorService } from '../services';

interface InstructorEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InstructorFormData) => void;
  venues: VenueInfo[];
  time_slots: TimeSlot[];
  scheduleId: string;
}

interface InstructorFormData {
  venue_id: string;
  time_slot: string;
  attendance_id: string;
}

export const InstructorEditorModal: React.FC<InstructorEditorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  venues,
  time_slots,
  scheduleId,
}) => {
  const [formData, setFormData] = useState<InstructorFormData>({
    venue_id: '',
    time_slot: '',
    attendance_id: '',
  });
  const [availableInstructors, setAvailableInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableInstructors();
    }
  }, [isOpen]);

  const fetchAvailableInstructors = async () => {
    try {
      setLoading(true);
      console.log('InstructorEditorModal: インストラクター候補を取得中。scheduleId=', scheduleId);
      // APIからインストラクター候補を取得
      const candidates = await sessionInstructorService.getInstructorCandidates(scheduleId);
      console.log('InstructorEditorModal: 取得した候補', candidates);
      
      // 候補データをattendanceInfo配列に変換
      const formattedCandidates = candidates.map(candidate => ({
        id: candidate.attendance_id,
        attendance_id: candidate.attendance_id,
        user_name: `${candidate.last_name_kanji || ''} ${candidate.first_name_kanji || ''}`.trim() || candidate.email,
        user_email: candidate.email,
        user_id: candidate.user_id,
      }));
      
      console.log('InstructorEditorModal: フォーマット後の候補', formattedCandidates);
      setAvailableInstructors(formattedCandidates);
    } catch (error) {
      console.error('インストラクター候補の取得に失敗しました:', error);
      setAvailableInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      venue_id: '',
      time_slot: '',
      attendance_id: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">インストラクターを追加</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 会場選択 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4" />
                <span>会場 <span className="text-red-500">*</span></span>
              </label>
              <select
                value={formData.venue_id}
                onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">会場を選択してください</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name || `会場${venue.id.slice(-4)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* 時間帯選択 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4" />
                <span>時間帯 <span className="text-red-500">*</span></span>
              </label>
              <select
                value={formData.time_slot}
                onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">時間帯を選択してください</option>
                {time_slots.map((slot) => (
                  <option key={slot.time} value={slot.time}>
                    {slot.display_time || slot.time}
                  </option>
                ))}
              </select>
            </div>

            {/* インストラクター選択 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4" />
                <span>インストラクター <span className="text-red-500">*</span></span>
              </label>
              {loading ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  読み込み中...
                </div>
              ) : (
                <select
                  value={formData.attendance_id}
                  onChange={(e) => setFormData({ ...formData, attendance_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">インストラクターを選択してください</option>
                  {availableInstructors.map((instructor) => (
                    <option key={instructor.attendance_id} value={instructor.attendance_id}>
                      {instructor.user_name || instructor.user_email || `指導者${instructor.attendance_id.slice(-4)}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-md transition-colors"
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

