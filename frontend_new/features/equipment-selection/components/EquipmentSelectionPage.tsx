'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Badge } from '@/components/ui/feedback/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Settings, Zap, Truck, ShoppingCart, Calculator, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { useEquipmentSelection } from '../hooks/useEquipmentSelection';
import { TabValue } from '../types';

export function EquipmentSelectionPage() {
  const {
    activeTab,
    setActiveTab,
    calculationResult,
    calculationParams,
    selectedCount,
    totalPrice,
    handleEquipmentToggle,
    handleCalculationParamChange,
    calculateRecommendations,
    generatePartsList,
    getFilteredEquipment
  } = useEquipmentSelection();

  return (
    <AppTemplate maxWidth="7xl">
      {/* カスタムヘッダー - 現在のレイアウトを保持 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              機械選定
            </h1>
            <p className="text-gray-600">
              レーザ加工機・搬送システム等の部品選定と自動計算
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="secondary">難易度: 中</Badge>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">選択済み: {selectedCount}件</span>
          </div>
          <div className="text-gray-600">
            合計見積額: ¥{totalPrice.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 計算パラメータ設定 */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border border-gray-200 sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                計算パラメータ
              </CardTitle>
              <CardDescription>
                MCP/LLM連携による自動計算
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="materialType">材料種別</Label>
                <Select 
                  value={calculationParams.materialType} 
                  onValueChange={(value) => handleCalculationParamChange('materialType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="材料を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ss400">SS400 (一般構造用鋼)</SelectItem>
                    <SelectItem value="sus304">SUS304 (ステンレス)</SelectItem>
                    <SelectItem value="aluminum">アルミニウム</SelectItem>
                    <SelectItem value="copper">銅</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="thickness">板厚 (mm)</Label>
                <Input
                  id="thickness"
                  type="number"
                  value={calculationParams.thickness}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleCalculationParamChange('thickness', parseFloat(e.target.value) || 0)
                  }
                  placeholder="10"
                />
              </div>
              
              <div>
                <Label htmlFor="throughput">目標スループット (個/時)</Label>
                <Input
                  id="throughput"
                  type="number"
                  value={calculationParams.throughput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleCalculationParamChange('throughput', parseFloat(e.target.value) || 0)
                  }
                  placeholder="100"
                />
              </div>
              
              <Button 
                onClick={calculateRecommendations}
                className="w-full"
                disabled={!calculationParams.materialType || !calculationParams.thickness}
              >
                <Calculator className="w-4 h-4 mr-2" />
                推奨機器を計算
              </Button>
            </CardContent>
          </Card>

          {/* 計算結果表示 */}
          {calculationResult && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  推奨レーザパラメータ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">出力:</span>
                    <span className="font-bold text-lg text-blue-600">{calculationResult.optimalPower}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">速度:</span>
                    <span className="font-bold text-lg text-blue-600">{calculationResult.speed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 機器選定タブ */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="laser" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                レーザ加工機
              </TabsTrigger>
              <TabsTrigger value="conveyor" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                搬送システム
              </TabsTrigger>
              <TabsTrigger value="inspection" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                検査装置
              </TabsTrigger>
              <TabsTrigger value="peripheral" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                周辺装置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="laser" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredEquipment('laser').map((item) => (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all ${
                      item.selected 
                        ? 'border-blue-50 bg-blue-10' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleEquipmentToggle(item.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription>{item.manufacturer}</CardDescription>
                        </div>
                        {item.selected && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {Object.entries(item.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">
                          ¥{item.price.toLocaleString()}
                        </span>
                        <Badge variant={item.selected ? "default" : "secondary"}>
                          {item.selected ? "選択済み" : "未選択"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="conveyor" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredEquipment('conveyor').map((item) => (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all ${
                      item.selected 
                        ? 'border-blue-50 bg-blue-10' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleEquipmentToggle(item.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription>{item.manufacturer}</CardDescription>
                        </div>
                        {item.selected && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {Object.entries(item.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">
                          ¥{item.price.toLocaleString()}
                        </span>
                        <Badge variant={item.selected ? "default" : "secondary"}>
                          {item.selected ? "選択済み" : "未選択"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="inspection" className="space-y-4">
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>検査装置のデータを準備中です</p>
              </div>
            </TabsContent>

            <TabsContent value="peripheral" className="space-y-4">
              <div className="text-center py-12 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>周辺装置のデータを準備中です</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 選択サマリーと次のステップ */}
      {selectedCount > 0 && (
        <div className="mt-8">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                選択サマリー
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedCount}件の機器を選択済み
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    合計見積額: ¥{totalPrice.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    部品リスト出力
                  </Button>
                  <Button onClick={generatePartsList}>
                    レイアウト設計へ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppTemplate>
  );
} 