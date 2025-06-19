'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { CameraFeed } from './camera-feed';
import { WorkerCount, HELMET_LABELS } from '@/types/worker';
import { HardHat, Users, Camera, RefreshCw, Clock, Activity } from 'lucide-react';

interface LiveMonitoringProps {
  camera1Counts: WorkerCount;
  camera2Counts: WorkerCount;
  isLoading: boolean;
  onRefresh: () => void;
  activeCamera: 1 | 2;
}

export function LiveMonitoring({ camera1Counts, camera2Counts, isLoading, onRefresh, activeCamera }: LiveMonitoringProps) {
  // 表示用の数字を管理（ちらつき防止）
  const [displayCamera1Counts, setDisplayCamera1Counts] = useState<WorkerCount>(camera1Counts);
  const [displayCamera2Counts, setDisplayCamera2Counts] = useState<WorkerCount>(camera2Counts);

  // カメラ1の数字が変更された場合のみ表示を更新
  useEffect(() => {
    // 数字が実際に変更された場合のみ更新（timestampは除外）
    if (
      displayCamera1Counts.red !== camera1Counts.red ||
      displayCamera1Counts.other !== camera1Counts.other ||
      displayCamera1Counts.no_helmet !== camera1Counts.no_helmet ||
      displayCamera1Counts.total !== camera1Counts.total
    ) {
      setDisplayCamera1Counts(camera1Counts);
    } else if (displayCamera1Counts.timestamp !== camera1Counts.timestamp) {
      // 数字は同じでtimestampのみ変更された場合は、timestampのみ更新
      setDisplayCamera1Counts(prev => ({ ...prev, timestamp: camera1Counts.timestamp }));
    }
  }, [camera1Counts]);

  // カメラ2の数字が変更された場合のみ表示を更新
  useEffect(() => {
    // 数字が実際に変更された場合のみ更新（timestampは除外）
    if (
      displayCamera2Counts.red !== camera2Counts.red ||
      displayCamera2Counts.other !== camera2Counts.other ||
      displayCamera2Counts.no_helmet !== camera2Counts.no_helmet ||
      displayCamera2Counts.total !== camera2Counts.total
    ) {
      setDisplayCamera2Counts(camera2Counts);
    } else if (displayCamera2Counts.timestamp !== camera2Counts.timestamp) {
      // 数字は同じでtimestampのみ変更された場合は、timestampのみ更新
      setDisplayCamera2Counts(prev => ({ ...prev, timestamp: camera2Counts.timestamp }));
    }
  }, [camera2Counts]);

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

  const getHelmetData = (counts: WorkerCount) => [
    { 
      color: 'red', 
      label: HELMET_LABELS.red_helmet, 
      count: counts.red, 
      bgColor: 'bg-red', 
      textColor: 'text-red-70',
      bgLight: 'bg-red-10'
    },
    { 
      color: 'other', 
      label: HELMET_LABELS.other_helmet, 
      count: counts.other, 
      bgColor: 'bg-gray-40', 
      textColor: 'text-gray-70',
      bgLight: 'bg-gray-10'
    },
    { 
      color: 'no_helmet', 
      label: HELMET_LABELS.no_helmet, 
      count: counts.no_helmet, 
      bgColor: 'bg-yellow', 
      textColor: 'text-yellow-70',
      bgLight: 'bg-yellow-10'
    }
  ];

  const CameraCountsCard = ({ cameraId, counts }: { cameraId: 1 | 2, counts: WorkerCount }) => {
    const helmetData = getHelmetData(counts);

    return (
      <div className="space-y-4">
        {/* Camera Header */}
        <div className="flex items-center space-x-2 mb-4">
          <Camera className="w-5 h-5 text-gray-60" />
          <h3 className="text-lg font-semibold text-gray-80">カメラ{cameraId}</h3>
          <div className={`w-2 h-2 rounded-full ${cameraId === activeCamera ? 'bg-green animate-pulse' : 'bg-gray-30'}`}></div>
        </div>

        {/* Helmet Count Cards - 横並び */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {helmetData.map((helmet) => (
            <Card key={helmet.color} className="card-elevated-hover">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center space-y-2">
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
              <div className="flex flex-col items-center text-center space-y-2">
                <Clock className="w-5 h-5 text-gray-50" />
                <span className="text-xs font-medium text-gray-60">最終更新</span>
                <p className="text-xs font-mono text-gray-80 bg-gray-10 px-1 py-1 rounded">
                  {formatTimestamp(counts.timestamp).replace(/\//g, '/').substring(5)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Status Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-70">複数カメラ - ライブ監視中</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-60">
              <Activity className="w-4 h-4" />
              <span>自動更新: 1秒間隔</span>
            </div>
          </div>
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            手動更新
          </Button>
        </div>
      </div>

      {/* Total Count Card for All Cameras */}
      <div className="mb-6">
        <Card className="card-elevated-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-60 mb-1">総作業員数（全カメラ）</p>
                <p className="text-3xl font-bold text-gray-80">
                  {displayCamera1Counts.total + displayCamera2Counts.total}
                </p>
                <p className="text-xs text-gray-50 mt-1">カメラ1: {displayCamera1Counts.total} + カメラ2: {displayCamera2Counts.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue to-blue-40 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - 2 columns for cameras with feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera 1 */}
        <div className="space-y-6">
          <CameraCountsCard cameraId={1} counts={displayCamera1Counts} />
          <CameraFeed cameraId={1} onRefresh={onRefresh} />
        </div>

        {/* Camera 2 */}
        <div className="space-y-6">
          <CameraCountsCard cameraId={2} counts={displayCamera2Counts} />
          <CameraFeed cameraId={2} onRefresh={onRefresh} />
        </div>
      </div>
    </div>
  );
} 