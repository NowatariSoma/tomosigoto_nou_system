import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__mocks__/test-utils';
import { PlaylistCard } from '@/features/materials/components/PlaylistCard';
import { Playlist, SubPlaylist } from '@/features/materials/types/material_types';

// shadcn/ui CardコンポーネントをHTMLに置き換えてモック
vi.mock('@/components/ui/layout/card', () => ({
  Card: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <div data-testid="card" className={className} onClick={onClick}>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-description" className={className}>{children}</div>
  ),
}));

const mockPlaylist: Playlist = {
  id: 'pl-1',
  title: '2024年公演',
  stage: '能舞台A',
  year: 2024,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const mockSubPlaylist: SubPlaylist = {
  id: 'sub-1',
  playlistId: 'pl-1',
  title: 'サブプレイリスト1',
  recordedDate: '2024-03-15',
  phase: '本稽古',
  playlistUrl: 'https://youtube.com/playlist',
  thumbnailUrl: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

describe('PlaylistCard', () => {
  it('メインプレイリストの場合は「年 舞台」をタイトルに表示する', () => {
    render(
      <PlaylistCard playlist={mockPlaylist} onClick={vi.fn()} />
    );

    expect(screen.getByText('2024年 能舞台A')).toBeInTheDocument();
  });

  it('サブプレイリストの場合はタイトルを表示する', () => {
    render(
      <PlaylistCard playlist={mockSubPlaylist} onClick={vi.fn()} />
    );

    expect(screen.getByText('サブプレイリスト1')).toBeInTheDocument();
  });

  it('サムネイルURLがある場合はimg要素を表示する', () => {
    render(
      <PlaylistCard playlist={mockPlaylist} onClick={vi.fn()} />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    expect(img).toHaveAttribute('alt', '2024年公演');
  });

  it('サムネイルURLがない場合は「No Image」を表示する', () => {
    const playlistNoThumb = { ...mockPlaylist, thumbnailUrl: '' };
    render(
      <PlaylistCard playlist={playlistNoThumb} onClick={vi.fn()} />
    );

    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('クリック時にonClickが呼ばれる', async () => {
    const onClickMock = vi.fn();
    const { user } = render(
      <PlaylistCard playlist={mockPlaylist} onClick={onClickMock} />
    );

    await user.click(screen.getByTestId('card'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('メインプレイリストのデフォルト説明文を表示する', () => {
    render(
      <PlaylistCard playlist={mockPlaylist} onClick={vi.fn()} />
    );

    expect(screen.getByText('能舞台A - プレイリスト詳細を見る')).toBeInTheDocument();
  });

  it('サブプレイリストのデフォルト説明文を表示する', () => {
    render(
      <PlaylistCard playlist={mockSubPlaylist} onClick={vi.fn()} />
    );

    expect(screen.getByText(/本稽古/)).toBeInTheDocument();
  });

  it('customDescriptionが指定された場合はそれを表示する', () => {
    render(
      <PlaylistCard
        playlist={mockPlaylist}
        onClick={vi.fn()}
        customDescription="カスタム説明"
      />
    );

    expect(screen.getByText('カスタム説明')).toBeInTheDocument();
  });

  it('showYear=trueの場合に年度を追加表示する', () => {
    render(
      <PlaylistCard playlist={mockPlaylist} showYear={true} onClick={vi.fn()} />
    );

    expect(screen.getByText('2024年')).toBeInTheDocument();
  });
});
