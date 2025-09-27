import { StageData, CreateStageRequest, UpdateStageRequest } from '../types';
import { mapStageResponseToStageData, mapCreateStageRequestToStage } from '../mappers';
import { supabase } from '../../../lib/supabase';

export class StageService {
  private readonly tableName = 'stages';

  async getStages(): Promise<StageData[]> {
    const { data, error } = await supabase
      .from('stages')
      .select(`
        id,
        name,
        performance_date,
        parts (
          id,
          name,
          member_assignments (
            user_id,
            category,
            display_order
          )
        )
      `)
      .eq('status', 'active')
      .order('performance_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stages: ${error.message}`);
    }

    return (data || []).map(mapStageResponseToStageData);
  }

  async getStage(id: string): Promise<StageData> {
    const { data, error } = await supabase
      .from('stages')
      .select(`
        id,
        name,
        performance_date,
        parts (
          id,
          name,
          member_assignments (
            user_id,
            category,
            display_order
          )
        )
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error) {
      throw new Error(`Failed to fetch stage: ${error.message}`);
    }

    return mapStageResponseToStageData(data);
  }

  async createStage(data: CreateStageRequest): Promise<StageData> {
    const stageData = mapCreateStageRequestToStage(data);
    
    // 1. 舞台を作成
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .insert(stageData)
      .select()
      .single();

    if (stageError) {
      throw new Error(`Failed to create stage: ${stageError.message}`);
    }

    // 2. パートを作成
    if (data.parts && data.parts.length > 0) {
      const partsData = data.parts.map(partName => ({
        stage_id: stage.id,
        name: partName,
        status: 'active'
      }));

      const { error: partsError } = await supabase
        .from('parts')
        .insert(partsData);

      if (partsError) {
        throw new Error(`Failed to create parts: ${partsError.message}`);
      }
    }

    // 3. 作成した舞台とパートを取得して返す
    return await this.getStage(stage.id);
  }

  async updateStage(id: string, data: UpdateStageRequest): Promise<StageData> {
    const stageData = mapCreateStageRequestToStage(data as CreateStageRequest);
    
    // 1. 舞台を更新
    const { error: stageError } = await supabase
      .from('stages')
      .update(stageData)
      .eq('id', id);

    if (stageError) {
      throw new Error(`Failed to update stage: ${stageError.message}`);
    }

    // 2. パートを更新（既存のパートを削除して新しく作成）
    if (data.parts && data.parts.length > 0) {
      // 既存のパートを削除
      const { error: deleteError } = await supabase
        .from('parts')
        .delete()
        .eq('stage_id', id);

      if (deleteError) {
        throw new Error(`Failed to delete existing parts: ${deleteError.message}`);
      }

      // 新しいパートを作成
      const partsData = data.parts.map(partName => ({
        stage_id: id,
        name: partName,
        status: 'active'
      }));

      const { error: partsError } = await supabase
        .from('parts')
        .insert(partsData);

      if (partsError) {
        throw new Error(`Failed to create new parts: ${partsError.message}`);
      }
    }

    // 3. 更新した舞台とパートを取得して返す
    return await this.getStage(id);
  }

  async deleteStage(id: string): Promise<void> {
    // 舞台を削除すると、関連するパートもCASCADEで削除される
    const { error } = await supabase
      .from('stages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete stage: ${error.message}`);
    }
  }
}

export const stageService = new StageService();
