"use client";

import SchedulerWrapper from "@/features/schedule/components/view/schedular-view-filteration";

export default function Home() {
  return (
    <div className="w-full">
      <SchedulerWrapper
        stopDayEventSummary={true}
        classNames={{
          tabs: {
            panel: "p-0",
          },
        }}
      />
    </div>
  );
}
