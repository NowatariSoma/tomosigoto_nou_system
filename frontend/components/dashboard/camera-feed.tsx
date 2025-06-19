'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Camera, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { camera } from '@/lib/api';

interface CameraFeedProps {
  cameraId: 1 | 2;
  onRefresh?: () => void;
}

export function CameraFeed({ cameraId, onRefresh }: CameraFeedProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasInitialImage, setHasInitialImage] = useState(false); // 初回画像取得済みかどうか
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchImage = async () => {
    try {
      // Get new image URL (already a blob URL string)
      const newImageUrl = await camera.getAnnotatedFrame(cameraId);
      
      // Clean up previous URL
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      
      setImageUrl(newImageUrl);
      setError('');
      setIsConnected(true);
      setHasInitialImage(true); // 初回画像取得完了
    } catch (err) {
      setError('画像の取得に失敗しました');
      setIsConnected(false);
      console.error(`Error fetching image from camera ${cameraId}:`, err);
    }
  };

  useEffect(() => {
    // カメラIDが変更された時は初期状態をリセット
    setHasInitialImage(false);
    setError('');
    
    // Initial fetch
    fetchImage();
    
    // Auto-refresh every 1 second (1000ms)
    intervalRef.current = setInterval(fetchImage, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [cameraId]);

  const handleRefresh = () => {
    fetchImage();
    onRefresh?.();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            カメラ{cameraId}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green" />
              ) : (
                <WifiOff className="h-4 w-4 text-red" />
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${
                isConnected 
                  ? 'bg-green-10 text-green-70' 
                  : 'bg-red-10 text-red-70'
              }`}>
                {isConnected ? '接続中' : '未接続'}
              </span>
            </div>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[60vh] bg-muted rounded-lg overflow-hidden">
          {!hasInitialImage && !imageUrl ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>カメラ{cameraId}に接続中...</p>
              </div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`カメラ${cameraId}のライブフィード`}
              className="w-full h-full object-cover"
              onError={() => setError('画像の読み込みに失敗しました')}
            />
          ) : null}
          
          {/* エラー表示をオーバーレイとして表示（画像の上に重ねる） */}
          {error && (
            <div className="absolute bottom-2 left-2 right-2 bg-red-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded">
              {error}
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          最終更新: {new Date().toLocaleTimeString('ja-JP')} (1秒間隔で自動更新)
        </div>
      </CardContent>
    </Card>
  );
}