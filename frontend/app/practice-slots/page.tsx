'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Information } from '@/components/ui/noh/information';
import { ScheduleTable } from '@/components/ui/noh/Schedule-Table';
import { DateButton } from '@/components/ui/noh/date-button';
import { scheduleData } from '@/data/schedule-data';

export default function TrainingSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 4, 26)); // May 26, 2024
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Header with Date Navigation */}
          <DateButton 
            currentDate={currentDate}
            onDateChange={navigateDate}
          />
          
          {/* Schedule Table */}
          <ScheduleTable scheduleData={scheduleData} />

          <Information currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
}