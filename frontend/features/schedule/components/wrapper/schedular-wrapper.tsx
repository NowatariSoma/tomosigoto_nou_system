import React from "react";
import SchedulerView from "../view/schedular-view";

export default function SchedulerWrapper() {
  return (
    <div className="w-full">
      <h1 className="tracking-tighter font-semibold text-3xl sm:text-5xl md:text-6xl lg:text-8xl mb-6 sm:mb-8 md:mb-10">Event Schedule</h1>
      <SchedulerView />
    </div>
  );
}
