'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { 
  MessageSquare, 
  Settings, 
  Layout, 
  Calculator, 
  FileText, 
  BarChart3, 
  Cpu, 
  Database 
} from 'lucide-react';
import { DashboardCard as DashboardCardType } from '../types';

const iconMap = {
  MessageSquare,
  Settings,
  Layout,
  Calculator,
  FileText,
  BarChart3,
  Cpu,
  Database
};

const difficultyColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600'
};

const difficultyLabels = {
  low: '低',
  medium: '中',
  high: '高'
};

const iconColors = {
  MessageSquare: 'text-blue-600',
  Settings: 'text-orange-600',
  Layout: 'text-red-600',
  Calculator: 'text-purple-600',
  FileText: 'text-green-600',
  BarChart3: 'text-indigo-600',
  Cpu: 'text-purple-500',
  Database: 'text-purple-500'
};

interface DashboardCardProps {
  card: DashboardCardType;
}

export function DashboardCard({ card }: DashboardCardProps) {
  const router = useRouter();
  const IconComponent = iconMap[card.icon as keyof typeof iconMap];
  const iconColor = iconColors[card.icon as keyof typeof iconColors] || 'text-gray-600';

  const handleClick = () => {
    if (card.route) {
      router.push(card.route);
    }
  };

  const isClickable = !!card.route;

  return (
    <Card 
      className={`bg-white border border-gray-200 ${isClickable ? 'hover-card cursor-pointer' : ''}`}
      onClick={isClickable ? handleClick : undefined}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {IconComponent && <IconComponent className={`h-5 w-5 ${iconColor}`} />}
          {card.title}
        </CardTitle>
        <CardDescription>
          {card.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {card.variant === 'default' ? (
          <Button className="w-full">
            {card.id === 'requirements' ? '新しいヒアリングを開始' : 'スタート'}
          </Button>
        ) : card.id === 'reports' ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">完了プロジェクト</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">今月の設計数</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">平均設計時間</span>
              <span className="font-semibold">-</span>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full">
            {card.id === 'equipment-selection' ? '部品選定を開始' : 
             card.id === 'layout-design' ? 'レイアウト設計' :
             card.id === 'calculation' ? '計算システム' :
             card.id === 'projects' ? 'プロジェクト一覧' : 'スタート'}
          </Button>
        )}
        
        {card.difficulty && (
          <div className="mt-3 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>難易度：</span>
              <span className={`font-medium ${difficultyColors[card.difficulty]}`}>
                {difficultyLabels[card.difficulty]}
              </span>
            </div>
          </div>
        )}
        
        {card.features && (
          <div className="mt-3 space-y-1">
            {card.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {feature === 'MCP連携' ? (
                  <Cpu className="h-3 w-3 text-purple-500" />
                ) : (
                  <Database className="h-3 w-3 text-purple-500" />
                )}
                <span className="text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 