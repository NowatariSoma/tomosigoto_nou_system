'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EquipmentItem, CalculationParams, CalculationResult, TabValue } from '../types';

export const useEquipmentSelection = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>('laser');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [calculationParams, setCalculationParams] = useState<CalculationParams>({
    materialType: '',
    thickness: 0,
    cuttingSpeed: 0,
    powerRequirement: 0,
    throughput: 0
  });

  const [equipment, setEquipment] = useState<EquipmentItem[]>([
    {
      id: 'laser-001',
      name: 'ファイバーレーザ加工機 FL-3000',
      category: 'laser',
      specifications: {
        'レーザ出力': '3kW',
        '加工範囲': '1500×3000mm',
        '板厚対応': 'SS: 20mm, SUS: 12mm',
        '位置決め精度': '±0.05mm'
      },
      price: 25000000,
      manufacturer: 'レーザテック株式会社',
      selected: false
    },
    {
      id: 'laser-002',
      name: 'CO2レーザ加工機 CL-2500',
      category: 'laser',
      specifications: {
        'レーザ出力': '2.5kW',
        '加工範囲': '1250×2500mm',
        '板厚対応': 'SS: 15mm, SUS: 8mm',
        '位置決め精度': '±0.1mm'
      },
      price: 18000000,
      manufacturer: 'オプティカル工業',
      selected: false
    },
    {
      id: 'conveyor-001',
      name: 'ローラーコンベア RC-2000',
      category: 'conveyor',
      specifications: {
        '搬送能力': '500kg/m',
        '搬送速度': '5-50m/min',
        'ローラー径': 'φ60mm',
        '全長': '2000mm'
      },
      price: 800000,
      manufacturer: 'コンベア技研',
      selected: false
    },
    {
      id: 'conveyor-002',
      name: 'ベルトコンベア BC-3000',
      category: 'conveyor',
      specifications: {
        '搬送能力': '300kg/m',
        '搬送速度': '10-100m/min',
        'ベルト幅': '600mm',
        '全長': '3000mm'
      },
      price: 1200000,
      manufacturer: 'オートメーション',
      selected: false
    }
  ]);

  const handleEquipmentToggle = (id: string) => {
    setEquipment(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleCalculationParamChange = (field: keyof CalculationParams, value: number | string) => {
    setCalculationParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateRecommendations = () => {
    // TODO: Implement MCP/LLM calculation logic
    console.log('Calculating recommendations with params:', calculationParams);
    // This would call the backend calculation system
    
    // サンプル計算結果を設定
    setCalculationResult({
      optimalPower: '2.8kW',
      speed: '1200mm/min'
    });
  };

  const generatePartsList = () => {
    const selectedEquipment = equipment.filter(item => item.selected);
    const totalPrice = selectedEquipment.reduce((sum, item) => sum + item.price, 0);
    
    // TODO: Generate detailed parts list
    console.log('Generating parts list:', { selectedEquipment, totalPrice });
    router.push('/layout-design');
  };

  const getFilteredEquipment = (category: string) => {
    return equipment.filter(item => item.category === category);
  };

  const selectedCount = equipment.filter(item => item.selected).length;
  const totalPrice = equipment.filter(item => item.selected).reduce((sum, item) => sum + item.price, 0);

  return {
    activeTab,
    setActiveTab,
    calculationResult,
    calculationParams,
    equipment,
    selectedCount,
    totalPrice,
    handleEquipmentToggle,
    handleCalculationParamChange,
    calculateRecommendations,
    generatePartsList,
    getFilteredEquipment
  };
}; 