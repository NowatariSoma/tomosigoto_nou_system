/**
 * RightDrawerPageコンポーネントのStorybook
 *
 * 右側ドロワー内のページコンテナとして機能するスタイル付きコンポーネントです。
 * 右側ドロワー内で表示される各ページのコンテナとして使用されます。
 */
import type { Meta, StoryObj } from '@storybook/react';

import { graphqlMocks } from '~/testing/graphqlMocks';
import { getRenderWrapperForComponent } from '~/testing/renderWrappers';

import { RightDrawerPage } from '../RightDrawerPage';

const meta: Meta<typeof RightDrawerPage> = {
  title: 'UI/RightDrawer/RightDrawerPage',
  component: RightDrawerPage,
};

export default meta;
type Story = StoryObj<typeof RightDrawerPage>;

export const Default: Story = {
  render: getRenderWrapperForComponent(
    <div style={{ width: '400px', height: '500px', border: '1px solid #ccc' }}>
      <RightDrawerPage>
        <div style={{ padding: '16px' }}>
          <h3>ページコンテンツ</h3>
          <p>これは右側ドロワーのページ内に表示されるコンテンツです。</p>
          <p>各ページのコンテナとして機能します。</p>
          <button>アクション</button>
        </div>
      </RightDrawerPage>
    </div>,
  ),
  parameters: {
    msw: graphqlMocks,
  },
};
