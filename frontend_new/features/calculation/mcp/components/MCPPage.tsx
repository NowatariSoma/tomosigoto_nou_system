'use client';

import React from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { TabsContainer } from '@/shared/components/layout/TabsContainer';
import { Badge } from '@/components/ui/feedback/badge';
import { Calculator, Briefcase, Settings } from 'lucide-react';
import { TabItem } from '@/shared/types/tabs';
import { useMCP } from '../hooks/useMCP';
import { CalculationTab, JobsTab, SettingsTab } from './tabs';
import { MCPTab } from '../types';

export function MCPPage() {
  const {
    activeTab,
    setActiveTab,
    jobs,
    newCalculation,
    setNewCalculation,
    connectionStatus,
    settings,
    handleStartCalculation,
    handleStopJob,
    handleDeleteJob,
    handleUpdateSettings,
    handleTestConnection,
    getRunningJobsCount,
    getQueuedJobsCount,
    getCompletedJobsCount,
  } = useMCP();

  const tabs: TabItem[] = [
    {
      value: 'calculation',
      label: (
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          新規計算
        </div>
      ),
      content: (
        <CalculationTab
          newCalculation={newCalculation}
          setNewCalculation={setNewCalculation}
          onStartCalculation={handleStartCalculation}
        />
      )
    },
    {
      value: 'jobs',
      label: (
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          ジョブ管理
        </div>
      ),
      content: (
        <JobsTab
          jobs={jobs}
          onStopJob={handleStopJob}
          onDeleteJob={handleDeleteJob}
        />
      )
    },
    {
      value: 'settings',
      label: (
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          設定
        </div>
      ),
      content: (
        <SettingsTab
          settings={settings}
          connectionStatus={connectionStatus}
          onUpdateSettings={handleUpdateSettings}
          onTestConnection={handleTestConnection}
        />
      )
    }
  ];

  return (
    <AppTemplate
      title="MCP連携システム"
      description="物理演算・最適化計算・材料解析のための高度計算システム"
      maxWidth="7xl"
    >
      {/* 接続状態と統計情報 */}
      <div className="flex items-center gap-4 text-sm mb-8">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-gray-600">
            {connectionStatus.isConnected ? 'MCP接続中' : 'MCP切断'}
          </span>
        </div>
        <Badge variant="secondary">
          実行中ジョブ: {getRunningJobsCount()}件
        </Badge>
        <Badge variant="outline">
          待機中: {getQueuedJobsCount()}件
        </Badge>
        <Badge variant="outline">
          完了: {getCompletedJobsCount()}件
        </Badge>
      </div>

      <TabsContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as MCPTab)}
        tabsContentClassName="mt-6"
      />
    </AppTemplate>
  );
} 