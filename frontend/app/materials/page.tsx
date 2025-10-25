'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { MaterialTopPage } from '@/features/materials/components/MaterialTopPage';
import { Theater } from 'lucide-react';

export default function Page() {
  return (
    <AppTemplate
      title="資料庫"
      description="資料を登録するページ"
      icon={<Theater className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'beta',
        text: 'バックエンド結合'
      }}
      permissionBadge={{
        level: 'basic',
        text: '管理者'
      }}
      maxWidth="7xl"
    >
      <MaterialTopPage />
    </AppTemplate>
  );
} 