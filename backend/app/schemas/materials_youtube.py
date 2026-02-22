from datetime import datetime, date, time
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

class MaterialsPlaylistBase(BaseModel):
    """プレイリストの基本情報"""
    title: str = Field(..., description="タイトル")
    name: str = Field(..., description="舞台名")
    year: int = Field(..., description="年度")
    thumbnail_url: str | None = Field(None, description="サムネイルURL")


class MaterialsPlaylistCreate(MaterialsPlaylistBase):
    """プレイリスト作成用スキーマ"""
    pass


class MaterialsPlaylistResponse(MaterialsPlaylistBase):
    """プレイリストレスポンス用スキーマ"""
    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MaterialsPlaylistUpdate(MaterialsPlaylistBase):
    """プレイリスト更新用スキーマ"""
    title: str | None = Field(None, description="タイトル")
    name: str | None = Field(None, description="舞台名")
    year: int | None = Field(None, description="年度")
    thumbnail_url: str | None = Field(None, description="サムネイルURL")


class MaterialsSubPlaylistBase(BaseModel):
    """サブプレイリストの基本情報"""
    title: str = Field(..., description="タイトル")
    recorded_date: date = Field(..., description="録画日")
    phase: str = Field(..., description="フェーズ")
    playlist_url: str = Field(..., description="プレイリストURL")
    thumbnail_url: str | None = Field(None, description="サムネイルURL")


class MaterialsSubPlaylistCreate(MaterialsSubPlaylistBase):
    """サブプレイリスト作成用スキーマ"""
    pass


class MaterialsSubPlaylistResponse(MaterialsSubPlaylistBase):
    """サブプレイリストレスポンス用スキーマ"""
    id: UUID
    playlist_id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True, extra='allow')  # 追加フィールド（import_result等）を許可


class MaterialsSubPlaylistUpdate(MaterialsSubPlaylistBase):
    """サブプレイリスト更新用スキーマ"""
    title: str | None = Field(None, description="タイトル")
    recorded_date: date | None = Field(None, description="録画日")
    phase: str | None = Field(None, description="フェーズ")
    playlist_url: str | None = Field(None, description="プレイリストURL")
    thumbnail_url: str | None = Field(None, description="サムネイルURL")


class MaterialsVideoBase(BaseModel):
    """ビデオの基本情報"""
    title: str = Field(..., description="タイトル")
    video_url: str = Field(..., description="ビデオURL")
    recorded_date: date = Field(..., description="録画日")
    thumbnail_url: str | None = Field(None, description="サムネイルURL")


class MaterialsVideoCreate(MaterialsVideoBase):
    """ビデオ作成用スキーマ"""
    pass


class MaterialsVideoResponse(MaterialsVideoBase):
    """ビデオレスポンス用スキーマ"""
    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MaterialsVideoUpdate(MaterialsVideoBase):
    """ビデオ更新用スキーマ"""
    title: str | None = Field(None, description="タイトル")
    video_url: str | None = Field(None, description="ビデオURL")
    recorded_date: date | None = Field(None, description="録画日")
    thumbnail_url: str | None = Field(None, description="サムネイルURL")


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
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class MaterialsFavoritesUpdate(MaterialsFavoritesBase):
    """お気に入り更新用スキーマ"""
    user_id: UUID | None = Field(None, description="ユーザーID")
    video_id: UUID | None = Field(None, description="ビデオID")


class MaterialsFavoritesDelete(MaterialsFavoritesBase):
    """お気に入り削除用スキーマ"""
    user_id: UUID = Field(..., description="ユーザーID")
    video_id: UUID = Field(..., description="ビデオID")


class MaterialsFavoritesDeleteResponse(MaterialsFavoritesBase):
    """お気に入り削除レスポンス用スキーマ"""
    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MaterialsPlaylistSearchParams(BaseModel):
    """プレイリスト検索パラメータ"""
    title: str | None = Field(None, description="タイトル（部分一致）")
    name: str | None = Field(None, description="舞台名（部分一致）")
    year: int | None = Field(None, description="年度")


class MaterialsSubPlaylistSearchParams(BaseModel):
    """サブプレイリスト検索パラメータ"""
    title: str | None = Field(None, description="タイトル（部分一致）")
    phase: str | None = Field(None, description="フェーズ")
    recorded_date_from: date | None = Field(None, description="録画日（開始日）")
    recorded_date_to: date | None = Field(None, description="録画日（終了日）")


class MaterialsVideoSearchParams(BaseModel):
    """ビデオ検索パラメータ"""
    title: str | None = Field(None, description="タイトル（部分一致）")
    recorded_date_from: date | None = Field(None, description="録画日（開始日）")
    recorded_date_to: date | None = Field(None, description="録画日（終了日）")


class FavoriteVideoDetailResponse(BaseModel):
    """お気に入り動画の詳細情報レスポンス用スキーマ"""
    id: UUID
    user_id: UUID
    video_id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    video: MaterialsVideoResponse
    sub_playlist: MaterialsSubPlaylistResponse
    playlist: MaterialsPlaylistResponse

    model_config = ConfigDict(from_attributes=True)