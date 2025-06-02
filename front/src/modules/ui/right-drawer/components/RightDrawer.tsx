import { useRef } from 'react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useRecoilState } from 'recoil';

import {
  OutsideClickAlerterMode,
  useOutsideAlerter,
} from '@/ui/hooks/useOutsideAlerter';
import { isDefined } from '~/utils/isDefined';

import { isRightDrawerOpenState } from '../states/isRightDrawerOpenState';
import { rightDrawerPageState } from '../states/rightDrawerPageState';

import { RightDrawerRouter } from './RightDrawerRouter';

interface StyledContainerProps {
  isOpen: boolean;
}

const StyledContainer = styled(motion.div)<StyledContainerProps>`
  background: ${({ theme }) => theme.background.primary};
  box-shadow: ${({ theme }) => theme.boxShadow.strong};
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  height: 100%;
  overflow-x: hidden;
  position: relative;
  width: 100%;
`;

const StyledRightDrawer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

export function RightDrawer() {
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useRecoilState(
    isRightDrawerOpenState,
  );

  const [rightDrawerPage] = useRecoilState(rightDrawerPageState);

  const rightDrawerRef = useRef(null);
  useOutsideAlerter({
    ref: rightDrawerRef,
    callback: () => setIsRightDrawerOpen(false),
    mode: OutsideClickAlerterMode.absolute,
  });

  if (!isDefined(rightDrawerPage) || !isRightDrawerOpen) {
    return <></>;
  }

  return (
    <StyledContainer isOpen={isRightDrawerOpen}>
      <StyledRightDrawer ref={rightDrawerRef}>
        <RightDrawerRouter />
      </StyledRightDrawer>
    </StyledContainer>
  );
}
