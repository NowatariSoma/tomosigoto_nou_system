'use client';

import { useState } from 'react';
import { StatCard, ProjectData, EquipmentStats, DateRange, ReportTab } from '../types';

export const useReports = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('last30days');

  const statCards: Omit<StatCard, 'icon'>[] = [
    {
      title: '完了プロジェクト数',
      value: '12',
      change: '+25%',
      trend: 'up'
    },
    {
      title: '平均設計時間',
      value: '18.5日',
      change: '-12%',
      trend: 'up'
    },
    {
      title: '総売上',
      value: '¥450M',
      change: '+18%',
      trend: 'up'
    },
    {
      title: 'アクティブユーザー',
      value: '8',
      change: '+2',
      trend: 'up'
    }
  ];

  const projectData: ProjectData[] = [
    { month: '2023-10', completed: 2, revenue: 80000000, avgDays: 22 },
    { month: '2023-11', completed: 3, revenue: 120000000, avgDays: 20 },
    { month: '2023-12', completed: 4, revenue: 150000000, avgDays: 18 },
    { month: '2024-01', completed: 3, revenue: 100000000, avgDays: 16 }
  ];

  const equipmentStats: EquipmentStats[] = [
    { category: 'レーザ加工機', count: 24, percentage: 40 },
    { category: '搬送システム', count: 18, percentage: 30 },
    { category: '検査装置', count: 12, percentage: 20 },
    { category: '周辺装置', count: 6, percentage: 10 }
  ];

  const getDateRangeLabel = (range: DateRange) => {
    switch (range) {
      case 'last7days': return '過去7日';
      case 'last30days': return '過去30日';
      case 'last90days': return '過去90日';
      case 'lastyear': return '過去1年';
      default: return '過去30日';
    }
  };

  return {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    statCards,
    projectData,
    equipmentStats,
    getDateRangeLabel
  };
};