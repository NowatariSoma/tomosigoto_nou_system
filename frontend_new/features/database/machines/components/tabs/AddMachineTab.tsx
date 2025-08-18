'use client';

import React, { Dispatch, SetStateAction, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Textarea } from '@/components/ui/inputs/textarea';
import { Button } from '@/components/ui/forms/button';
import { Badge } from '@/components/ui/feedback/badge';
import { Plus, Wrench, Settings2, Zap, Factory, X } from 'lucide-react';
import { NewMachine } from '../../types';

interface AddMachineTabProps {
  newMachine: NewMachine;
  setNewMachine: Dispatch<SetStateAction<NewMachine>>;
  onAddMachine: () => void;
}

export const AddMachineTab: React.FC<AddMachineTabProps> = ({
  newMachine,
  setNewMachine,
  onAddMachine
}) => {
  const [materialInput, setMaterialInput] = useState('');

  const handleInputChange = (field: keyof NewMachine, value: string | number | string[]) => {
    setNewMachine(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMaterial = () => {
    if (materialInput.trim() && !newMachine.materials.includes(materialInput.trim())) {
      handleInputChange('materials', [...newMachine.materials, materialInput.trim()]);
      setMaterialInput('');
    }
  };

  const handleRemoveMaterial = (material: string) => {
    handleInputChange('materials', newMachine.materials.filter(m => m !== material));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            基本情報
          </CardTitle>
          <CardDescription>機械設備の基本的な情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">機械名 *</Label>
            <Input
              id="name"
              value={newMachine.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="例: レーザ加工機A"
            />
          </div>
          
          <div>
            <Label htmlFor="model">型式</Label>
            <Input
              id="model"
              value={newMachine.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              placeholder="例: LC-3000"
            />
          </div>
          
          <div>
            <Label htmlFor="manufacturer">メーカー</Label>
            <Input
              id="manufacturer"
              value={newMachine.manufacturer}
              onChange={(e) => handleInputChange('manufacturer', e.target.value)}
              placeholder="例: ファナック"
            />
          </div>
          
          <div>
            <Label htmlFor="category">カテゴリ *</Label>
            <Select 
              value={newMachine.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="レーザ加工機">レーザ加工機</SelectItem>
                <SelectItem value="CNC旋盤">CNC旋盤</SelectItem>
                <SelectItem value="CNCフライス">CNCフライス</SelectItem>
                <SelectItem value="プレス機">プレス機</SelectItem>
                <SelectItem value="溶接機">溶接機</SelectItem>
                <SelectItem value="研削盤">研削盤</SelectItem>
                <SelectItem value="測定機">測定機</SelectItem>
                <SelectItem value="ロボット">ロボット</SelectItem>
                <SelectItem value="その他">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 仕様 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            仕様
          </CardTitle>
          <CardDescription>機械設備の技術仕様を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label htmlFor="maxWorkSizeX">最大加工サイズ X (mm)</Label>
              <Input
                id="maxWorkSizeX"
                type="number"
                value={newMachine.maxWorkSizeX}
                onChange={(e) => handleInputChange('maxWorkSizeX', parseFloat(e.target.value) || 0)}
                placeholder="3000"
              />
            </div>
            <div>
              <Label htmlFor="maxWorkSizeY">Y (mm)</Label>
              <Input
                id="maxWorkSizeY"
                type="number"
                value={newMachine.maxWorkSizeY}
                onChange={(e) => handleInputChange('maxWorkSizeY', parseFloat(e.target.value) || 0)}
                placeholder="1500"
              />
            </div>
            <div>
              <Label htmlFor="maxWorkSizeZ">Z (mm)</Label>
              <Input
                id="maxWorkSizeZ"
                type="number"
                value={newMachine.maxWorkSizeZ}
                onChange={(e) => handleInputChange('maxWorkSizeZ', parseFloat(e.target.value) || 0)}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="maxWorkWeight">最大重量 (kg)</Label>
              <Input
                id="maxWorkWeight"
                type="number"
                value={newMachine.maxWorkWeight}
                onChange={(e) => handleInputChange('maxWorkWeight', parseFloat(e.target.value) || 0)}
                placeholder="1000"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="repeatabilityAccuracy">繰返し精度 (mm)</Label>
              <Input
                id="repeatabilityAccuracy"
                type="number"
                step="0.001"
                value={newMachine.repeatabilityAccuracy}
                onChange={(e) => handleInputChange('repeatabilityAccuracy', parseFloat(e.target.value) || 0)}
                placeholder="0.02"
              />
            </div>
            <div>
              <Label htmlFor="positioningAccuracy">位置決め精度 (mm)</Label>
              <Input
                id="positioningAccuracy"
                type="number"
                step="0.001"
                value={newMachine.positioningAccuracy}
                onChange={(e) => handleInputChange('positioningAccuracy', parseFloat(e.target.value) || 0)}
                placeholder="0.05"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cycleTimeValue">サイクルタイム</Label>
              <Input
                id="cycleTimeValue"
                type="number"
                value={newMachine.cycleTimeValue}
                onChange={(e) => handleInputChange('cycleTimeValue', parseFloat(e.target.value) || 0)}
                placeholder="120"
              />
            </div>
            <div>
              <Label htmlFor="cycleTimeUnit">単位</Label>
              <Select 
                value={newMachine.cycleTimeUnit} 
                onValueChange={(value) => handleInputChange('cycleTimeUnit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="単位を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="個/時間">個/時間</SelectItem>
                  <SelectItem value="分/個">分/個</SelectItem>
                  <SelectItem value="秒/個">秒/個</SelectItem>
                  <SelectItem value="個/分">個/分</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="power">出力 (W)</Label>
              <Input
                id="power"
                type="number"
                value={newMachine.power}
                onChange={(e) => handleInputChange('power', parseFloat(e.target.value) || 0)}
                placeholder="3000"
              />
            </div>
            <div>
              <Label htmlFor="capacity">容量 (kg)</Label>
              <Input
                id="capacity"
                type="number"
                value={newMachine.capacity}
                onChange={(e) => handleInputChange('capacity', parseFloat(e.target.value) || 0)}
                placeholder="1000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* インフラ要件 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            インフラ要件
          </CardTitle>
          <CardDescription>設備インフラの要件を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="requiredPower">必要電力 (kW)</Label>
            <Input
              id="requiredPower"
              type="number"
              value={newMachine.requiredPower}
              onChange={(e) => handleInputChange('requiredPower', parseFloat(e.target.value) || 0)}
              placeholder="15"
            />
          </div>
          
          <div>
            <Label htmlFor="requiredAir">必要エアー (MPa)</Label>
            <Input
              id="requiredAir"
              type="number"
              step="0.1"
              value={newMachine.requiredAir}
              onChange={(e) => handleInputChange('requiredAir', parseFloat(e.target.value) || 0)}
              placeholder="0.7"
            />
          </div>
          
          <div>
            <Label htmlFor="voltage">電圧仕様</Label>
            <Select 
              value={newMachine.voltage} 
              onValueChange={(value) => handleInputChange('voltage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="電圧を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3相200V">3相200V</SelectItem>
                <SelectItem value="3相400V">3相400V</SelectItem>
                <SelectItem value="単相100V">単相100V</SelectItem>
                <SelectItem value="単相200V">単相200V</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 対応素材 */}
      <Card>
        <CardHeader>
          <CardTitle>対応素材</CardTitle>
          <CardDescription>加工可能な素材を追加してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={materialInput}
              onChange={(e) => setMaterialInput(e.target.value)}
              placeholder="例: 鉄、ステンレス、アルミ"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMaterial();
                }
              }}
            />
            <Button type="button" onClick={handleAddMaterial} variant="outline">
              追加
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {newMachine.materials.map((material, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {material}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => handleRemoveMaterial(material)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* インターフェース */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            インターフェース
          </CardTitle>
          <CardDescription>通信・制御インターフェースを入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ioSpecification">IO仕様</Label>
            <Input
              id="ioSpecification"
              value={newMachine.ioSpecification}
              onChange={(e) => handleInputChange('ioSpecification', e.target.value)}
              placeholder="例: DI/DO 24V"
            />
          </div>
          
          <div>
            <Label htmlFor="communicationStandard">通信規格</Label>
            <Select 
              value={newMachine.communicationStandard} 
              onValueChange={(value) => handleInputChange('communicationStandard', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="通信規格を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ethernet/IP">Ethernet/IP</SelectItem>
                <SelectItem value="PROFINET">PROFINET</SelectItem>
                <SelectItem value="CC-Link">CC-Link</SelectItem>
                <SelectItem value="Modbus TCP">Modbus TCP</SelectItem>
                <SelectItem value="DeviceNet">DeviceNet</SelectItem>
                <SelectItem value="その他">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="plcCompatibility">PLC対応</Label>
            <Input
              id="plcCompatibility"
              value={newMachine.plcCompatibility}
              onChange={(e) => handleInputChange('plcCompatibility', e.target.value)}
              placeholder="例: FANUC-PLC対応"
            />
          </div>
        </CardContent>
      </Card>

      {/* 運用情報 */}
      <Card>
        <CardHeader>
          <CardTitle>運用情報</CardTitle>
          <CardDescription>機械設備の運用に関する情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="operatingHours">稼働時間 (時間)</Label>
            <Input
              id="operatingHours"
              type="number"
              value={newMachine.operatingHours}
              onChange={(e) => handleInputChange('operatingHours', parseFloat(e.target.value) || 0)}
              placeholder="2400"
            />
          </div>
          
          <div>
            <Label htmlFor="lastMaintenance">前回メンテナンス日</Label>
            <Input
              id="lastMaintenance"
              type="date"
              value={newMachine.lastMaintenance}
              onChange={(e) => handleInputChange('lastMaintenance', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="nextMaintenance">次回メンテナンス予定日</Label>
            <Input
              id="nextMaintenance"
              type="date"
              value={newMachine.nextMaintenance}
              onChange={(e) => handleInputChange('nextMaintenance', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="location">設置場所</Label>
            <Input
              id="location"
              value={newMachine.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="例: 工場A-1F"
            />
          </div>
          
          <div>
            <Label htmlFor="status">稼働状況</Label>
            <Select 
              value={newMachine.status} 
              onValueChange={(value) => handleInputChange('status', value as 'active' | 'maintenance' | 'inactive')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">稼働中</SelectItem>
                <SelectItem value="maintenance">メンテナンス</SelectItem>
                <SelectItem value="inactive">停止中</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* コスト情報 */}
      <Card>
        <CardHeader>
          <CardTitle>コスト情報</CardTitle>
          <CardDescription>機械設備のコストに関する情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="acquisitionCost">取得価格 (円)</Label>
            <Input
              id="acquisitionCost"
              type="number"
              value={newMachine.acquisitionCost}
              onChange={(e) => handleInputChange('acquisitionCost', parseFloat(e.target.value) || 0)}
              placeholder="15000000"
            />
          </div>
          
          <div>
            <Label htmlFor="operatingCostPerHour">運用コスト (円/時間)</Label>
            <Input
              id="operatingCostPerHour"
              type="number"
              value={newMachine.operatingCostPerHour}
              onChange={(e) => handleInputChange('operatingCostPerHour', parseFloat(e.target.value) || 0)}
              placeholder="800"
            />
          </div>
          
          <div>
            <Label htmlFor="depreciationRate">減価償却率</Label>
            <Input
              id="depreciationRate"
              type="number"
              step="0.01"
              value={newMachine.depreciationRate}
              onChange={(e) => handleInputChange('depreciationRate', parseFloat(e.target.value) || 0)}
              placeholder="0.1"
            />
          </div>
        </CardContent>
      </Card>

      {/* その他情報 */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>その他情報</CardTitle>
          <CardDescription>導入実績や備考などの追加情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="implementationHistory">導入実績</Label>
            <Textarea
              id="implementationHistory"
              value={newMachine.implementationHistory}
              onChange={(e) => handleInputChange('implementationHistory', e.target.value)}
              placeholder="例: 自動車部品業界、精密機械業界での導入実績多数"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="remarks">備考</Label>
            <Textarea
              id="remarks"
              value={newMachine.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              placeholder="例: メンテナンス性良好、5年保証、価格帯：中級"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end mt-6">
            <Button onClick={onAddMachine} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              機械設備を追加
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 