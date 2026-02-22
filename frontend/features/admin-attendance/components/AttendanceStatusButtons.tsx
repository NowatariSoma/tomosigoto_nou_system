'use client';

import React from 'react';
import { ATTENDANCE_STATUS } from '../constants';

type AttendanceStatusValue = 'present' | 'absent' | 'late' | 'no_show';

interface StatusButtonConfig {
  value: AttendanceStatusValue;
  label: string;
  shortLabel?: string;
  activeClass: string;
  inactiveClass: string;
  badgeClass: string;
}

const STATUS_CONFIGS: StatusButtonConfig[] = [
  {
    value: ATTENDANCE_STATUS.PRESENT,
    label: '出席',
    activeClass: 'bg-yellow-300 text-black border-yellow-400 shadow-sm',
    inactiveClass: 'bg-white text-black border-blue-300 hover:bg-blue-50',
    badgeClass: 'status-present',
  },
  {
    value: ATTENDANCE_STATUS.ABSENT,
    label: '欠席',
    activeClass: 'bg-yellow-300 text-black border-yellow-400 shadow-sm',
    inactiveClass: 'bg-white text-black border-gray-400 hover:bg-gray-50',
    badgeClass: 'status-absent',
  },
  {
    value: ATTENDANCE_STATUS.LATE,
    label: '遅刻',
    activeClass: 'bg-yellow-300 text-black border-yellow-400 shadow-sm',
    inactiveClass: 'bg-white text-black border-yellow-300 hover:bg-yellow-50',
    badgeClass: 'status-late',
  },
  {
    value: ATTENDANCE_STATUS.NO_SHOW,
    label: '無断欠席',
    shortLabel: '無断',
    activeClass: 'bg-yellow-300 text-black border-yellow-400 shadow-sm',
    inactiveClass: 'bg-white text-black border-gray-500 hover:bg-gray-50',
    badgeClass: 'status-no-show',
  },
];

interface AttendanceStatusEditButtonsProps {
  currentStatus: string | null;
  onStatusChange: (status: AttendanceStatusValue) => void;
  layout?: 'inline' | 'grid';
  useShortLabels?: boolean;
}

export const AttendanceStatusEditButtons: React.FC<AttendanceStatusEditButtonsProps> = ({
  currentStatus,
  onStatusChange,
  layout = 'inline',
  useShortLabels = false,
}) => (
  <div className={layout === 'grid' ? 'grid grid-cols-4 gap-1.5' : 'flex gap-1.5'}>
    {STATUS_CONFIGS.map(config => (
      <button
        key={config.value}
        onClick={() => onStatusChange(config.value)}
        className={`${layout === 'inline' ? 'flex-1' : ''} px-1.5 py-1.5 text-xs font-medium whitespace-nowrap rounded-md border ${
          currentStatus === config.value ? config.activeClass : config.inactiveClass
        }`}
      >
        {useShortLabels ? (config.shortLabel || config.label) : config.label}
      </button>
    ))}
  </div>
);

interface AttendanceStatusBadgeProps {
  status: string | null;
  size?: 'sm' | 'md';
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'w-16 px-2 py-1' : 'w-20 px-3 py-1.5';

  const config = STATUS_CONFIGS.find(c => c.value === status);
  if (!config) {
    if (size === 'sm') {
      return (
        <span className="inline-flex items-center justify-center w-16 px-2 py-1 text-xs font-medium rounded-md border bg-gray-400 text-white border-gray-400 shadow-sm">
          未登録
        </span>
      );
    }
    return <span className="text-sm text-black">未登録</span>;
  }

  const label = size === 'sm' ? (config.shortLabel || config.label) : config.label;

  return (
    <span className={`inline-flex items-center justify-center ${sizeClass} text-xs font-medium rounded-md border ${config.badgeClass} shadow-sm`}>
      {label}
    </span>
  );
};
