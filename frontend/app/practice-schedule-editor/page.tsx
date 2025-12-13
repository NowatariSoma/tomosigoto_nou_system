'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { PracticeScheduleEditorPage } from '@/features/practice-schedule-editor/components';
import { Edit3 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function PracticeScheduleEditorContent() {
  const searchParams = useSearchParams();
  const scheduleId = searchParams?.get('scheduleId') || undefined;
  const scheduleDate = searchParams?.get('date') || undefined;

  return (
    <PracticeScheduleEditorPage 
      scheduleId={scheduleId}
      scheduleDate={scheduleDate}
    />
  );
}

export default function Page() {
  const router = useRouter();
  const { canEdit, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !canEdit) {
      router.push('/');
    }
  }, [canEdit, isLoading, router]);

  if (isLoading || !canEdit) {
    return null;
  }

  return (
    <AppTemplate
      title="練習表編集"
      description="練習スケジュールのセッション編集"
      icon={<Edit3 className="h-8 w-8 text-black" />}
      developmentBadge={{
        level: 'alpha',
        text: '開発中'
      }}
      maxWidth="7xl"
    >
      <Suspense fallback={<div>読み込み中...</div>}>
        <PracticeScheduleEditorContent />
      </Suspense>
    </AppTemplate>
  );
}
