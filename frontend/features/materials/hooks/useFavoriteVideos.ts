'use client';

import { useState, useEffect, useCallback } from 'react';
import { materialsService } from '../services/materials-service';

export const useFavoriteVideos = () => {
  const [favorites, setFavoritesInternal] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteStatusCache, setFavoriteStatusCache] = useState<Map<string, boolean>>(new Map());

  // 初期化時にバックエンドからお気に入りを読み込む
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsLoading(true);
        const favoritesList = await materialsService.getFavorites();
        const favoriteIds = favoritesList.map(fav => fav.videoId);
        setFavoritesInternal(new Set(favoriteIds));
        
        // キャッシュを更新
        const statusMap = new Map<string, boolean>();
        favoriteIds.forEach(id => statusMap.set(id, true));
        setFavoriteStatusCache(statusMap);
      } catch (error) {
        console.error('Failed to load favorites from API:', error);
        // エラー時は空のセットを返す
        setFavoritesInternal(new Set());
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // お気に入りの切り替え（バックエンドAPIを呼び出す）
  const toggleFavorite = useCallback(async (videoId: string) => {
    try {
      const result = await materialsService.toggleFavorite(videoId);
      
      // ローカル状態を更新
      setFavoritesInternal(prev => {
        const newFavorites = new Set(prev);
        if (result.is_favorited) {
          newFavorites.add(videoId);
        } else {
          newFavorites.delete(videoId);
        }
        return newFavorites;
      });

      // キャッシュを更新
      setFavoriteStatusCache(prev => {
        const newCache = new Map(prev);
        newCache.set(videoId, result.is_favorited);
        return newCache;
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }, []);

  // お気に入り状態の取得（キャッシュから）
  const isFavorite = useCallback((videoId: string) => {
    return favorites.has(videoId);
  }, [favorites]);

  // お気に入りの数を取得
  const getFavoriteCount = useCallback(() => {
    return favorites.size;
  }, [favorites]);

  // 全てのお気に入りIDを取得
  const getAllFavoriteIds = useCallback(() => {
    return Array.from(favorites);
  }, [favorites]);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    getFavoriteCount,
    getAllFavoriteIds,
    isLoading,
  };
};

