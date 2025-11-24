import { useState, useEffect } from 'react';
import { FilterOption } from '@/shared/types/filter_types';
import { Playlist, SubPlaylist, Video } from '../types/material_types';
import { useFavoriteVideos } from './useFavoriteVideos';
import { materialsService } from '../services/materials-service';

export const usePlaylistDetailPage = (playlistId: string) => {
  const [stageData, setStageData] = useState<Playlist | null>(null);
  const [stagePlaylists, setStagePlaylists] = useState<SubPlaylist[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoriteVideos();

  // データ取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // プレイリスト詳細を取得
        const playlist = await materialsService.getPlaylist(playlistId);
        setStageData(playlist);

        // サブプレイリスト一覧を取得
        const subPlaylists = await materialsService.getSubPlaylists(playlistId);
        setStagePlaylists(subPlaylists);

        // すべての動画を取得
        const allVideos: Video[] = [];
        for (const subPlaylist of subPlaylists) {
          try {
            const videosData = await materialsService.getVideos(playlistId, subPlaylist.id);
            allVideos.push(...videosData);
          } catch (err) {
            console.error(`Failed to load videos for sub-playlist ${subPlaylist.id}:`, err);
          }
        }
        setVideos(allVideos);
      } catch (err) {
        console.error('Failed to load playlist data:', err);
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (playlistId) {
      loadData();
    }
  }, [playlistId]);

  // フェーズオプションの定義
  const phaseOptions: FilterOption[] = [
    { value: 'all', label: 'すべてのフェーズ' },
    { value: '稽古', label: '稽古' },
    { value: '本番', label: '本番' },
  ];

  // 検索クエリが演目名を含むかチェック
  const isVideoSearch =
    searchQuery !== '' &&
    videos.some(video => video.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !stagePlaylists.some(
      playlist =>
        playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.phase.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // 動画検索の場合
  const filteredVideos: Video[] = [];
  if (isVideoSearch) {
    videos.forEach((video: Video) => {
      const subPlaylist = stagePlaylists.find(item => item.id === video.subPlaylistId);
      if (!subPlaylist || subPlaylist.playlistId !== playlistId) return;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        video.title.toLowerCase().includes(searchLower) ||
        subPlaylist.title.toLowerCase().includes(searchLower) ||
        stageData?.title.toLowerCase().includes(searchLower) ||
        stageData?.stage.toLowerCase().includes(searchLower);
      const matchesPhase = selectedPhase === 'all' || subPlaylist.phase === selectedPhase;
      const matchesFavorite = !showFavoritesOnly || isFavorite(video.id);

      if (matchesSearch && matchesPhase && matchesFavorite) {
        filteredVideos.push(video);
      }
    });
  }

  // プレイリスト検索の場合
  const filteredPlaylists = stagePlaylists.filter((playlist: SubPlaylist) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      playlist.title.toLowerCase().includes(searchLower) ||
      playlist.phase.toLowerCase().includes(searchLower);
    const matchesPhase = selectedPhase === 'all' || playlist.phase === selectedPhase;

    return matchesSearch && matchesPhase;
  });

  // お気に入り切り替え
  const handleToggleFavorite = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(videoId);
  };

  // フィルター設定
  const filterConfigs = [
    {
      id: 'phase',
      placeholder: 'フェーズを選択',
      options: phaseOptions,
      value: selectedPhase,
      onValueChange: setSelectedPhase,
    },
  ];

  return {
    stageData,
    stagePlaylists,
    videos,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedPhase,
    showFavoritesOnly,
    setShowFavoritesOnly,
    isVideoSearch,
    filteredVideos,
    filteredPlaylists,
    isFavorite,
    toggleFavorite,
    handleToggleFavorite,
    filterConfigs,
  };
};

