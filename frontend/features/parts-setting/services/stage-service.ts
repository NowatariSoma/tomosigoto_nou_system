import { StageData, CreateStageRequest, UpdateStageRequest } from '../types';
import { mapStageResponseToStageData, mapCreateStageRequestToStage } from '../mappers';
import { fetchApi } from '../../../lib/api';

export class StageService {
  async getStages(): Promise<StageData[]> {
    const response = await fetchApi('/stages/?status=active&include_parts=true&include_assignments=true');
    const data = await response.json();
    return (data || []).map(mapStageResponseToStageData);
  }

  async getStage(id: string): Promise<StageData> {
    const response = await fetchApi(`/stages/${id}?include_parts=true&include_assignments=true`);
    const data = await response.json();
    return mapStageResponseToStageData(data);
  }

  async createStage(data: CreateStageRequest): Promise<StageData> {
    const stageData = mapCreateStageRequestToStage(data);

    // 1. 舞台を作成（パート情報も含めて送信）
    const response = await fetchApi('/stages/', {
      method: 'POST',
      body: JSON.stringify({
        ...stageData,
        parts: data.parts || [],
      }),
    });
    const stage = await response.json();

    // 2. 作成した舞台とパートを取得して返す
    return await this.getStage(stage.id);
  }

  async updateStage(id: string, data: UpdateStageRequest): Promise<StageData> {
    const stageData = mapCreateStageRequestToStage(data as CreateStageRequest);

    // 舞台とパートをまとめて更新
    await fetchApi(`/stages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...stageData,
        parts: data.parts || [],
      }),
    });

    // 更新した舞台とパートを取得して返す
    return await this.getStage(id);
  }

  async deleteStage(id: string): Promise<void> {
    // 舞台を削除すると、関連するパートもCASCADEで削除される
    await fetchApi(`/stages/${id}`, { method: 'DELETE' });
  }
}

export const stageService = new StageService();
