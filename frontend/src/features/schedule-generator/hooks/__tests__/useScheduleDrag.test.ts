import { renderHook, act } from '@testing-library/react';
import { useScheduleDrag } from '../useScheduleDrag';
import { GeneratedSchedule, SessionDropData, DropTarget } from '../../types/generatedSchedule';

// モックデータ
const mockSchedule: GeneratedSchedule = {
  id: 'test-schedule',
  name: 'Test Schedule',
  sessions: [
    {
      id: 'session-1',
      title: 'Test Session 1',
      date: new Date('2024-01-15'),
      startTime: '09:00',
      endTime: '10:00',
      venueId: 1,
      partIds: [1],
      status: 'confirmed',
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      id: 'session-2',
      title: 'Test Session 2',
      date: new Date('2024-01-15'),
      startTime: '10:30',
      endTime: '11:30',
      venueId: 2,
      partIds: [2],
      status: 'confirmed',
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
  ],
  venues: [
    { id: 1, name: 'Room A', capacity: 50, location: 'Building 1' },
    { id: 2, name: 'Room B', capacity: 30, location: 'Building 2' },
  ],
  parts: [
    { id: 1, name: 'Part A', color: '#FF0000' },
    { id: 2, name: 'Part B', color: '#00FF00' },
  ],
  conflicts: [],
  optimizationScore: {
    total: 85,
    breakdown: {
      venueUtilization: 80,
      partBalance: 90,
      timeEfficiency: 85,
      conflictPenalty: 0,
    },
    suggestions: [],
  },
  generatedAt: new Date(),
  version: 1,
};

describe('useScheduleDrag', () => {
  let mockOnDrop: jest.Mock;

  beforeEach(() => {
    mockOnDrop = jest.fn();
  });

  describe('初期状態', () => {
    it('初期状態では何もドラッグされていない', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      expect(result.current.draggedSession).toBeNull();
      expect(result.current.dragPreview).toBeNull();
      expect(result.current.isDragInProgress).toBe(false);
    });
  });

  describe('ドラッグ開始', () => {
    it('startDragでドラッグが開始される', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      act(() => {
        result.current.startDrag('session-1');
      });

      expect(result.current.draggedSession).toBe('session-1');
      expect(result.current.isDragInProgress).toBe(true);
    });

    it('存在しないセッションIDでは開始できない', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      act(() => {
        result.current.startDrag('non-existent');
      });

      expect(result.current.draggedSession).toBeNull();
      expect(result.current.isDragInProgress).toBe(false);
    });
  });

  describe('ドラッグ位置更新', () => {
    it('updateDragPositionでプレビュー位置が更新される', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      act(() => {
        result.current.startDrag('session-1');
        result.current.updateDragPosition(100, 200);
      });

      expect(result.current.dragPreview).toEqual({
        x: 100,
        y: 200,
        width: expect.any(Number),
        height: expect.any(Number),
      });
    });

    it('ドラッグ中でなければ位置更新されない', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      act(() => {
        result.current.updateDragPosition(100, 200);
      });

      expect(result.current.dragPreview).toBeNull();
    });
  });

  describe('ドロップターゲット検証', () => {
    it('有効なドロップターゲットを判定できる', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      const validTarget: DropTarget = {
        date: new Date('2024-01-16'),
        venueId: 1,
        hour: 9,
        isValid: true,
      };

      expect(result.current.isValidDropTarget(validTarget)).toBe(true);
    });

    it('時間が重複するドロップターゲットは無効', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      const invalidTarget: DropTarget = {
        date: new Date('2024-01-15'),
        venueId: 1,
        hour: 9, // session-1と同じ時間
        isValid: false,
      };

      expect(result.current.isValidDropTarget(invalidTarget)).toBe(false);
    });
  });

  describe('ドラッグ終了', () => {
    it('有効なターゲットにドロップするとonDropが呼ばれる', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      const validTarget: DropTarget = {
        date: new Date('2024-01-16'),
        venueId: 2,
        hour: 14,
        isValid: true,
      };

      act(() => {
        result.current.startDrag('session-1');
        result.current.endDrag(validTarget);
      });

      expect(mockOnDrop).toHaveBeenCalledWith('session-1', {
        date: new Date('2024-01-16'),
        startTime: '14:00',
        endTime: '15:00',
        venueId: 2,
      });

      expect(result.current.draggedSession).toBeNull();
      expect(result.current.isDragInProgress).toBe(false);
    });

    it('無効なターゲットにドロップしてもonDropは呼ばれない', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      act(() => {
        result.current.startDrag('session-1');
        result.current.endDrag(null);
      });

      expect(mockOnDrop).not.toHaveBeenCalled();
      expect(result.current.draggedSession).toBeNull();
      expect(result.current.isDragInProgress).toBe(false);
    });
  });

  describe('複数セッションの同時ドラッグ防止', () => {
    it('既にドラッグ中のときは新しいドラッグを開始できない', () => {
      const { result } = renderHook(() => useScheduleDrag(mockSchedule, mockOnDrop));

      act(() => {
        result.current.startDrag('session-1');
        result.current.startDrag('session-2');
      });

      expect(result.current.draggedSession).toBe('session-1');
    });
  });
});