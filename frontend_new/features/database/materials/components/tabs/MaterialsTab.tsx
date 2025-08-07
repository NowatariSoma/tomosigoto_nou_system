'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Badge } from '@/components/ui/feedback/badge';
import { Button } from '@/components/ui/forms/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/data-display/table';
import { Search, Edit, Trash2, Database } from 'lucide-react';
import { Material, MaterialFilters } from '../../types';

interface MaterialsTabProps {
  filteredMaterials: Material[];
  filters: MaterialFilters;
  categories: string[];
  onUpdateFilters: (filters: Partial<MaterialFilters>) => void;
  onDeleteMaterial: (materialId: string) => void;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({
  filteredMaterials,
  filters,
  categories,
  onUpdateFilters,
  onDeleteMaterial,
}) => {
  return (
    <div className="space-y-6">
      {/* 検索・フィルター */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-600" />
            材料検索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">材料名・カテゴリ検索</Label>
              <Input
                id="search"
                value={filters.searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onUpdateFilters({ searchQuery: e.target.value })
                }
                placeholder="SUS304, ステンレスなど"
              />
            </div>
            <div>
              <Label htmlFor="category">カテゴリフィルター</Label>
              <Select 
                value={filters.selectedCategory} 
                onValueChange={(value) => onUpdateFilters({ selectedCategory: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 材料一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => (
          <Card key={material.id} className="bg-white border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{material.name}</CardTitle>
                <Badge variant="outline">{material.category}</Badge>
              </div>
              <CardDescription>
                最終更新: {material.lastUpdated}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">密度:</span>
                    <span className="ml-1 font-medium">{material.density} g/cm³</span>
                  </div>
                  <div>
                    <span className="text-gray-500">融点:</span>
                    <span className="ml-1 font-medium">{material.meltingPoint}°C</span>
                  </div>
                  <div>
                    <span className="text-gray-500">熱伝導率:</span>
                    <span className="ml-1 font-medium">{material.thermalConductivity} W/mK</span>
                  </div>
                  <div>
                    <span className="text-gray-500">単価:</span>
                    <span className="ml-1 font-medium">¥{material.cost}/kg</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">推奨レーザパラメータ</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs text-blue-700">
                    <div>出力: {material.laserParameters.power}W</div>
                    <div>速度: {material.laserParameters.speed}mm/min</div>
                    <div>焦点: {material.laserParameters.focus}mm</div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  供給元: {material.supplier}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    編集
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onDeleteMaterial(material.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 