'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { MemberAssignmentsSettingsPage } from '@/features/member_assignments-setting/components';
import { UserCheck } from 'lucide-react';

export default function Page() {
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
        level: 'basic',
        text: '管理者'
      }}
      maxWidth="7xl"
    >
      <MemberAssignmentsSettingsPage />
    </AppTemplate>
  );
}
