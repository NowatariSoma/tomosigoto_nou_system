'use client';

import { useState, useEffect } from 'react';
import { Playlist, SubPlaylist } from '../types/material_types';
import { materialsService } from '../services/materials-service';
import { FilterOption } from '@/shared/types/filter_types';

type EditMode = 'list' | 'playlist' | 'subPlaylist' | null;

export function useEditMaterials() {
  const [editMode, setEditMode] = useState<EditMode>('list');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedSubPlaylist, setSelectedSubPlaylist] = useState<SubPlaylist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [subPlaylistCounts, setSubPlaylistCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'year'>('createdAt');
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [playlistFormData, setPlaylistFormData] = useState({
    title: '',
    year: '',
    stage: '',
  });

  // データ取得
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        setIsLoading(true);
        const data = await materialsService.getPlaylists();
        setPlaylists(data);

        const counts: Record<string, number> = {};
        for (const playlist of data) {
          try {
            const subPlaylists = await materialsService.getSubPlaylists(playlist.id);
            counts[playlist.id] = subPlaylists.length;
          } catch (err) {
            console.error(`Failed to load sub-playlists count for ${playlist.id}:`, err);
            counts[playlist.id] = 0;
          }
        }
        setSubPlaylistCounts(counts);
      } catch (error) {
        console.error('Failed to load playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlaylists();
  }, []);

  const handleSavePlaylist = async (data: { title: string; year: number; stage: string }) => {
    if (!selectedPlaylist) return;
    try {
      await materialsService.updatePlaylist(selectedPlaylist.id, {
        title: data.title,
        year: data.year,
        stage: data.stage,
      });
      const updatedPlaylists = await materialsService.getPlaylists();
      setPlaylists(updatedPlaylists);
      const updated = updatedPlaylists.find(p => p.id === selectedPlaylist.id);
      if (updated) setSelectedPlaylist(updated);
      alert('プレイリスト情報を保存しました');
    } catch (error) {
      console.error('Failed to save playlist:', error);
      alert('プレイリストの保存に失敗しました');
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (confirm('本当にこのプレイリストを削除しますか？\nこの操作は取り消せません。')) {
      try {
        await materialsService.deletePlaylist(playlistId);
        const updatedPlaylists = await materialsService.getPlaylists();
        setPlaylists(updatedPlaylists);
        setEditMode('list');
        setSelectedPlaylist(null);
        alert('プレイリストを削除しました');
      } catch (error) {
        console.error('Failed to delete playlist:', error);
        alert('プレイリストの削除に失敗しました');
      }
    }
  };

  const handleDeleteSubPlaylist = async (subPlaylistId: string) => {
    if (!selectedPlaylist) return;
    if (confirm('本当にこのサブプレイリストを削除しますか？\nこの操作は取り消せません。')) {
      try {
        await materialsService.deleteSubPlaylist(selectedPlaylist.id, subPlaylistId);
        alert('サブプレイリストを削除しました');
        const updated = await materialsService.getPlaylist(selectedPlaylist.id);
        setSelectedPlaylist(updated);
      } catch (error) {
        console.error('Failed to delete sub-playlist:', error);
        alert('サブプレイリストの削除に失敗しました');
      }
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!selectedPlaylist) return;
    try {
      const subPlaylists = await materialsService.getSubPlaylists(selectedPlaylist.id);
      for (const subPlaylist of subPlaylists) {
        try {
          const videos = await materialsService.getVideos(selectedPlaylist.id, subPlaylist.id);
          const video = videos.find(v => v.id === videoId);
          if (video) {
            await materialsService.deleteVideo(selectedPlaylist.id, subPlaylist.id, videoId);
            alert('動画を削除しました');
            const updated = await materialsService.getPlaylist(selectedPlaylist.id);
            setSelectedPlaylist(updated);
            return;
          }
        } catch (err) {
          // エラーを無視して続行
        }
      }
      alert('動画が見つかりませんでした');
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('動画の削除に失敗しました');
    }
  };

  const handleMoveSubPlaylist = (subPlaylistId: string) => {
    alert('別のプレイリストに移動しますか？\n（この機能は未実装です）');
  };

  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await materialsService.createPlaylist({
        title: playlistFormData.title,
        stage: playlistFormData.stage,
        year: parseInt(playlistFormData.year, 10),
      });
      const updatedPlaylists = await materialsService.getPlaylists();
      setPlaylists(updatedPlaylists);
      setPlaylistFormData({ title: '', year: '', stage: '' });
      setIsPlaylistDialogOpen(false);
      alert('プレイリストを作成しました');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      alert('プレイリストの作成に失敗しました');
    }
  };

  const handleCreateSubPlaylist = async (data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => {
    if (!selectedPlaylist) return;
    try {
      await materialsService.createSubPlaylist(selectedPlaylist.id, {
        title: data.title,
        recordedDate: data.recordedDate,
        phase: data.phase,
        playlistUrl: data.playlistUrl,
      });
      const updated = await materialsService.getPlaylist(selectedPlaylist.id);
      setSelectedPlaylist(updated);
      if (selectedSubPlaylist) {
        const subPlaylists = await materialsService.getSubPlaylists(selectedPlaylist.id);
        const updatedSubPlaylist = subPlaylists.find(sp => sp.id === selectedSubPlaylist.id);
        if (updatedSubPlaylist) {
          setSelectedSubPlaylist(updatedSubPlaylist);
        }
      }
      alert('サブプレイリストを作成しました');
    } catch (error) {
      console.error('Failed to create sub-playlist:', error);
      alert('サブプレイリストの作成に失敗しました');
    }
  };

  const handleUpdateSubPlaylist = async (subPlaylistId: string, data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => {
    if (!selectedPlaylist) return;
    try {
      await materialsService.updateSubPlaylist(selectedPlaylist.id, subPlaylistId, {
        title: data.title,
        recordedDate: data.recordedDate,
        phase: data.phase,
        playlistUrl: data.playlistUrl,
      });
      const updated = await materialsService.getPlaylist(selectedPlaylist.id);
      setSelectedPlaylist(updated);
      const subPlaylists = await materialsService.getSubPlaylists(selectedPlaylist.id);
      const updatedSubPlaylist = subPlaylists.find(sp => sp.id === subPlaylistId);
      if (updatedSubPlaylist) {
        setSelectedSubPlaylist(updatedSubPlaylist);
      }
      alert('サブプレイリストを更新しました');
    } catch (error) {
      console.error('Failed to update sub-playlist:', error);
      alert('サブプレイリストの更新に失敗しました');
    }
  };

  const handleVideoAdd = async (playlistId: string, subPlaylistId: string, data: { title: string; videoUrl: string; recordedDate: string; thumbnailUrl?: string }) => {
    try {
      await materialsService.createVideo(playlistId, subPlaylistId, {
        title: data.title,
        videoUrl: data.videoUrl,
        recordedDate: data.recordedDate,
        thumbnailUrl: data.thumbnailUrl,
      });
      alert('動画を追加しました');
    } catch (error) {
      console.error('Failed to add video:', error);
      alert('動画の追加に失敗しました');
      throw error;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '日付未設定';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // フィルター設定
  const years = Array.from(new Set(playlists.map((item: Playlist) => item.year))).sort((a: number, b: number) => b - a);
  const stages = Array.from(new Set(playlists.map((item: Playlist) => item.stage))).sort();

  const yearOptions: FilterOption[] = [
    { value: 'all', label: 'すべての年度' },
    ...years.map((year: number) => ({ value: year.toString(), label: `${year}年` }))
  ];

  const stageOptions: FilterOption[] = [
    { value: 'all', label: 'すべての舞台' },
    ...stages.map((stage: string) => ({ value: stage, label: stage }))
  ];

  const filterConfigs = [
    {
      id: 'year',
      placeholder: '年度を選択',
      options: yearOptions,
      value: selectedYear,
      onValueChange: setSelectedYear
    },
    {
      id: 'stage',
      placeholder: '舞台を選択',
      options: stageOptions,
      value: selectedStage,
      onValueChange: setSelectedStage
    }
  ];

  const filteredPlaylists = playlists
    .filter((playlist) => {
      const matchesYear = selectedYear === 'all' || playlist.year.toString() === selectedYear;
      const matchesStage = selectedStage === 'all' || playlist.stage === selectedStage;
      return matchesYear && matchesStage;
    })
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      } else {
        return b.year - a.year;
      }
    });

  return {
    editMode,
    setEditMode,
    selectedPlaylist,
    setSelectedPlaylist,
    selectedSubPlaylist,
    setSelectedSubPlaylist,
    playlists,
    subPlaylistCounts,
    isLoading,
    sortBy,
    setSortBy,
    isPlaylistDialogOpen,
    setIsPlaylistDialogOpen,
    playlistFormData,
    setPlaylistFormData,
    handleSavePlaylist,
    handleDeletePlaylist,
    handleDeleteSubPlaylist,
    handleDeleteVideo,
    handleMoveSubPlaylist,
    handleCreatePlaylistSubmit,
    handleCreateSubPlaylist,
    handleUpdateSubPlaylist,
    handleVideoAdd,
    formatDate,
    filterConfigs,
    filteredPlaylists,
  };
}
