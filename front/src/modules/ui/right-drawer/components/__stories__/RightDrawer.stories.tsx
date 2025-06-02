/**
 * RightDrawerコンポーネントのStorybook
 *
 * アプリケーションの右側に表示されるドロワーコンポーネントを描画します。
 * この物語では、ドロワーの開閉状態やページの状態を制御できます。
 */
import type { Meta, StoryObj } from '@storybook/react';
import { RecoilRoot } from 'recoil';

import { graphqlMocks } from '~/testing/graphqlMocks';
import { getRenderWrapperForComponent } from '~/testing/renderWrappers';

import { RightDrawerPages } from '../../../right-drawer/types/RightDrawerPages';
import { isRightDrawerOpenState } from '../../states/isRightDrawerOpenState';
import { rightDrawerPageState } from '../../states/rightDrawerPageState';
import { RightDrawer } from '../RightDrawer';

const meta: Meta<typeof RightDrawer> = {
  title: 'UI/RightDrawer/RightDrawer',
  component: RightDrawer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RightDrawer>;

const MockState = ({
  children,
  isOpen,
  page,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  page: RightDrawerPages;
}) => (
  <RecoilRoot
    initializeState={({ set }) => {
      set(isRightDrawerOpenState, isOpen);
      set(rightDrawerPageState, page);
    }}
  >
    {children}
  </RecoilRoot>
);

export const Default: Story = {
  render: getRenderWrapperForComponent(
    <div style={{ height: '600px', position: 'relative' }}>
      <MockState isOpen={true} page={RightDrawerPages.Timeline}>
        <RightDrawer />
      </MockState>
    </div>,
  ),
  parameters: {
    msw: graphqlMocks,
    actions: { argTypesRegex: '^on.*' },
  },
  args: {},
};

export const Closed: Story = {
  render: getRenderWrapperForComponent(
    <div style={{ height: '600px', position: 'relative' }}>
      <MockState isOpen={false} page={RightDrawerPages.Timeline}>
        <RightDrawer />
      </MockState>
    </div>,
  ),
  parameters: {
    msw: graphqlMocks,
  },
};
