'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { RoomSettingsPage } from '@/features/room-settings/components/room-settingsPage';
import { Activity } from 'lucide-react';

export default function Page() {
  return (
    <AppTemplate
      title="部屋登録ページ"
      description="使用する部屋を登録するページ"
      icon={<Activity className="h-8 w-8 text-blue-600" />}
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
      <RoomSettingsPage />
    </AppTemplate>
  );
} 