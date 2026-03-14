'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Archive, Plus, Youtube, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { YouTubeOAuthService } from '@/features/materials/services/youtube-oauth-service';

const YOUTUBE_OAUTH_POPUP_WIDTH = 520;
const YOUTUBE_OAUTH_POPUP_HEIGHT = 640;

function EditMaterialPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [youtubeAuthLoading, setYoutubeAuthLoading] = useState(false);
  const youtubeOAuthService = useMemo(() => new YouTubeOAuthService(), []);

  // コールバック: YouTube認証後のリダイレクトで付与されるクエリを処理
  useEffect(() => {
    const status = searchParams.get('youtube_auth');
    const message = searchParams.get('message');
    if (!status) return;

    const decodedMessage = message ? decodeURIComponent(message) : undefined;
    if (status === 'success') {
      toast.success('YouTube認証が完了しました');
      if (typeof window !== 'undefined' && window.opener) {
        window.opener.postMessage({ type: 'youtube_oauth_complete', success: true }, window.location.origin);
        window.close();
      } else {
        router.replace('/materials/edit', { scroll: false });
      }
    } else if (status === 'error') {
      toast.error(decodedMessage ?? 'YouTube認証に失敗しました');
      if (typeof window !== 'undefined' && window.opener) {
        window.opener.postMessage({ type: 'youtube_oauth_complete', success: false, message: decodedMessage }, window.location.origin);
        window.close();
      } else {
        router.replace('/materials/edit', { scroll: false });
      }
    }
  }, [searchParams, router]);

  // ポップアップからの完了メッセージを受信（親ウィンドウ側）
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'youtube_oauth_complete') return;
      if (event.data.success) {
        toast.success('YouTube認証が完了しました');
      } else {
        toast.error(event.data.message ?? 'YouTube認証に失敗しました');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const startYouTubeAuth = useCallback(async () => {
    setYoutubeAuthLoading(true);
    try {
      const { authorization_url } = await youtubeOAuthService.getAuthorizeUrl();
      const left = Math.round((window.screen.width - YOUTUBE_OAUTH_POPUP_WIDTH) / 2);
      const top = Math.round((window.screen.height - YOUTUBE_OAUTH_POPUP_HEIGHT) / 2);
      window.open(
        authorization_url,
        'youtube_oauth',
        `width=${YOUTUBE_OAUTH_POPUP_WIDTH},height=${YOUTUBE_OAUTH_POPUP_HEIGHT},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
    } catch (err) {
      console.error(err);
      toast.error('認証の開始に失敗しました。設定を確認してください。');
    } finally {
      setYoutubeAuthLoading(false);
    }
  }, [youtubeOAuthService]);

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
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setIsPlaylistDialogOpen(true)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  プレイリストを追加
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                  onClick={startYouTubeAuth}
                  disabled={youtubeAuthLoading}
                >
                  {youtubeAuthLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Youtube className="h-4 w-4" />
                  )}
                  YouTube認証
                </Button>
              </div>
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

export default function EditMaterialPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]">読み込み中...</div>}>
      <EditMaterialPageContent />
    </Suspense>
  );
}
