import { NextResponse } from 'next/server';
import { stagesService } from '../../../features/parts-setting/services/stages-service';
import { partsService } from '../../../features/parts-setting/services/parts-service';

export async function GET() {
  console.log('[API Debug] Starting parts-setting debug...');

  try {
    // ステージを取得
    console.time('[API Debug] Fetching stages');
    const stages = await stagesService.getStages();
    console.timeEnd('[API Debug] Fetching stages');
    console.log(`[API Debug] Found ${stages.length} stages`);

    // 最初のステージのパートを取得（テスト用）
    if (stages.length > 0) {
      console.time('[API Debug] Fetching parts for first stage');
      const parts = await partsService.getPartsByStageId(stages[0].id);
      console.timeEnd('[API Debug] Fetching parts for first stage');
      console.log(`[API Debug] Found ${parts.length} parts for stage: ${stages[0].name}`);

      return NextResponse.json({
        success: true,
        stageCount: stages.length,
        firstStage: {
          id: stages[0].id,
          name: stages[0].name,
          partCount: parts.length,
          parts: parts.map(p => ({ id: p.id, name: p.name }))
        }
      });
    }

    return NextResponse.json({
      success: true,
      stageCount: stages.length,
      message: 'No stages found'
    });
  } catch (error) {
    console.error('[API Debug] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}