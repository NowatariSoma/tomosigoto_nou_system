import { useEffect, useMemo, useRef, useState } from 'react';
import { getOperationName } from '@apollo/client/utilities';
import { BlockNoteEditor } from '@blocknote/core';
import { useBlockNote } from '@blocknote/react';
import styled from '@emotion/styled';
import debounce from 'lodash.debounce';

import { BlockEditor } from '@/ui/editor/components/BlockEditor';
import {
  CommentThread,
  useUpdateCommentThreadMutation,
} from '~/generated/graphql';

import { GET_COMMENT_THREADS_BY_TARGETS } from '../queries/select';

const BlockNoteStyledContainer = styled.div`
  width: 100%;
`;

const StyledTextarea = styled.textarea`
  background: ${({ theme }: any) => theme.background.primary};
  border: 1px solid ${({ theme }: any) => theme.border.color.light};
  border-radius: 4px;
  color: ${({ theme }: any) => theme.font.color.primary};
  font-family: inherit;
  font-size: 14px;
  min-height: 100px;
  padding: 8px;
  resize: vertical;
  width: 100%;
`;

type OwnProps = {
  commentThread: Pick<CommentThread, 'id' | 'body'>;
  onChange?: (commentThreadBody: string) => void;
};

export function CommentThreadBodyEditor({ commentThread, onChange }: OwnProps) {
  const [updateCommentThreadMutation] = useUpdateCommentThreadMutation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    try {
      if (commentThread.body) {
        const parsedContent = JSON.parse(commentThread.body);
        if (Array.isArray(parsedContent)) {
          // JSONからテキストを抽出
          let textContent = '';
          parsedContent.forEach((block: any) => {
            if (block.content) {
              if (Array.isArray(block.content)) {
                // 新形式: content は配列で、各要素にtextプロパティがある
                block.content.forEach((item: any) => {
                  if (item && typeof item.text === 'string') {
                    textContent += item.text + '\n';
                  }
                });
              } else if (typeof block.content === 'string') {
                // 旧形式: content は文字列
                textContent += block.content + '\n';
              }
            }
          });
          setContent(textContent.trim());
        }
      }
    } catch (e) {
      // JSONパースに失敗した場合は生のテキストとして扱う
      console.error('コメント本文のパースエラー:', e);
      setContent(commentThread.body || '');
    }
  }, [commentThread.body]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // JSONに変換して保存
    const jsonContent = JSON.stringify([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: newContent,
          },
        ],
      },
    ]);

    onChange?.(jsonContent);

    updateCommentThreadMutation({
      variables: {
        id: commentThread.id,
        body: jsonContent,
      },
      refetchQueries: [getOperationName(GET_COMMENT_THREADS_BY_TARGETS) ?? ''],
    });
  };

  return (
    <BlockNoteStyledContainer>
      <StyledTextarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder="コメントを入力..."
      />
    </BlockNoteStyledContainer>
  );
}
