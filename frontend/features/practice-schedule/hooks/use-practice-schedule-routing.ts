'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PracticeSchedule } from '../types';

/**
 * 練習スケジュールのルーティング処理を管理するカスタムフック
 */
export const usePracticeScheduleRouting = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLから現在のスケジュールIDを取得
  const currentScheduleId = useMemo(() => {
    return searchParams?.get('id') ?? null;
  }, [searchParams]);

  // 編集モードかどうか
  const isEditMode = useMemo(() => {
    return currentScheduleId !== null;
  }, [currentScheduleId]);

  // スケジュール詳細ページへ遷移
  const navigateToSchedule = useCallback((schedule: PracticeSchedule) => {
    router.push(`/practice-schedule?id=${schedule.id}`);
  }, [router]);

  // 一覧ページへ戻る
  const navigateToList = useCallback(() => {
    router.push('/practice-schedule');
  }, [router]);

  return {
    currentScheduleId,
    isEditMode,
    navigateToSchedule,
    navigateToList,
  };
};
