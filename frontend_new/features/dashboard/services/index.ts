import { DashboardCard, ProjectStats } from '../types';

export const dashboardService = {
  getDashboardCards: (): DashboardCard[] => [
    {
      id: 'requirements',
      title: '要望ヒアリング',
      description: 'お客様の導入目的と要件を整理・洗い出し',
      icon: 'MessageSquare',
      route: '/requirements',
      difficulty: 'low',
      variant: 'default'
    },
    {
      id: 'equipment-selection',
      title: '機械選定',
      description: 'レーザ加工機・搬送システム等の部品選定',
      icon: 'Settings',
      route: '/equipment-selection',
      difficulty: 'medium',
      variant: 'outline'
    },
    {
      id: 'layout-design',
      title: 'レイアウト設計',
      description: '装置配置の最適化と簡易レイアウト図作成',
      icon: 'Layout',
      route: '/layout-design',
      difficulty: 'high',
      variant: 'outline'
    },
    {
      id: 'calculation',
      title: '背景計算システム',
      description: 'MCP/LLM連携による物理演算・部品計算',
      icon: 'Calculator',
      route: '/calculation',
      variant: 'outline',
      features: ['MCP連携', '材料DB']
    },
    {
      id: 'projects',
      title: 'プロジェクト管理',
      description: '進行中の設計プロジェクトと履歴管理',
      icon: 'FileText',
      route: '/projects',
      variant: 'outline'
    },
    {
      id: 'reports',
      title: '統計・レポート',
      description: 'システム利用状況と設計効率の分析',
      icon: 'BarChart3',
      route: '/reports'
    }
  ],

  getProjectStats: (): ProjectStats => ({
    completedProjects: 0,
    monthlyDesigns: 0,
    averageDesignTime: '-'
  })
}; 