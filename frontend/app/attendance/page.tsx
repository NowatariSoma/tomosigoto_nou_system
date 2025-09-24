'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { UserCheck } from 'lucide-react';
import { AttendancePage } from '@/features/attendance/components';

export default function Page() {
  return (
    <AppTemplate
      title="出席登録"
      description="練習への出席状況を登録・管理"
      icon={<UserCheck className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'alpha',
        text: '認証システム統合、UI改善'
      }}
      permissionBadge={{
        level: 'basic',
        text: '管理者'
      }}
      maxWidth="7xl"
    >
      <AttendancePage />
    </AppTemplate>
  );
}
