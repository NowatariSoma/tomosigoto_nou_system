export type DatabaseTab = 'materials' | 'add' | 'import';

export interface Material {
  id: string;
  name: string;
  category: string;
  density: number;
  meltingPoint: number;
  thermalConductivity: number;
  laserParameters: {
    power: number;
    speed: number;
    focus: number;
  };
  cost: number;
  supplier: string;
  lastUpdated: string;
}

export interface NewMaterial {
  name: string;
  category: string;
  density: number;
  meltingPoint: number;
  thermalConductivity: number;
  laserPower: number;
  laserSpeed: number;
  laserFocus: number;
  cost: number;
  supplier: string;
}

export interface MaterialFilters {
  searchQuery: string;
  selectedCategory: string;
} 