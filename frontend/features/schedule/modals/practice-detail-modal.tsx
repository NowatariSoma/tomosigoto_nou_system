'use client';

import React, { useState, useEffect } from 'react';
import { useModal } from '@/features/schedule/providers/modal-context';
import { PracticeScheduleCard } from '@/features/practice-schedule/components/PracticeScheduleCard';
import { PracticeSchedule } from '../types/attendance';
import { practiceScheduleService } from '../services/practice-schedule-service';
import { Calendar, Users, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';

export default function PracticeDetailModal() {
  const { data } = useModal();
  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  // モーダルデータから練習スケジュールIDを取得
  const practiceId = data?.default?.practiceId;

  useEffect(() => {
    const fetchPracticeDetails = async () => {
      if (!practiceId) {
        setError('練習IDが見つかりません');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 練習スケジュールの詳細を取得
        const schedule = await practiceScheduleService.getPracticeSchedule(practiceId);
        setPracticeSchedule(schedule);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '練習スケジュールの取得に失敗しました';
        setError(errorMessage);
        console.error('Failed to fetch practice schedule details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPracticeDetails();
  }, [practiceId]);

  const handleAttendanceRegistration = () => {
    if (practiceSchedule) {
      // 出席登録はスケジュール内で行うため、モーダルを閉じる
      // または、出席登録機能をここに実装
      alert('出席登録機能はスケジュール画面に統合されました');
    }
  };

  const handleViewPracticeSheet = () => {
    if (practiceSchedule) {
      // 練習表ページに遷移
      const practiceSheetUrl = `/practice-sheet?practice=${practiceSchedule.id}`;
      window.open(practiceSheetUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">練習スケジュールを読み込んでいます...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="h-12 w-12 text-gray-500 mb-4" />
        <p className="text-lg font-medium text-gray-600 mb-2">エラーが発生しました</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!practiceSchedule) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-600 mb-2">練習スケジュールが見つかりません</p>
        <p className="text-sm text-muted-foreground">指定された練習スケジュールは存在しないか、削除された可能性があります。</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">練習詳細</span>
            <span className="sm:hidden">詳細</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">出席登録</span>
            <span className="sm:hidden">出席</span>
          </TabsTrigger>
          <TabsTrigger value="practice-sheet" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">練習表</span>
            <span className="sm:hidden">練習表</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="space-y-4">
            <PracticeScheduleCard
              schedule={practiceSchedule as any}
              onEdit={undefined}
              onDelete={undefined}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleAttendanceRegistration}
                className="flex items-center gap-2 flex-1"
                variant="default"
              >
                <Users className="h-4 w-4" />
                出席登録を開く
              </Button>
              <Button 
                onClick={handleViewPracticeSheet}
                className="flex items-center gap-2 flex-1"
                variant="outline"
              >
                <FileText className="h-4 w-4" />
                練習表を開く
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Users className="h-12 w-12 text-black mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">出席登録</h3>
            <p className="text-black mb-4">
              この練習の出席登録を行います。新しいタブで出席登録ページが開きます。
            </p>
            <Button 
              onClick={handleAttendanceRegistration}
              className="flex items-center gap-2 mx-auto"
            >
              <Users className="h-4 w-4" />
              出席登録ページを開く
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="practice-sheet" className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <FileText className="h-12 w-12 text-black mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">練習表</h3>
            <p className="text-black mb-4">
              この練習の練習表を表示します。新しいタブで練習表ページが開きます。
            </p>
            <Button 
              onClick={handleViewPracticeSheet}
              className="flex items-center gap-2 mx-auto"
              variant="outline"
            >
              <FileText className="h-4 w-4" />
              練習表ページを開く
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
