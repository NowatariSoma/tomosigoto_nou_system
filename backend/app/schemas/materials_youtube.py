from datetime import datetime, date, time
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

class MaterialsPlaylistBase(BaseModel):
    """プレイリストの基本情報"""
    title: str = Field(..., description="タイトル")
    name: str = Field(..., description="舞台名")
    year: int = Field(..., description="年度")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")


class MaterialsPlaylistCreate(MaterialsPlaylistBase):
    """プレイリスト作成用スキーマ"""
    pass


class MaterialsPlaylistResponse(MaterialsPlaylistBase):
    """プレイリストレスポンス用スキーマ"""
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MaterialsPlaylistUpdate(MaterialsPlaylistBase):
    """プレイリスト更新用スキーマ"""
    title: Optional[str] = Field(None, description="タイトル")
    name: Optional[str] = Field(None, description="舞台名")
    year: Optional[int] = Field(None, description="年度")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")


class MaterialsSubPlaylistBase(BaseModel):
    """サブプレイリストの基本情報"""
    title: str = Field(..., description="タイトル")
    recorded_date: date = Field(..., description="録画日")
    phase: str = Field(..., description="フェーズ")
    playlist_url: str = Field(..., description="プレイリストURL")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")


class MaterialsSubPlaylistCreate(MaterialsSubPlaylistBase):
    """サブプレイリスト作成用スキーマ"""
    pass


class MaterialsSubPlaylistResponse(MaterialsSubPlaylistBase):
    """サブプレイリストレスポンス用スキーマ"""
    id: UUID
    playlist_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True, extra='allow')  # 追加フィールド（import_result等）を許可


class MaterialsSubPlaylistUpdate(MaterialsSubPlaylistBase):
    """サブプレイリスト更新用スキーマ"""
    title: Optional[str] = Field(None, description="タイトル")
    recorded_date: Optional[date] = Field(None, description="録画日")
    phase: Optional[str] = Field(None, description="フェーズ")
    playlist_url: Optional[str] = Field(None, description="プレイリストURL")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")


class MaterialsVideoBase(BaseModel):
    """ビデオの基本情報"""
    title: str = Field(..., description="タイトル")
    video_url: str = Field(..., description="ビデオURL")
    recorded_date: date = Field(..., description="録画日")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")


class MaterialsVideoCreate(MaterialsVideoBase):
    """ビデオ作成用スキーマ"""
    pass


class MaterialsVideoResponse(MaterialsVideoBase):
    """ビデオレスポンス用スキーマ"""
    id: UUID
    sub_playlist_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # タグ情報
    tags: Optional[List["VideoTagResponse"]] = Field(None, description="関連タグ")

    model_config = ConfigDict(from_attributes=True)


class MaterialsVideoUpdate(MaterialsVideoBase):
    """ビデオ更新用スキーマ"""
    title: Optional[str] = Field(None, description="タイトル")
    video_url: Optional[str] = Field(None, description="ビデオURL")
    recorded_date: Optional[date] = Field(None, description="録画日")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")


class MaterialsFavoritesBase(BaseModel):
    """お気に入りの基本情報"""
    user_id: UUID = Field(..., description="ユーザーID")
    video_id: UUID = Field(..., description="ビデオID")


class MaterialsFavoritesCreate(MaterialsFavoritesBase):
    """お気に入り作成用スキーマ"""
    pass


class MaterialsFavoritesResponse(MaterialsFavoritesBase):
    """お気に入りレスポンス用スキーマ"""
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class MaterialsFavoritesUpdate(MaterialsFavoritesBase):
    """お気に入り更新用スキーマ"""
    user_id: Optional[UUID] = Field(None, description="ユーザーID")
    video_id: Optional[UUID] = Field(None, description="ビデオID")


class MaterialsFavoritesDelete(MaterialsFavoritesBase):
    """お気に入り削除用スキーマ"""
    user_id: UUID = Field(..., description="ユーザーID")
    video_id: UUID = Field(..., description="ビデオID")


