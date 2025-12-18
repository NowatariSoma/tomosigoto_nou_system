import re
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime, date

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from supabase import Client

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.core.config import settings
from app.repositories.materials_youtube_repository import MaterialsPlaylistRepository, MaterialsSubPlaylistRepository, MaterialsVideoRepository, MaterialsFavoriteRepository

logger = logging.getLogger(__name__)

class MaterialsPlaylistService:
    """プレイリストの関連の機能を実装するクラス"""

    def __init__(self, materials_playlist_repository: MaterialsPlaylistRepository):
        self.materials_playlist_repository = materials_playlist_repository

    async def get_all_materials_playlists(self) -> List[Dict[str, Any]]:
        """すべてのプレイリストを取得"""
        return await self.materials_playlist_repository.find_all()

    async def get_materials_playlist_by_id(self, playlist_id: UUID) -> Dict[str, Any]:
        """指定したIDのプレイリストを取得"""
        return await self.materials_playlist_repository.find_by_id(playlist_id)

    async def create_materials_playlist(self, playlist_data: Dict[str, Any]) -> Dict[str, Any]:
        """プレイリストを作成"""
        return await self.materials_playlist_repository.create(playlist_data)

    async def update_materials_playlist(self, playlist_id: UUID, playlist_data: Dict[str, Any]) -> Dict[str, Any]:
        """プレイリストを更新"""
        return await self.materials_playlist_repository.update(playlist_id, playlist_data)

    async def delete_materials_playlist(self, playlist_id: UUID) -> bool:
        """プレイリストを削除"""
        return await self.materials_playlist_repository.delete(playlist_id)

    async def search_materials_playlists(
        self,
        title: Optional[str] = None,
        name: Optional[str] = None,
        year: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """プレイリストを検索"""
        return await self.materials_playlist_repository.search(
            title=title,
            name=name,
            year=year
        )


class MaterialsSubPlaylistService:
    """サブプレイリストの関連の機能を実装するクラス"""

    def __init__(
        self, 
        materials_sub_playlist_repository: MaterialsSubPlaylistRepository,
        materials_video_repository: MaterialsVideoRepository,
        materials_playlist_repository: MaterialsPlaylistRepository,
        supabase_client: Client
    ):
        self.materials_sub_playlist_repository = materials_sub_playlist_repository
        self.materials_video_repository = materials_video_repository
        self.materials_playlist_repository = materials_playlist_repository
        self.supabase_client = supabase_client
        self.youtube_scopes = [
            'https://www.googleapis.com/auth/youtube.readonly'
        ]

    async def get_all_materials_sub_playlists(self, playlist_id: UUID) -> List[Dict[str, Any]]:
        """指定されたプレイリストのサブプレイリストを取得"""
        return await self.materials_sub_playlist_repository.find_all(playlist_id)

    async def get_materials_sub_playlist_by_id(self, playlist_id: UUID, sub_playlist_id: UUID) -> Dict[str, Any]:
        """指定したIDのサブプレイリストを取得"""
        return await self.materials_sub_playlist_repository.find_by_id(playlist_id, sub_playlist_id)

    def _extract_playlist_id(self, playlist_url: str) -> str:
        """
        YouTube再生リストURLからプレイリストIDを抽出
        
        Args:
            playlist_url: YouTube再生リストURL
            
        Returns:
            プレイリストID
            
        Raises:
            APIException: URLが無効な場合
        """
        patterns = [
            r"list=([a-zA-Z0-9_-]+)",
            r"/playlist\?list=([a-zA-Z0-9_-]+)",
            r"playlist/([a-zA-Z0-9_-]+)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, playlist_url)
            if match:
                return match.group(1)
        
        raise APIException(ErrorMessage.INVALID_PLAYLIST_URL)

    def _get_client_secret(self) -> Optional[str]:
        """
        環境変数からclient_secretを取得

        Returns:
            client_secret、またはNone
        """
        return settings.GOOGLE_CLIENT_SECRET

    async def _get_system_credentials(self) -> Optional[Credentials]:
        """
        システム管理者のOAuth認証情報を取得

        Returns:
            Google認証情報、またはNone（トークンがない場合）
        """
        try:
            response = (
                self.supabase_client.table("youtube_oauth_tokens")
                .select("*")
                .eq("account_type", "system")
                .execute()
            )

            if not response.data:
                return None

            token_data = response.data[0]

            # client_secretを取得（DBに保存されていないため環境変数またはファイルから）
            client_secret = token_data.get("client_secret") or self._get_client_secret()

            if not client_secret:
                logger.error("client_secret not found in DB or secrets file")
                raise APIException(ErrorMessage.CLIENT_SECRET_NOT_FOUND)

            creds = Credentials(
                token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token"),
                token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
                client_id=token_data.get("client_id"),
                client_secret=client_secret,
                scopes=token_data.get("scopes", [])
            )

            # トークンが期限切れの場合はリフレッシュ
            if creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                    # 更新されたトークンをDBに保存
                    self.supabase_client.table("youtube_oauth_tokens").update({
                        "access_token": creds.token,
                        "expiry": creds.expiry.isoformat() if creds.expiry else None,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", token_data["id"]).execute()
                    logger.info("YouTube OAuth token refreshed successfully")
                except Exception as e:
                    logger.error(f"Failed to refresh YouTube OAuth token: {str(e)}")
                    raise APIException(ErrorMessage.TOKEN_REFRESH_FAILED(str(e)))

            return creds
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Failed to get system credentials: {str(e)}")
            return None

    async def _get_videos_from_playlist(
        self,
        playlist_url: str,
        credentials: Optional[Credentials] = None
    ) -> List[Dict[str, Any]]:
        """
        YouTube APIから再生リスト内の動画一覧を取得（限定公開動画も含む）
        
        Args:
            playlist_url: YouTube再生リストURL
            credentials: OAuth認証情報（Noneの場合はシステム管理者のトークンを使用）
            
        Returns:
            動画情報のリスト
            
        Raises:
            APIException: APIエラーが発生した場合
        """
        playlist_id = self._extract_playlist_id(playlist_url)
        videos = []
        next_page_token = None
        
        # 認証情報が指定されていない場合はシステム管理者のトークンを使用
        if not credentials:
            credentials = await self._get_system_credentials()
        
        if not credentials:
            raise APIException(ErrorMessage.OAUTH_TOKEN_NOT_FOUND)
        
        try:
            service = build("youtube", "v3", credentials=credentials)
            
            while True:
                # プレイリストアイテムを取得
                response = service.playlistItems().list(
                    part="snippet,contentDetails",
                    playlistId=playlist_id,
                    maxResults=50,
                    pageToken=next_page_token
                ).execute()
                
                if not response.get("items"):
                    break
                
                # 動画IDのリストを作成
                video_ids = [
                    item["contentDetails"]["videoId"]
                    for item in response["items"]
                ]
                
                if not video_ids:
                    break
                
                # 動画の詳細情報を取得
                video_response = service.videos().list(
                    part="snippet,contentDetails",
                    id=",".join(video_ids)
                ).execute()
                
                # 動画情報を整形
                for video in video_response.get("items", []):
                    snippet = video["snippet"]
                    videos.append({
                        "youtube_video_id": video["id"],
                        "title": snippet["title"],
                        "description": snippet.get("description", ""),
                        "published_at": snippet.get("publishedAt"),
                        "thumbnail_url": (
                            snippet.get("thumbnails", {})
                            .get("high", {})
                            .get("url") or
                            snippet.get("thumbnails", {})
                            .get("default", {})
                            .get("url")
                        ),
                    })
                
                next_page_token = response.get("nextPageToken")
                if not next_page_token:
                    break
                    
        except Exception as e:
            error_msg = str(e)
            logger.error(f"YouTube API error: {error_msg}", exc_info=True)
            
            if "quotaExceeded" in error_msg or "quota" in error_msg.lower():
                raise APIException(ErrorMessage.YOUTUBE_QUOTA_EXCEEDED)
            elif "forbidden" in error_msg.lower() or "403" in error_msg:
                raise APIException(ErrorMessage.YOUTUBE_ACCESS_DENIED)
            elif "notFound" in error_msg.lower() or "404" in error_msg:
                raise APIException(ErrorMessage.YOUTUBE_PLAYLIST_NOT_FOUND)
            else:
                raise APIException(ErrorMessage.YOUTUBE_API_ERROR(error_msg))
        
        return videos

    async def _update_sub_playlist_thumbnail_from_videos(
        self,
        sub_playlist_id: UUID,
        playlist_id: UUID
    ) -> None:
        """
        サブプレイリストのサムネイルを子の動画の最初のサムネイルで更新
        
        Args:
            sub_playlist_id: サブプレイリストID
            playlist_id: プレイリストID（更新用）
        """
        try:
            # サブプレイリストに紐づく動画を取得
            videos = await self.materials_video_repository.find_all(sub_playlist_id)
            
            # thumbnail_url が設定されている最初の動画を探す
            thumbnail_url = None
            for video in videos:
                if video.get("thumbnail_url"):
                    thumbnail_url = video["thumbnail_url"]
                    break
            
            # サムネイルが見つかった場合のみ更新
            if thumbnail_url:
                await self.materials_sub_playlist_repository.update(
                    playlist_id,
                    sub_playlist_id,
                    {"thumbnail_url": thumbnail_url}
                )
                logger.info(f"Updated sub-playlist {sub_playlist_id} thumbnail from videos")
            else:
                logger.debug(f"No thumbnail found for sub-playlist {sub_playlist_id} videos")
        except Exception as e:
            # エラーが発生しても処理は継続（警告として記録）
            logger.warning(f"Failed to update sub-playlist thumbnail from videos: {str(e)}")

    async def _update_playlist_thumbnail_from_sub_playlists(
        self,
        playlist_id: UUID
    ) -> None:
        """
        プレイリストのサムネイルを関連サブプレイリストの最初のサムネイルで更新
        
        Args:
            playlist_id: プレイリストID
        """
        try:
            # プレイリストに紐づくサブプレイリストを取得
            sub_playlists = await self.materials_sub_playlist_repository.find_all(playlist_id)
            
            # thumbnail_url が設定されている最初のサブプレイリストを探す
            thumbnail_url = None
            for sub_playlist in sub_playlists:
                if sub_playlist.get("thumbnail_url"):
                    thumbnail_url = sub_playlist["thumbnail_url"]
                    break
            
            # サムネイルが見つかった場合のみ更新
            if thumbnail_url:
                await self.materials_playlist_repository.update(
                    playlist_id,
                    {"thumbnail_url": thumbnail_url}
                )
                logger.info(f"Updated playlist {playlist_id} thumbnail from sub-playlists")
            else:
                logger.debug(f"No thumbnail found for playlist {playlist_id} sub-playlists")
        except Exception as e:
            # エラーが発生しても処理は継続（警告として記録）
            logger.warning(f"Failed to update playlist thumbnail from sub-playlists: {str(e)}")

    async def _import_videos_from_playlist(
        self,
        playlist_url: str,
        sub_playlist_id: UUID,
        recorded_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        再生リストURLから動画を取得し、指定されたサブプレイリストに登録
        
        Args:
            playlist_url: YouTube再生リストURL
            sub_playlist_id: 登録先のサブプレイリストID
            recorded_date: 録画日（オプション）
            
        Returns:
            インポート結果（imported_count, skipped_count, total_count, warnings）
        """
        imported_count = 0
        skipped_count = 0
        warnings = []
        
        try:
            # YouTube APIから動画一覧を取得
            videos = await self._get_videos_from_playlist(playlist_url)
            
            if not videos:
                return {
                    "imported_count": 0,
                    "skipped_count": 0,
                    "total_count": 0,
                    "warnings": ["動画が見つかりませんでした"]
                }
            
            # 動画をDBに登録
            for video in videos:
                # 既存チェック（video_urlで判定）
                video_url = f"https://www.youtube.com/watch?v={video['youtube_video_id']}"
                
                existing = (
                    self.supabase_client.table("videos")
                    .select("id")
                    .eq("sub_playlist_id", str(sub_playlist_id))
                    .eq("video_url", video_url)
                    .execute()
                )
                
                if existing.data:
                    skipped_count += 1
                    continue
                
                # published_atからrecorded_dateを推測（サブプレイリストのrecorded_dateがない場合）
                video_recorded_date = recorded_date
                if not video_recorded_date and video.get("published_at"):
                    try:
                        published = datetime.fromisoformat(
                            video["published_at"].replace("Z", "+00:00")
                        )
                        video_recorded_date = published.date().isoformat()
                    except Exception:
                        pass
                
                # 動画を登録
                video_data = {
                    "sub_playlist_id": str(sub_playlist_id),
                    "title": video["title"],
                    "video_url": video_url,
                    "recorded_date": video_recorded_date,
                    "thumbnail_url": video.get("thumbnail_url")
                }
                
                try:
                    await self.materials_video_repository.create(
                        sub_playlist_id,
                        video_data
                    )
                    imported_count += 1
                except Exception as e:
                    logger.error(f"Failed to create video {video.get('youtube_video_id', 'unknown')}: {str(e)}")
                    warnings.append(f"動画 '{video.get('title', 'Unknown')}' の登録に失敗しました: {str(e)}")
            
            # サブプレイリストのサムネイルを更新（子の動画の最初のサムネイルを使用）
            try:
                # サブプレイリスト情報を取得して playlist_id を取得
                sub_playlist_info = (
                    self.supabase_client.table("sub_playlists")
                    .select("playlist_id")
                    .eq("id", str(sub_playlist_id))
                    .execute()
                )
                if sub_playlist_info.data:
                    playlist_id = UUID(sub_playlist_info.data[0]["playlist_id"])
                    # サブプレイリストのサムネイルを更新
                    await self._update_sub_playlist_thumbnail_from_videos(sub_playlist_id, playlist_id)
                    # 親プレイリストのサムネイルも更新
                    await self._update_playlist_thumbnail_from_sub_playlists(playlist_id)
            except Exception as e:
                # サムネイル更新のエラーは警告として記録するが、処理は継続
                logger.warning(f"Failed to update thumbnails after video import: {str(e)}")
            
            return {
                "imported_count": imported_count,
                "skipped_count": skipped_count,
                "total_count": len(videos),
                "warnings": warnings
            }
            
        except APIException as e:
            # API例外は警告として返す
            error_msg = e.detail.get("error_msg", str(e.detail)) if isinstance(e.detail, dict) else str(e.detail)
            logger.warning(f"Failed to import videos from playlist: {error_msg}")
            warnings.append(f"動画のインポートに失敗しました: {error_msg}")
            return {
                "imported_count": imported_count,
                "skipped_count": skipped_count,
                "total_count": 0,
                "warnings": warnings
            }
        except Exception as e:
            # その他のエラーも警告として返す
            logger.error(f"Unexpected error during video import: {str(e)}")
            warnings.append(f"動画のインポート中にエラーが発生しました: {str(e)}")
            return {
                "imported_count": imported_count,
                "skipped_count": skipped_count,
                "total_count": 0,
                "warnings": warnings
            }

    async def create_materials_sub_playlist(
        self, 
        playlist_id: UUID, 
        sub_playlist_data: Dict[str, Any],
        auto_import_videos: bool = True
    ) -> Dict[str, Any]:
        """
        サブプレイリストを作成し、playlist_urlがある場合は動画を自動インポート
        
        Args:
            playlist_id: プレイリストID
            sub_playlist_data: サブプレイリストデータ
            auto_import_videos: 動画を自動インポートするかどうか
        """
        # サブプレイリストを作成
        sub_playlist = await self.materials_sub_playlist_repository.create(
            playlist_id, 
            sub_playlist_data
        )
        
        # playlist_urlが存在し、自動インポートが有効な場合
        playlist_url = sub_playlist_data.get("playlist_url")
        
        if playlist_url and auto_import_videos:
            sub_playlist_id = UUID(sub_playlist["id"])
            recorded_date = sub_playlist_data.get("recorded_date")
            
            # recorded_dateを文字列に変換（既に文字列の場合はそのまま）
            recorded_date_str = None
            if recorded_date:
                if isinstance(recorded_date, str):
                    recorded_date_str = recorded_date
                elif hasattr(recorded_date, 'isoformat'):
                    recorded_date_str = recorded_date.isoformat()
                else:
                    recorded_date_str = str(recorded_date)
            
            # 動画をインポート
            try:
                import_result = await self._import_videos_from_playlist(
                    playlist_url,
                    sub_playlist_id,
                    recorded_date_str
                )
                
                # インポート結果をサブプレイリストに追加
                sub_playlist["import_result"] = import_result
                if import_result["warnings"]:
                    sub_playlist["import_warnings"] = import_result["warnings"]
            except Exception as e:
                logger.error(f"Failed to import videos during sub-playlist creation: {str(e)}", exc_info=True)
                # エラーが発生してもサブプレイリストは作成済みなので、エラー情報を追加
                sub_playlist["import_result"] = {
                    "imported_count": 0,
                    "skipped_count": 0,
                    "total_count": 0,
                    "warnings": [f"動画のインポート中にエラーが発生しました: {str(e)}"]
                }
                sub_playlist["import_warnings"] = [f"動画のインポート中にエラーが発生しました: {str(e)}"]
        
        return sub_playlist

    async def update_materials_sub_playlist(
        self, 
        playlist_id: UUID, 
        sub_playlist_id: UUID, 
        sub_playlist_data: Dict[str, Any],
        auto_import_videos: bool = True
    ) -> Dict[str, Any]:
        """
        サブプレイリストを更新し、playlist_urlが変更された場合は動画を再インポート
        
        Args:
            playlist_id: プレイリストID
            sub_playlist_id: サブプレイリストID
            sub_playlist_data: 更新データ
            auto_import_videos: 動画を自動インポートするかどうか
        """
        # 既存のサブプレイリストを取得
        existing_sub_playlist = await self.materials_sub_playlist_repository.find_by_id(
            playlist_id, sub_playlist_id
        )
        
        if not existing_sub_playlist:
            raise APIException(ErrorMessage.SUB_PLAYLIST_NOT_FOUND)
        
        # サブプレイリストを更新
        updated_sub_playlist = await self.materials_sub_playlist_repository.update(
            playlist_id, 
            sub_playlist_id, 
            sub_playlist_data
        )
        
        # playlist_urlが変更された場合、動画を再インポート
        new_playlist_url = sub_playlist_data.get("playlist_url")
        old_playlist_url = existing_sub_playlist.get("playlist_url")
        
        if new_playlist_url and new_playlist_url != old_playlist_url and auto_import_videos:
            recorded_date = sub_playlist_data.get("recorded_date") or existing_sub_playlist.get("recorded_date")
            
            # recorded_dateを文字列に変換（既に文字列の場合はそのまま）
            recorded_date_str = None
            if recorded_date:
                if isinstance(recorded_date, str):
                    recorded_date_str = recorded_date
                elif hasattr(recorded_date, 'isoformat'):
                    recorded_date_str = recorded_date.isoformat()
                else:
                    recorded_date_str = str(recorded_date)
            
            # 動画をインポート
            try:
                import_result = await self._import_videos_from_playlist(
                    new_playlist_url,
                    sub_playlist_id,
                    recorded_date_str
                )
                
                # インポート結果をサブプレイリストに追加
                updated_sub_playlist["import_result"] = import_result
                if import_result["warnings"]:
                    updated_sub_playlist["import_warnings"] = import_result["warnings"]
            except Exception as e:
                logger.error(f"Failed to import videos during sub-playlist update: {str(e)}", exc_info=True)
                # エラーが発生してもサブプレイリストは更新済みなので、エラー情報を追加
                updated_sub_playlist["import_result"] = {
                    "imported_count": 0,
                    "skipped_count": 0,
                    "total_count": 0,
                    "warnings": [f"動画のインポート中にエラーが発生しました: {str(e)}"]
                }
                updated_sub_playlist["import_warnings"] = [f"動画のインポート中にエラーが発生しました: {str(e)}"]
        
        # 既存の動画からサムネイルを更新（動画インポートが行われなかった場合でも実行）
        try:
            await self._update_sub_playlist_thumbnail_from_videos(sub_playlist_id, playlist_id)
            # 親プレイリストのサムネイルも更新
            await self._update_playlist_thumbnail_from_sub_playlists(playlist_id)
        except Exception as e:
            # サムネイル更新のエラーは警告として記録するが、処理は継続
            logger.warning(f"Failed to update thumbnails after sub-playlist update: {str(e)}")
        
        return updated_sub_playlist

    async def delete_materials_sub_playlist(self, playlist_id: UUID, sub_playlist_id: UUID) -> bool:
        """サブプレイリストを削除"""
        return await self.materials_sub_playlist_repository.delete(playlist_id, sub_playlist_id)

    async def search_materials_sub_playlists(
        self,
        playlist_id: UUID,
        title: Optional[str] = None,
        phase: Optional[str] = None,
        recorded_date_from: Optional[date] = None,
        recorded_date_to: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """サブプレイリストを検索"""
        return await self.materials_sub_playlist_repository.search(
            playlist_id=playlist_id,
            title=title,
            phase=phase,
            recorded_date_from=recorded_date_from,
            recorded_date_to=recorded_date_to
        )


class MaterialsVideoService:
    """ビデオの関連の機能を実装するクラス"""

    def __init__(
        self, 
        materials_video_repository: MaterialsVideoRepository,
        materials_sub_playlist_repository: MaterialsSubPlaylistRepository
    ):
        self.materials_video_repository = materials_video_repository
        self.materials_sub_playlist_repository = materials_sub_playlist_repository

    async def _validate_sub_playlist_belongs_to_playlist(self, playlist_id: UUID, sub_playlist_id: UUID) -> None:
        """サブプレイリストが指定されたプレイリストに属しているかを検証"""
        sub_playlist = await self.materials_sub_playlist_repository.find_by_id(playlist_id, sub_playlist_id)
        if not sub_playlist:
            raise APIException(ErrorMessage.SUB_PLAYLIST_NOT_FOUND)

    async def get_all_materials_videos(self, playlist_id: UUID, sub_playlist_id: UUID) -> List[Dict[str, Any]]:
        """指定されたサブプレイリストのビデオを取得"""
        await self._validate_sub_playlist_belongs_to_playlist(playlist_id, sub_playlist_id)
        return await self.materials_video_repository.find_all(sub_playlist_id)

    async def get_materials_video_by_id(self, playlist_id: UUID, sub_playlist_id: UUID, video_id: UUID) -> Dict[str, Any]:
        """指定したIDのビデオを取得"""
        await self._validate_sub_playlist_belongs_to_playlist(playlist_id, sub_playlist_id)
        return await self.materials_video_repository.find_by_id(sub_playlist_id, video_id)

    async def create_materials_video(self, playlist_id: UUID, sub_playlist_id: UUID, video_data: Dict[str, Any]) -> Dict[str, Any]:
        """ビデオを作成"""
        await self._validate_sub_playlist_belongs_to_playlist(playlist_id, sub_playlist_id)
        return await self.materials_video_repository.create(sub_playlist_id, video_data)

    async def update_materials_video(self, playlist_id: UUID, sub_playlist_id: UUID, video_id: UUID, video_data: Dict[str, Any]) -> Dict[str, Any]:
        """ビデオを更新"""
        await self._validate_sub_playlist_belongs_to_playlist(playlist_id, sub_playlist_id)
        return await self.materials_video_repository.update(sub_playlist_id, video_id, video_data)

    async def delete_materials_video(self, playlist_id: UUID, sub_playlist_id: UUID, video_id: UUID) -> bool:
        """ビデオを削除"""
        await self._validate_sub_playlist_belongs_to_playlist(playlist_id, sub_playlist_id)
        return await self.materials_video_repository.delete(sub_playlist_id, video_id)

    async def search_materials_videos(
        self,
        playlist_id: UUID,
        sub_playlist_id: UUID,
        title: Optional[str] = None,
        recorded_date_from: Optional[date] = None,
        recorded_date_to: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """ビデオを検索"""
        await self._validate_sub_playlist_belongs_to_playlist(playlist_id, sub_playlist_id)
        return await self.materials_video_repository.search(
            sub_playlist_id=sub_playlist_id,
            title=title,
            recorded_date_from=recorded_date_from,
            recorded_date_to=recorded_date_to
        )


class MaterialsFavoriteService:
    """お気に入りの関連の機能を実装するクラス"""

    def __init__(self, materials_favorite_repository: MaterialsFavoriteRepository):
        self.materials_favorite_repository = materials_favorite_repository

    async def get_all_materials_favorites(self) -> List[Dict[str, Any]]:
        """すべてのお気に入りを取得"""
        return await self.materials_favorite_repository.find_all()

    async def get_materials_favorite_by_id(self, favorite_id: UUID) -> Dict[str, Any]:
        """指定したIDのお気に入りを取得"""
        return await self.materials_favorite_repository.find_by_id(favorite_id)

    async def get_favorites_by_user_id(self, user_id: UUID) -> List[Dict[str, Any]]:
        """指定したユーザーIDのお気に入り一覧を取得"""
        return await self.materials_favorite_repository.find_by_user_id(user_id)

    async def is_favorited(self, user_id: UUID, video_id: UUID) -> bool:
        """指定したユーザーがビデオをお気に入り登録しているかチェック"""
        favorite = await self.materials_favorite_repository.find_by_user_id_and_video_id(user_id, video_id)
        return favorite is not None

    async def create_materials_favorite(self, favorite_data: Dict[str, Any]) -> Dict[str, Any]:
        """お気に入りを作成"""
        # 既に存在する場合はエラーを返す
        user_id = favorite_data.get("user_id")
        video_id = favorite_data.get("video_id")
        if user_id and video_id:
            existing = await self.materials_favorite_repository.find_by_user_id_and_video_id(
                UUID(user_id) if isinstance(user_id, str) else user_id,
                UUID(video_id) if isinstance(video_id, str) else video_id
            )
            if existing:
                raise APIException(ErrorMessage.FAVORITE_ALREADY_EXISTS)
        return await self.materials_favorite_repository.create(favorite_data)

    async def toggle_favorite(self, user_id: UUID, video_id: UUID) -> Dict[str, Any]:
        """お気に入りの追加/削除を切り替え"""
        existing = await self.materials_favorite_repository.find_by_user_id_and_video_id(user_id, video_id)
        
        if existing:
            # 既に存在する場合は削除
            await self.materials_favorite_repository.delete_by_user_id_and_video_id(user_id, video_id)
            return {"is_favorited": False, "message": "お気に入りを解除しました"}
        else:
            # 存在しない場合は追加
            favorite_data = {
                "user_id": str(user_id),
                "video_id": str(video_id)
            }
            favorite = await self.materials_favorite_repository.create(favorite_data)
            return {"is_favorited": True, "favorite": favorite, "message": "お気に入りに追加しました"}

    async def delete_materials_favorite(self, user_id: UUID, video_id: UUID) -> bool:
        """指定したユーザーIDとビデオIDのお気に入りを削除"""
        return await self.materials_favorite_repository.delete_by_user_id_and_video_id(user_id, video_id)

    async def update_materials_favorite(self, favorite_id: UUID, favorite_data: Dict[str, Any]) -> Dict[str, Any]:
        """お気に入りを更新"""
        return await self.materials_favorite_repository.update(favorite_id, favorite_data)

    async def delete_materials_favorite_by_id(self, favorite_id: UUID) -> bool:
        """お気に入りを削除（ID指定）"""
        return await self.materials_favorite_repository.delete(favorite_id)

    async def get_favorite_videos_with_details(self, user_id: UUID) -> List[Dict[str, Any]]:
        """指定したユーザーIDのお気に入り動画とその関連情報（プレイリスト、サブプレイリスト）を取得"""
        return await self.materials_favorite_repository.find_favorite_videos_with_details(user_id)