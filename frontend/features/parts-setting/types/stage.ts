export interface StageData {
  id: string;
  date: string;
  stageName: string;
  description?: string;
  status: 'active' | 'inactive';
  parts: string[];
  partCount: number;
}

export interface CreateStageRequest {
  date: string;
  stageName: string;
  description?: string;
  status: 'active' | 'inactive';
  parts: string[];
  partCount: number;
}

export interface UpdateStageRequest extends Partial<CreateStageRequest> {}
