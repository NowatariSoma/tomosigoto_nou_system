'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Brain } from 'lucide-react';
import SchedulePage from '@/features/schedule/components/schedulePage';
import { SchedulerProvider } from '@/features/schedule/providers/schedular-provider';

export default function Home() {
  return (
    <AppTemplate
      title="カレンダー"
      description="カレンダーから練習日程に移動できるページ"
      icon={<Brain className="h-8 w-8 text-blue-600" />}
      permissionBadge={{
        level: 'basic',
        text: '基本権限'
      }}
      maxWidth="7xl"
    >
      <SchedulerProvider weekStartsOn="sunday">
        <SchedulePage />
      </SchedulerProvider>
    </AppTemplate>
  );
}