"""
youtubeプレイリストのAPIエンドポイント
"""
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.deps import get_current_user, get_materials_playlist_service, get_materials_sub_playlist_service, get_materials_video_service, get_materials_favorite_service
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from pydantic import ValidationError
from app.schemas.materials_youtube import (
    MaterialsPlaylistCreate,
    MaterialsPlaylistResponse,
    MaterialsPlaylistUpdate,
    MaterialsSubPlaylistCreate,
    MaterialsSubPlaylistResponse,
    MaterialsSubPlaylistUpdate,
    MaterialsVideoCreate,
    MaterialsVideoResponse,
    MaterialsVideoUpdate,
    MaterialsFavoritesResponse,
    MaterialsFavoritesCreate,
)
from app.services.materials_youtube_service import MaterialsPlaylistService, MaterialsSubPlaylistService, MaterialsVideoService, MaterialsFavoriteService
from fastapi import APIRouter, Depends, HTTPException, status, Query

router = APIRouter()


@router.get("", response_model=List[MaterialsPlaylistResponse])
@router.get("/", response_model=List[MaterialsPlaylistResponse])
async def get_materials_playlists(
    materials_playlist_service: MaterialsPlaylistService = Depends(get_materials_playlist_service),
):
    """
    youtubeプレイリスト一覧を取得
    """
    return await materials_playlist_service.get_all_materials_playlists()


# お気に入りのAPIエンドポイント（動的パスより前に定義する必要あり）
@router.get("/favorites", response_model=List[MaterialsFavoritesResponse])
async def get_user_favorites(
    current_user: Dict[str, Any] = Depends(get_current_user),
    materials_favorite_service: MaterialsFavoriteService = Depends(get_materials_favorite_service),
):
    """
    現在のユーザーのお気に入り一覧を取得
    """
    user_id = UUID(current_user["id"])
    favorites = await materials_favorite_service.get_favorites_by_user_id(user_id)

    if not favorites:
        return []

    # スキーマに明示的に変換
    result = []
    for favorite in favorites:
        try:
            # UUIDフィールドを確認して変換
            favorite_dict = dict(favorite)

            # UUID変換
            if 'id' in favorite_dict and isinstance(favorite_dict['id'], str):
                favorite_dict['id'] = UUID(favorite_dict['id'])
            if 'user_id' in favorite_dict and isinstance(favorite_dict['user_id'], str):
                favorite_dict['user_id'] = UUID(favorite_dict['user_id'])
            if 'video_id' in favorite_dict and isinstance(favorite_dict['video_id'], str):
                favorite_dict['video_id'] = UUID(favorite_dict['video_id'])

            # スキーマに変換
            favorite_response = MaterialsFavoritesResponse(**favorite_dict)
            result.append(favorite_response)
        except (ValidationError, ValueError, KeyError):
            # バリデーションエラーはスキップして続行
            continue

    return result


@router.get("/videos/{video_id}/favorites/status")
async def get_favorite_status(
    video_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    materials_favorite_service: MaterialsFavoriteService = Depends(get_materials_favorite_service),
):
    """
    指定したビデオが現在のユーザーにお気に入り登録されているかチェック
    """
    user_id = UUID(current_user["id"])
    is_favorited = await materials_favorite_service.is_favorited(user_id, video_id)
    return {"is_favorited": is_favorited, "video_id": str(video_id), "user_id": str(user_id)}


@router.post("/videos/{video_id}/favorites", response_model=MaterialsFavoritesResponse)
async def create_favorite(
    video_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    materials_favorite_service: MaterialsFavoriteService = Depends(get_materials_favorite_service),
):
    """
    指定したビデオをお気に入りに追加
    """
    user_id = UUID(current_user["id"])
    favorite_data = {
        "user_id": str(user_id),
        "video_id": str(video_id)
    }
    try:
        favorite = await materials_favorite_service.create_materials_favorite(favorite_data)
        return favorite
    except APIException as e:
        if e.error_code == "FAVORITE_ALREADY_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=e.error_msg
            )
        raise


@router.delete("/videos/{video_id}/favorites")
async def delete_favorite(
    video_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    materials_favorite_service: MaterialsFavoriteService = Depends(get_materials_favorite_service),
):
    """
    指定したビデオのお気に入りを削除
    """
    user_id = UUID(current_user["id"])
    success = await materials_favorite_service.delete_materials_favorite(user_id, video_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="お気に入りが見つかりません"
        )

    return {"message": "お気に入りを削除しました", "video_id": str(video_id)}


