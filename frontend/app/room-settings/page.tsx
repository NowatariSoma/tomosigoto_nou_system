'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { RoomSettingsPage } from '@/features/room-settings/components/room-settingsPage';
import { Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Page() {
  const router = useRouter();
  const { canEdit, isLoading } = useAuth();

  useEffect(() => {
    // ローディング完了後、権限がない場合はリダイレクト
    if (!isLoading && !canEdit) {
      router.push('/');
    }
  }, [canEdit, isLoading, router]);

  // ローディング中または権限がない場合は何も表示しない
  if (isLoading || !canEdit) {
    return null;
  }

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
        level: 'instructor',
        text: '指導者以上'
      }}
      maxWidth="7xl"
    >
      <RoomSettingsPage />
    </AppTemplate>
  );
} 