'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Brain } from 'lucide-react';
import { PracticeSlotsPage } from '@/features/practice-slots/components/practice-slotsPage';

export default function Page() {
  return (
    <AppTemplate
      title="練習表ページ"
      description="日毎の練習表を作成するページ"
      icon={<Brain className="h-8 w-8 text-blue-600" />}
      badge="AI解析"
      badgeVariant="secondary"
      maxWidth="7xl"
    >
      <PracticeSlotsPage />
    </AppTemplate>
  );
} 