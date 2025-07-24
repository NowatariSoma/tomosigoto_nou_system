import { useState, useCallback } from 'react';
import { ChangeHistoryEntry } from '../types/generatedSchedule';

export const useChangeHistory = (maxHistorySize: number = 50) => {
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const addChange = useCallback((
    change: Omit<ChangeHistoryEntry, 'id' | 'timestamp'>
  ) => {
    const newEntry: ChangeHistoryEntry = {
      ...change,
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setHistory(prevHistory => {
      // 現在のインデックス以降の履歴を削除（分岐を防ぐ）
      const truncatedHistory = prevHistory.slice(0, currentIndex + 1);
      
      // 新しい変更を追加
      const newHistory = [...truncatedHistory, newEntry];
      
      // 最大履歴数を超えた場合は古いエントリを削除
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      
      return newHistory;
    });

    setCurrentIndex(prevIndex => {
      const newHistoryLength = Math.min(
        (currentIndex + 1) + 1, 
        maxHistorySize
      );
      return newHistoryLength - 1;
    });
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback((
    callback: (entry: ChangeHistoryEntry) => void
  ) => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      const entryToUndo = history[currentIndex];
      
      if (entryToUndo.canUndo) {
        callback(entryToUndo);
        setCurrentIndex(prev => prev - 1);
      }
    }
  }, [currentIndex, history]);

  const redo = useCallback((
    callback: (entry: ChangeHistoryEntry) => void
  ) => {
    if (currentIndex + 1 < history.length) {
      const entryToRedo = history[currentIndex + 1];
      callback(entryToRedo);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  const canUndo = currentIndex >= 0 && 
    currentIndex < history.length && 
    history[currentIndex]?.canUndo === true;

  const canRedo = currentIndex + 1 < history.length;

  return {
    history,
    currentIndex,
    canUndo,
    canRedo,
    addChange,
    undo,
    redo,
    clearHistory,
  };
};