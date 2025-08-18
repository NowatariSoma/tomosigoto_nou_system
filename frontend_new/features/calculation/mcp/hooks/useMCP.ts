import { useState } from 'react';
import { MCPTab, CalculationJob, NewCalculation, MCPSettings, MCPConnectionStatus, JobType } from '../types';

const mockJobs: CalculationJob[] = [
  {
    id: 'job-001',
    name: 'レーザ加工最適化',
    type: 'optimization',
    status: 'completed',
    progress: 100,
    startTime: '2024-01-15 10:30',
    duration: '2分30秒',
    result: { optimalPower: '2.8kW', speed: '1200mm/min' }
  },
  {
    id: 'job-002',
    name: '材料強度解析',
    type: 'physics',
    status: 'running',
    progress: 65,
    startTime: '2024-01-15 11:15'
  },
  {
    id: 'job-003',
    name: 'コスト最適化',
    type: 'optimization',
    status: 'queued',
    progress: 0,
    startTime: '2024-01-15 11:45'
  }
];

const initialNewCalculation: NewCalculation = {
  name: '',
  type: '',
  parameters: '',
  priority: 'normal'
};

const initialSettings: MCPSettings = {
  endpoint: 'http://localhost:3000/mcp',
  apiKey: '',
  maxJobs: 3
};

export const useMCP = () => {
  const [activeTab, setActiveTab] = useState<MCPTab>('calculation');
  const [jobs, setJobs] = useState<CalculationJob[]>(mockJobs);
  const [newCalculation, setNewCalculation] = useState<NewCalculation>(initialNewCalculation);
  const [connectionStatus, setConnectionStatus] = useState<MCPConnectionStatus>({
    isConnected: true
  });
  const [settings, setSettings] = useState<MCPSettings>(initialSettings);

  const handleStartCalculation = () => {
    if (!newCalculation.name || !newCalculation.type) return;

    const newJob: CalculationJob = {
      id: `job-${Date.now()}`,
      name: newCalculation.name,
      type: newCalculation.type as JobType,
      status: 'queued',
      progress: 0,
      startTime: new Date().toLocaleString('ja-JP')
    };

    setJobs(prev => [...prev, newJob]);
    setNewCalculation(initialNewCalculation);
  };

  const handleStopJob = (jobId: string) => {
    setJobs(prev => 
      prev.map(job => 
        job.id === jobId ? { ...job, status: 'failed' as const } : job
      )
    );
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm('このジョブを削除しますか？')) {
      setJobs(prev => prev.filter(job => job.id !== jobId));
    }
  };

  const handleUpdateSettings = (newSettings: Partial<MCPSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleTestConnection = () => {
    // TODO: 実際のMCP接続テスト
    setConnectionStatus({
      isConnected: !connectionStatus.isConnected,
      lastConnected: new Date().toLocaleString('ja-JP')
    });
  };

  const getRunningJobsCount = () => jobs.filter(job => job.status === 'running').length;
  const getQueuedJobsCount = () => jobs.filter(job => job.status === 'queued').length;
  const getCompletedJobsCount = () => jobs.filter(job => job.status === 'completed').length;

  return {
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
  };
}; 