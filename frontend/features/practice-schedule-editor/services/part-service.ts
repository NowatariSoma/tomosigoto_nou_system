import { fetchApi } from '../../../lib/api';

export interface Part {
  id: string;
  name: string;
  stage_id: string;
  description?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export class PartService {
  private readonly basePath = '/parts';

  async getAllParts(): Promise<Part[]> {
    const response = await fetchApi(this.basePath);
    return await response.json();
  }
}

export const partService = new PartService();