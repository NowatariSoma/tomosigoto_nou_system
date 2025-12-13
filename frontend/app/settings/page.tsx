'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Settings as SettingsIcon } from 'lucide-react';
import { AccountSettingsPage } from '@/features/account-setting';

export default function Settings() {
  return (
    <AppTemplate
      title="設定"
      description="アカウントの基本情報を管理します"
      icon={<SettingsIcon className="h-8 w-8 text-black" />}
      developmentBadge={{
        level: 'alpha',
        text: 'バックエンド作成'
      }}
      permissionBadge={{
        level: 'basic',
        text: '基本権限'
      }}
      maxWidth="7xl"
    >
      <AccountSettingsPage />
    </AppTemplate>
  );
}