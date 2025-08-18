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
        z: 100
      },
      accuracy: 0.05,
      power: 3000,
      capacity: 1000
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
        z: 600
      },
      accuracy: 0.01,
      power: 15,
      capacity: 500
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
        z: 50
      },
      accuracy: 0.1,
      power: 500,
      capacity: 2000
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
  accuracy: 0,
  power: 0,
  capacity: 0,
  operatingHours: 0,
  lastMaintenance: '',
  nextMaintenance: '',
  location: '',
  status: 'active',
  acquisitionCost: 0,
  operatingCostPerHour: 0,
  depreciationRate: 0
};

export const useMachineDatabase = () => {
  const [activeTab, setActiveTab] = useState<DatabaseTab>('machines');
  const [machines, setMachines] = useState<Machine[]>(mockMachines);
  const [newMachine, setNewMachine] = useState<NewMachine>(initialNewMachine);
  const [filters, setFilters] = useState<MachineFilters>({
    searchQuery: '',
    selectedCategory: 'all',
    selectedStatus: 'all'
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
          z: newMachine.maxWorkSizeZ
        },
        accuracy: newMachine.accuracy,
        power: newMachine.power,
        capacity: newMachine.capacity
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
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(machines.map(m => m.category)));
  const statuses = Array.from(new Set(machines.map(m => m.operationalInfo.status)));

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
    handleAddMachine,
    handleDeleteMachine,
    handleUpdateFilters,
  };
}; 