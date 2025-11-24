import { useState, useEffect, useRef } from 'react';
import { Attendance, AttendanceCreate, AttendanceUpdate } from '../types/attendance';
import { attendanceService } from '../services/attendance-service';

interface UseAttendanceOptions {
  initialAttendances?: Attendance[];
  autoFetch?: boolean;
}

export const useAttendance = (practiceScheduleId?: string, options?: UseAttendanceOptions) => {
  const initialAttendances = options?.initialAttendances;
  const autoFetch = options?.autoFetch ?? true;
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipInitialFetch = useRef<boolean>(Boolean(initialAttendances));

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.getAttendances();
      setAttendances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '出席記録の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendancesByPractice = async (practiceId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.getAttendancesByPractice(practiceId);
      setAttendances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '練習の出席記録取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAttendances) {
      setAttendances(initialAttendances);
      setLoading(false);
    }
    skipInitialFetch.current = Boolean(initialAttendances);
  }, [initialAttendances]);

  const getAttendancesByUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.getAttendancesByUser(userId);
      setAttendances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの出席記録取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const createAttendance = async (data: AttendanceCreate): Promise<Attendance> => {
    try {
      const newAttendance = await attendanceService.createAttendance(data);
      setAttendances(prev => [...prev, newAttendance]);
      return newAttendance;
    } catch (err) {
      setError(err instanceof Error ? err.message : '出席登録に失敗しました');
      throw err;
    }
  };

  const upsertAttendance = async (data: AttendanceCreate): Promise<Attendance> => {
    try {
      const attendance = await attendanceService.upsertAttendance(data);
      setAttendances(prev => {
        const existingIndex = prev.findIndex(a =>
          a.practice_schedule_id === data.practice_schedule_id &&
          a.user_id === data.user_id
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = attendance;
          return updated;
        } else {
          return [...prev, attendance];
        }
      });
      return attendance;
    } catch (err) {
      setError(err instanceof Error ? err.message : '出席登録に失敗しました');
      throw err;
    }
  };

  const updateAttendance = async (id: string, data: AttendanceUpdate): Promise<Attendance> => {
    try {
      const updatedAttendance = await attendanceService.updateAttendance(id, data);
      setAttendances(prev => prev.map(attendance =>
        attendance.id === id ? updatedAttendance : attendance
      ));
      return updatedAttendance;
    } catch (err) {
      setError(err instanceof Error ? err.message : '出席記録の更新に失敗しました');
      throw err;
    }
  };

  const deleteAttendance = async (id: string): Promise<void> => {
    try {
      await attendanceService.deleteAttendance(id);
      setAttendances(prev => prev.filter(attendance => attendance.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '出席記録の削除に失敗しました');
      throw err;
    }
  };

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    if (practiceScheduleId) {
      fetchAttendancesByPractice(practiceScheduleId);
    } else {
      fetchAttendances();
    }
  }, [practiceScheduleId, autoFetch]);

  return {
    attendances,
    loading,
    error,
    createAttendance,
    upsertAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendancesByUser,
    refetch: practiceScheduleId
      ? () => fetchAttendancesByPractice(practiceScheduleId)
      : fetchAttendances,
  };
};
