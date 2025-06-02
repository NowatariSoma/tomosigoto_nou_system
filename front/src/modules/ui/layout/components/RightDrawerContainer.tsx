import styled from '@emotion/styled';
import { useRecoilState } from 'recoil';

import { RightDrawer } from '@/ui/right-drawer/components/RightDrawer';
import { isRightDrawerOpenState } from '@/ui/right-drawer/states/isRightDrawerOpenState';

import { Panel } from './Panel';

type OwnProps = {
  children: JSX.Element | JSX.Element[];
  topMargin?: number;
};

const StyledMainContainer = styled.div<{ topMargin: number }>`
  background: ${({ theme }) => theme.background.noisy};
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(2)};
  height: calc(100% - ${(props) => props.topMargin}px);
  padding-bottom: ${({ theme }) => theme.spacing(3)};
  padding-right: ${({ theme }) => theme.spacing(3)};
  width: calc(100% - ${({ theme }) => theme.spacing(3)});
`;

type LeftContainerProps = {
  isRightDrawerOpen: boolean;
};

const StyledLeftContainer = styled.div<LeftContainerProps>`
  display: flex;
  flex: ${({ isRightDrawerOpen }) => (isRightDrawerOpen ? 2 : 1)};
  position: relative;
  transition: flex 0.3s ease;
  width: auto;
`;

const StyledRightContainer = styled.div<{ isRightDrawerOpen: boolean }>`
  display: ${({ isRightDrawerOpen }) => (isRightDrawerOpen ? 'flex' : 'none')};
  flex: 1;
  flex-direction: column;
  min-width: ${({ theme }) => theme.rightDrawerWidth};
  transition: all 0.3s ease;
`;

export function RightDrawerContainer({ children, topMargin }: OwnProps) {
  const [isRightDrawerOpen] = useRecoilState(isRightDrawerOpenState);

  return (
    <StyledMainContainer topMargin={topMargin ?? 0}>
      <StyledLeftContainer isRightDrawerOpen={isRightDrawerOpen}>
        <Panel>{children}</Panel>
      </StyledLeftContainer>
      <StyledRightContainer isRightDrawerOpen={isRightDrawerOpen}>
        <RightDrawer />
      </StyledRightContainer>
    </StyledMainContainer>
  );
}
