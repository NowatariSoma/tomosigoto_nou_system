'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Badge } from '@/components/ui/feedback/badge';
import { Button } from '@/components/ui/forms/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/data-display/table';
import { Search, Edit, Trash2, Wrench, MapPin, Clock, AlertTriangle, Zap, Settings2, Factory } from 'lucide-react';
import { Machine, MachineFilters } from '../../types';

interface MachinesTabProps {
  filteredMachines: Machine[];
  filters: MachineFilters;
  categories: string[];
  statuses: string[];
  materials: string[];
  onUpdateFilters: (filters: Partial<MachineFilters>) => void;
  onDeleteMachine: (machineId: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-100 text-green-800">稼働中</Badge>;
    case 'maintenance':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">メンテナンス</Badge>;
    case 'inactive':
      return <Badge variant="default" className="bg-gray-100 text-gray-800">停止中</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const MachinesTab: React.FC<MachinesTabProps> = ({
  filteredMachines,
  filters,
  categories,
  statuses,
  materials,
  onUpdateFilters,
  onDeleteMachine,
}) => {
  return (
    <div className="space-y-6">
      {/* 検索・フィルター */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-600" />
            機械設備検索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">機械名・メーカー・カテゴリ検索</Label>
              <Input
                id="search"
                value={filters.searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onUpdateFilters({ searchQuery: e.target.value })
                }
                placeholder="レーザ加工機、ファナックなど"
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
            <div>
              <Label htmlFor="status">稼働状況フィルター</Label>
              <Select 
                value={filters.selectedStatus} 
                onValueChange={(value) => onUpdateFilters({ selectedStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === 'active' ? '稼働中' : status === 'maintenance' ? 'メンテナンス' : '停止中'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="material">対応素材フィルター</Label>
              <Select 
                value={filters.selectedMaterial} 
                onValueChange={(value) => onUpdateFilters({ selectedMaterial: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {materials.map(material => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 機械設備一覧 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {filteredMachines.map((machine) => (
          <Card key={machine.id} className="bg-white border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{machine.name}</CardTitle>
                {getStatusBadge(machine.operationalInfo.status)}
              </div>
              <CardDescription>
                {machine.model} - {machine.manufacturer}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant="outline">{machine.category}</Badge>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {machine.operationalInfo.location}
                  </div>
                </div>

                {/* 基本仕様 */}
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1">
                    <Settings2 className="w-3 h-3" />
                    基本仕様
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                    <div>
                      <span className="text-gray-500">加工サイズ:</span>
                      <div className="font-medium">
                        {machine.specifications.maxWorkSize.x} × {machine.specifications.maxWorkSize.y} × {machine.specifications.maxWorkSize.z} mm
                      </div>
                      <div className="font-medium">最大重量: {machine.specifications.maxWorkSize.weight}kg</div>
                    </div>
                    <div>
                      <span className="text-gray-500">精度:</span>
                      <div className="font-medium">繰返し: ±{machine.specifications.accuracy.repeatability}mm</div>
                      <div className="font-medium">位置決め: ±{machine.specifications.accuracy.positioning}mm</div>
                    </div>
                    <div>
                      <span className="text-gray-500">サイクルタイム:</span>
                      <div className="font-medium">{machine.specifications.cycleTime.value} {machine.specifications.cycleTime.unit}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">出力/容量:</span>
                      <div className="font-medium">{machine.specifications.power}W / {machine.specifications.capacity}kg</div>
                    </div>
                  </div>
                </div>

                {/* インフラ要件 */}
                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    インフラ要件
                  </h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>電力: {machine.infrastructure.requiredPower}kW ({machine.infrastructure.voltage})</div>
                    <div>エアー: {machine.infrastructure.requiredAir}MPa</div>
                  </div>
                </div>

                {/* 対応素材 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2">対応素材</h4>
                  <div className="flex flex-wrap gap-1">
                    {machine.materials.map((material, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* インターフェース */}
                <div className="bg-purple-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-1">
                    <Factory className="w-3 h-3" />
                    インターフェース
                  </h4>
                  <div className="text-xs text-purple-700 space-y-1">
                    <div>IO: {machine.interface.ioSpecification}</div>
                    <div>通信: {machine.interface.communicationStandard}</div>
                    <div>PLC: {machine.interface.plcCompatibility}</div>
                  </div>
                </div>

                {/* メンテナンス情報 */}
                <div className="bg-yellow-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    メンテナンス情報
                  </h4>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <div>稼働時間: {machine.operationalInfo.operatingHours}h</div>
                    <div>前回: {machine.operationalInfo.lastMaintenance}</div>
                    <div>次回: {machine.operationalInfo.nextMaintenance}</div>
                  </div>
                </div>
                
                {/* コスト情報 */}
                <div className="bg-green-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-green-800 mb-2">コスト情報</h4>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>取得価格: ¥{machine.costInfo.acquisitionCost.toLocaleString()}</div>
                    <div>運用コスト: ¥{machine.costInfo.operatingCostPerHour}/時間</div>
                  </div>
                </div>

                {/* 導入実績・備考 */}
                {(machine.implementationHistory || machine.remarks) && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">その他情報</h4>
                    <div className="text-xs text-gray-700 space-y-1">
                      {machine.implementationHistory && (
                        <div><span className="font-medium">導入実績:</span> {machine.implementationHistory}</div>
                      )}
                      {machine.remarks && (
                        <div><span className="font-medium">備考:</span> {machine.remarks}</div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  最終更新: {machine.lastUpdated}
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
                    onClick={() => onDeleteMachine(machine.id)}
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