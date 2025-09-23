"use client";
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { ReceiptText } from 'lucide-react';
import FloraDisplay from '@/features/performances-list/components/FloraDisplay';
import { mockFloraData } from '@/features/performances-list/data/mockFlora';

export default function Home() {
  return (
    <AppTemplate
    title="演目一覧"
    description="学年ごとの演目の一覧を表示するページ"
    icon={<ReceiptText className="h-8 w-8 text-blue-600" />}
    developmentBadge={{
      level: 'alpha',
      text: 'バックエンド作成'
    }}
    permissionBadge={{
      level: 'basic',
      text: '基本権限'
    }}
    maxWidth="7xl"
  >
  <FloraDisplay sections={mockFloraData.sections} />
  </AppTemplate>
);
}