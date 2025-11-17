import { supabase } from '../../../lib/supabase';

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
  private readonly tableName = 'stages';

  async getStages(): Promise<StageData[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('performance_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stages: ${error.message}`);
    }

    console.log('Fetched stages from DB:', data);
    return (data || []).map(this.mapStageResponseToStageData);
  }

  async getStage(id: string): Promise<StageData> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch stage: ${error.message}`);
    }

    return this.mapStageResponseToStageData(data);
  }

  async createStage(data: CreateStageRequest): Promise<StageData> {
    const stageData = {
      name: data.name,
      description: data.description,
      performance_date: data.performanceDate,
      status: data.status || 'active',
    };

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(stageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create stage: ${error.message}`);
    }

    return this.mapStageResponseToStageData(result);
  }

  async updateStage(id: string, data: UpdateStageRequest): Promise<StageData> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.performanceDate !== undefined) updateData.performance_date = data.performanceDate;
    if (data.status !== undefined) updateData.status = data.status;

    console.log('Updating stage with data:', updateData);

    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update stage: ${error.message}`);
    }

    console.log('Updated stage result:', result);
    return this.mapStageResponseToStageData(result);
  }

  async deleteStage(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete stage: ${error.message}`);
    }
  }

  private mapStageResponseToStageData(stage: any): StageData {
    console.log('Mapping stage data:', stage);
    const mapped = {
      id: stage.id,
      name: stage.name,
      description: stage.description,
      performanceDate: stage.performance_date,
      status: stage.status,
      createdAt: stage.created_at,
      updatedAt: stage.updated_at,
    };
    console.log('Mapped stage data:', mapped);
    return mapped;
  }
}

export const stagesService = new StagesService();