import { StageData, CreateStageRequest } from '../types';

// SupabaseのStage型の定義（関連テーブル含む）
interface SupabasePart {
  id: string;
  name: string;
  member_assignments?: Array<{
    user_id: string;
    category: string;
    display_order: number;
  }>;
}

interface SupabaseStageResponse {
  id?: string;
  name?: string;
  performance_date?: string;
  parts?: SupabasePart[];
}

// SupabaseのStage型をフロントエンドのStageData型にマッピング
export const mapStageResponseToStageData = (stage: SupabaseStageResponse | null | undefined): StageData => {
  if (!stage) {
    return {
      id: '',
      date: '',
      stageName: '',
      parts: [],
      partCount: 0,
    };
  }
  
  // partsテーブルからパート名の配列を作成
  const partNames = (stage.parts || []).map(part => part.name);
  
  return {
    id: stage.id || '',
    date: stage.performance_date || '',
    stageName: stage.name || '',
    parts: partNames,
    partCount: partNames.length,
  };
};

// フロントエンドのCreateStageRequest型をSupabaseのStage型にマッピング
export const mapCreateStageRequestToStage = (stage: CreateStageRequest) => {
  return {
    name: stage.stageName,
    performance_date: stage.date,
    status: 'active',
  };
};
