'use client';

import React from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { TabsContainer } from '@/shared/components/layout/TabsContainer';
import { Badge } from '@/components/ui/feedback/badge';
import { List, Plus, Settings, Wrench } from 'lucide-react';
import { TabItem } from '@/shared/types/tabs';
import { useMachineDatabase } from '../hooks/useMachineDatabase';
import { MachinesTab, AddMachineTab, DataManagementTab } from './tabs';

export const DatabasePage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    machines,
    newMachine,
    setNewMachine,
    filters,
    filteredMachines,
    categories,
    statuses,
    materials,
    handleAddMachine,
    handleDeleteMachine,
    handleUpdateFilters,
  } = useMachineDatabase();

  const tabs: TabItem[] = [
    {
      value: 'machines',
      label: (
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          機械一覧
        </div>
      ),
      content: (
        <MachinesTab
          filteredMachines={filteredMachines}
          filters={filters}
          categories={categories}
          statuses={statuses}
          materials={materials}
          onUpdateFilters={handleUpdateFilters}
          onDeleteMachine={handleDeleteMachine}
        />
      )
    },
    {
      value: 'add',
      label: (
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          機械追加
        </div>
      ),
      content: (
        <AddMachineTab
          newMachine={newMachine}
          setNewMachine={setNewMachine}
          onAddMachine={handleAddMachine}
        />
      )
    },
    {
      value: 'import',
      label: (
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          データ管理
        </div>
      ),
      content: (
        <DataManagementTab machineCount={machines.length} />
      )
    }
  ];

  const activeMachines = machines.filter(m => m.operationalInfo.status === 'active').length;
  const maintenanceMachines = machines.filter(m => m.operationalInfo.status === 'maintenance').length;

  return (
    <AppTemplate
      title="機械設備データベース"
      description="機械設備の仕様と運用情報の管理システム"
      maxWidth="7xl"
    >
      {/* 統計情報 */}
      <div className="flex items-center gap-4 text-sm mb-8">
        <Badge variant="secondary">
          登録機械: {machines.length}台
        </Badge>
        <Badge variant="outline">
          カテゴリ: {categories.length}分類
        </Badge>
        <Badge variant="outline">
          対応素材: {materials.length}種類
        </Badge>
        <Badge variant="default" className="bg-green-100 text-green-800">
          稼働中: {activeMachines}台
        </Badge>
        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
          メンテナンス: {maintenanceMachines}台
        </Badge>
      </div>

      <TabsContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as any)}
        tabsContentClassName="mt-6"
      />
    </AppTemplate>
  );
}; 