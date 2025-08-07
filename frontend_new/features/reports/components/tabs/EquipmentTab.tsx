'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { EquipmentStats } from '../../types';

interface EquipmentTabProps {
  equipmentStats: EquipmentStats[];
}

export function EquipmentTab({ equipmentStats }: EquipmentTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>機器カテゴリ別統計</CardTitle>
            <CardDescription>選定された機器の分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {equipmentStats.map((equipment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{equipment.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${equipment.percentage}%` }} 
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{equipment.count}台</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>コスト効率分析</CardTitle>
            <CardDescription>予算対実績コスト</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-800">予算内完了</span>
                  <span className="text-lg font-bold text-green-600">75%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-yellow-800">予算超過</span>
                  <span className="text-lg font-bold text-yellow-600">25%</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '25%' }} />
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>平均コスト効率: <span className="font-medium">95.2%</span></p>
                <p>総削減コスト: <span className="font-medium text-green-600">¥12M</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 