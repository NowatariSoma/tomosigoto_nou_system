/**
 * スクロールバーを非表示にしたタイムラインコンポーネント
 * 右サイドパネル用に最適化されています
 */
import styled from '@emotion/styled';

import { Timeline } from '@/activities/timeline/components/Timeline';
import { CommentableEntity } from '@/activities/types/CommentableEntity';

// スクロールバーを非表示にして、UI表示領域を最適化するスタイル
const StyledTimelineWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  /* スクロールバーを非表示にする */
  & ::-webkit-scrollbar {
    display: none;
    height: 0;
    width: 0;
  }

  & * {
    -ms-overflow-style: none; /* IE, Edge 対応 */
    scrollbar-width: none; /* Firefox 対応 */
  }

  /* UI範囲の最適化 */
  & > div {
    height: 100%;
    width: 100%;
  }

  & > div > div {
    box-sizing: border-box;
    padding: ${({ theme }) => theme.spacing(2)};
    width: 100%;
  }

  /* タイムラインアイテム全体の高さを確保 */
  & div[class*='StyledTimelineItemContainer'] {
    min-height: 32px;
    padding: 4px 0;
    width: 100%;
  }

  /* アイコンコンテナの高さを確保 */
  & div[class*='StyledIconContainer'] {
    min-height: 24px;
    min-width: 24px;
  }

  /* カードの高さと余白を確保 */
  & div[class*='StyledCardContainer'] {
    padding: 8px 0 24px 0;
    width: 100%;
  }

  /* カードの表示領域を拡大 */
  & div[class*='StyledCard'] {
    box-sizing: border-box;
    min-height: 80px;
    padding: 16px;
    width: 100%;
  }

  /* カードタイトルの表示領域を拡大 */
  & div[class*='StyledCardTitle'] {
    font-size: ${({ theme }) => theme.font.size.md};
    margin-bottom: 8px;
    width: 100%;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* カードコンテンツの表示領域を拡大 */
  & div[class*='StyledCardContent'] {
    font-size: ${({ theme }) => theme.font.size.sm};
    line-height: 1.5;
    min-height: 36px;
    width: 100%;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* アクションバーのボタンスペース最適化 */
  & button {
    flex-shrink: 0;
  }
`;

interface HiddenScrollTimelineProps {
  entity: CommentableEntity;
}

export function HiddenScrollTimeline({ entity }: HiddenScrollTimelineProps) {
  return (
    <StyledTimelineWrapper>
      <Timeline entity={entity} />
    </StyledTimelineWrapper>
  );
}
