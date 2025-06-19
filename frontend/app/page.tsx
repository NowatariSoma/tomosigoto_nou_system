'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Upload, History, FileText, Users, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Check authentication
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
        
        <main className="flex-1 container mx-auto px-4 py-8 bg-white">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              SlideHub - PowerPoint差分比較システム
            </h1>
            <p className="text-gray-600">
              PowerPointファイルの変更点を視覚的に比較・確認できるシステムです
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* アップロード画面への導線 */}
            <Card className="hover-card cursor-pointer bg-white border border-gray-200" onClick={() => router.push('/upload')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  ファイルアップロード
                </CardTitle>
                <CardDescription>
                  PowerPointファイルをアップロードして差分を生成
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  新しいファイルをアップロード
                </Button>
              </CardContent>
            </Card>

            {/* 差分履歴画面への導線 */}
            <Card className="hover-card cursor-pointer bg-white border border-gray-200" onClick={() => router.push('/history')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-green-600" />
                  差分履歴
                </CardTitle>
                <CardDescription>
                  過去にアップロードした差分履歴を確認
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  履歴を確認
                </Button>
              </CardContent>
            </Card>

            {/* 統計情報 */}
            <Card className="hover-card bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  統計情報
                </CardTitle>
                <CardDescription>
                  システムの使用状況とレポート
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">総アップロード数</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">今月の比較回数</span>
                    <span className="font-semibold">-</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 最近の活動 */}
          <div className="mt-8">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  最近の活動
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  まだアップロードされたファイルがありません
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}