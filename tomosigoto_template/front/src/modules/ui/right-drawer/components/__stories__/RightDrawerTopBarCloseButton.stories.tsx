/**
 * RightDrawerTopBarCloseButtonコンポーネントのStorybook
 *
 * 右側ドロワーを閉じるボタンコンポーネントです。
 * クリックするとドロワーが閉じる機能を持っています。
 */
import type { Meta, StoryObj } from '@storybook/react';
import { RecoilRoot } from 'recoil';

import { graphqlMocks } from '~/testing/graphqlMocks';
import { getRenderWrapperForComponent } from '~/testing/renderWrappers';

import { isRightDrawerOpenState } from '../../states/isRightDrawerOpenState';
import { RightDrawerTopBarCloseButton } from '../RightDrawerTopBarCloseButton';

const meta: Meta<typeof RightDrawerTopBarCloseButton> = {
  title: 'UI/RightDrawer/RightDrawerTopBarCloseButton',
  component: RightDrawerTopBarCloseButton,
};

export default meta;
type Story = StoryObj<typeof RightDrawerTopBarCloseButton>;

const MockState = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot
    initializeState={({ set }) => {
      set(isRightDrawerOpenState, true);
    }}
  >
    {children}
  </RecoilRoot>
);

export const Default: Story = {
  render: getRenderWrapperForComponent(
    <div style={{ padding: '16px', background: '#f5f5f5' }}>
      <MockState>
        <RightDrawerTopBarCloseButton />
      </MockState>
    </div>,
  ),
  parameters: {
    msw: graphqlMocks,
    actions: { argTypesRegex: '^on.*' },
  },
};
