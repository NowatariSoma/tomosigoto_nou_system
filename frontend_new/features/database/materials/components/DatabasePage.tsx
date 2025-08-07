'use client';

import React from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { TabsContainer } from '@/shared/components/layout/TabsContainer';
import { Badge } from '@/components/ui/feedback/badge';
import { List, Plus, Settings } from 'lucide-react';
import { TabItem } from '@/shared/types/tabs';
import { useMaterialDatabase } from '../hooks/useMaterialDatabase';
import { MaterialsTab, AddMaterialTab, DataManagementTab } from './tabs';

export const DatabasePage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    materials,
    newMaterial,
    setNewMaterial,
    filters,
    filteredMaterials,
    categories,
    handleAddMaterial,
    handleDeleteMaterial,
    handleUpdateFilters,
  } = useMaterialDatabase();

  const tabs: TabItem[] = [
    {
      value: 'materials',
      label: (
        <div className="flex items-center gap-2">
          <List className="w-4 h-4" />
          材料一覧
        </div>
      ),
      content: (
        <MaterialsTab
          filteredMaterials={filteredMaterials}
          filters={filters}
          categories={categories}
          onUpdateFilters={handleUpdateFilters}
          onDeleteMaterial={handleDeleteMaterial}
        />
      )
    },
    {
      value: 'add',
      label: (
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          材料追加
        </div>
      ),
      content: (
        <AddMaterialTab
          newMaterial={newMaterial}
          setNewMaterial={setNewMaterial}
          onAddMaterial={handleAddMaterial}
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
        <DataManagementTab materialCount={materials.length} />
      )
    }
  ];

  return (
    <AppTemplate
      title="材料データベース"
      description="材料の物性値と加工パラメータの管理システム"
      maxWidth="7xl"
    >
      {/* 統計情報 */}
      <div className="flex items-center gap-4 text-sm mb-8">
        <Badge variant="secondary">
          登録材料: {materials.length}種類
        </Badge>
        <Badge variant="outline">
          カテゴリ: {categories.length}分類
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