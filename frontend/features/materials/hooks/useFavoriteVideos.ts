'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'material_favorite_videos';

export const useFavoriteVideos = () => {
  const [favorites, setFavoritesInternal] = useState<Set<string>>(new Set());

  // 初期化時にlocalStorageからお気に入りを読み込む
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const favoriteIds = JSON.parse(stored) as string[];
        setFavoritesInternal(new Set(favoriteIds));
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
    }
  }, []);

  // localStorageに保存
  const saveToLocalStorage = (favoriteIds: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  };

  // お気に入りの切り替え
  const toggleFavorite = (videoId: string) => {
    setFavoritesInternal(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(videoId)) {
        newFavorites.delete(videoId);
      } else {
        newFavorites.add(videoId);
      }
      saveToLocalStorage(Array.from(newFavorites));
      return newFavorites;
    });
  };

  // お気に入り状態の取得
  const isFavorite = (videoId: string) => {
    return favorites.has(videoId);
  };

  // お気に入りの数を取得
  const getFavoriteCount = () => {
    return favorites.size;
  };

  // 全てのお気に入りIDを取得
  const getAllFavoriteIds = () => {
    return Array.from(favorites);
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    getFavoriteCount,
    getAllFavoriteIds,
  };
};

