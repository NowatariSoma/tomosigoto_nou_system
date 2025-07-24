import { renderHook, act } from '@testing-library/react';
import { useChangeHistory } from '../useChangeHistory';
import { ChangeHistoryEntry, Session } from '../../types/generatedSchedule';

// モックセッションデータ
const mockSession: Session = {
  id: 'session-1',
  title: 'Test Session',
  date: new Date('2024-01-15'),
  startTime: '09:00',
  endTime: '10:00',
  venueId: 1,
  partIds: [1],
  status: 'confirmed',
  createdAt: new Date(),
  modifiedAt: new Date(),
};

describe('useChangeHistory', () => {
  describe('初期状態', () => {
    it('初期状態では履歴が空である', () => {
      const { result } = renderHook(() => useChangeHistory());

      expect(result.current.history).toEqual([]);
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('変更の記録', () => {
    it('addChangeで変更が記録される', () => {
      const { result } = renderHook(() => useChangeHistory());

      const changeEntry: Omit<ChangeHistoryEntry, 'id' | 'timestamp'> = {
        type: 'session_moved',
        sessionId: 'session-1',
        oldData: { venueId: 1 },
        newData: { venueId: 2 },
        description: 'セッションを会場1から会場2に移動',
        canUndo: true,
      };

      act(() => {
        result.current.addChange(changeEntry);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0]).toEqual(
        expect.objectContaining({
          ...changeEntry,
          id: expect.any(String),
          timestamp: expect.any(Date),
        })
      );
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('複数の変更を順次記録できる', () => {
      const { result } = renderHook(() => useChangeHistory());

      const changes = [
        {
          type: 'session_moved' as const,
          sessionId: 'session-1',
          oldData: { venueId: 1 },
          newData: { venueId: 2 },
          description: '会場変更',
          canUndo: true,
        },
        {
          type: 'session_edited' as const,
          sessionId: 'session-1',
          oldData: { title: 'Old Title' },
          newData: { title: 'New Title' },
          description: 'タイトル変更',
          canUndo: true,
        },
      ];

      act(() => {
        changes.forEach(change => result.current.addChange(change));
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.currentIndex).toBe(1);
    });
  });

  describe('Undo操作', () => {
    it('undoで前の状態に戻れる', () => {
      const { result } = renderHook(() => useChangeHistory());

      const change = {
        type: 'session_moved' as const,
        sessionId: 'session-1',
        oldData: { venueId: 1 },
        newData: { venueId: 2 },
        description: '会場変更',
        canUndo: true,
      };

      act(() => {
        result.current.addChange(change);
      });

      expect(result.current.canUndo).toBe(true);

      let undoCallback: jest.Mock = jest.fn();

      act(() => {
        result.current.undo(undoCallback);
      });

      expect(undoCallback).toHaveBeenCalledWith(result.current.history[0]);
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('Undo不可能な変更はundoできない', () => {
      const { result } = renderHook(() => useChangeHistory());

      const nonUndoableChange = {
        type: 'session_created' as const,
        sessionId: 'session-1',
        oldData: {},
        newData: mockSession,
        description: 'セッション作成',
        canUndo: false,
      };

      act(() => {
        result.current.addChange(nonUndoableChange);
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('複数の変更を順次undoできる', () => {
      const { result } = renderHook(() => useChangeHistory());

      const changes = [
        {
          type: 'session_moved' as const,
          sessionId: 'session-1',
          oldData: { venueId: 1 },
          newData: { venueId: 2 },
          description: '1回目の変更',
          canUndo: true,
        },
        {
          type: 'session_edited' as const,
          sessionId: 'session-1',
          oldData: { title: 'Old' },
          newData: { title: 'New' },
          description: '2回目の変更',
          canUndo: true,
        },
      ];

      act(() => {
        changes.forEach(change => result.current.addChange(change));
      });

      const undoCallback = jest.fn();

      // 2回目の変更をundo
      act(() => {
        result.current.undo(undoCallback);
      });

      expect(result.current.currentIndex).toBe(0);
      expect(undoCallback).toHaveBeenCalledWith(result.current.history[1]);

      // 1回目の変更をundo
      act(() => {
        result.current.undo(undoCallback);
      });

      expect(result.current.currentIndex).toBe(-1);
      expect(undoCallback).toHaveBeenCalledWith(result.current.history[0]);
    });
  });

  describe('Redo操作', () => {
    it('redoで次の状態に進める', () => {
      const { result } = renderHook(() => useChangeHistory());

      const change = {
        type: 'session_moved' as const,
        sessionId: 'session-1',
        oldData: { venueId: 1 },
        newData: { venueId: 2 },
        description: '会場変更',
        canUndo: true,
      };

      act(() => {
        result.current.addChange(change);
        result.current.undo(jest.fn());
      });

      expect(result.current.canRedo).toBe(true);

      const redoCallback = jest.fn();

      act(() => {
        result.current.redo(redoCallback);
      });

      expect(redoCallback).toHaveBeenCalledWith(result.current.history[0]);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('履歴のクリア', () => {
    it('clearHistoryで履歴が全削除される', () => {
      const { result } = renderHook(() => useChangeHistory());

      const change = {
        type: 'session_moved' as const,
        sessionId: 'session-1',
        oldData: { venueId: 1 },
        newData: { venueId: 2 },
        description: '会場変更',
        canUndo: true,
      };

      act(() => {
        result.current.addChange(change);
      });

      expect(result.current.history).toHaveLength(1);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toEqual([]);
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('履歴の分岐', () => {
    it('undo後に新しい変更を追加すると履歴が分岐する', () => {
      const { result } = renderHook(() => useChangeHistory());

      const changes = [
        {
          type: 'session_moved' as const,
          sessionId: 'session-1',
          oldData: { venueId: 1 },
          newData: { venueId: 2 },
          description: '1回目の変更',
          canUndo: true,
        },
        {
          type: 'session_edited' as const,
          sessionId: 'session-1',
          oldData: { title: 'Old' },
          newData: { title: 'New' },
          description: '2回目の変更',
          canUndo: true,
        },
      ];

      act(() => {
        changes.forEach(change => result.current.addChange(change));
        result.current.undo(jest.fn()); // 2回目の変更をundo
      });

      expect(result.current.currentIndex).toBe(0);

      const newChange = {
        type: 'session_moved' as const,
        sessionId: 'session-1',
        oldData: { venueId: 2 },
        newData: { venueId: 3 },
        description: '新しい変更',
        canUndo: true,
      };

      act(() => {
        result.current.addChange(newChange);
      });

      // 2回目の元の変更は削除され、新しい変更が追加される
      expect(result.current.history).toHaveLength(2);
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.history[1].description).toBe('新しい変更');
    });
  });

  describe('最大履歴数の制限', () => {
    it('最大履歴数を超えると古い履歴が削除される', () => {
      const { result } = renderHook(() => useChangeHistory(3)); // 最大3件

      // 4件の変更を追加
      for (let i = 1; i <= 4; i++) {
        const change = {
          type: 'session_moved' as const,
          sessionId: `session-${i}`,
          oldData: { venueId: i },
          newData: { venueId: i + 1 },
          description: `変更${i}`,
          canUndo: true,
        };

        act(() => {
          result.current.addChange(change);
        });
      }

      // 最大3件に制限されている
      expect(result.current.history).toHaveLength(3);
      expect(result.current.history[0].description).toBe('変更2'); // 最初の変更は削除された
      expect(result.current.history[2].description).toBe('変更4');
    });
  });
});