@router.post("/videos/{video_id}/favorites/toggle")
async def toggle_favorite(
    video_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    materials_favorite_service: MaterialsFavoriteService = Depends(get_materials_favorite_service),
):
    """
    指定したビデオのお気に入りを追加/削除を切り替え
    """
    user_id = UUID(current_user["id"])
    result = await materials_favorite_service.toggle_favorite(user_id, video_id)
    return result


@router.get("/{playlist_id}", response_model=MaterialsPlaylistResponse)
async def get_materials_playlist_by_id(
    playlist_id: UUID,
    materials_playlist_service: MaterialsPlaylistService = Depends(get_materials_playlist_service),
):
    """
    youtubeプレイリストを指定したIDで取得
    """
    playlist = await materials_playlist_service.get_materials_playlist_by_id(playlist_id)
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プレイリストが見つかりません"
        )
    return playlist


@router.post("", response_model=MaterialsPlaylistResponse)
@router.post("/", response_model=MaterialsPlaylistResponse)
async def create_materials_playlist(
    materials_playlist_data: MaterialsPlaylistCreate,
    materials_playlist_service: MaterialsPlaylistService = Depends(get_materials_playlist_service),
):
    """
    youtubeプレイリストを作成
    """
    return await materials_playlist_service.create_materials_playlist(
        materials_playlist_data.model_dump()
    )


@router.put("/{playlist_id}", response_model=MaterialsPlaylistResponse)
async def update_materials_playlist(
    playlist_id: UUID,
    materials_playlist_data: MaterialsPlaylistUpdate,
    materials_playlist_service: MaterialsPlaylistService = Depends(get_materials_playlist_service),
):
    """
    youtubeプレイリストを更新
    """
    # None値を除外
    update_dict = {k: v for k, v in materials_playlist_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新するデータが指定されていません"
        )
    
    playlist = await materials_playlist_service.update_materials_playlist(
        playlist_id, update_dict
    )
    return playlist


@router.delete("/{playlist_id}")
async def delete_materials_playlist(
    playlist_id: UUID,
    materials_playlist_service: MaterialsPlaylistService = Depends(get_materials_playlist_service),
):
    """
    youtubeプレイリストを削除
    """
    success = await materials_playlist_service.delete_materials_playlist(playlist_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="削除に失敗しました"
        )
    
    return {"message": "プレイリストを削除しました"}


# サブプレイリストのAPIエンドポイント
@router.get("/{playlist_id}/sub-playlists", response_model=List[MaterialsSubPlaylistResponse])
async def get_materials_sub_playlists(
    playlist_id: UUID,
    materials_sub_playlist_service: MaterialsSubPlaylistService = Depends(get_materials_sub_playlist_service),
):
    """
    youtubeプレイリストのサブプレイリスト一覧を取得
    """
    return await materials_sub_playlist_service.get_all_materials_sub_playlists(playlist_id)
    

@router.get("/{playlist_id}/sub-playlists/{sub_playlist_id}", response_model=MaterialsSubPlaylistResponse)
async def get_materials_sub_playlist_by_id(
    playlist_id: UUID,
    sub_playlist_id: UUID,
    materials_sub_playlist_service: MaterialsSubPlaylistService = Depends(get_materials_sub_playlist_service),
):
    """
    youtubeプレイリストのサブプレイリストを指定したIDで取得
    """
    sub_playlist = await materials_sub_playlist_service.get_materials_sub_playlist_by_id(playlist_id, sub_playlist_id)
    if not sub_playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="サブプレイリストが見つかりません"
        )
    return sub_playlist
    

@router.post("/{playlist_id}/sub-playlists", response_model=MaterialsSubPlaylistResponse)
async def create_materials_sub_playlist(
    playlist_id: UUID,
    materials_sub_playlist_data: MaterialsSubPlaylistCreate,
    materials_sub_playlist_service: MaterialsSubPlaylistService = Depends(get_materials_sub_playlist_service),
):
    """
    youtubeプレイリストのサブプレイリストを作成
    
    playlist_urlが指定されている場合、自動的に動画をインポートします。
    限定公開動画を含む場合は、システム管理者のOAuth認証が必要です。
    """
    return await materials_sub_playlist_service.create_materials_sub_playlist(
        playlist_id, 
        materials_sub_playlist_data.model_dump(mode='json'),
        auto_import_videos=True
    )        


