'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Calendar } from 'lucide-react';
// import { RegisterPage } from '@/features/register/components';

export default function Page() {
  return (
    <AppTemplate
      title="練習予定管理"
      description="練習スケジュールの作成・編集・削除"
      icon={<Calendar className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'alpha',
        text: 'バックエンド作成、UI改善'
      }}
      permissionBadge={{
        level: 'basic',
        text: '管理者'
      }}
      maxWidth="7xl"
    >
      {/* <RegisterPage /> */}
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">練習予定管理</h2>
        <p className="text-gray-500">この機能は開発中です。</p>
      </div>
    </AppTemplate>
  );
}