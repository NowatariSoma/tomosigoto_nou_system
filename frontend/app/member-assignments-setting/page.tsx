'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { MemberAssignmentsSettingsPage } from '@/features/member_assignments-setting/components';
import { UserCheck } from 'lucide-react';
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
      title="メンバー所属設定ページ"
      description="メンバーのパート所属を管理するページ"
      icon={<UserCheck className="h-8 w-8 text-blue-600" />}
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
      <MemberAssignmentsSettingsPage />
    </AppTemplate>
  );
}
