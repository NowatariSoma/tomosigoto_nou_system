'use client';

import { useState, useCallback } from 'react';
import { AttendanceCreate, UserWithAttendanceResponse } from '../types';
import { ATTENDANCE_STATUS } from '../constants';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';

type AttendanceStatusValue = 'present' | 'absent' | 'late' | 'no_show';

interface EditedChange {
  status?: AttendanceStatusValue;
  availableFrom?: string;
  availableTo?: string;
  notes?: string;
}

export interface UseAttendanceEditsReturn {
  isEditMode: boolean;
  editedChanges: Record<string, EditedChange>;
  saving: boolean;
  handleEditModeToggle: () => void;
  handleLocalStatusChange: (userId: string, status: AttendanceStatusValue) => void;
  handleLocalTimeChange: (userId: string, field: 'availableFrom' | 'availableTo', value: string) => void;
  handleLocalNotesChange: (userId: string, notes: string) => void;
  handleSaveAllChanges: () => Promise<void>;
  handleCancelChanges: () => void;
  getCurrentValue: (userId: string, field: 'status' | 'availableFrom' | 'availableTo' | 'notes') => string | null;
}

export function useAttendanceEdits(
  tableData: UserWithAttendanceResponse[],
  filterPracticeId: string,
  upsertAttendance: (data: AttendanceCreate) => Promise<any>,
): UseAttendanceEditsReturn {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedChanges, setEditedChanges] = useState<Record<string, EditedChange>>({});
  const [saving, setSaving] = useState(false);

  const handleEditModeToggle = useCallback(() => {
    if (isEditMode) {
      if (Object.keys(editedChanges).length > 0) {
        if (!confirm('保存されていない変更があります。編集モードを終了しますか？')) {
          return;
        }
      }
      setEditedChanges({});
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, editedChanges]);

  const handleLocalStatusChange = useCallback((userId: string, status: AttendanceStatusValue) => {
    setEditedChanges(prev => ({
      ...prev,
      [userId]: { ...prev[userId], status },
    }));
  }, []);

  const handleLocalTimeChange = useCallback((userId: string, field: 'availableFrom' | 'availableTo', value: string) => {
    setEditedChanges(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  }, []);

  const handleLocalNotesChange = useCallback((userId: string, notes: string) => {
    setEditedChanges(prev => ({
      ...prev,
      [userId]: { ...prev[userId], notes },
    }));
  }, []);

  const handleSaveAllChanges = useCallback(async () => {
    if (!filterPracticeId) return;

    setSaving(true);
    try {
      const promises = Object.entries(editedChanges).map(([userId, changes]) => {
        const item = tableData.find(d => d.user.id === userId);
        const currentAttendance = item?.attendance;

        const updateData: AttendanceCreate = {
          practice_schedule_id: filterPracticeId,
          user_id: userId,
          status: changes.status || currentAttendance?.status || ATTENDANCE_STATUS.PRESENT,
          notes: changes.notes !== undefined ? changes.notes : currentAttendance?.notes || undefined,
        };

        if (updateData.status === ATTENDANCE_STATUS.LATE) {
          updateData.available_from = changes.availableFrom !== undefined ? changes.availableFrom : currentAttendance?.available_from || undefined;
          updateData.available_to = changes.availableTo !== undefined ? changes.availableTo : currentAttendance?.available_to || undefined;
        } else {
          updateData.available_from = null;
          updateData.available_to = null;
        }

        return upsertAttendance(updateData);
      });

      await Promise.all(promises);
      setEditedChanges({});
      setIsEditMode(false);
      toast.success('出席を記録しました');
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.message
        : error instanceof Error
        ? error.message
        : String(error);
      toast.error(`変更の保存に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }, [filterPracticeId, editedChanges, tableData, upsertAttendance]);

  const handleCancelChanges = useCallback(() => {
    if (Object.keys(editedChanges).length > 0) {
      if (!confirm('保存されていない変更があります。キャンセルしますか？')) {
        return;
      }
    }
    setEditedChanges({});
    setIsEditMode(false);
  }, [editedChanges]);

  const getCurrentValue = useCallback((userId: string, field: 'status' | 'availableFrom' | 'availableTo' | 'notes') => {
    const item = tableData.find(d => d.user.id === userId);
    const changes = editedChanges[userId];

    if (changes && changes[field] !== undefined) {
      return changes[field] as string;
    }

    if (field === 'status') {
      return item?.attendance?.status || null;
    }

    const fieldMap = {
      availableFrom: 'available_from',
      availableTo: 'available_to',
      notes: 'notes',
    } as const;

    const dbField = fieldMap[field as keyof typeof fieldMap];
    return (item?.attendance as any)?.[dbField] || '';
  }, [tableData, editedChanges]);

  return {
    isEditMode,
    editedChanges,
    saving,
    handleEditModeToggle,
    handleLocalStatusChange,
    handleLocalTimeChange,
    handleLocalNotesChange,
    handleSaveAllChanges,
    handleCancelChanges,
    getCurrentValue,
  };
}
