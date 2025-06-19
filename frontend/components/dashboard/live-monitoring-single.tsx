'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Badge } from '@/components/ui/feedback/badge';
import { WorkerCount, HELMET_LABELS } from '@/types/worker';
import { HardHat, Users, Camera, RefreshCw, Clock, Activity } from 'lucide-react';
import { camera } from '@/lib/api';

interface LiveMonitoringSingleProps {
  counts: WorkerCount;
  isLoading: boolean;
  onRefresh: () => void;
  cameraId: 1 | 2;
}

export function LiveMonitoringSingle({ counts, isLoading, onRefresh, cameraId }: LiveMonitoringSingleProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [hasInitialImage, setHasInitialImage] = useState(false); // 初回画像取得済みかどうか
  const [displayCounts, setDisplayCounts] = useState<WorkerCount>(counts); // 表示用の数字を管理

  // 数字が変更された場合のみ表示を更新
  useEffect(() => {
    // 数字が実際に変更された場合のみ更新（timestampは除外）
    if (
      displayCounts.red !== counts.red ||
      displayCounts.other !== counts.other ||
      displayCounts.no_helmet !== counts.no_helmet ||
      displayCounts.total !== counts.total
    ) {
      setDisplayCounts(counts);
    } else if (displayCounts.timestamp !== counts.timestamp) {
      // 数字は同じでtimestampのみ変更された場合は、timestampのみ更新
      setDisplayCounts(prev => ({ ...prev, timestamp: counts.timestamp }));
    }
  }, [counts]);

  const fetchImage = async () => {
    try {
      // Get new image URL (already a blob URL string)
      const newImageUrl = await camera.getAnnotatedFrame(cameraId);
      
      // Clean up previous URL
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }

      setImageUrl(newImageUrl);
      setImageError('');
      setHasInitialImage(true); // 初回画像取得完了
    } catch (err) {
      setImageError('カメラフィードの読み込みに失敗しました');
      console.error(`Error fetching image from camera ${cameraId}:`, err);
    }
  };

  useEffect(() => {
    // カメラIDが変更された時は初期状態をリセット
    setHasInitialImage(false);
    setImageError('');
    
    fetchImage();
    
    // Auto-refresh every 1 second (1000ms)
    const interval = setInterval(fetchImage, 1000);
    
    return () => {
      clearInterval(interval);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [cameraId]); // Re-fetch when camera changes

  const handleRefresh = () => {
    fetchImage();
    onRefresh();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const helmetData = [
    { 
      color: 'red', 
      label: HELMET_LABELS.red_helmet, 
      count: displayCounts.red, 
      bgColor: 'bg-red', 
      textColor: 'text-red-70',
      bgLight: 'bg-red-10'
    },
    { 
      color: 'other', 
      label: HELMET_LABELS.other_helmet, 
      count: displayCounts.other, 
      bgColor: 'bg-gray-40', 
      textColor: 'text-gray-70',
      bgLight: 'bg-gray-10'
    },
    { 
      color: 'no_helmet', 
      label: HELMET_LABELS.no_helmet, 
      count: displayCounts.no_helmet, 
      bgColor: 'bg-yellow', 
      textColor: 'text-yellow-70',
      bgLight: 'bg-yellow-10'
    }
  ];

  return (
    <div className="w-full animate-fade-in">
      {/* Status Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-70">カメラ{cameraId} - ライブ監視中</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-60">
              <Activity className="w-4 h-4" />
              <span>自動更新: 1秒間隔</span>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            手動更新
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="space-y-6">
        {/* Worker Count Cards - 横帯レイアウト */}
        <div>
          {/* Helmet Count Cards - 横並び */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {helmetData.map((helmet) => (
              <Card key={helmet.color} className="card-elevated-hover">
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center space-y-1">
                    <div className={`w-5 h-5 rounded-full ${helmet.bgColor}`}></div>
                    <span className="text-xs font-medium text-gray-70">{helmet.label}</span>
                    <div className={`px-2 py-1 rounded-full ${helmet.bgLight} ${helmet.textColor} font-semibold text-base`}>
                      {helmet.count}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Timestamp Card */}
            <Card className="card-elevated">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center space-y-1">
                  <Clock className="w-5 h-5 text-gray-50" />
                  <span className="text-xs font-medium text-gray-60">最終更新</span>
                  <p className="text-xs font-mono text-gray-80 bg-gray-10 px-2 py-1 rounded">
                    {formatTimestamp(displayCounts.timestamp)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Camera Feed */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-gray-80">
              <Camera className="h-5 w-5" />
              <span>カメラ{cameraId} - ライブフィード</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="relative h-[100vh] bg-gray-15 rounded-lg overflow-hidden shadow-soft">
              {!hasInitialImage && !imageUrl ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue border-t-transparent mb-4"></div>
                    <p className="text-gray-60">カメラ{cameraId}フィード読み込み中...</p>
                  </div>
                </div>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`カメラ${cameraId}ライブフィード`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : null}
              
              {/* エラー表示をオーバーレイとして表示（画像の上に重ねる） */}
              {imageError && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-500 bg-opacity-90 text-white text-sm px-3 py-2 rounded">
                  {imageError}
                  <Button onClick={fetchImage} variant="outline" size="sm" className="ml-2 text-xs">
                    再試行
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              最終更新: {new Date().toLocaleTimeString('ja-JP')} (1秒間隔で自動更新)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 