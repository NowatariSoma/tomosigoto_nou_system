"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import SchedulerWrapper from "@/features/schedule/components/view/schedular-view-filteration";
import { BottomSheetSchedule } from "@/features/schedule/components/BottomSheetSchedule";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedDate = searchParams?.get('date') || null; // YYYY-MM-DD形式

  // 即座にボトムシートを表示するための状態
  // URLの変更を待たずにクリック時点で表示開始
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  // URLパラメータが変更されたらpendingDateをクリア
  useEffect(() => {
    if (selectedDate) {
      setPendingDate(null);
    }
  }, [selectedDate]);

  // 日付クリック時のハンドラ（即座にボトムシートを表示）
  const handleDateClick = useCallback((dateStr: string) => {
    setPendingDate(dateStr);
    router.push(`/schedule?date=${dateStr}`);
  }, [router]);

  // ボトムシートを閉じる
  const handleCloseBottomSheet = () => {
    setPendingDate(null);
    router.push('/schedule');
  };

  // 表示する日付（pendingDateを優先、なければURLパラメータ）
  const displayDate = pendingDate || selectedDate;

  return (
    <div className="w-full relative">
      {/* カレンダー（常に表示） */}
      <SchedulerWrapper
        classNames={{
          tabs: {
            panel: "p-0",
          },
        }}
        onDateClick={handleDateClick}
      />

      {/* ボトムシート（dateパラメータまたはpendingDateがある時に表示） */}
      <AnimatePresence mode="wait">
        {displayDate && (
          <BottomSheetSchedule
            date={displayDate}
            onClose={handleCloseBottomSheet}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
