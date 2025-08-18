'use client';

import { useState } from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Information } from '@/features/practice-slots/components/information';
import { ScheduleTable } from '@/features/practice-slots/components/Schedule-Table';
import { DateButton } from '@/features/practice-slots/components/date-button';
import { scheduleData } from '@/features/practice-slots/services/schedule-data';

export const PracticeSlotsPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 4, 26)); // May 26, 2024

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <AppTemplate
      title="練習表"
      description="練習表の管理システム"
      maxWidth="7xl"
    >
      <div className="space-y-6">
        {/* Date Navigation */}
        <DateButton 
          currentDate={currentDate}
          onDateChange={navigateDate}
        />
        
        {/* Schedule Table */}
        <ScheduleTable scheduleData={scheduleData} />

        {/* Information */}
        <Information currentDate={currentDate} />
      </div>
    </AppTemplate>
  );
};