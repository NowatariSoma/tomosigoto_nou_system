// Reports feature types
export interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export interface ProjectData {
  month: string;
  completed: number;
  revenue: number;
  avgDays: number;
}

export interface EquipmentStats {
  category: string;
  count: number;
  percentage: number;
}

export interface ReportsData {
  statCards: StatCard[];
  projectData: ProjectData[];
  equipmentStats: EquipmentStats[];
}

export type DateRange = 'last7days' | 'last30days' | 'last90days' | 'lastyear';

export type ReportTab = 'overview' | 'projects' | 'equipment' | 'performance';