'use client';

import { useRouter } from 'next/navigation';
import { Archive, Plus } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { SubPlaylist } from '@/features/materials/types/material_types';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { PlaylistEditListView } from '@/features/materials/components/PlaylistEditListView';
import { CreatePlaylistDialog } from '@/features/materials/components/CreatePlaylistDialog';
import { PlaylistEditViewAsyncWrapper } from '@/features/materials/components/PlaylistEditViewAsyncWrapper';
import { SubPlaylistEditViewAsyncWrapper } from '@/features/materials/components/SubPlaylistEditViewAsyncWrapper';
import { useEditMaterials } from '@/features/materials/hooks/useEditMaterials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';

export default function EditMaterialPage() {
  const router = useRouter();
  const {
    editMode,
    setEditMode,
    selectedPlaylist,
    setSelectedPlaylist,
    selectedSubPlaylist,
    setSelectedSubPlaylist,
    subPlaylistCounts,
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
  } = useEditMaterials();

  return (
    <AppTemplate
      title="能楽部資料庫"
      description="プレイリストの編集"
      icon={<Archive className="h-8 w-8 text-blue-600" />}
      maxWidth="7xl"
    >
      <main className="container mx-auto px-4 py-8">
        {editMode === 'list' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/materials')}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  ← 戻る
                </Button>
                <h1 className="text-xl sm:text-3xl font-bold text-slate-900">プレイリストを編集</h1>
              </div>
              <Button
                onClick={() => setIsPlaylistDialogOpen(true)}
                className="flex items-center gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                プレイリストを追加
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <MaterialFilterSelects filters={filterConfigs} />
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm text-slate-600 whitespace-nowrap">
                  並び順:
                </label>
                <Select value={sortBy} onValueChange={(value: 'createdAt' | 'year') => setSortBy(value)}>
                  <SelectTrigger id="sort-select" className="w-[180px]">
                    <SelectValue placeholder="並び順を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">作成日時</SelectItem>
                    <SelectItem value="year">年度</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <PlaylistEditListView
              playlists={filteredPlaylists}
              getSubPlaylistCount={(playlistId: string) => subPlaylistCounts[playlistId] || 0}
              onPlaylistSelect={(playlist) => {
                setSelectedPlaylist(playlist);
                setEditMode('playlist');
              }}
            />
          </div>
        )}

        {editMode === 'playlist' && selectedPlaylist && (
          <PlaylistEditViewAsyncWrapper
            playlist={selectedPlaylist}
            onBack={() => setEditMode('list')}
            onSavePlaylist={handleSavePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onDeleteSubPlaylist={handleDeleteSubPlaylist}
            onDeleteVideo={handleDeleteVideo}
            onMoveSubPlaylist={handleMoveSubPlaylist}
            onSubPlaylistCreate={handleCreateSubPlaylist}
            onVideoAdd={handleVideoAdd}
            formatDate={formatDate}
            onSubPlaylistClick={(subPlaylist: SubPlaylist) => {
              setSelectedSubPlaylist(subPlaylist);
              setEditMode('subPlaylist');
            }}
          />
        )}

        {editMode === 'subPlaylist' && selectedSubPlaylist && selectedPlaylist && (
          <SubPlaylistEditViewAsyncWrapper
            subPlaylist={selectedSubPlaylist}
            playlist={selectedPlaylist}
            onBack={() => setEditMode('playlist')}
            onDelete={handleDeleteSubPlaylist}
            onMove={handleMoveSubPlaylist}
            onVideoDelete={handleDeleteVideo}
            formatDate={formatDate}
            onSubPlaylistCreate={handleCreateSubPlaylist}
            onSubPlaylistUpdate={handleUpdateSubPlaylist}
            onVideoAdd={handleVideoAdd}
          />
        )}
      </main>

      <CreatePlaylistDialog
        open={isPlaylistDialogOpen}
        onOpenChange={setIsPlaylistDialogOpen}
        playlistData={playlistFormData}
        setPlaylistData={setPlaylistFormData}
        onSubmit={handleCreatePlaylistSubmit}
      />
    </AppTemplate>
  );
}
