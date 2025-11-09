'use client';

import { Suspense } from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Users } from 'lucide-react';
import { AdminAttendancePage } from '@/features/admin-attendance/components/AdminAttendancePage';

function AdminAttendanceContent() {
  return (
    <AppTemplate
      title="管理者用出席管理"
      description="練習への出席状況を一括登録・管理"
      icon={<Users className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'alpha',
        text: '管理者向け機能'
      }}
      permissionBadge={{
        level: 'basic',
        text: '管理者のみ'
      }}
      maxWidth="7xl"
    >
      <AdminAttendancePage />
    </AppTemplate>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <AdminAttendanceContent />
    </Suspense>
  );
}
