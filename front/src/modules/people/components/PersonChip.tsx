import * as React from 'react';
import { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { useRecoilState } from 'recoil';

import { isRightDrawerOpenState } from '@/ui/right-drawer/states/isRightDrawerOpenState';
import { rightDrawerPageState } from '@/ui/right-drawer/states/rightDrawerPageState';
import { selectedPersonIdState } from '@/ui/right-drawer/states/selectedPersonIdState';
import { RightDrawerPages } from '@/ui/right-drawer/types/RightDrawerPages';
import { Avatar } from '@/users/components/Avatar';

export type PersonChipPropsType = {
  id: string;
  name: string;
  picture?: string;
};

const StyledContainer = styled.div`
  align-items: center;
  background-color: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme }) => theme.font.color.secondary};
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(0.5)};
  padding-right: ${({ theme }) => theme.spacing(1)};

  :hover {
    background-color: ${({ theme }) => theme.background.tertiary};
    cursor: pointer;
  }
`;

const StyledName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function PersonChip({ id, name, picture }: PersonChipPropsType) {
  const [, setIsRightDrawerOpen] = useRecoilState(isRightDrawerOpenState);
  const [, setRightDrawerPage] = useRecoilState(rightDrawerPageState);
  const [, setSelectedPersonId] = useRecoilState(selectedPersonIdState);

  const handleClick = React.useCallback(() => {
    if (id) {
      setSelectedPersonId(id);
      setRightDrawerPage(RightDrawerPages.PersonDetail);
      setIsRightDrawerOpen(true);
    }
  }, [id, setIsRightDrawerOpen, setRightDrawerPage, setSelectedPersonId]);

  return (
    <StyledContainer data-testid="person-chip" onClick={handleClick}>
      <Avatar
        avatarUrl={picture}
        colorId={id}
        placeholder={name}
        size={14}
        type="rounded"
      />
      <StyledName>{name}</StyledName>
    </StyledContainer>
  );
}
