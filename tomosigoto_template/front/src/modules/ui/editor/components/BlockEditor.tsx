/**
 * @fileoverview ブロックエディタコンポーネント
 * テキスト入力のためのシンプルなエディタを提供します。
 * 現在はシンプルなテキストエリアとして実装されています。
 */
import styled from '@emotion/styled';

/**
 * BlockEditorコンポーネントのプロパティ
 * @typedef {Object} BlockEditorProps
 * @property {any} editor - エディタの状態を管理するオブジェクト
 */
interface BlockEditorProps {
  editor: any;
}

/**
 * スタイル付きエディタコンテナ
 * エディタの外観を定義します
 */
const StyledEditor = styled.div`
  min-height: 200px;
  width: 100%;
  & textarea {
    background: ${({ theme }: any) => theme.background.primary};
    border: 1px solid ${({ theme }: any) => theme.border.color.light};
    color: ${({ theme }: any) => theme.font.color.primary};
    font-size: 13px;
    min-height: 200px;
    padding: 8px;
    resize: vertical;
    width: 100%;
  }
`;

/**
 * ブロックエディタコンポーネント
 * シンプルなテキストエリアを提供します
 *
 * @param {BlockEditorProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} ブロックエディタコンポーネント
 */
export function BlockEditor({ editor }: BlockEditorProps) {
  // シンプルなテキストエリアを代替として使用する
  return (
    <StyledEditor>
      <textarea
        placeholder="テキストを入力..."
        defaultValue={
          editor?.blocks?.map((block: any) => block.content || '').join('\n') ||
          ''
        }
      />
    </StyledEditor>
  );
}
