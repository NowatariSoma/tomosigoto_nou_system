import { BaseEntity, Status } from '@/shared/types/common';

export interface Project extends BaseEntity {
  name: string;
  customer: string;
  status: Status;
  progress: number;
  startDate: string;
  endDate?: string;
  budget: number;
  actualCost?: number;
  description: string;
  equipmentCount: number;
  layoutCompleted: boolean;
}

export interface ProjectFilters {
  searchQuery: string;
  statusFilter: Status | 'all';
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  totalBudget: number;
  averageProgress: number;
} 