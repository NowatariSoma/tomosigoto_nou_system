'use client';

import { Suspense } from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Calendar } from 'lucide-react';
import { PracticeSchedulePage } from '@/features/practice-schedule/components';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">読み込み中...</span>
    </div>
  );
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
      <Suspense fallback={<LoadingFallback />}>
        <PracticeSchedulePage />
      </Suspense>
    </AppTemplate>
  );
}