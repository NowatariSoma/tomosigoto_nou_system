'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { TrendingUp, Target, Clock, DollarSign, Users } from 'lucide-react';
import { StatCard, ProjectData } from '../../types';

interface OverviewTabProps {
  statCards: Omit<StatCard, 'icon'>[];
  projectData: ProjectData[];
}

export function OverviewTab({ statCards, projectData }: OverviewTabProps) {
  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
    );
  };

  const fullStatCards: StatCard[] = [
    {
      ...statCards[0],
      icon: <Target className="w-5 h-5 text-green-600" />
    },
    {
      ...statCards[1],
      icon: <Clock className="w-5 h-5 text-blue-600" />
    },
    {
      ...statCards[2],
      icon: <DollarSign className="w-5 h-5 text-purple-600" />
    },
    {
      ...statCards[3],
      icon: <Users className="w-5 h-5 text-orange-600" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {fullStatCards.map((stat, index) => (
          <Card key={index} className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(stat.trend)}
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500">前期比</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 月次推移グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>プロジェクト完了数推移</CardTitle>
            <CardDescription>月別の完了プロジェクト数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between px-4">
              {projectData.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-blue-600 rounded-t w-12 mb-2"
                    style={{ height: `${data.completed * 20}px` }}
                  />
                  <span className="text-xs text-gray-600">{data.month.split('-')[1]}月</span>
                  <span className="text-xs font-medium">{data.completed}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>売上推移</CardTitle>
            <CardDescription>月別売上金額</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between px-4">
              {projectData.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-green-600 rounded-t w-12 mb-2"
                    style={{ height: `${(data.revenue / 1000000)}px` }}
                  />
                  <span className="text-xs text-gray-600">{data.month.split('-')[1]}月</span>
                  <span className="text-xs font-medium">¥{(data.revenue / 1000000)}M</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 