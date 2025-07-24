import React, { useState } from 'react';
import { Session, ScheduleConflict } from '../types/generatedSchedule';
import { cn } from '@/lib/utils';

interface SessionDragItemProps {
  session: Session;
  conflicts: ScheduleConflict[];
  isDraggable: boolean;
  isSelected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const SessionDragItem: React.FC<SessionDragItemProps> = ({
  session,
  conflicts,
  isDraggable,
  isSelected,
  onClick,
  style,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    
    // ドラッグデータを設定
    e.dataTransfer.setData('text/plain', session.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
  };

  const getConflictSeverity = () => {
    if (conflicts.length === 0) return 'none';
    
    const severities = conflicts.map(c => c.severity);
    if (severities.includes('error')) return 'error';
    if (severities.includes('warning')) return 'warning';
    if (severities.includes('info')) return 'info';
    return 'none';
  };

  const getConflictBorderClass = () => {
    const severity = getConflictSeverity();
    switch (severity) {
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      case 'info':
        return 'border-blue-500';
      default:
        return 'border-gray-200';
    }
  };

  const getStatusBackgroundClass = () => {
    switch (session.status) {
      case 'confirmed':
        return 'bg-white';
      case 'tentative':
        return 'bg-gray-50 opacity-75';
      case 'cancelled':
        return 'bg-gray-100 opacity-50';
      default:
        return 'bg-white';
    }
  };

  const getAriaLabel = () => {
    const parts = [
      session.title,
      `${session.startTime} - ${session.endTime}`,
    ];
    
    if (session.description) {
      parts.push(session.description);
    }

    if (conflicts.length > 0) {
      parts.push(`${conflicts.length}件の競合あり`);
    }

    return parts.join(', ');
  };

  return (
    <button
      className={cn(
        'relative w-full p-3 text-left border-2 rounded-lg shadow-sm transition-all duration-200',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'cursor-pointer',
        getStatusBackgroundClass(),
        getConflictBorderClass(),
        isSelected && 'ring-2 ring-blue-500',
        isDragging && 'opacity-50',
        isDraggable && 'cursor-grab active:cursor-grabbing'
      )}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      style={style}
      aria-label={getAriaLabel()}
      aria-selected={isSelected}
      aria-grabbed={isDragging ? 'true' : 'false'}
      role="button"
    >
      {/* セッションタイトル */}
      <div className="font-semibold text-gray-900 mb-1">
        {session.title}
      </div>

      {/* 時間表示 */}
      <div className="text-sm text-gray-600 mb-1">
        {session.startTime} - {session.endTime}
      </div>

      {/* 説明文 */}
      {session.description && (
        <div className="text-sm text-gray-500 mb-2">
          {session.description}
        </div>
      )}

      {/* パート情報（色付きドット） */}
      <div className="flex items-center space-x-1">
        {session.partIds.map((partId, index) => (
          <div
            key={partId}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: `hsl(${partId * 137.5 % 360}, 60%, 50%)` }}
            title={`パート ${partId}`}
          />
        ))}
      </div>

      {/* 競合インジケーター */}
      {conflicts.length > 0 && (
        <div className="absolute top-2 right-2">
          <div
            className={cn(
              'w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-bold',
              getConflictSeverity() === 'error' && 'bg-red-500',
              getConflictSeverity() === 'warning' && 'bg-yellow-500',
              getConflictSeverity() === 'info' && 'bg-blue-500'
            )}
            title={`${conflicts.length}件の競合`}
          >
            !
          </div>
        </div>
      )}

      {/* ドラッグハンドル */}
      {isDraggable && (
        <div className="absolute bottom-2 right-2 text-gray-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="2" cy="2" r="1" />
            <circle cx="6" cy="2" r="1" />
            <circle cx="10" cy="2" r="1" />
            <circle cx="2" cy="6" r="1" />
            <circle cx="6" cy="6" r="1" />
            <circle cx="10" cy="6" r="1" />
            <circle cx="2" cy="10" r="1" />
            <circle cx="6" cy="10" r="1" />
            <circle cx="10" cy="10" r="1" />
          </svg>
        </div>
      )}
    </button>
  );
};