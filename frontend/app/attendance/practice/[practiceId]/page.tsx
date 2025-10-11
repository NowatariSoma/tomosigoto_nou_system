'use client';

import { use } from 'react';
import { PracticeAttendancePage } from '@/features/attendance/components';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { UserCheck } from 'lucide-react';

interface PracticeAttendancePageProps {
  params: Promise<{
    practiceId: string;
  }>;
}

export default function Page({ params }: PracticeAttendancePageProps) {
  const { practiceId } = use(params);

  return (
    <AppTemplate
      title="出席登録"
      description="練習への出席状況を登録・管理"
      icon={<UserCheck className="h-8 w-8 text-blue-600" />}
      permissionBadge={{
        level: 'basic',
        text: '管理者'
      }}
      maxWidth="7xl"
    >
      <PracticeAttendancePage practiceId={practiceId} />
    </AppTemplate>
  );
}
