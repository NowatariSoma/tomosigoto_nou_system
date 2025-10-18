"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import SchedulerWrapper from "@/features/schedule/components/view/schedular-view-filteration";
import { BottomSheetSchedule } from "@/features/schedule/components/bottom-sheet-schedule";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedDate = searchParams.get('date'); // YYYY-MM-DD形式

  // ボトムシートを閉じる
  const handleCloseBottomSheet = () => {
    router.push('/schedule');
  };

  return (
    <div className="w-full relative">
      {/* カレンダー（常に表示） */}
      <SchedulerWrapper
        stopDayEventSummary={true}
        classNames={{
          tabs: {
            panel: "p-0",
          },
        }}
      />

      {/* ボトムシート（dateパラメータがある時のみ表示） */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <BottomSheetSchedule
            date={selectedDate}
            onClose={handleCloseBottomSheet}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
