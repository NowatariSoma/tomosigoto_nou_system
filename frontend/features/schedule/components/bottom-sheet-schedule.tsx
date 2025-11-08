'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScheduleTable } from './ScheduleTable';
import { Information } from './Information';
import { AttendanceSummary } from './attendance-summary';
import { Button } from '@/components/ui/forms/button';
import { formatDateToYYYYMMDD } from '@/shared/utils/format';
import { SimpleAttendanceForm } from './attendance/SimpleAttendanceForm';
import { useAttendance } from '../hooks/use-attendance';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/lib/api';
import { User, PracticeSchedule as AttendancePracticeSchedule } from '../types/attendance';
import { toast } from 'sonner';

interface BottomSheetScheduleProps {
  date: string; // YYYY-MM-DD形式
  onClose: () => void;
}

export function BottomSheetSchedule({ date, onClose }: BottomSheetScheduleProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [practiceSchedules, setPracticeSchedules] = useState<AttendancePracticeSchedule[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  // dateプロップが変わった時に再計算されるように useMemo を使用
  // YYYY-MM-DD形式をローカルタイムゾーンとして正しく解釈
  const currentDate = useMemo(() => {
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0); // 正午に設定してタイムゾーンの影響を避ける
    console.log('BottomSheetSchedule - Date parsing:', {
      dateParam: date,
      year,
      month,
      day,
      parsedDate,
      parsedDateYear: parsedDate.getFullYear(),
      parsedDateMonth: parsedDate.getMonth(),
      parsedDateDay: parsedDate.getDate()
    });
    return parsedDate;
  }, [date]);

  const y = useMotionValue(0);
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [screenHeight, setScreenHeight] = useState(1000); // デフォルト値

  // 出席情報を取得
  const { attendances, loading: attendanceLoading, error: attendanceError, upsertAttendance, deleteAttendance, refetch } = useAttendance();

  // 画面の高さを取得
  useEffect(() => {
    setScreenHeight(window.innerHeight);
  }, []);

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetchApi('/users/');
      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // 練習スケジュール一覧を取得
  const fetchPracticeSchedules = async () => {
    try {
      const response = await fetchApi('/practice_schedules/');
      const data = await response.json();
      setPracticeSchedules(data || []);
    } catch (error) {
      console.error('Error fetching practice schedules:', error);
    }
  };

  // ユーザー一覧と練習スケジュールを取得
  useEffect(() => {
    if (!authLoading && user) {
      fetchUsers();
      fetchPracticeSchedules();
    }
  }, [authLoading, user]);

  // その日の練習スケジュールを取得
  const todayPracticeSchedule = useMemo(() => {
    if (!practiceSchedules.length) return null;

    // dateをYYYY-MM-DD形式で比較
    const targetDate = date; // date は既に YYYY-MM-DD 形式

    const schedule = practiceSchedules.find(schedule => {
      // schedule_dateもYYYY-MM-DD形式なので直接比較
      return schedule.schedule_date === targetDate;
    });

    return schedule || null;
  }, [practiceSchedules, date]);

  // その日の練習の自分の出席状況を取得
  const myAttendance = useMemo(() => {
    if (!todayPracticeSchedule || !user) return null;

    return attendances.find(
      attendance =>
        attendance.practice_schedule_id === todayPracticeSchedule.id &&
        attendance.user_id === user.id
    );
  }, [attendances, todayPracticeSchedule, user]);

  // 日付のフォーマット
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 (${weekday})`;
  };

  // 前日に移動
  const goToPrevDay = () => {
    const prevDate = new Date(currentDate);
    prevDate.setHours(12, 0, 0, 0); // 正午に設定してタイムゾーンの影響を避ける
    prevDate.setDate(prevDate.getDate() - 1);
    const dateStr = formatDateToYYYYMMDD(prevDate);
    router.push(`/schedule?date=${dateStr}`);
  };

  // 翌日に移動
  const goToNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setHours(12, 0, 0, 0); // 正午に設定してタイムゾーンの影響を避ける
    nextDate.setDate(nextDate.getDate() + 1);
    const dateStr = formatDateToYYYYMMDD(nextDate);
    router.push(`/schedule?date=${dateStr}`);
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 150; // 閉じるためのしきい値

    if (info.offset.y > threshold) {
      // 下にスワイプ → 閉じる
      onClose();
    }
  };

  // 背景の透明度（下にドラッグするほど薄くなる）
  const opacity = useTransform(y, [0, 300], [0.5, 0]);

  // コンテンツの左右スワイプ処理
  const handleContentDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100; // スワイプのしきい値

    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) {
        // 右にスワイプ → 前日
        goToPrevDay();
      } else {
        // 左にスワイプ → 翌日
        goToNextDay();
      }
    }
  };

  // 出席登録フォーム送信処理
  const handleAttendanceSubmit = async (data: { status: string; notes: string; userId: string; practiceScheduleId: string; availableFrom?: string; availableTo?: string }) => {
    try {
      setFormLoading(true);
      await upsertAttendance({
        practice_schedule_id: data.practiceScheduleId,
        user_id: data.userId,
        status: data.status as "present" | "absent" | "late" | "no_show" | "undecided",
        notes: data.notes,
        available_from: data.availableFrom,
        available_to: data.availableTo,
      });

      // 出席情報を再取得
      refetch();

      // トーストで成功メッセージを表示
      toast.success('出席を記録しました');
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error('出席登録に失敗しました');
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <>
      {/* 背景オーバーレイ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40"
        onClick={onClose}
        style={{ opacity }}
      />

      {/* ボトムシート */}
      <motion.div
        initial={{ translateY: '100%' }}
        animate={{ translateY: 0 }}
        exit={{ translateY: '100%' }}
        transition={{
          duration: 0.35,
          ease: 'easeOut'
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: screenHeight }}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="fixed inset-0 bg-background rounded-t-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* ハンドル */}
        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="px-4 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {formatDate(currentDate)}
            </h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevDay}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextDay}
                className="h-8 w-8"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* コンテンツエリア（スクロール可能 & 左右スワイプ対応） */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleContentDragEnd}
          style={{ x }}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
        >
          {/* 出席登録フォーム */}
          {authLoading || usersLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">読み込み中...</span>
            </div>
          ) : todayPracticeSchedule ? (
            <SimpleAttendanceForm
              practiceScheduleId={todayPracticeSchedule.id}
              practiceSchedule={todayPracticeSchedule}
              users={users}
              currentUserId={user?.id}
              onSubmit={handleAttendanceSubmit}
              loading={formLoading}
              existingAttendance={myAttendance}
            />
          ) : null}

          {/* 練習表テーブル */}
          <div className="w-full max-w-7xl mx-auto">
            <ScheduleTable currentDate={currentDate} />
          </div>

          {/* 追加情報 */}
          <div className="w-full max-w-7xl mx-auto">
            <Information currentDate={currentDate} />
          </div>

          <div className="w-full max-w-7xl mx-auto">
            {/* 出席情報サマリーと出欠情報詳細 */}
            <AttendanceSummary currentDate={currentDate} />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