class MaterialsFavoritesDeleteResponse(MaterialsFavoritesBase):
    """お気に入り削除レスポンス用スキーマ"""
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MaterialsPlaylistSearchParams(BaseModel):
    """プレイリスト検索パラメータ"""
    title: Optional[str] = Field(None, description="タイトル（部分一致）")
    name: Optional[str] = Field(None, description="舞台名（部分一致）")
    year: Optional[int] = Field(None, description="年度")


class MaterialsSubPlaylistSearchParams(BaseModel):
    """サブプレイリスト検索パラメータ"""
    title: Optional[str] = Field(None, description="タイトル（部分一致）")
    phase: Optional[str] = Field(None, description="フェーズ")
    recorded_date_from: Optional[date] = Field(None, description="録画日（開始日）")
    recorded_date_to: Optional[date] = Field(None, description="録画日（終了日）")


class MaterialsVideoSearchParams(BaseModel):
    """ビデオ検索パラメータ"""
    title: Optional[str] = Field(None, description="タイトル（部分一致）")
    recorded_date_from: Optional[date] = Field(None, description="録画日（開始日）")
    recorded_date_to: Optional[date] = Field(None, description="録画日（終了日）")


class FavoriteVideoDetailResponse(BaseModel):
    """お気に入り動画の詳細情報レスポンス用スキーマ"""
    id: UUID
    user_id: UUID
    video_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    video: MaterialsVideoResponse
    sub_playlist: MaterialsSubPlaylistResponse
    playlist: MaterialsPlaylistResponse

    model_config = ConfigDict(from_attributes=True)


# タグ関連のスキーマ
class TagCategoryBase(BaseModel):
    """タグカテゴリの基本情報"""
    name: str = Field(..., description="カテゴリ名")
    description: Optional[str] = Field(None, description="説明")


class TagCategoryCreate(TagCategoryBase):
    """タグカテゴリ作成用スキーマ"""
    pass


class TagCategoryResponse(TagCategoryBase):
    """タグカテゴリレスポンス用スキーマ"""
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TagBase(BaseModel):
    """タグの基本情報"""
    name: str = Field(..., description="タグ名")
    description: Optional[str] = Field(None, description="説明")


class TagCreate(TagBase):
    """タグ作成用スキーマ"""
    category_id: UUID = Field(..., description="カテゴリID")


class TagResponse(TagBase):
    """タグレスポンス用スキーマ"""
    id: UUID
    category_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class VideoTagBase(BaseModel):
    """ビデオタグの基本情報"""
    confidence: Optional[float] = Field(None, description="信頼度", ge=0.0, le=1.0)
    auto_generated: bool = Field(False, description="AI生成かどうか")


class VideoTagCreate(VideoTagBase):
    """ビデオタグ作成用スキーマ"""
    video_id: UUID = Field(..., description="ビデオID")
    tag_id: UUID = Field(..., description="タグID")


class VideoTagResponse(VideoTagBase):
    """ビデオタグレスポンス用スキーマ"""
    id: UUID
    video_id: UUID
    tag_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # 関連データ
    tag: Optional[TagResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


class TagSuggestionRequest(BaseModel):
    """タグ提案リクエスト"""
    video_title: str = Field(..., description="動画タイトル")
    video_description: Optional[str] = Field(None, description="動画説明")


class TagSuggestionResponse(BaseModel):
    """タグ提案レスポンス"""
    category: str = Field(..., description="カテゴリ名")
    tag: str = Field(..., description="タグ名")
    confidence: float = Field(..., description="信頼度", ge=0.0, le=1.0)


class AutoTagRequest(BaseModel):
    """自動タグ付けリクエスト"""
    video_id: UUID = Field(..., description="対象動画ID")
    force_update: bool = Field(False, description="既存タグを強制更新するか")