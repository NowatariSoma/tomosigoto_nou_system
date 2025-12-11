'use client';

import { Suspense } from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import SchedulePage from '@/features/schedule/components/schedulePage';
import { SchedulerProvider } from '@/features/schedule/providers/schedular-provider';

export default function Home() {
  return (
    <AppTemplate
      maxWidth="7xl"
    >
      <SchedulerProvider weekStartsOn="sunday">
        <Suspense fallback={<div className="flex items-center justify-center h-64">読み込み中...</div>}>
          <SchedulePage />
        </Suspense>
      </SchedulerProvider>
    </AppTemplate>
  );
}