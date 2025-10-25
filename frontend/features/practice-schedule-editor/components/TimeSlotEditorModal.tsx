import React, { useState, useEffect } from 'react';
import { Clock, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeSlot } from '../types/session-editor';
import { TimePicker } from './TimePicker';

interface TimeSlotEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timeSlot: TimeSlot) => void;
  timeSlot: TimeSlot | null;
  className?: string;
}

export const TimeSlotEditorModal: React.FC<TimeSlotEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  timeSlot,
  className
}) => {
  const [localTimeSlot, setLocalTimeSlot] = useState<TimeSlot | null>(null);
  const [errors, setErrors] = useState<{ start_time?: string; end_time?: string }>({});

  // モーダルが開かれたときにローカル状態を初期化
  useEffect(() => {
    if (isOpen && timeSlot) {
      setLocalTimeSlot({ ...timeSlot });
      setErrors({});
    }
  }, [isOpen, timeSlot]);

  const handleInputChange = (field: 'start_time' | 'end_time', value: string) => {
    if (!localTimeSlot) return;
    
    setLocalTimeSlot(prev => prev ? { ...prev, [field]: value } : null);
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateTimeSlot = (): boolean => {
    if (!localTimeSlot) return false;

    const newErrors: { start_time?: string; end_time?: string } = {};

    if (!localTimeSlot.start_time) {
      newErrors.start_time = '開始時間を入力してください';
    }

    if (!localTimeSlot.end_time) {
      newErrors.end_time = '終了時間を入力してください';
    }

    if (localTimeSlot.start_time && localTimeSlot.end_time) {
      if (localTimeSlot.start_time >= localTimeSlot.end_time) {
        newErrors.end_time = '終了時間は開始時間より遅く設定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!localTimeSlot || !validateTimeSlot()) return;

    const updatedTimeSlot: TimeSlot = {
      ...localTimeSlot,
      display_time: `${localTimeSlot.start_time} - ${localTimeSlot.end_time}`
    };

    onSave(updatedTimeSlot);
    onClose();
  };

  const handleCancel = () => {
    setLocalTimeSlot(null);
    setErrors({});
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen || !localTimeSlot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleCancel}
      />
      
      {/* モーダル */}
      <div className={cn(
        "relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4",
        className
      )}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">時間スロット編集</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* ボディ */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* 開始時間 */}
            <TimePicker
              value={localTimeSlot.start_time}
              onChange={(value) => handleInputChange('start_time', value)}
              label="開始時間"
              error={errors.start_time}
            />

            {/* 終了時間 */}
            <TimePicker
              value={localTimeSlot.end_time}
              onChange={(value) => handleInputChange('end_time', value)}
              label="終了時間"
              error={errors.end_time}
            />
          </div>

        </div>

        {/* フッター */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
          >
            <Check className="h-4 w-4" />
            <span>保存</span>
          </button>
        </div>

        {/* キーボードショートカットのヒント */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl + Enter</kbd> で保存、
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Esc</kbd> でキャンセル
          </p>
        </div>
      </div>
    </div>
  );
};
