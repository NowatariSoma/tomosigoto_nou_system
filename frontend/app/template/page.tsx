'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { TemplatePage } from '@/features/template';

export default function Template() {
  return (
    <AppTemplate
      title="テンプレートレイアウト"
      description="統一されたレイアウトテンプレートのデモンストレーション"
      developmentBadge={{
        level: 'alpha',
        text: 'アルファ版'
      }}
      permissionBadge={{
        level: 'basic',
        text: '基本権限'
      }}
      maxWidth="7xl"
    >
      <TemplatePage />
    </AppTemplate>
  );
} 