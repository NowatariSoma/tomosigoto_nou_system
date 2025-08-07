export type DatabaseTab = 'machines' | 'add' | 'import';

export interface Machine {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  category: string;
  specifications: {
    maxWorkSize: {
      x: number;
      y: number;
      z: number;
      weight: number;
    };
    accuracy: {
      repeatability: number;
      positioning: number;
    };
    cycleTime: {
      value: number;
      unit: string;
    };
    power: number;
    capacity: number;
  };
  infrastructure: {
    requiredPower: number;
    requiredAir: number;
    voltage: string;
  };
  materials: string[];
  interface: {
    ioSpecification: string;
    communicationStandard: string;
    plcCompatibility: string;
  };
  operationalInfo: {
    operatingHours: number;
    lastMaintenance: string;
    nextMaintenance: string;
    location: string;
    status: 'active' | 'maintenance' | 'inactive';
  };
  costInfo: {
    acquisitionCost: number;
    operatingCostPerHour: number;
    depreciationRate: number;
  };
  implementationHistory: string;
  remarks: string;
  lastUpdated: string;
}

export interface NewMachine {
  name: string;
  model: string;
  manufacturer: string;
  category: string;
  maxWorkSizeX: number;
  maxWorkSizeY: number;
  maxWorkSizeZ: number;
  maxWorkWeight: number;
  repeatabilityAccuracy: number;
  positioningAccuracy: number;
  cycleTimeValue: number;
  cycleTimeUnit: string;
  power: number;
  capacity: number;
  requiredPower: number;
  requiredAir: number;
  voltage: string;
  materials: string[];
  ioSpecification: string;
  communicationStandard: string;
  plcCompatibility: string;
  operatingHours: number;
  lastMaintenance: string;
  nextMaintenance: string;
  location: string;
  status: 'active' | 'maintenance' | 'inactive';
  acquisitionCost: number;
  operatingCostPerHour: number;
  depreciationRate: number;
  implementationHistory: string;
  remarks: string;
}

export interface MachineFilters {
  searchQuery: string;
  selectedCategory: string;
  selectedStatus: string;
  selectedMaterial: string;
} 