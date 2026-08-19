/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の一時ファイル。
 *
 * scripts/build-pages.mjs が export ビルドの間だけ
 * features/part-member-assignment/data/mockData.ts として配置し、
 * ビルド後に必ず元のファイルへ戻す。
 *
 * 本来の mockData.ts は「パート 1 / 部員1」というプレースホルダなので、
 * デモではほかの画面と同じ架空データ（部員15名と能のパート）に差し替える。
 */
import { Part, Member } from '../types';
import { MEMBERS, MEMBER_ASSIGNMENTS, PARTS, STAGES, fullNameKanji } from '@/lib/demo/fixtures';

/** 「夏合宿発表会「土蜘蛛」」→「土蜘蛛」 */
function pieceOf(stageName: string): string {
  const matched = stageName.match(/「([^」]+)」/);
  return matched ? matched[1] : stageName;
}

const ACTIVE_PARTS = PARTS.filter((part) => part.status === 'active');

export const createMockMembers = (partId?: string): Member[] =>
  MEMBERS.map((member, index) => ({
    id: index + 1,
    name: fullNameKanji(member),
    isSelected: partId
      ? MEMBER_ASSIGNMENTS.some(
          (assignment) => assignment.part_id === partId && assignment.user_id === member.id
        )
      : false,
  }));

export const mockParts: Part[] = ACTIVE_PARTS.map((part, index) => {
  const stage = STAGES.find((s) => s.id === part.stage_id);
  return {
    id: index + 1,
    name: stage ? `${pieceOf(stage.name)}／${part.name}` : part.name,
    members: createMockMembers(part.id),
  };
});
