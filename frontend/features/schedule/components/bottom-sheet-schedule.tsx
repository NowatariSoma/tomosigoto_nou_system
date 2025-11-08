'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScheduleTable } from '@/features/practice-slots/components/ScheduleTable';
import { Information } from '@/features/practice-slots/components/Information';
import { AttendanceSummary } from './attendance-summary';
import { Button } from '@/components/ui/forms/button';

interface BottomSheetScheduleProps {
  date: string; // YYYY-MM-DD形式
  onClose: () => void;
}

export function BottomSheetSchedule({ date, onClose }: BottomSheetScheduleProps) {
  const router = useRouter();
  // dateプロップが変わった時に再計算されるように useMemo を使用
  // YYYY-MM-DD形式をローカルタイムゾーンとして正しく解釈
  const currentDate = useMemo(() => {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [date]);

  const y = useMotionValue(0);
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [screenHeight, setScreenHeight] = useState(1000); // デフォルト値

  // 画面の高さを取得
  useEffect(() => {
    setScreenHeight(window.innerHeight);
  }, []);

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
    prevDate.setDate(prevDate.getDate() - 1);
    const dateStr = prevDate.toISOString().split('T')[0];
    router.push(`/schedule?date=${dateStr}`);
  };

  // 翌日に移動
  const goToNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const dateStr = nextDate.toISOString().split('T')[0];
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
          {/* 練習表テーブル */}
          <ScheduleTable currentDate={currentDate} />

          {/* 追加情報 */}
          <Information currentDate={currentDate} />

          {/* 出席情報サマリーと出欠情報詳細 */}
          <AttendanceSummary currentDate={currentDate} />
        </motion.div>
      </motion.div>
    </>
  );
}
