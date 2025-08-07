'use client';

import React, { Dispatch, SetStateAction } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Textarea } from '@/components/ui/inputs/textarea';
import { Button } from '@/components/ui/forms/button';
import { Plus } from 'lucide-react';
import { NewMaterial } from '../../types';

interface AddMaterialTabProps {
  newMaterial: NewMaterial;
  setNewMaterial: Dispatch<SetStateAction<NewMaterial>>;
  onAddMaterial: () => void;
}

export const AddMaterialTab: React.FC<AddMaterialTabProps> = ({
  newMaterial,
  setNewMaterial,
  onAddMaterial
}) => {
  const handleInputChange = (field: keyof NewMaterial, value: string | number) => {
    setNewMaterial(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>材料の基本的な情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">材料名 *</Label>
            <Input
              id="name"
              value={newMaterial.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="例: SUS304"
            />
          </div>
          
          <div>
            <Label htmlFor="category">カテゴリ *</Label>
            <Select 
              value={newMaterial.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ステンレス">ステンレス</SelectItem>
                <SelectItem value="炭素鋼">炭素鋼</SelectItem>
                <SelectItem value="アルミニウム">アルミニウム</SelectItem>
                <SelectItem value="銅">銅</SelectItem>
                <SelectItem value="チタン">チタン</SelectItem>
                <SelectItem value="その他">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="supplier">供給業者</Label>
            <Input
              id="supplier"
              value={newMaterial.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              placeholder="例: 材料商社A"
            />
          </div>
          
          <div>
            <Label htmlFor="cost">コスト (円/kg)</Label>
            <Input
              id="cost"
              type="number"
              value={newMaterial.cost}
              onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
              placeholder="例: 350"
            />
          </div>
        </CardContent>
      </Card>

      {/* 物性値 */}
      <Card>
        <CardHeader>
          <CardTitle>物性値</CardTitle>
          <CardDescription>材料の物理的特性を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="density">密度 (g/cm³)</Label>
            <Input
              id="density"
              type="number"
              step="0.01"
              value={newMaterial.density}
              onChange={(e) => handleInputChange('density', parseFloat(e.target.value) || 0)}
              placeholder="例: 7.93"
            />
          </div>
          
          <div>
            <Label htmlFor="meltingPoint">融点 (°C)</Label>
            <Input
              id="meltingPoint"
              type="number"
              value={newMaterial.meltingPoint}
              onChange={(e) => handleInputChange('meltingPoint', parseFloat(e.target.value) || 0)}
              placeholder="例: 1400"
            />
          </div>
          
          <div>
            <Label htmlFor="thermalConductivity">熱伝導率 (W/m·K)</Label>
            <Input
              id="thermalConductivity"
              type="number"
              step="0.1"
              value={newMaterial.thermalConductivity}
              onChange={(e) => handleInputChange('thermalConductivity', parseFloat(e.target.value) || 0)}
              placeholder="例: 16.2"
            />
          </div>
        </CardContent>
      </Card>

      {/* レーザ加工パラメータ */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>レーザ加工パラメータ</CardTitle>
          <CardDescription>推奨されるレーザ加工条件を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="laserPower">出力 (W)</Label>
              <Input
                id="laserPower"
                type="number"
                value={newMaterial.laserPower}
                onChange={(e) => handleInputChange('laserPower', parseFloat(e.target.value) || 0)}
                placeholder="例: 2800"
              />
            </div>
            
            <div>
              <Label htmlFor="laserSpeed">速度 (mm/min)</Label>
              <Input
                id="laserSpeed"
                type="number"
                value={newMaterial.laserSpeed}
                onChange={(e) => handleInputChange('laserSpeed', parseFloat(e.target.value) || 0)}
                placeholder="例: 1200"
              />
            </div>
            
            <div>
              <Label htmlFor="laserFocus">フォーカス (mm)</Label>
              <Input
                id="laserFocus"
                type="number"
                step="0.1"
                value={newMaterial.laserFocus}
                onChange={(e) => handleInputChange('laserFocus', parseFloat(e.target.value) || 0)}
                placeholder="例: 0"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button onClick={onAddMaterial} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              材料を追加
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 