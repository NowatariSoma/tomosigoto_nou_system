import { useState } from 'react';
import { DatabaseTab, Machine, NewMachine, MachineFilters } from '../types';

const mockMachines: Machine[] = [
  {
    id: 'mach-001',
    name: 'レーザ加工機A',
    model: 'LC-3000',
    manufacturer: 'ファナック',
    category: 'レーザ加工機',
    specifications: {
      maxWorkSize: {
        x: 3000,
        y: 1500,
        z: 100,
        weight: 1000
      },
      accuracy: {
        repeatability: 0.02,
        positioning: 0.05
      },
      cycleTime: {
        value: 120,
        unit: '個/時間'
      },
      power: 3000,
      capacity: 1000
    },
    infrastructure: {
      requiredPower: 15,
      requiredAir: 0.7,
      voltage: '3相200V'
    },
    materials: ['鉄', 'ステンレス', 'アルミ'],
    interface: {
      ioSpecification: 'DI/DO 24V',
      communicationStandard: 'Ethernet/IP',
      plcCompatibility: 'FANUC-PLC対応'
    },
    operationalInfo: {
      operatingHours: 2400,
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-04-10',
      location: '工場A-1F',
      status: 'active'
    },
    costInfo: {
      acquisitionCost: 15000000,
      operatingCostPerHour: 800,
      depreciationRate: 0.1
    },
    implementationHistory: '自動車部品業界、精密機械業界での導入実績多数',
    remarks: 'メンテナンス性良好、5年保証、価格帯：中級',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'mach-002',
    name: 'CNC旋盤B',
    model: 'TL-200',
    manufacturer: 'オークマ',
    category: 'CNC旋盤',
    specifications: {
      maxWorkSize: {
        x: 400,
        y: 400,
        z: 600,
        weight: 500
      },
      accuracy: {
        repeatability: 0.005,
        positioning: 0.01
      },
      cycleTime: {
        value: 3.5,
        unit: '分/個'
      },
      power: 15,
      capacity: 500
    },
    infrastructure: {
      requiredPower: 20,
      requiredAir: 0.5,
      voltage: '3相400V'
    },
    materials: ['鉄', 'ステンレス', '銅', 'アルミ'],
    interface: {
      ioSpecification: 'DI/DO 24V',
      communicationStandard: 'PROFINET',
      plcCompatibility: 'Siemens PLC対応'
    },
    operationalInfo: {
      operatingHours: 3200,
      lastMaintenance: '2024-01-05',
      nextMaintenance: '2024-03-05',
      location: '工場B-2F',
      status: 'active'
    },
    costInfo: {
      acquisitionCost: 8000000,
      operatingCostPerHour: 600,
      depreciationRate: 0.08
    },
    implementationHistory: '航空宇宙業界、医療機器業界での導入実績',
    remarks: '高精度加工対応、3年保証、価格帯：高級',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'mach-003',
    name: 'プレス機C',
    model: 'PR-500',
    manufacturer: 'アマダ',
    category: 'プレス機',
    specifications: {
      maxWorkSize: {
        x: 2000,
        y: 1000,
        z: 50,
        weight: 2000
      },
      accuracy: {
        repeatability: 0.05,
        positioning: 0.1
      },
      cycleTime: {
        value: 300,
        unit: '個/時間'
      },
      power: 500,
      capacity: 2000
    },
    infrastructure: {
      requiredPower: 25,
      requiredAir: 0.8,
      voltage: '3相200V'
    },
    materials: ['鉄', 'ステンレス', 'アルミ', '銅'],
    interface: {
      ioSpecification: 'DI/DO 24V',
      communicationStandard: 'CC-Link',
      plcCompatibility: '三菱PLC対応'
    },
    operationalInfo: {
      operatingHours: 1800,
      lastMaintenance: '2023-12-20',
      nextMaintenance: '2024-02-20',
      location: '工場A-2F',
      status: 'maintenance'
    },
    costInfo: {
      acquisitionCost: 12000000,
      operatingCostPerHour: 500,
      depreciationRate: 0.12
    },
    implementationHistory: '板金業界、家電業界での導入実績',
    remarks: 'メンテナンス中、部品交換予定、価格帯：中級',
    lastUpdated: '2024-01-13'
  }
];