@router.put("/{playlist_id}/sub-playlists/{sub_playlist_id}", response_model=MaterialsSubPlaylistResponse)
async def update_materials_sub_playlist(
    playlist_id: UUID,
    sub_playlist_id: UUID,
    materials_sub_playlist_data: MaterialsSubPlaylistUpdate,
    materials_sub_playlist_service: MaterialsSubPlaylistService = Depends(get_materials_sub_playlist_service),
):
    """
    youtubeプレイリストのサブプレイリストを更新
    
    playlist_urlが変更された場合、自動的に動画を再インポートします。
    限定公開動画を含む場合は、システム管理者のOAuth認証が必要です。
    """
    # None値を除外
    update_dict = {k: v for k, v in materials_sub_playlist_data.model_dump(mode='json').items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新するデータが指定されていません"
        )
    
    return await materials_sub_playlist_service.update_materials_sub_playlist(
        playlist_id, sub_playlist_id, update_dict, auto_import_videos=True
    )


@router.delete("/{playlist_id}/sub-playlists/{sub_playlist_id}")
async def delete_materials_sub_playlist(
    playlist_id: UUID,
    sub_playlist_id: UUID,
    materials_sub_playlist_service: MaterialsSubPlaylistService = Depends(get_materials_sub_playlist_service),
):
    """
    youtubeプレイリストのサブプレイリストを削除
    """
    success = await materials_sub_playlist_service.delete_materials_sub_playlist(playlist_id, sub_playlist_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="削除に失敗しました"
        )
    
    return {"message": "サブプレイリストを削除しました"}
    

# ビデオのAPIエンドポイント
@router.get("/{playlist_id}/sub-playlists/{sub_playlist_id}/videos", response_model=List[MaterialsVideoResponse])
async def get_materials_videos(
    playlist_id: UUID,
    sub_playlist_id: UUID,
    materials_video_service: MaterialsVideoService = Depends(get_materials_video_service),
):
    """
    youtubeプレイリストのサブプレイリストのビデオ一覧を取得
    """
    return await materials_video_service.get_all_materials_videos(playlist_id, sub_playlist_id)


@router.get("/{playlist_id}/sub-playlists/{sub_playlist_id}/videos/{video_id}", response_model=MaterialsVideoResponse)
async def get_materials_video_by_id(
    playlist_id: UUID,
    sub_playlist_id: UUID,
    video_id: UUID,
    materials_video_service: MaterialsVideoService = Depends(get_materials_video_service),
):
    """
    youtubeプレイリストのサブプレイリストのビデオを指定したIDで取得
    """
    video = await materials_video_service.get_materials_video_by_id(playlist_id, sub_playlist_id, video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ビデオが見つかりません"
        )
    return video
    

@router.post("/{playlist_id}/sub-playlists/{sub_playlist_id}/videos", response_model=MaterialsVideoResponse)
async def create_materials_video(
    playlist_id: UUID,
    sub_playlist_id: UUID,
    materials_video_data: MaterialsVideoCreate,
    materials_video_service: MaterialsVideoService = Depends(get_materials_video_service),
):
    """
    youtubeプレイリストのサブプレイリストのビデオを作成
    """
    return await materials_video_service.create_materials_video(playlist_id, sub_playlist_id, materials_video_data.model_dump(mode='json'))
    

@router.put("/{playlist_id}/sub-playlists/{sub_playlist_id}/videos/{video_id}", response_model=MaterialsVideoResponse)
async def update_materials_video(
    playlist_id: UUID,
    sub_playlist_id: UUID,
    video_id: UUID,
    materials_video_data: MaterialsVideoUpdate,
    materials_video_service: MaterialsVideoService = Depends(get_materials_video_service),
):
    """
    youtubeプレイリストのサブプレイリストのビデオを更新
    """
    # None値を除外
    update_dict = {k: v for k, v in materials_video_data.model_dump(mode='json').items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新するデータが指定されていません"
        )
    
    return await materials_video_service.update_materials_video(
        playlist_id, sub_playlist_id, video_id, update_dict
    )
    

@router.delete("/{playlist_id}/sub-playlists/{sub_playlist_id}/videos/{video_id}")
async def delete_materials_video(
    playlist_id: UUID,
    sub_playlist_id: UUID,
    video_id: UUID,
    materials_video_service: MaterialsVideoService = Depends(get_materials_video_service),
):
    """
    youtubeプレイリストのサブプレイリストのビデオを削除
    """
    success = await materials_video_service.delete_materials_video(playlist_id, sub_playlist_id, video_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="削除に失敗しました"
        )
    
    return {"message": "ビデオを削除しました"}