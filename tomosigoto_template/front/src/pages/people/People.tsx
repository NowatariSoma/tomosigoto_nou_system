import { useCallback } from 'react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';

import { PeopleTable } from '@/people/table/components/PeopleTable';
import { TableActionBarButtonCreateCommentThreadPeople } from '@/people/table/components/TableActionBarButtonCreateCommentThreadPeople';
import { TableActionBarButtonDeletePeople } from '@/people/table/components/TableActionBarButtonDeletePeople';
import { IconBuildingSkyscraper } from '@/ui/icon';
import { WithTopBarContainer } from '@/ui/layout/components/WithTopBarContainer';
import { RecoilScope } from '@/ui/recoil-scope/components/RecoilScope';
import { useOpenRightDrawer } from '@/ui/right-drawer/hooks/useOpenRightDrawer';
import { RightDrawerPages } from '@/ui/right-drawer/types/RightDrawerPages';
import { EntityTableActionBar } from '@/ui/table/action-bar/components/EntityTableActionBar';
import { TableContext } from '@/ui/table/states/TableContext';

const StyledTableContainer = styled.div`
  display: flex;
  width: 100%;
`;

/**
 * Peopleコンポーネント
 * 人のリストを表示し、新しい人を右サイドパネルで追加する機能を提供します
 */
export function People() {
  const openRightDrawer = useOpenRightDrawer();
  const theme = useTheme();

  /**
   * 連絡先追加パネルを開くハンドラー
   * PersonDetailでは選択されたIDがnullの場合に新規作成モードとなる
   */
  const handleAddButtonClick = useCallback(() => {
    openRightDrawer(RightDrawerPages.PersonDetail);
  }, [openRightDrawer]);

  return (
    <RecoilScope SpecificContext={TableContext}>
      <WithTopBarContainer
        title="People"
        icon={<IconBuildingSkyscraper size={theme.icon.size.md} />}
        onAddButtonClick={handleAddButtonClick}
      >
        <StyledTableContainer>
          <PeopleTable />
        </StyledTableContainer>
        <EntityTableActionBar>
          <TableActionBarButtonCreateCommentThreadPeople />
          <TableActionBarButtonDeletePeople />
        </EntityTableActionBar>
      </WithTopBarContainer>
    </RecoilScope>
  );
}
