import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Brain } from 'lucide-react';
import { AccountSettingsPage } from '@/features/account-setting';

export default function Home() {
  return (
  <AppTemplate
    title="アカウント設定"
    description="アカウント設定を行うページ"
    icon={<Brain className="h-8 w-8 text-blue-600" />}
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
      <AccountSettingsPage />
    </AppTemplate>
  );
}