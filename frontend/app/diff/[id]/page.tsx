'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Eye, 
  EyeOff, 
  MessageCircle, 
  Filter,
  FileText,
  Plus,
  Minus,
  Move
} from 'lucide-react';

interface SlideChange {
  id: string;
  slideNumber: number;
  changeType: 'added' | 'deleted' | 'modified' | 'moved';
  title: string;
  description: string;
  beforeImage?: string;
  afterImage?: string;
}

interface DiffData {
  id: string;
  title: string;
  createdAt: string;
  changes: SlideChange[];
}

export default function DiffPage() {
  const router = useRouter();
  const params = useParams();
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'added' | 'deleted' | 'modified' | 'moved'>('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  // 模擬データ
  useEffect(() => {
    const mockData: DiffData = {
      id: params.id as string,
      title: 'プレゼンテーション_v1_vs_v2',
      createdAt: '2024-01-15T10:30:00Z',
      changes: [
        {
          id: '1',
          slideNumber: 1,
          changeType: 'modified',
          title: 'タイトルスライド',
          description: 'タイトルテキストが変更されました',
        },
        {
          id: '2',
          slideNumber: 2,
          changeType: 'added',
          title: '新しいスライド',
          description: '新規に追加されたスライドです',
        },
        {
          id: '3',
          slideNumber: 3,
          changeType: 'modified',
          title: '売上グラフ',
          description: 'グラフのデータが更新されました',
        },
        {
          id: '4',
          slideNumber: 4,
          changeType: 'deleted',
          title: '削除されたスライド',
          description: 'このスライドは削除されました',
        },
        {
          id: '5',
          slideNumber: 5,
          changeType: 'moved',
          title: '移動されたスライド',
          description: 'スライドの順序が変更されました',
        },
      ],
    };

    setTimeout(() => {
      setDiffData(mockData);
      setSelectedSlide(mockData.changes[0]?.id || null);
      setLoading(false);
    }, 1000);
  }, [params.id]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFilterChange = (type: typeof filterType) => {
    setFilterType(type);
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'deleted':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'moved':
        return <Move className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeBadge = (type: string) => {
    switch (type) {
      case 'added':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">追加</span>;
      case 'deleted':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">削除</span>;
      case 'modified':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">変更</span>;
      case 'moved':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">移動</span>;
      default:
        return null;
    }
  };

  const filteredChanges = diffData?.changes.filter(change => 
    filterType === 'all' || change.changeType === filterType
  ) || [];

  const selectedSlideData = filteredChanges.find(change => change.id === selectedSlide);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <Sidebar 
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleMobileSidebarClose}
        />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!diffData) {
    return (
      <div className="min-h-screen bg-white flex">
        <Sidebar 
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleMobileSidebarClose}
        />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <p className="text-gray-500">差分データが見つかりません</p>
              <Button onClick={() => router.push('/history')} className="mt-4">
                履歴に戻る
              </Button>
            </div>
          </div>
        </div>
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
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" onClick={() => router.push('/history')} className="hover-nav">
                <ArrowLeft className="h-4 w-4 mr-2" />
                履歴に戻る
              </Button>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                差分詳細: {diffData.title}
              </h1>
              <p className="text-gray-600">
                {new Date(diffData.createdAt).toLocaleDateString('ja-JP')} に作成
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* サイドバー - 変更一覧 */}
            <div className="lg:col-span-1">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>変更一覧</span>
                    <span className="text-sm font-normal text-gray-500">
                      {filteredChanges.length}件
                    </span>
                  </CardTitle>
                  
                  {/* フィルター */}
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant={filterType === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('all')}
                      className="text-xs"
                    >
                      すべて
                    </Button>
                    <Button
                      variant={filterType === 'added' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('added')}
                      className="text-xs text-green-700 hover:text-green-800"
                    >
                      追加
                    </Button>
                    <Button
                      variant={filterType === 'modified' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('modified')}
                      className="text-xs text-blue-700 hover:text-blue-800"
                    >
                      変更
                    </Button>
                    <Button
                      variant={filterType === 'deleted' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('deleted')}
                      className="text-xs text-red-700 hover:text-red-800"
                    >
                      削除
                    </Button>
                    <Button
                      variant={filterType === 'moved' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('moved')}
                      className="text-xs text-purple-700 hover:text-purple-800"
                    >
                      移動
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredChanges.map((change) => (
                      <div
                        key={change.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedSlide === change.id
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                        onClick={() => setSelectedSlide(change.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getChangeIcon(change.changeType)}
                          <span className="text-sm font-medium text-gray-900">
                            スライド {change.slideNumber}
                          </span>
                          {getChangeBadge(change.changeType)}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{change.title}</p>
                        <p className="text-xs text-gray-500">{change.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* メインビュー */}
            <div className="lg:col-span-3">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {selectedSlideData ? 
                        `スライド ${selectedSlideData.slideNumber}: ${selectedSlideData.title}` : 
                        'スライドを選択してください'
                      }
                    </CardTitle>
                    
                    {/* ツールバー */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
                        <Button
                          variant={viewMode === 'side-by-side' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('side-by-side')}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          左右比較
                        </Button>
                        <Button
                          variant={viewMode === 'overlay' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('overlay')}
                          className="text-xs"
                        >
                          <EyeOff className="h-3 w-3 mr-1" />
                          オーバーレイ
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
                        <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <span className="text-xs px-2 text-gray-700">{zoom}%</span>
                        <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleRotate}>
                          <RotateCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {selectedSlideData && (
                    <CardDescription className="flex items-center gap-2">
                      {getChangeBadge(selectedSlideData.changeType)}
                      <span>{selectedSlideData.description}</span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedSlideData ? (
                    <div className="space-y-4">
                      {/* スライド表示エリア */}
                      <div 
                        className={`border rounded-lg bg-gray-50 min-h-96 overflow-hidden ${
                          viewMode === 'side-by-side' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 p-4' : 'relative p-4'
                        }`}
                      >
                        {viewMode === 'side-by-side' ? (
                          <>
                            {/* Before */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-700">変更前</h4>
                              <div 
                                className="border rounded bg-white h-64 flex items-center justify-center"
                                style={{ 
                                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                  transformOrigin: 'center'
                                }}
                              >
                                <span className="text-gray-500">スライド画像 (変更前)</span>
                              </div>
                            </div>
                            
                            {/* After */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-700">変更後</h4>
                              <div 
                                className="border rounded bg-white h-64 flex items-center justify-center"
                                style={{ 
                                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                  transformOrigin: 'center'
                                }}
                              >
                                <span className="text-gray-500">スライド画像 (変更後)</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Overlay mode */
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">オーバーレイ表示</h4>
                            <div 
                              className="border rounded bg-white h-64 flex items-center justify-center relative"
                              style={{ 
                                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                transformOrigin: 'center'
                              }}
                            >
                              <span className="text-gray-500">スライド画像 (差分オーバーレイ)</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* アクションボタン */}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => router.push(`/annotate/${params.id}?slide=${selectedSlideData.id}`)}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          注釈・コメントを追加
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      左側のリストからスライドを選択してください
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 