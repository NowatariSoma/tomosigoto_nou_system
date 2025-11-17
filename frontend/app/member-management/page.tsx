'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Shield } from 'lucide-react';
import { MemberManagementPage } from '@/features/member-management/components/MemberManagementPage';

export default function MemberManagement() {
  return (
    <AppTemplate
      title="メンバー管理"
      description="管理者権限とアカウントを管理します"
      icon={<Shield className="h-8 w-8 text-blue-600" />}
      permissionBadge={{
        level: 'basic',
        text: '管理権限'
      }}
      maxWidth="7xl"
    >
      <MemberManagementPage />
    </AppTemplate>
  );
}

