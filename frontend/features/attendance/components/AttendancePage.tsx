'use client';

import React, { useState, useEffect } from 'react';
import { Attendance, AttendanceFormData, PracticeSchedule } from '../types';
import { AttendanceList } from './AttendanceList';
import { AttendanceForm } from './AttendanceForm';
import { LoginForm } from './LoginForm';
import { useAttendance, usePracticeSchedule } from '../hooks';
import { useAuth } from '@/contexts/AuthContext';
import { UI_TEXT } from '../constants';
import { Plus, User, Calendar } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user, isLoading: authLoading, login, logout, isAuthenticated } = useAuth();
  
  const { attendances, loading: attendanceLoading, upsertAttendance, deleteAttendance } = useAttendance();
  const { practiceSchedules, loading: practiceLoading, error: practiceError } = usePracticeSchedule();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
    if (!user) return;

    try {
      setFormLoading(true);
      await upsertAttendance({
        practice_schedule_id: data.practice_schedule_id,
        user_id: user.id, // 認証されたユーザーIDを使用
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

  // 認証チェック
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">ログイン</h2>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

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
      {/* ユーザー情報表示 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{user?.email || 'ユーザー'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <span>{UI_TEXT.LOGOUT}</span>
        </button>
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
