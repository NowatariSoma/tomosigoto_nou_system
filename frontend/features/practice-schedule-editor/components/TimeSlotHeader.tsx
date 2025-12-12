'use client';

import React from 'react';
import { TimeSlot } from '../types/session-editor';

interface TimeSlotHeaderProps {
  timeSlot: TimeSlot;
}

export const TimeSlotHeader: React.FC<TimeSlotHeaderProps> = ({ timeSlot }) => {
  return (
    <td className="px-4 py-4 font-bold text-black bg-gray-100 border-r border-gray-300 text-center">
      <div className="text-sm">{timeSlot.display_time}</div>
    </td>
  );
};
