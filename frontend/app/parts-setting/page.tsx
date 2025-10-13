'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { PartsSettingsPage } from '@/features/parts-setting/components';
import { Theater } from 'lucide-react';

export default function Page() {
  return (
    <AppTemplate
      title="舞台・パート登録ページ"
      description="舞台・パートを登録するページ"
      icon={<Theater className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'beta',
        text: 'バックエンド結合'
      }}
      permissionBadge={{
        level: 'admin',
        text: '管理者'
      }}
      maxWidth="7xl"
    >
      <PartsSettingsPage />
    </AppTemplate>
  );
} 