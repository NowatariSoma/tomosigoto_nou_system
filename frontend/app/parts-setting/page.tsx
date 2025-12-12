'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { PartsSettingsPage } from '@/features/parts-setting/components';
import { Theater } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Page() {
  const router = useRouter();
  const { canEdit, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !canEdit) {
      router.push('/');
    }
  }, [canEdit, isLoading, router]);

  if (isLoading || !canEdit) {
    return null;
  }

  return (
    <AppTemplate
      title="舞台・パート登録ページ"
      description="舞台・パートを登録するページ"
      icon={<Theater className="h-8 w-8 text-black" />}
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
      <PartsSettingsPage />
    </AppTemplate>
  );
} 