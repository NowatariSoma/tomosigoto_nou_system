'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Brain } from 'lucide-react';
import { PartMemberAssignmentPage } from '@/features/part-member-assignment/components/part-member-assignmentPage';

export default function Home() {
  return (
    <AppTemplate
      title="メンバー割り当て"
      description="パートに対してメンバーを割り当てるページ"
      icon={<Brain className="h-8 w-8 text-blue-600" />}
      permissionBadge={{
        level: 'basic',
        text: '基本権限'
      }}
      maxWidth="7xl"
    >
      <PartMemberAssignmentPage />
    </AppTemplate>
  );
}