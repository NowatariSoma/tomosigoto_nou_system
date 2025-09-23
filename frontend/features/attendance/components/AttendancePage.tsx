'use client';

import React, { useState, useEffect } from 'react';
import { Attendance, AttendanceFormData, PracticeSchedule } from '../types';
import { AttendanceList } from './AttendanceList';
import { AttendanceForm } from './AttendanceForm';
import { LoginForm } from './LoginForm';
import { useAttendance, usePracticeSchedule } from '../hooks';
import { UI_TEXT } from '../constants';
import { Plus, User, Calendar } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  // TODO: 本番環境ではログイン認証を必要にする
  // const { user, loading: authLoading, signin, signout, isAuthenticated } = useAuth();
  
  // モックユーザーデータ（開発用）
  const mockUsers = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'user1@example.com',
      name: 'ユーザー1',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'user2@example.com',
      name: 'ユーザー2',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'user3@example.com',
      name: 'ユーザー3',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const [selectedUserId, setSelectedUserId] = useState(mockUsers[0].id);
  const selectedUser = mockUsers.find(user => user.id === selectedUserId) || mockUsers[0];
  
  const { attendances, loading: attendanceLoading, upsertAttendance, deleteAttendance } = useAttendance();
  const { practiceSchedules, loading: practiceLoading, error: practiceError } = usePracticeSchedule();
  
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
        user_id: selectedUser.id, // 選択されたユーザーIDを使用
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

  if (attendanceLoading || practiceLoading) {
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
            <span>{selectedUser.name} (開発モード)</span>
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

      {/* ユーザー選択 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          ユーザー選択
        </h2>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {mockUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-slate-600">
          選択中のユーザー: <span className="font-medium">{selectedUser.name}</span>
        </p>
      </div>

      {/* フォーム */}
      {isFormOpen && (
        <AttendanceForm
          attendance={editingAttendance}
          practiceSchedules={practiceSchedules}
          userId={selectedUser.id} // 選択されたユーザーIDを使用
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      )}

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
    </div>
  );
};
