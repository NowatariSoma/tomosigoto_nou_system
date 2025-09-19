'use client';

import React, { useState, useEffect } from 'react';
import { Attendance, AttendanceFormData, PracticeSchedule } from '../types';
import { AttendanceList } from './AttendanceList';
import { AttendanceForm } from './AttendanceForm';
import { LoginForm } from './LoginForm';
import { useAttendance } from '../hooks';
import { UI_TEXT } from '../constants';
import { Plus, User, Calendar } from 'lucide-react';

// モック練習予定データ
const mockPracticeSchedules: PracticeSchedule[] = [
  {
    id: 'practice-1',
    date: '2024-09-20',
    start_time: '09:00',
    end_time: '11:00',
    venue_id: 'venue-1',
    venue_name: '体育館A',
    campus: '今出川',
    description: 'バスケットボール練習',
  },
  {
    id: 'practice-2',
    date: '2024-09-21',
    start_time: '14:00',
    end_time: '16:00',
    venue_id: 'venue-2',
    venue_name: '体育館B',
    campus: '京田辺',
    description: 'サッカー練習',
  },
  {
    id: 'practice-3',
    date: '2024-09-22',
    start_time: '10:00',
    end_time: '12:00',
    venue_id: 'venue-3',
    venue_name: 'グラウンド',
    campus: '今出川',
    description: '陸上練習',
  },
];

export const AttendancePage: React.FC = () => {
  // TODO: 本番環境ではログイン認証を必要にする
  // const { user, loading: authLoading, signin, signout, isAuthenticated } = useAuth();
  
  // モックユーザーデータ（開発用）
  const mockUser = {
    id: 'mock-user-1',
    email: 'test@example.com',
    name: 'テストユーザー',
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const { attendances, loading: attendanceLoading, upsertAttendance, deleteAttendance } = useAttendance();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // TODO: 本番環境ではログイン認証を必要にする
  // const handleLogin = async (email: string, password: string) => {
  //   try {
  //     await signin(email, password);
  //   } catch (error) {
  //     console.error('Login failed:', error);
  //   }
  // };

  // const handleLogout = async () => {
  //   try {
  //     await signout();
  //   } catch (error) {
  //     console.error('Logout failed:', error);
  //   }
  // };

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
    // TODO: 本番環境ではログイン認証を必要にする
    // if (!user) return;

    try {
      setFormLoading(true);
      await upsertAttendance({
        practice_schedule_id: data.practice_schedule_id,
        user_id: mockUser.id, // モックユーザーIDを使用
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

  // TODO: 本番環境ではログイン認証を必要にする
  // ログインしていない場合はログインフォームを表示
  // if (!isAuthenticated) {
  //   return (
  //     <LoginForm
  //       onSubmit={handleLogin}
  //       loading={authLoading}
  //       error={null}
  //     />
  //   );
  // }

  // TODO: 本番環境ではログイン認証を必要にする
  // if (authLoading || attendanceLoading) {
  //   return (
  //     <div className="flex items-center justify-center p-8">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  //       <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
  //     </div>
  //   );
  // }

  if (attendanceLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">出席登録</h1>
          <p className="text-gray-600 mt-1">
            練習への出席状況を登録・管理します
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{mockUser.name} (開発モード)</span>
          </div>
          {/* TODO: 本番環境ではログイン認証を必要にする */}
          {/* <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>{UI_TEXT.LOGOUT}</span>
          </button> */}
        </div>
      </div>

      {/* フォーム */}
      {isFormOpen && (
        <AttendanceForm
          attendance={editingAttendance}
          practiceSchedules={mockPracticeSchedules}
          userId={mockUser.id} // モックユーザーIDを使用
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      )}

      {/* 出席履歴一覧 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {UI_TEXT.ATTENDANCE_HISTORY} ({attendances.length}件)
          </h2>
          <button
            onClick={handleCreateClick}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>出席登録</span>
          </button>
        </div>
        <AttendanceList
          attendances={attendances}
          practiceSchedules={mockPracticeSchedules}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          showUserInfo={false}
        />
      </div>
    </div>
  );
};
