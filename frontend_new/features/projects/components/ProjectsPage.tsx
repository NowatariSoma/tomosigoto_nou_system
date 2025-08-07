'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Badge } from '@/components/ui/feedback/badge';
import { FolderOpen, Search, Plus } from 'lucide-react';
import { useMobileSidebar } from '@/shared/hooks/useMobileSidebar';
import { TabsContainer } from '@/shared/components/layout/TabsContainer';
import { TabItem } from '@/shared/types/tabs';
import { useProjects } from '../hooks/useProjects';
import { ActiveProjectsTab, CompletedProjectsTab, AllProjectsTab } from './tabs';

export const ProjectsPage: React.FC = () => {
  const { isMobileSidebarOpen, handleMobileSidebarToggle, handleMobileSidebarClose } = useMobileSidebar();
  const { projects, activeProjects, completedProjects, stats, filters, updateFilters } = useProjects();
  const [activeTab, setActiveTab] = useState('active');

  const handleView = (id: string) => {
    console.log('View project:', id);
    // TODO: Navigate to project detail page
  };

  const handleEdit = (id: string) => {
    console.log('Edit project:', id);
    // TODO: Navigate to project edit page
  };

  const handleDelete = (id: string) => {
    if (confirm('このプロジェクトを削除しますか？')) {
      console.log('Delete project:', id);
      // TODO: Implement delete functionality
    }
  };

  const tabs: TabItem[] = [
    {
      value: 'active',
      label: `進行中プロジェクト (${stats.active})`,
      content: (
        <ActiveProjectsTab
          projects={activeProjects}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )
    },
    {
      value: 'completed',
      label: `完了プロジェクト (${stats.completed})`,
      content: (
        <CompletedProjectsTab
          projects={completedProjects}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )
    },
    {
      value: 'all',
      label: `全プロジェクト (${stats.total})`,
      content: (
        <AllProjectsTab
          projects={projects}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      
      <div className="flex flex-col min-h-screen md:pl-64">
        <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
        
        <main className="flex-1 w-full px-4 py-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <FolderOpen className="w-8 h-8 text-green-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    プロジェクト管理
                  </h1>
                  <p className="text-gray-600">
                    進行中の設計プロジェクトと履歴管理
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary">
                  総プロジェクト: {stats.total}件
                </Badge>
                <Badge variant="outline">
                  進行中: {stats.active}件
                </Badge>
                <Badge className="bg-green-100 text-green-800">
                  完了: {stats.completed}件
                </Badge>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="プロジェクト名または顧客名で検索..."
                  value={filters.searchQuery}
                  onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Select 
                value={filters.statusFilter} 
                onValueChange={(value) => updateFilters({ statusFilter: value as any })}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのステータス</SelectItem>
                  <SelectItem value="planning">計画中</SelectItem>
                  <SelectItem value="in-progress">進行中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="on-hold">保留</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新規プロジェクト
              </Button>
            </div>

            <TabsContainer
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabsContentClassName="space-y-6"
            />
          </div>
        </main>
      </div>
    </div>
  );
}; 