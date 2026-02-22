import type { ReactNode } from 'react';
import { Users, Shield, UserCheck } from 'lucide-react';

type SummaryCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
  accent?: string;
};

function SummaryCard({ icon, title, value, description, accent = 'bg-blue-50' }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 border border-blue-200 rounded-lg bg-white shadow-sm">
      <div className={`p-3 rounded-full ${accent}`}>{icon}</div>
      <div>
        <p className="text-sm text-black">{title}</p>
        <p className="text-2xl font-semibold text-black">{value}</p>
        <p className="text-xs text-black mt-1">{description}</p>
      </div>
    </div>
  );
}

type MemberSummaryCardsProps = {
  totalMembers: number;
  adminCount: number;
  instructorCount: number;
  viewerCount: number;
};

export function MemberSummaryCards({ totalMembers, adminCount, instructorCount, viewerCount }: MemberSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryCard
        icon={<Users className="w-6 h-6 text-black" />}
        title="登録メンバー"
        value={`${totalMembers}名`}
        description="全ての管理対象メンバー"
        accent="bg-blue-50"
      />
      <SummaryCard
        icon={<Shield className="w-6 h-6 text-black" />}
        title="管理者"
        value={`${adminCount}名`}
        description="アプリ設定を操作可能"
        accent="bg-blue-50"
      />
      <SummaryCard
        icon={<UserCheck className="w-6 h-6 text-black" />}
        title="指導者 / ビューアー"
        value={`${instructorCount}名 / ${viewerCount}名`}
        description="特別ロールの状況"
        accent="bg-blue-50"
      />
    </div>
  );
}
