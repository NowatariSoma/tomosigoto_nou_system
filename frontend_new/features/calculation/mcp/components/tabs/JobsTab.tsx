'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { Button } from '@/components/ui/forms/button';
import { Progress } from '@/components/ui/feedback/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/data-display/table';
import { Play, Square, Trash2, Clock, CheckCircle, AlertCircle, RotateCw, Download } from 'lucide-react';
import { CalculationJob, JobStatus } from '../../types';

interface JobsTabProps {
  jobs: CalculationJob[];
  onStopJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
}

export const JobsTab: React.FC<JobsTabProps> = ({
  jobs,
  onStopJob,
  onDeleteJob,
}) => {
  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'running':
        return <RotateCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: JobStatus) => {
    switch (status) {
      case 'running':
        return '実行中';
      case 'completed':
        return '完了';
      case 'failed':
        return '失敗';
      case 'queued':
        return '待機中';
      default:
        return '不明';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'physics':
        return '物理演算';
      case 'optimization':
        return '最適化';
      case 'material':
        return '材料解析';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="bg-white border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{job.name}</CardTitle>
              <div className="flex items-center gap-2">
                {getStatusIcon(job.status)}
                <Badge className={getStatusColor(job.status)}>
                  {getStatusLabel(job.status)}
                </Badge>
              </div>
            </div>
            <CardDescription>
              タイプ: {getTypeLabel(job.type)} | 
              開始時刻: {job.startTime}
              {job.duration && ` | 実行時間: ${job.duration}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {job.status === 'running' && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>進捗</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {job.result && (
              <div className="bg-white border border-gray-200 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-2">計算結果</h4>
                <div className="text-sm text-gray-700">
                  {Object.entries(job.result).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span className="font-medium">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              {job.status === 'running' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onStopJob(job.id)}
                >
                  <Square className="w-4 h-4 mr-2" />
                  停止
                </Button>
              )}
              {job.status === 'completed' && (
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  結果をダウンロード
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700"
                onClick={() => onDeleteJob(job.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 