const initialNewMachine: NewMachine = {
  name: '',
  model: '',
  manufacturer: '',
  category: '',
  maxWorkSizeX: 0,
  maxWorkSizeY: 0,
  maxWorkSizeZ: 0,
  maxWorkWeight: 0,
  repeatabilityAccuracy: 0,
  positioningAccuracy: 0,
  cycleTimeValue: 0,
  cycleTimeUnit: '',
  power: 0,
  capacity: 0,
  requiredPower: 0,
  requiredAir: 0,
  voltage: '',
  materials: [],
  ioSpecification: '',
  communicationStandard: '',
  plcCompatibility: '',
  operatingHours: 0,
  lastMaintenance: '',
  nextMaintenance: '',
  location: '',
  status: 'active',
  acquisitionCost: 0,
  operatingCostPerHour: 0,
  depreciationRate: 0,
  implementationHistory: '',
  remarks: ''
};

export const useMachineDatabase = () => {
  const [activeTab, setActiveTab] = useState<DatabaseTab>('machines');
  const [machines, setMachines] = useState<Machine[]>(mockMachines);
  const [newMachine, setNewMachine] = useState<NewMachine>(initialNewMachine);
  const [filters, setFilters] = useState<MachineFilters>({
    searchQuery: '',
    selectedCategory: 'all',
    selectedStatus: 'all',
    selectedMaterial: 'all'
  });

  const handleAddMachine = () => {
    if (!newMachine.name || !newMachine.category) return;

    const machine: Machine = {
      id: `mach-${Date.now()}`,
      name: newMachine.name,
      model: newMachine.model,
      manufacturer: newMachine.manufacturer,
      category: newMachine.category,
      specifications: {
        maxWorkSize: {
          x: newMachine.maxWorkSizeX,
          y: newMachine.maxWorkSizeY,
          z: newMachine.maxWorkSizeZ,
          weight: newMachine.maxWorkWeight
        },
        accuracy: {
          repeatability: newMachine.repeatabilityAccuracy,
          positioning: newMachine.positioningAccuracy
        },
        cycleTime: {
          value: newMachine.cycleTimeValue,
          unit: newMachine.cycleTimeUnit
        },
        power: newMachine.power,
        capacity: newMachine.capacity
      },
      infrastructure: {
        requiredPower: newMachine.requiredPower,
        requiredAir: newMachine.requiredAir,
        voltage: newMachine.voltage
      },
      materials: newMachine.materials,
      interface: {
        ioSpecification: newMachine.ioSpecification,
        communicationStandard: newMachine.communicationStandard,
        plcCompatibility: newMachine.plcCompatibility
      },
      operationalInfo: {
        operatingHours: newMachine.operatingHours,
        lastMaintenance: newMachine.lastMaintenance,
        nextMaintenance: newMachine.nextMaintenance,
        location: newMachine.location,
        status: newMachine.status
      },
      costInfo: {
        acquisitionCost: newMachine.acquisitionCost,
        operatingCostPerHour: newMachine.operatingCostPerHour,
        depreciationRate: newMachine.depreciationRate
      },
      implementationHistory: newMachine.implementationHistory,
      remarks: newMachine.remarks,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setMachines(prev => [...prev, machine]);
    setNewMachine(initialNewMachine);
  };

  const handleDeleteMachine = (machineId: string) => {
    if (confirm('この機械設備を削除しますか？')) {
      setMachines(prev => prev.filter(machine => machine.id !== machineId));
    }
  };

  const handleUpdateFilters = (newFilters: Partial<MachineFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                         machine.category.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                         machine.manufacturer.toLowerCase().includes(filters.searchQuery.toLowerCase());
    const matchesCategory = filters.selectedCategory === 'all' || machine.category === filters.selectedCategory;
    const matchesStatus = filters.selectedStatus === 'all' || machine.operationalInfo.status === filters.selectedStatus;
    const matchesMaterial = filters.selectedMaterial === 'all' || machine.materials.includes(filters.selectedMaterial);
    return matchesSearch && matchesCategory && matchesStatus && matchesMaterial;
  });

  const categories = Array.from(new Set(machines.map(m => m.category)));
  const statuses = Array.from(new Set(machines.map(m => m.operationalInfo.status)));
  const materials = Array.from(new Set(machines.flatMap(m => m.materials)));

  return {
    activeTab,
    setActiveTab,
    machines,
    newMachine,
    setNewMachine,
    filters,
    filteredMachines,
    categories,
    statuses,
    materials,
    handleAddMachine,
    handleDeleteMachine,
    handleUpdateFilters,
  };
}; 