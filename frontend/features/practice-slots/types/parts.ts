export interface Part {
  id?: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PartCreate {
  name: string;
  display_name: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface PartUpdate {
  name?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}





