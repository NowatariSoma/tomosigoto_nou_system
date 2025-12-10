import { supabase } from '../../../lib/supabase';

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
  private readonly tableName = 'parts';

  async getPartsByStageId(stageId: string): Promise<PartData[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('stage_id', stageId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch parts: ${error.message}`);
    }

    return (data || []).map(this.mapPartResponseToPartData);
  }

  async getPart(id: string): Promise<PartData> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch part: ${error.message}`);
    }

    return this.mapPartResponseToPartData(data);
  }

  async createPart(data: CreatePartRequest): Promise<PartData> {
    const partData = {
      stage_id: data.stageId,
      name: data.name,
      description: data.description,
      status: 'active' as const,
    };

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(partData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create part: ${error.message}`);
    }

    return this.mapPartResponseToPartData(result);
  }

  async createParts(parts: CreatePartRequest[]): Promise<PartData[]> {
    if (parts.length === 0) return [];

    const partsData = parts.map(part => ({
      stage_id: part.stageId,
      name: part.name,
      description: part.description,
      status: 'active' as const,
    }));

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(partsData)
      .select();

    if (error) {
      throw new Error(`Failed to create parts: ${error.message}`);
    }

    return (data || []).map(this.mapPartResponseToPartData);
  }

  async updatePart(id: string, data: UpdatePartRequest): Promise<PartData> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update part: ${error.message}`);
    }

    return this.mapPartResponseToPartData(result);
  }

  async deletePart(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete part: ${error.message}`);
    }
  }

  async deletePartsByStageId(stageId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('stage_id', stageId);

    if (error) {
      throw new Error(`Failed to delete parts by stage ID: ${error.message}`);
    }
  }

  async deleteParts(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to delete parts: ${error.message}`);
    }
  }

  async updatePartsStatusByStageId(stageId: string, status: 'active' | 'inactive'): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ status })
      .eq('stage_id', stageId);

    if (error) {
      throw new Error(`Failed to update parts status by stage ID: ${error.message}`);
    }
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
