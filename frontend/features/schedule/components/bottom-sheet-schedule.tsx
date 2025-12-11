'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, useDragControls, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScheduleTable } from './ScheduleTable';
import { Information } from './Information';
import { Button } from '@/components/ui/forms/button';
import { formatDateToYYYYMMDD } from '@/shared/utils/format';
import { SimpleAttendanceForm } from './attendance/SimpleAttendanceForm';
import { useAttendance } from '../hooks/use-attendance';
import { useAuth } from '@/contexts/AuthContext';
import { User, PracticeSchedule as AttendancePracticeSchedule } from '../types/attendance';
import { toast } from 'sonner';
import { practiceScheduleService } from '../services/practice-schedule-service';
import { PracticeScheduleBundleResponse, PracticeScheduleDisplayResponse } from '../types/practice-schedule-types';

interface BottomSheetScheduleProps {
  date: string; // YYYY-MM-DD形式
  onClose: () => void;
}

export function BottomSheetSchedule({ date, onClose }: BottomSheetScheduleProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  // 軽量データ（出席フォーム + 練習内容用）- 先にロード
  const [basicSchedule, setBasicSchedule] = useState<PracticeScheduleDisplayResponse | null>(null);
  const [basicLoading, setBasicLoading] = useState(false);
  const [basicError, setBasicError] = useState<string | null>(null);

  // 重いデータ（時間割、出欠詳細用）- 後からロード
  const [bundleData, setBundleData] = useState<PracticeScheduleBundleResponse | null>(null);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // dateプロップが変わった時に再計算されるように useMemo を使用
  // YYYY-MM-DD形式をローカルタイムゾーンとして正しく解釈
  const currentDate = useMemo(() => {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // 正午に設定してタイムゾーンの影響を避ける
  }, [date]);

  const y = useMotionValue(0);
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [screenHeight, setScreenHeight] = useState(1000); // デフォルト値
  const dragControls = useDragControls();

  // 画面の高さを取得
  useEffect(() => {
    setScreenHeight(window.innerHeight);
  }, []);

  // 1. 軽量データ取得（出席フォーム + 練習内容用）- 先にロード
  useEffect(() => {
    if (!date) {
      setBasicSchedule(null);
      return;
    }

    let isMounted = true;
    setBasicLoading(true);
    setBasicError(null);

    practiceScheduleService
      .getPracticeScheduleByDate(date)
      .then((data) => {
        if (!isMounted) return;
        setBasicSchedule(data);
      })
      .catch((error) => {
        if (!isMounted) return;
        setBasicSchedule(null);
        setBasicError(error instanceof Error ? error.message : '練習予定の取得に失敗しました');
      })
      .finally(() => {
        if (!isMounted) return;
        setBasicLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [date]);

  // 2. 重いデータ取得（時間割、出欠詳細用）- 後からロード
  useEffect(() => {
    if (!date) {
      setBundleData(null);
      return;
    }

    let isMounted = true;
    setBundleLoading(true);
    setBundleError(null);

    practiceScheduleService
      .getPracticeScheduleBundle(date)
      .then((data) => {
        if (!isMounted) return;
        setBundleData(data);
        if (data?.users?.length) {
          setUsers(
            data.users.map((item) => ({
              id: item.id,
              name: item.name,
              email: item.email || '',
            }))
          );
        } else {
          setUsers([]);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        setBundleData(null);
        setBundleError(error instanceof Error ? error.message : '練習予定の取得に失敗しました');
      })
      .finally(() => {
        if (!isMounted) return;
        setBundleLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [date]);

  // 出席フォーム用のスケジュール（軽量データから先に取得）
  const practiceSchedule = useMemo<AttendancePracticeSchedule | null>(() => {
    // basicScheduleから先に生成（高速表示）
    if (basicSchedule) {
      return {
        id: basicSchedule.id,
        schedule_date: basicSchedule.schedule_date,
        start_time: basicSchedule.start_time || '',
        end_time: basicSchedule.end_time || '',
        division_count: 1,
        title: basicSchedule.title,
        description: basicSchedule.description,
        schedule_type: basicSchedule.schedule_type,
        status: basicSchedule.status,
        created_at: undefined,
        updated_at: undefined,
        created_by: undefined,
        updated_by: undefined,
        venues: [],
      };
    }
    return null;
  }, [basicSchedule]);

  const attendanceOptions = useMemo(
    () => ({
      initialAttendances: bundleData?.attendance?.entries,
    }),
    [bundleData?.attendance?.entries]
  );

  const {
    attendances,
    loading: attendanceLoading,
    error: attendanceError,
    upsertAttendance,
    deleteAttendance,
    refetch,
  } = useAttendance(practiceSchedule?.id, attendanceOptions);

  // その日の練習の自分の出席状況を取得
  const myAttendance = useMemo(() => {
    if (!practiceSchedule || !user) return null;

    return attendances.find(
      attendance =>
        attendance.practice_schedule_id === practiceSchedule.id &&
        attendance.user_id === user.id
    );
  }, [attendances, practiceSchedule, user]);

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

    // 速度または移動量で方向を判断
    const isMovingDown = info.velocity.y > 0 || info.offset.y > 50;

    if (isMovingDown) {
      // 下方向 → 閉じる
      onClose();
    } else {
      // 上方向 → 元の位置に即座に戻す
      animate(y, 0, { duration: 0.2, ease: 'easeOut' });
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
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: screenHeight }}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="fixed inset-0 bg-background rounded-t-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* ドラッグ可能エリア（ハンドル + ヘッダー） */}
        <div
          className="cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          {/* ハンドル */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* ヘッダー */}
          <div className="px-4 pb-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {formatDate(currentDate)}
              </h2>
              <div className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
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
          {/* 1. 出席登録フォーム（最初にロード） */}
          {authLoading || basicLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">読み込み中...</span>
            </div>
          ) : basicError ? (
            <div className="flex items-center justify-center p-8 text-red-600">
              練習予定の取得に失敗しました: {basicError}
            </div>
          ) : practiceSchedule ? (
            <SimpleAttendanceForm
              practiceScheduleId={practiceSchedule.id}
              practiceSchedule={practiceSchedule}
              users={users}
              currentUserId={user?.id}
              onSubmit={handleAttendanceSubmit}
              loading={formLoading}
              existingAttendance={myAttendance}
            />
          ) : (
            <div className="flex items-center justify-center p-8 text-gray-500">
              この日付の練習予定は見つかりませんでした
            </div>
          )}

          {/* 2. 練習内容（2番目にロード） */}
          <div className="w-full max-w-7xl mx-auto">
            <Information
              currentDate={currentDate}
              basicSchedule={basicSchedule}
              basicLoading={basicLoading}
              basicError={basicError}
              bundleData={bundleData}
              bundleLoading={bundleLoading}
              bundleError={bundleError}
            />
          </div>

          {/* 3. 練習表テーブル（最後にロード） */}
          <div className="w-full max-w-7xl mx-auto">
            <ScheduleTable
              currentDate={currentDate}
              idealData={bundleData?.ideal ?? null}
              loading={bundleLoading}
              error={bundleError}
            />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
