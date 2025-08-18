import { useState, useMemo } from 'react';
import { Project, ProjectFilters, ProjectStats } from '../types';

// モックデータ
const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: '新工場レーザ加工ライン導入',
    customer: '株式会社製造A',
    status: 'in-progress',
    progress: 75,
    startDate: '2024-01-10',
    budget: 50000000,
    actualCost: 37500000,
    description: '自動車部品製造用のレーザ加工ラインの設計・導入プロジェクト',
    equipmentCount: 8,
    layoutCompleted: true
  },
  {
    id: 'proj-002',
    name: '精密部品加工システム',
    customer: '精密工業株式会社',
    status: 'planning',
    progress: 25,
    startDate: '2024-01-20',
    budget: 30000000,
    description: '電子部品用の高精度レーザ加工システムの導入',
    equipmentCount: 5,
    layoutCompleted: false
  },
  {
    id: 'proj-003',
    name: '建築材料加工ライン',
    customer: '建材メーカーB',
    status: 'completed',
    progress: 100,
    startDate: '2023-12-01',
    endDate: '2024-01-15',
    budget: 80000000,
    actualCost: 78000000,
    description: '大型建築材料の加工ライン構築',
    equipmentCount: 12,
    layoutCompleted: true
  }
];

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [filters, setFilters] = useState<ProjectFilters>({
    searchQuery: '',
    statusFilter: 'all'
  });

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                           project.customer.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const matchesStatus = filters.statusFilter === 'all' || project.status === filters.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, filters]);

  const activeProjects = useMemo(() => 
    projects.filter(p => p.status !== 'completed'), 
    [projects]
  );

  const completedProjects = useMemo(() => 
    projects.filter(p => p.status === 'completed'), 
    [projects]
  );

  const stats: ProjectStats = useMemo(() => ({
    total: projects.length,
    active: activeProjects.length,
    completed: completedProjects.length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    averageProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
  }), [projects, activeProjects, completedProjects]);

  const updateFilters = (newFilters: Partial<ProjectFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === id ? { ...project, ...updates } : project
      )
    );
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  return {
    projects: filteredProjects,
    allProjects: projects,
    activeProjects,
    completedProjects,
    stats,
    filters,
    updateFilters,
    addProject,
    updateProject,
    deleteProject,
  };
}; 