// Requirements feature types
export interface RequirementItem {
  id: string;
  category: 'purpose' | 'functional' | 'non-functional';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'confirmed' | 'completed';
}

export interface CustomerInfo {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  currentProcess: string;
  challenges: string;
  goals: string;
}

export interface NewRequirement {
  category: RequirementItem['category'];
  title: string;
  description: string;
  priority: RequirementItem['priority'];
}

export type RequirementStep = 'hearing' | 'requirements' | 'review'; 