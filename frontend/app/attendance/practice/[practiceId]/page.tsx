'use client';

import { use } from 'react';
import { PracticeAttendancePage } from '@/features/attendance/components';

interface PracticeAttendancePageProps {
  params: Promise<{
    practiceId: string;
  }>;
}

export default function Page({ params }: PracticeAttendancePageProps) {
  const { practiceId } = use(params);
  return <PracticeAttendancePage practiceId={practiceId} />;
}
