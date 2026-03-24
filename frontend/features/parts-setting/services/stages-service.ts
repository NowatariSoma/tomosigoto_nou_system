import { fetchApi } from '../../../lib/api';

// Stagesテーブルの型定義
export interface StageData {
  id: string;
  name: string;
  description?: string;
  performanceDate?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateStageRequest {
  name: string;
  description?: string;
  performanceDate?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateStageRequest extends Partial<CreateStageRequest> {}

export class StagesService {
  async getStages(): Promise<StageData[]> {
    const response = await fetchApi('/stages');
    const data = await response.json();
    return (data || []).map(this.mapStageResponseToStageData);
  }

  async getStage(id: string): Promise<StageData> {
    const response = await fetchApi(`/stages/${id}`);
    const data = await response.json();
    return this.mapStageResponseToStageData(data);
  }

  async createStage(data: CreateStageRequest): Promise<StageData> {
    const response = await fetchApi('/stages', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        performance_date: data.performanceDate,
        status: data.status || 'active',
      }),
    });
    const result = await response.json();
    return this.mapStageResponseToStageData(result);
  }

  async updateStage(id: string, data: UpdateStageRequest): Promise<StageData> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.performanceDate !== undefined) updateData.performance_date = data.performanceDate;
    if (data.status !== undefined) updateData.status = data.status;

    const response = await fetchApi(`/stages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    const result = await response.json();
    return this.mapStageResponseToStageData(result);
  }

  async deleteStage(id: string): Promise<void> {
    await fetchApi(`/stages/${id}`, { method: 'DELETE' });
  }

  private mapStageResponseToStageData(stage: any): StageData {
    const mapped = {
      id: stage.id,
      name: stage.name,
      description: stage.description,
      performanceDate: stage.performance_date,
      status: stage.status,
      createdAt: stage.created_at,
      updatedAt: stage.updated_at,
    };
    return mapped;
  }
}

export const stagesService = new StagesService();
