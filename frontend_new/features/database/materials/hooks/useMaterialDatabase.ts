import { useState } from 'react';
import { DatabaseTab, Material, NewMaterial, MaterialFilters } from '../types';

const mockMaterials: Material[] = [
  {
    id: 'mat-001',
    name: 'SUS304',
    category: 'ステンレス',
    density: 7.93,
    meltingPoint: 1400,
    thermalConductivity: 16.2,
    laserParameters: {
      power: 2800,
      speed: 1200,
      focus: 0
    },
    cost: 350,
    supplier: '材料商社A',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'mat-002',
    name: 'SS400',
    category: '炭素鋼',
    density: 7.85,
    meltingPoint: 1538,
    thermalConductivity: 51.9,
    laserParameters: {
      power: 2500,
      speed: 1500,
      focus: 0
    },
    cost: 120,
    supplier: '鉄鋼メーカーB',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'mat-003',
    name: 'A5052',
    category: 'アルミニウム',
    density: 2.68,
    meltingPoint: 607,
    thermalConductivity: 138,
    laserParameters: {
      power: 2000,
      speed: 2000,
      focus: -1
    },
    cost: 280,
    supplier: 'アルミ加工C',
    lastUpdated: '2024-01-13'
  }
];

const initialNewMaterial: NewMaterial = {
  name: '',
  category: '',
  density: 0,
  meltingPoint: 0,
  thermalConductivity: 0,
  laserPower: 0,
  laserSpeed: 0,
  laserFocus: 0,
  cost: 0,
  supplier: ''
};

export const useMaterialDatabase = () => {
  const [activeTab, setActiveTab] = useState<DatabaseTab>('materials');
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [newMaterial, setNewMaterial] = useState<NewMaterial>(initialNewMaterial);
  const [filters, setFilters] = useState<MaterialFilters>({
    searchQuery: '',
    selectedCategory: 'all'
  });

  const handleAddMaterial = () => {
    if (!newMaterial.name || !newMaterial.category) return;

    const material: Material = {
      id: `mat-${Date.now()}`,
      name: newMaterial.name,
      category: newMaterial.category,
      density: newMaterial.density,
      meltingPoint: newMaterial.meltingPoint,
      thermalConductivity: newMaterial.thermalConductivity,
      laserParameters: {
        power: newMaterial.laserPower,
        speed: newMaterial.laserSpeed,
        focus: newMaterial.laserFocus
      },
      cost: newMaterial.cost,
      supplier: newMaterial.supplier,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setMaterials(prev => [...prev, material]);
    setNewMaterial(initialNewMaterial);
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (confirm('この材料を削除しますか？')) {
      setMaterials(prev => prev.filter(material => material.id !== materialId));
    }
  };

  const handleUpdateFilters = (newFilters: Partial<MaterialFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                         material.category.toLowerCase().includes(filters.searchQuery.toLowerCase());
    const matchesCategory = filters.selectedCategory === 'all' || material.category === filters.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(materials.map(m => m.category)));

  return {
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
  };
}; 