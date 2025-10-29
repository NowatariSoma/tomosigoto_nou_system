'use client';

import React, { useState, useEffect } from 'react';
import { Attendance, AttendanceFormData, PracticeSchedule } from '../types';
import { AttendanceList } from './AttendanceList';
import { AttendanceForm } from './AttendanceForm';
import { SimpleAttendanceForm } from './SimpleAttendanceForm';
import { useAttendance, usePracticeSchedule } from '../hooks';
import { UI_TEXT } from '../constants';
import { Plus, Calendar } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
}

export const AttendancePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { attendances, loading: attendanceLoading, upsertAttendance, deleteAttendance } = useAttendance();
  const { practiceSchedules, loading: practiceLoading, error: practiceError } = usePracticeSchedule();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const handleCreateClick = () => {
    setEditingAttendance(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (attendance: Attendance) => {
    setEditingAttendance(attendance);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (attendance: Attendance) => {
    if (window.confirm('この出席記録を削除しますか？')) {
      try {
        await deleteAttendance(attendance.id);
      } catch (error) {
        console.error('Failed to delete attendance:', error);
      }
    }
  };

  const handleFormSubmit = async (data: AttendanceFormData) => {
    try {
      setFormLoading(true);
      await upsertAttendance({
        practice_schedule_id: data.practice_schedule_id,
        user_id: user?.id || "", // AuthContextから取得
        status: data.status,
        notes: data.notes,
      });
      setIsFormOpen(false);
      setEditingAttendance(null);
    } catch (error) {
      console.error('Failed to save attendance:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingAttendance(null);
  };

  const handleSimpleFormSubmit = async (data: { status: string; notes: string; userId: string; practiceScheduleId: string; availableFrom?: string; availableTo?: string }) => {
    try {
      setFormLoading(true);
      await upsertAttendance({
        practice_schedule_id: data.practiceScheduleId,
        user_id: data.userId,
        status: data.status as "present" | "absent" | "late" | "no_show",
        notes: data.notes,
        available_from: data.availableFrom,
        available_to: data.availableTo,
      });
    } catch (error) {
      console.error('Failed to save attendance:', error);
    } finally {
      setFormLoading(false);
    }
  };

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      
      // デバッグ: 認証状態とlocalStorageのauthTokenを確認
      console.log('Auth user:', user);
      console.log('Auth loading:', authLoading);
      const authToken = localStorage.getItem('authToken');
      console.log('Auth token from localStorage:', authToken ? 'exists' : 'not found');
      
      const response = await fetchApi('/users/');
      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };


  // ユーザー一覧を取得（認証が完了してから）
  useEffect(() => {
    if (!authLoading && user) {
      fetchUsers();
    }
  }, [authLoading, user]);

  if (authLoading || attendanceLoading || practiceLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  if (practiceError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">エラーが発生しました</h2>
            <p className="text-red-600 mb-4">{practiceError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 練習スケジュールが存在しない場合
  if (!practiceSchedules || practiceSchedules.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">練習スケジュールが見つかりません</h2>
            <p className="text-yellow-600 mb-4">練習スケジュールが設定されていません。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* シンプルな出席登録フォーム */}
      <SimpleAttendanceForm
        practiceSchedules={practiceSchedules}
        users={users}
        currentUserId={user?.id}
        onSubmit={handleSimpleFormSubmit}
        loading={formLoading}
      />

      {/* 出席履歴一覧 */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            {UI_TEXT.ATTENDANCE_HISTORY} ({attendances.length}件)
          </h2>
          <button
            onClick={handleCreateClick}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>出席登録</span>
          </button>
        </div>
        <AttendanceList
          attendances={attendances}
          practiceSchedules={practiceSchedules}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          showUserInfo={false}
        />
      </div>

      {/* 詳細フォーム（必要に応じて表示） */}
      {isFormOpen && (
        <AttendanceForm
          attendance={editingAttendance}
          practiceSchedules={practiceSchedules}
          userId={user?.id || ""} // AuthContextから取得
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      )}
    </div>
  );
};
