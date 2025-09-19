'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Brain } from 'lucide-react';
import { PracticeSlotsPage } from '@/features/practice-slots/components/PracticeSlotsPage';

export default function Page() {
  return (
    <AppTemplate
      title="練習表ページテスト"
      description="日毎の練習表を作成するページ"
      icon={<Brain className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'alpha',
        text: 'API使うように、UI改善'
      }}
      permissionBadge={{
        level: 'basic',
        text: '基本権限'
      }}
      maxWidth="7xl"
    >
      <PracticeSlotsPage />
    </AppTemplate>
  );
} 
