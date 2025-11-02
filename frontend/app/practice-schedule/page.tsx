'use client';

import { Suspense } from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Calendar, Edit3 } from 'lucide-react';
import { PracticeSchedulePage } from '@/features/practice-schedule/components';
import { PracticeScheduleEditorPage } from '@/features/practice-schedule-editor/components';
import { useSearchParams } from 'next/navigation';

function PracticeScheduleContent() {
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('scheduleId') || undefined;
  const scheduleDate = searchParams.get('date') || undefined;

  // スケジュールIDが指定されている場合は編集画面を表示
  if (scheduleId) {
    return (
      <PracticeScheduleEditorPage
        scheduleId={scheduleId}
        scheduleDate={scheduleDate}
      />
    );
  }

  // それ以外は一覧画面を表示
  return <PracticeSchedulePage />;
}

export default function Page() {
  return (
    <AppTemplate
      title="練習予定管理"
      description="練習スケジュールの作成・編集・削除"
      icon={<Calendar className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'beta',
        text: '機能完成、最終テスト中'
      }}
      permissionBadge={{
        level: 'basic',
        text: '管理者'
      }}
      maxWidth="7xl"
    >
      <Suspense fallback={<div>読み込み中...</div>}>
        <PracticeScheduleContent />
      </Suspense>
    </AppTemplate>
  );
}