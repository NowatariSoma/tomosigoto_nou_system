'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { PracticeScheduleEditorPage } from '@/features/practice-schedule-editor/components';
import { Edit3, Calendar } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('scheduleId') || undefined;
  const scheduleDate = searchParams.get('date') || undefined;

  return (
    <AppTemplate
      title="練習表編集"
      description="練習スケジュールのセッション編集"
      icon={<Edit3 className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'alpha',
        text: '開発中'
      }}
      maxWidth="7xl"
    >
      <PracticeScheduleEditorPage 
        scheduleId={scheduleId}
        scheduleDate={scheduleDate}
      />
    </AppTemplate>
  );
}
