'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/forms/button';
import { Calendar, Clock } from 'lucide-react';

interface DateTimeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string, startTime: string, endTime: string) => void;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

const DateTimeSelectionModal: React.FC<DateTimeSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialDate = '',
  initialStartTime = '09:00',
  initialEndTime = '10:00',
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedStartTime, setSelectedStartTime] = useState(initialStartTime);
  const [selectedEndTime, setSelectedEndTime] = useState(initialEndTime);

  // モーダルが開かれるたびに初期値を設定
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate);
      setSelectedStartTime(initialStartTime);
      setSelectedEndTime(initialEndTime);
    }
  }, [isOpen, initialDate, initialStartTime, initialEndTime]);

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

  const handleConfirm = () => {
    if (selectedDate && selectedStartTime && selectedEndTime) {
      onConfirm(selectedDate, selectedStartTime, selectedEndTime);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            日時を選択
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 日付選択 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4" />
              <span>日付</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedDate && (
              <p className="mt-1 text-sm text-gray-600">
                {formatDate(selectedDate)}
              </p>
            )}
          </div>

          {/* 時間選択 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4" />
                <span>開始時間</span>
              </label>
              <select
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4" />
                <span>終了時間</span>
              </label>
              <select
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* プレビュー */}
          {selectedDate && selectedStartTime && selectedEndTime && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">プレビュー</h4>
              <p className="text-sm text-gray-600">
                {formatDate(selectedDate)}
              </p>
              <p className="text-sm text-gray-600">
                {selectedStartTime} - {selectedEndTime}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-6"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedStartTime || !selectedEndTime}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            確定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateTimeSelectionModal;
