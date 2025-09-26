'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Brain } from 'lucide-react';
import { StagePartAssignmentPage } from '@/features/stage-part-assignment/components/stage-part-assignmentPage';

export default function Home() {
  return (
    <AppTemplate
      title="パート割り当て"
      description="公演に対してパートを割り当てるページ"
      icon={<Brain className="h-8 w-8 text-blue-600" />}
      permissionBadge={{
        level: 'basic',
        text: '基本権限'
      }}
      maxWidth="7xl"
    >
      <StagePartAssignmentPage />
    </AppTemplate>
  );
}