import { useState, useMemo, useEffect } from 'react';
import { FilterOption } from '@/shared/types/filter_types';
import { Playlist, Video, SubPlaylist } from '../types/material_types';
import { useFavoriteVideos } from './useFavoriteVideos';
import { materialsService } from '../services/materials-service';

export const useMaterialListPage = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [subPlaylists, setSubPlaylists] = useState<SubPlaylist[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite, getFavoriteCount } = useFavoriteVideos();

  // データ取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // プレイリスト一覧を取得
        const playlistsData = await materialsService.getPlaylists();
        setPlaylists(playlistsData);

        // すべてのサブプレイリストを取得
        const allSubPlaylists: SubPlaylist[] = [];
        for (const playlist of playlistsData) {
          try {
            const subPlaylistsData = await materialsService.getSubPlaylists(playlist.id);
            allSubPlaylists.push(...subPlaylistsData);
          } catch (err) {
            console.error(`Failed to load sub-playlists for playlist ${playlist.id}:`, err);
          }
        }
        setSubPlaylists(allSubPlaylists);

        // すべての動画を取得
        const allVideos: Video[] = [];
        for (const subPlaylist of allSubPlaylists) {
          try {
            const videosData = await materialsService.getVideos(subPlaylist.playlistId, subPlaylist.id);
            // 各動画にsubPlaylistIdを明示的に設定（APIレスポンスに含まれていない場合に備える）
            const videosWithSubPlaylistId = videosData.map(video => ({
              ...video,
              subPlaylistId: video.subPlaylistId || subPlaylist.id,
            }));
            allVideos.push(...videosWithSubPlaylistId);
          } catch (err) {
            console.error(`Failed to load videos for sub-playlist ${subPlaylist.id}:`, err);
          }
        }
        setVideos(allVideos);
      } catch (err) {
        console.error('Failed to load materials:', err);
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 年度・舞台のオプションを生成
  const years = Array.from(new Set(playlists.map((item: Playlist) => item.year))).sort(
    (a: number, b: number) => b - a
  );
  const stages = Array.from(new Set(playlists.map((item: Playlist) => item.stage))).sort();

  const yearOptions: FilterOption[] = [
    { value: 'all', label: 'すべての年度' },
    ...years.map((year: number) => ({ value: year.toString(), label: `${year}年` })),
  ];

  const stageOptions: FilterOption[] = [
    { value: 'all', label: 'すべての舞台' },
    ...stages.map((stage: string) => ({ value: stage, label: stage })),
  ];

  const phaseOptions: FilterOption[] = [
    { value: 'all', label: 'すべてのフェーズ' },
    { value: '稽古', label: '稽古' },
    { value: '本番', label: '本番' },
  ];

  const filterConfigs = [
    {
      id: 'year',
      placeholder: '年度を選択',
      options: yearOptions,
      value: selectedYear,
      onValueChange: setSelectedYear,
    },
    {
      id: 'stage',
      placeholder: '舞台を選択',
      options: stageOptions,
      value: selectedStage,
      onValueChange: setSelectedStage,
    },
    {
      id: 'phase',
      placeholder: 'フェーズを選択',
      options: phaseOptions,
      value: selectedPhase,
      onValueChange: setSelectedPhase,
    },
  ];

  // 検索結果をプレイリスト、サブプレイリスト、動画の3つに分ける
  const filteredPlaylists = useMemo(() => {
    return playlists
      .filter((item: Playlist) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          searchQuery === '' ||
          item.title.toLowerCase().includes(searchLower) ||
          (item.stage && item.stage.toLowerCase().includes(searchLower));
        const matchesYear = selectedYear === 'all' || item.year.toString() === selectedYear;
        const matchesStage = selectedStage === 'all' || (item.stage && item.stage === selectedStage);
        return matchesSearch && matchesYear && matchesStage;
      })
      .sort((a, b) => b.year - a.year); // 年度順（降順）でソート
  }, [searchQuery, selectedYear, selectedStage, playlists]);

  const filteredSubPlaylists = useMemo(() => {
    return subPlaylists.filter((subPlaylist: SubPlaylist) => {
      const playlist = playlists.find(item => item.id === subPlaylist.playlistId);
      if (!playlist) return false;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        subPlaylist.title.toLowerCase().includes(searchLower) ||
        playlist.title.toLowerCase().includes(searchLower) ||
        (playlist.stage && playlist.stage.toLowerCase().includes(searchLower));
      const matchesYear = selectedYear === 'all' || playlist.year.toString() === selectedYear;
      const matchesStage = selectedStage === 'all' || (playlist.stage && playlist.stage === selectedStage);
      const matchesPhase = selectedPhase === 'all' || subPlaylist.phase === selectedPhase;

      return matchesSearch && matchesYear && matchesStage && matchesPhase;
    });
  }, [searchQuery, selectedYear, selectedStage, selectedPhase, subPlaylists, playlists]);

  const filteredVideos = useMemo(() => {
    // 検索クエリがない場合は動画を表示しない（プレイリスト一覧表示時）
    if (searchQuery === '') return [];

    const searchLower = searchQuery.toLowerCase();
    
    return videos.filter((video: Video) => {
      const subPlaylist = subPlaylists.find(item => item.id === video.subPlaylistId);
      if (!subPlaylist) return false;

      const playlist = playlists.find(item => item.id === subPlaylist.playlistId);
      if (!playlist) return false;

      // 検索条件: 動画タイトル、サブプレイリストタイトル、プレイリストタイトル、舞台名で検索
      const matchesSearch =
        video.title.toLowerCase().includes(searchLower) ||
        subPlaylist.title.toLowerCase().includes(searchLower) ||
        playlist.title.toLowerCase().includes(searchLower) ||
        (playlist.stage && playlist.stage.toLowerCase().includes(searchLower));
      
      const matchesYear = selectedYear === 'all' || playlist.year.toString() === selectedYear;
      const matchesStage = selectedStage === 'all' || (playlist.stage && playlist.stage === selectedStage);
      const matchesPhase = selectedPhase === 'all' || subPlaylist.phase === selectedPhase;
      const matchesFavorite = !showFavoritesOnly || isFavorite(video.id);

      return matchesSearch && matchesYear && matchesStage && matchesPhase && matchesFavorite;
    });
  }, [searchQuery, selectedYear, selectedStage, selectedPhase, showFavoritesOnly, isFavorite, videos, subPlaylists, playlists]);

  // 後方互換性のため、検索クエリがある場合は動画検索モードとみなす
  const isVideoSearch = useMemo(() => {
    return searchQuery !== '' && filteredVideos.length > 0;
  }, [searchQuery, filteredVideos.length]);

  // お気に入り切り替え
  const handleToggleFavorite = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(videoId);
  };

  return {
    playlists,
    subPlaylists,
    videos,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedYear,
    selectedStage,
    selectedPhase,
    showFavoritesOnly,
    setShowFavoritesOnly,
    filterConfigs,
    isVideoSearch,
    filteredPlaylists,
    filteredSubPlaylists,
    filteredVideos,
    filteredData: filteredPlaylists, // 後方互換性のため
    isFavorite,
    toggleFavorite,
    getFavoriteCount,
    handleToggleFavorite,
  };
};

