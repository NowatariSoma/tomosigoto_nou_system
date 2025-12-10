'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Brain } from 'lucide-react';
import { StagePartAssignmentPage } from '@/features/stage-part-assignment/components/stage-part-assignmentPage';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { canEdit, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !canEdit) {
      router.push('/');
    }
  }, [canEdit, isLoading, router]);

  if (isLoading || !canEdit) {
    return null;
  }

  return (
    <AppTemplate
      title="パート割り当て"
      description="公演に対してパートを割り当てるページ"
      icon={<Brain className="h-8 w-8 text-blue-600" />}
      permissionBadge={{
        level: 'instructor',
        text: '指導者以上'
      }}
      maxWidth="7xl"
    >
      <StagePartAssignmentPage />
    </AppTemplate>
  );
}