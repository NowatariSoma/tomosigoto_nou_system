'use client';

import { Suspense } from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { UserCheck } from 'lucide-react';
import { AttendancePage, PracticeAttendancePage } from '@/features/attendance/components';
import { useSearchParams } from 'next/navigation';

function AttendanceContent() {
  const searchParams = useSearchParams();
  const practiceId = searchParams.get('practice');

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
      {practiceId ? (
        <PracticeAttendancePage practiceId={practiceId} />
      ) : (
        <AttendancePage />
      )}
    </AppTemplate>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
