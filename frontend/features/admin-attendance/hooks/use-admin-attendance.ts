import { useState, useEffect, useCallback } from 'react';
import { Attendance, User, UserWithAttendance, PracticeSchedule, AttendanceCreate } from '../types';
import { adminAttendanceService } from '../services/attendance-service';
import { adminUserService } from '../services/user-service';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export const useAdminAttendance = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [practiceSchedules, setPracticeSchedules] = useState<PracticeSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ユーザー一覧を取得
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminUserService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー一覧の取得に失敗しました');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 練習スケジュール一覧を取得
  const fetchPracticeSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchApi(API_ENDPOINTS.PRACTICE_SCHEDULES);
      const data = await response.json();
      setPracticeSchedules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '練習予定一覧の取得に失敗しました');
      console.error('Failed to fetch practice schedules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 特定の練習の出席記録を取得
  const fetchAttendancesByPractice = useCallback(async (practiceScheduleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAttendanceService.getAttendancesByPractice(practiceScheduleId);
      setAttendances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '出席記録の取得に失敗しました');
      console.error('Failed to fetch attendances:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 一括更新
  const bulkUpdateAttendances = useCallback(async (
    practiceScheduleId: string,
    attendances: AttendanceCreate[]
  ): Promise<Attendance[]> => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAttendanceService.bulkUpdateAttendances(
        practiceScheduleId,
        attendances
      );
      // 更新後に再取得
      await fetchAttendancesByPractice(practiceScheduleId);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '一括更新に失敗しました';
      setError(errorMessage);
      console.error('Failed to bulk update attendances:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAttendancesByPractice]);

  // 個別更新
  const upsertAttendance = useCallback(async (
    attendance: AttendanceCreate
  ): Promise<Attendance> => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAttendanceService.upsertAttendance(attendance);
      // 更新後に再取得
      if (attendance.practice_schedule_id) {
        await fetchAttendancesByPractice(attendance.practice_schedule_id);
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '出席登録に失敗しました';
      setError(errorMessage);
      console.error('Failed to upsert attendance:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAttendancesByPractice]);

  // ユーザーと出席記録をマージ
  const getUsersWithAttendance = useCallback((
    practiceScheduleId: string
  ): UserWithAttendance[] => {
    const practiceAttendances = attendances.filter(
      a => a.practice_schedule_id === practiceScheduleId
    );
    
    return users.map(user => {
      const attendance = practiceAttendances.find(a => a.user_id === user.id);
      return {
        ...user,
        attendance,
      };
    });
  }, [users, attendances]);

  useEffect(() => {
    fetchUsers();
    fetchPracticeSchedules();
  }, [fetchUsers, fetchPracticeSchedules]);

  return {
    attendances,
    users,
    practiceSchedules,
    loading,
    error,
    fetchAttendancesByPractice,
    bulkUpdateAttendances,
    upsertAttendance,
    getUsersWithAttendance,
    refetchUsers: fetchUsers,
    refetchPracticeSchedules: fetchPracticeSchedules,
  };
};

