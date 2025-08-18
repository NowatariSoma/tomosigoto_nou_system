export type MCPTab = 'calculation' | 'jobs' | 'settings';

export type JobStatus = 'running' | 'completed' | 'failed' | 'queued';

export type JobType = 'physics' | 'optimization' | 'material';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface CalculationJob {
  id: string;
  name: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  startTime: string;
  duration?: string;
  result?: Record<string, any>;
}

export interface NewCalculation {
  name: string;
  type: string;
  parameters: string;
  priority: Priority;
}

export interface MCPSettings {
  endpoint: string;
  apiKey: string;
  maxJobs: number;
}

export interface MCPConnectionStatus {
  isConnected: boolean;
  lastConnected?: string;
  error?: string;
} 