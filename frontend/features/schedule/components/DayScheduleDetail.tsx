'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ScheduleTable } from './ScheduleTable';
import { Information } from './Information';

interface DayScheduleDetailProps {
  date: string; // YYYY-MM-DD形式
}

export function DayScheduleDetail({ date }: DayScheduleDetailProps) {
  const currentDate = new Date(date);

  // 日付のフォーマット（例: 2025年10月18日 (土)）
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 (${weekday})`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-6"
    >
      {/* ヘッダー */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">
          {formatDate(currentDate)} の練習表
        </h2>
      </div>

      {/* 練習表テーブル */}
      <ScheduleTable currentDate={currentDate} />

      {/* 追加情報 */}
      <Information currentDate={currentDate} />
    </motion.div>
  );
}
