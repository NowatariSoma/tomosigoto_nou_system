'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { TabsContainer } from '@/shared/components/layout/TabsContainer';
import { Button } from '@/components/ui/forms/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Badge } from '@/components/ui/feedback/badge';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { DateRange, ReportTab } from '../types';
import { TabItem } from '@/shared/types/tabs';
import { OverviewTab, ProjectsTab, EquipmentTab, PerformanceTab } from './tabs';

export function ReportsPage() {
  const {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    statCards,
    projectData,
    equipmentStats,
    getDateRangeLabel
  } = useReports();

  const tabs: TabItem[] = [
    {
      value: 'overview',
      label: '概要',
      content: <OverviewTab statCards={statCards} projectData={projectData} />
    },
    {
      value: 'projects',
      label: 'プロジェクト分析',
      content: <ProjectsTab />
    },
    {
      value: 'equipment',
      label: '機器統計',
      content: <EquipmentTab equipmentStats={equipmentStats} />
    },
    {
      value: 'performance',
      label: '効率分析',
      content: <PerformanceTab />
    }
  ];

  return (
    <AppTemplate
      title="統計・レポート"
      description="システム利用状況と設計効率の分析"
      maxWidth="7xl"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">
                期間: {getDateRangeLabel(dateRange)}
              </Badge>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                最終更新: 2024-01-15 12:00
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">過去7日</SelectItem>
                <SelectItem value="last30days">過去30日</SelectItem>
                <SelectItem value="last90days">過去90日</SelectItem>
                <SelectItem value="lastyear">過去1年</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              エクスポート
            </Button>
          </div>
        </div>
      </div>

      <TabsContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as ReportTab)}
        tabsContentClassName="space-y-6"
      />
    </AppTemplate>
  );
} 