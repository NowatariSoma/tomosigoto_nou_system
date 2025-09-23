'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Calendar } from 'lucide-react';
import { RegisterPage } from '@/features/register/components';

export default function Page() {
  return (
    <AppTemplate
      title="練習予定管理"
      description="練習スケジュールの作成・編集・削除"
      icon={<Calendar className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'alpha',
        text: 'バックエンド作成、UI改善'
      }}
      // TODO: 管理者権限を一時的に無効化 - 本番環境では有効にする必要がある
      // permissionBadge={{
      //   level: 'admin',
      //   text: '管理者'
      // }}
      maxWidth="7xl"
    >
      <RegisterPage />
    </AppTemplate>
  );
}