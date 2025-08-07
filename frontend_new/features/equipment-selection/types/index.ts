// Equipment Selection feature types
export interface EquipmentItem {
  id: string;
  name: string;
  category: 'laser' | 'conveyor' | 'inspection' | 'peripheral';
  specifications: Record<string, string>;
  price: number;
  manufacturer: string;
  selected: boolean;
}

export interface CalculationParams {
  materialType: string;
  thickness: number;
  cuttingSpeed: number;
  powerRequirement: number;
  throughput: number;
}

export interface CalculationResult {
  optimalPower: string;
  speed: string;
}

export type EquipmentCategory = 'laser' | 'conveyor' | 'inspection' | 'peripheral';

export type TabValue = 'laser' | 'conveyor' | 'inspection' | 'peripheral'; 