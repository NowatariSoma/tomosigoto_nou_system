'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Calendar } from 'lucide-react';
import { RegisterPage } from '@/features/register/components';

export default function Page() {
  return (
    <AppTemplate
      title="登録"
      description="練習スケジュールと部屋の登録"
      icon={<Calendar className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'alpha',
        text: 'バックエンド作成、UI改善'
      }}
      permissionBadge={{
        level: 'admin',
        text: '管理者'
      }}
      maxWidth="7xl"
    >
      <RegisterPage />
    </AppTemplate>
  );
}