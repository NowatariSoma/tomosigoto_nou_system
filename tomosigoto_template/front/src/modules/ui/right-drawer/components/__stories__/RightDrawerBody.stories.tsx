/**
 * RightDrawerBodyコンポーネントのStorybook
 *
 * 右側ドロワーの本体部分を表示するスタイル付きコンポーネントです。
 * スクロール可能なコンテンツ領域として機能します。
 */
import type { Meta, StoryObj } from '@storybook/react';

import { graphqlMocks } from '~/testing/graphqlMocks';
import { getRenderWrapperForComponent } from '~/testing/renderWrappers';

import { RightDrawerBody } from '../RightDrawerBody';

const meta: Meta<typeof RightDrawerBody> = {
  title: 'UI/RightDrawer/RightDrawerBody',
  component: RightDrawerBody,
};

export default meta;
type Story = StoryObj<typeof RightDrawerBody>;

export const Default: Story = {
  render: getRenderWrapperForComponent(
    <div style={{ width: '400px', height: '400px', border: '1px solid #ccc' }}>
      <RightDrawerBody>
        <div style={{ padding: '16px' }}>
          <h3>ドロワーコンテンツ</h3>
          <p>これは右側ドロワーの本体部分に表示されるコンテンツです。</p>
          <p>スクロール可能な領域として機能します。</p>
          {Array(20)
            .fill(0)
            .map((_, index) => (
              <p key={index}>スクロールコンテンツ行 {index + 1}</p>
            ))}
        </div>
      </RightDrawerBody>
    </div>,
  ),
  parameters: {
    msw: graphqlMocks,
  },
};
