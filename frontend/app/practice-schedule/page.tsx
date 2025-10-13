'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Calendar } from 'lucide-react';
import { PracticeSchedulePage } from '@/features/practice-schedule/components';

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
      <PracticeSchedulePage />
    </AppTemplate>
  );
}