'use client';

import React, { Dispatch, SetStateAction } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Textarea } from '@/components/ui/inputs/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Button } from '@/components/ui/forms/button';
import { Play, Zap } from 'lucide-react';
import { NewCalculation } from '../../types';

interface CalculationTabProps {
  newCalculation: NewCalculation;
  setNewCalculation: React.Dispatch<React.SetStateAction<NewCalculation>>;
  onStartCalculation: () => void;
}

export const CalculationTab: React.FC<CalculationTabProps> = ({
  newCalculation,
  setNewCalculation,
  onStartCalculation,
}) => {
  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" />
            新規計算実行
          </CardTitle>
          <CardDescription>
            MCP/LLMシステムに計算ジョブを送信します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calcName">計算名</Label>
              <Input
                id="calcName"
                value={newCalculation.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewCalculation(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="レーザ加工最適化"
              />
            </div>
            <div>
              <Label htmlFor="calcType">計算タイプ</Label>
              <Select 
                value={newCalculation.type} 
                onValueChange={(value) => 
                  setNewCalculation(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="計算タイプを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physics">物理演算</SelectItem>
                  <SelectItem value="optimization">最適化計算</SelectItem>
                  <SelectItem value="material">材料解析</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="parameters">計算パラメータ</Label>
            <Textarea
              id="parameters"
              value={newCalculation.parameters}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setNewCalculation(prev => ({ ...prev, parameters: e.target.value }))
              }
              placeholder="材料: SUS304, 板厚: 10mm, 目標速度: 1000mm/min"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="priority">優先度</Label>
            <Select 
              value={newCalculation.priority} 
              onValueChange={(value) => 
                setNewCalculation(prev => ({ ...prev, priority: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">低</SelectItem>
                <SelectItem value="normal">通常</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="urgent">緊急</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={onStartCalculation}
            disabled={!newCalculation.name || !newCalculation.type}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            計算を開始
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 