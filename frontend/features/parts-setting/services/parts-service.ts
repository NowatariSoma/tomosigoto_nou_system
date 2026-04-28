import { fetchApi } from '../../../lib/api';

// Partsテーブルの型定義
export interface PartData {
  id: string;
  stageId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartRequest {
  stageId: string;
  name: string;
  description?: string;
}

export interface UpdatePartRequest extends Partial<CreatePartRequest> {}

export class PartsService {
  async getPartsByStageId(stageId: string): Promise<PartData[]> {
    const response = await fetchApi(`/parts/?stage_id=${stageId}`);
    const data = await response.json();
    return (data || []).map(this.mapPartResponseToPartData);
  }

  async getPart(id: string): Promise<PartData> {
    const response = await fetchApi(`/parts/${id}`);
    const data = await response.json();
    return this.mapPartResponseToPartData(data);
  }

  async createPart(data: CreatePartRequest): Promise<PartData> {
    const response = await fetchApi('/parts/', {
      method: 'POST',
      body: JSON.stringify({
        stage_id: data.stageId,
        name: data.name,
        description: data.description,
        status: 'active',
      }),
    });
    const result = await response.json();
    return this.mapPartResponseToPartData(result);
  }

  async createParts(parts: CreatePartRequest[]): Promise<PartData[]> {
    if (parts.length === 0) return [];
    const response = await fetchApi('/parts/bulk', {
      method: 'POST',
      body: JSON.stringify(parts.map(part => ({
        stage_id: part.stageId,
        name: part.name,
        description: part.description,
        status: 'active',
      }))),
    });
    const data = await response.json();
    return (data || []).map(this.mapPartResponseToPartData);
  }

  async updatePart(id: string, data: UpdatePartRequest): Promise<PartData> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const response = await fetchApi(`/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    const result = await response.json();
    return this.mapPartResponseToPartData(result);
  }

  async deletePart(id: string): Promise<void> {
    await fetchApi(`/parts/${id}`, { method: 'DELETE' });
  }

  async deletePartsByStageId(stageId: string): Promise<void> {
    await fetchApi(`/parts?stage_id=${stageId}`, { method: 'DELETE' });
  }

  async deleteParts(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await fetchApi('/parts/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  }

  async updatePartsStatusByStageId(stageId: string, status: 'active' | 'inactive'): Promise<void> {
    await fetchApi(`/parts/status?stage_id=${stageId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  private mapPartResponseToPartData(part: any): PartData {
    return {
      id: part.id,
      stageId: part.stage_id,
      name: part.name,
      description: part.description,
      status: part.status,
      createdAt: part.created_at,
      updatedAt: part.updated_at,
    };
  }
}

export const partsService = new PartsService();
