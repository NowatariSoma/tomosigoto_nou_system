/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の一時ファイル。
 *
 * scripts/build-pages.mjs が export ビルドの間だけ
 * features/stage-part-assignment/data/mockData.ts として配置し、
 * ビルド後に必ず元のファイルへ戻す。
 *
 * 本来の mockData.ts は「公演名 1 / パート 1」というプレースホルダなので、
 * デモではほかの画面と同じ架空データ（能の曲目とパート）に差し替える。
 */
import { Performance } from '../types';
import { STAGES, partsOfStage } from '@/lib/demo/fixtures';

const GRADES = ['1回生', '2回生', '3回生', '4回生'];

/** その学年がそのパートを担当しうるか（下級生は地謡・囃子方が中心） */
function isAssignableTo(gradeIndex: number, partName: string): boolean {
  const isChorus = partName.startsWith('地謡') || partName.startsWith('囃子方');
  const isTsure = partName.includes('ツレ');
  const isLead = partName.includes('シテ') || partName.includes('ワキ');

  switch (gradeIndex) {
    case 0:
      return isChorus;
    case 1:
      return isChorus || isTsure;
    case 2:
      return true;
    default:
      return isLead || isTsure;
  }
}

export const mockPerformances: Performance[] = STAGES.map((stage, stageIdx) => {
  const parts = partsOfStage(stage.id);
  return {
    id: stage.id,
    name: stage.name,
    parts: parts.map((part) => part.name),
    grades: GRADES.map((gradeName, gradeIdx) => ({
      id: `${stage.id}-grade-${gradeIdx + 1}`,
      name: gradeName,
      expanded: stageIdx === 0 && gradeIdx === 2,
      parts: parts.map((part) => ({
        id: `${stage.id}-grade-${gradeIdx + 1}-${part.id}`,
        name: part.name,
        selected: isAssignableTo(gradeIdx, part.name),
      })),
    })),
  };
});
