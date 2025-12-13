'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';

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

  // 親から渡された値が更新されたらローカルStateを同期
  useEffect(() => {
    setLocalStartTime(startTime);
    setLocalEndTime(endTime);
  }, [startTime, endTime]);

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
        <Clock className="h-4 w-4 text-black" />
        <div className="flex items-center space-x-2">
          <Input
            type="time"
            value={localStartTime}
            onChange={(e) => setLocalStartTime(e.target.value)}
            className="px-2 py-1 text-sm h-8"
          />
          <span className="text-black">〜</span>
          <Input
            type="time"
            value={localEndTime}
            onChange={(e) => setLocalEndTime(e.target.value)}
            className="px-2 py-1 text-sm h-8"
          />
        </div>
        <Button
          onClick={handleSave}
          size="sm"
          className="px-3 py-1 text-sm"
        >
          保存
        </Button>
        <Button
          onClick={handleCancel}
          variant="outline"
          size="sm"
          className="px-3 py-1 bg-blue-200 text-black text-sm"
        >
          キャンセル
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Clock className="h-4 w-4 text-black" />
      <span className="text-black">
        {startTime} 〜 {endTime}
      </span>
      <Button
        onClick={() => setIsEditing(true)}
        variant="link"
        size="sm"
        className="text-black hover:text-black text-sm h-auto p-0"
      >
        編集
      </Button>
    </div>
  );
};