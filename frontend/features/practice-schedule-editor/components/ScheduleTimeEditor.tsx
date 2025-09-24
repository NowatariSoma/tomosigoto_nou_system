'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface ScheduleTimeEditorProps {
  startTime: string;
  endTime: string;
  onUpdate: (startTime: string, endTime: string) => void;
}

export const ScheduleTimeEditor: React.FC<ScheduleTimeEditorProps> = ({
  startTime,
  endTime,
  onUpdate,
}) => {
  const [localStartTime, setLocalStartTime] = useState(startTime);
  const [localEndTime, setLocalEndTime] = useState(endTime);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdate(localStartTime, localEndTime);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalStartTime(startTime);
    setLocalEndTime(endTime);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-md border border-blue-200">
        <Clock className="h-4 w-4 text-blue-600" />
        <div className="flex items-center space-x-2">
          <input
            type="time"
            value={localStartTime}
            onChange={(e) => setLocalStartTime(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-500">〜</span>
          <input
            type="time"
            value={localEndTime}
            onChange={(e) => setLocalEndTime(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          保存
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
        >
          キャンセル
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Clock className="h-4 w-4 text-gray-500" />
      <span className="text-gray-700">
        {startTime} 〜 {endTime}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="text-blue-600 hover:text-blue-800 text-sm underline"
      >
        編集
      </button>
    </div>
  );
};