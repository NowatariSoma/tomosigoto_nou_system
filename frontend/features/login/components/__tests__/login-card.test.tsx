import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__mocks__/test-utils';
import { LoginCard } from '@/features/login/components/login-card';

describe('LoginCard', () => {
  it('childrenを正しくレンダリングする', () => {
    render(
      <LoginCard>
        <p>テスト内容</p>
      </LoginCard>
    );

    expect(screen.getByText('テスト内容')).toBeInTheDocument();
  });

  it('複数のchildrenをレンダリングする', () => {
    render(
      <LoginCard>
        <h1>タイトル</h1>
        <p>説明文</p>
        <button>ボタン</button>
      </LoginCard>
    );

    expect(screen.getByText('タイトル')).toBeInTheDocument();
    expect(screen.getByText('説明文')).toBeInTheDocument();
    expect(screen.getByText('ボタン')).toBeInTheDocument();
  });

  it('カードの外側コンテナが正しいクラスを持つ', () => {
    const { container } = render(
      <LoginCard>
        <span>コンテンツ</span>
      </LoginCard>
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('relative', 'z-10');
  });

  it('ガラスモーフィズムの背景要素が存在する', () => {
    const { container } = render(
      <LoginCard>
        <span>コンテンツ</span>
      </LoginCard>
    );

    const backdropElement = container.querySelector('.backdrop-blur-md');
    expect(backdropElement).toBeInTheDocument();
  });

  it('フォームコンテンツのラッパーが存在する', () => {
    const { container } = render(
      <LoginCard>
        <span>コンテンツ</span>
      </LoginCard>
    );

    // z-10クラスを持つ内側のdivを確認
    const formWrapper = container.querySelector('.relative.z-10.w-full.px-14.py-8');
    expect(formWrapper).toBeInTheDocument();
  });
});
