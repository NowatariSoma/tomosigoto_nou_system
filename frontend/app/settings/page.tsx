'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Settings as SettingsIcon } from 'lucide-react';
import { SettingsPage } from '@/features/settings/components/SettingsPage';

export default function Settings() {
  return (
    <AppTemplate
      title="設定"
      description="アカウント設定とチーム管理を行います"
      icon={<SettingsIcon className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'stable',
        text: '安定版'
      }}
      permissionBadge={{
        level: 'super',
        text: 'システム管理者'
      }}
      maxWidth="7xl"
    >
      <SettingsPage />
    </AppTemplate>
  );
} 