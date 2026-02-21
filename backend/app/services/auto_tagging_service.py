from typing import List, Optional, Dict, Any
from uuid import UUID
import asyncio

from app.core.gemini_client import GeminiTaggingClient, TagSuggestion
from app.core.supabase import get_supabase
from app.schemas.materials_youtube import (
    VideoTagCreate, 
    VideoTagResponse, 
    TagResponse,
    TagSuggestionResponse
)

class AutoTaggingService:
    """自動タグ付けサービス"""
    
    def __init__(self):
        self.gemini_client = GeminiTaggingClient()
        self.supabase = get_supabase()
    
    async def suggest_tags_for_video(self, video_title: str, video_description: str = "") -> List[TagSuggestionResponse]:
        """
        動画タイトルからタグを提案
        
        Args:
            video_title: 動画タイトル
            video_description: 動画説明
            
        Returns:
            List[TagSuggestionResponse]: 提案されたタグのリスト
        """
        suggestions = await self.gemini_client.suggest_tags(video_title, video_description)
        
        result = []
        for suggestion in suggestions:
            result.append(TagSuggestionResponse(
                category=suggestion.category,
                tag=suggestion.tag,
                confidence=suggestion.confidence
            ))
            
        return result
    
    async def apply_auto_tags(self, video_id: UUID, force_update: bool = False) -> List[VideoTagResponse]:
        """
        動画に自動タグを適用
        
        Args:
            video_id: 対象動画ID
            force_update: 既存のAI生成タグを削除して再生成するか
            
        Returns:
            List[VideoTagResponse]: 適用されたタグのリスト
        """
        
        # 動画情報を取得
        video_result = self.supabase.table("videos").select("*").eq("id", str(video_id)).execute()
        if not video_result.data:
            raise ValueError(f"Video not found: {video_id}")
        
        video = video_result.data[0]
        video_title = video["title"]
        
        # 既存のAI生成タグを確認
        if force_update:
            # 既存のAI生成タグを削除
            self.supabase.table("video_tags").delete().eq("video_id", str(video_id)).eq("auto_generated", True).execute()
        else:
            # 既存のAI生成タグがあるかチェック
            existing_tags = self.supabase.table("video_tags").select("*").eq("video_id", str(video_id)).eq("auto_generated", True).execute()
            if existing_tags.data:
                # 既存のタグがある場合は何もしない
                return await self.get_video_tags(video_id)
        
        # Gemini APIでタグを提案
        suggestions = await self.gemini_client.suggest_tags(video_title)
        
        applied_tags = []
        
        for suggestion in suggestions:
            # タグカテゴリを取得
            category_result = self.supabase.table("tag_categories").select("*").eq("name", suggestion.category).execute()
            if not category_result.data:
                continue
                
            category = category_result.data[0]
            
            # タグを取得または作成
            tag_result = self.supabase.table("tags").select("*").eq("category_id", category["id"]).eq("name", suggestion.tag).execute()
            
            if tag_result.data:
                tag = tag_result.data[0]
            else:
                # 新しいタグを作成
                new_tag = self.supabase.table("tags").insert({
                    "category_id": category["id"],
                    "name": suggestion.tag,
                    "description": f"AI生成タグ: {suggestion.tag}"
                }).execute()
                tag = new_tag.data[0]
            
            # ビデオタグを作成
            video_tag_data = {
                "video_id": str(video_id),
                "tag_id": tag["id"],
                "confidence": suggestion.confidence,
                "auto_generated": True
            }
            
            video_tag_result = self.supabase.table("video_tags").insert(video_tag_data).execute()
            if video_tag_result.data:
                video_tag = video_tag_result.data[0]
                applied_tags.append(VideoTagResponse(
                    id=UUID(video_tag["id"]),
                    video_id=UUID(video_tag["video_id"]),
                    tag_id=UUID(video_tag["tag_id"]),
                    confidence=video_tag["confidence"],
                    auto_generated=video_tag["auto_generated"],
                    created_at=video_tag["created_at"],
                    updated_at=video_tag["updated_at"],
                    tag=TagResponse(
                        id=UUID(tag["id"]),
                        category_id=UUID(tag["category_id"]),
                        name=tag["name"],
                        description=tag["description"],
                        created_at=tag["created_at"],
                        updated_at=tag["updated_at"]
                    )
                ))
        
        return applied_tags
    
    async def get_video_tags(self, video_id: UUID) -> List[VideoTagResponse]:
        """
        動画のタグを取得
        
        Args:
            video_id: 動画ID
            
        Returns:
            List[VideoTagResponse]: 動画のタグリスト
        """
        result = self.supabase.table("video_tags").select("""
            *,
            tag:tags (
                id,
                category_id,
                name,
                description,
                created_at,
                updated_at
            )
        """).eq("video_id", str(video_id)).execute()
        
        tags = []
        for video_tag_data in result.data:
            tag_data = video_tag_data["tag"]
            tags.append(VideoTagResponse(
                id=UUID(video_tag_data["id"]),
                video_id=UUID(video_tag_data["video_id"]),
                tag_id=UUID(video_tag_data["tag_id"]),
                confidence=video_tag_data["confidence"],
                auto_generated=video_tag_data["auto_generated"],
                created_at=video_tag_data["created_at"],
                updated_at=video_tag_data["updated_at"],
                tag=TagResponse(
                    id=UUID(tag_data["id"]),
                    category_id=UUID(tag_data["category_id"]),
                    name=tag_data["name"],
                    description=tag_data["description"],
                    created_at=tag_data["created_at"],
                    updated_at=tag_data["updated_at"]
                ) if tag_data else None
            ))
        
        return tags
    
    async def get_all_tags(self) -> Dict[str, List[TagResponse]]:
        """
        すべてのタグをカテゴリ別に取得
        
        Returns:
            Dict[str, List[TagResponse]]: カテゴリ名をキーとしたタグリスト
        """
        result = self.supabase.table("tags").select("""
            *,
            category:tag_categories (
                id,
                name,
                description
            )
        """).execute()
        
        tags_by_category = {}
        
        for tag_data in result.data:
            category_name = tag_data["category"]["name"]
            
            if category_name not in tags_by_category:
                tags_by_category[category_name] = []
            
            tags_by_category[category_name].append(TagResponse(
                id=UUID(tag_data["id"]),
                category_id=UUID(tag_data["category_id"]),
                name=tag_data["name"],
                description=tag_data["description"],
                created_at=tag_data["created_at"],
                updated_at=tag_data["updated_at"]
            ))
        
        return tags_by_category
    
    async def search_videos_by_tags(self, tag_names: List[str]) -> List[Dict[str, Any]]:
        """
        タグ名で動画を検索
        
        Args:
            tag_names: 検索するタグ名のリスト
            
        Returns:
            List[Dict]: マッチした動画のリスト
        """
        if not tag_names:
            return []
        
        # タグ名から動画を検索
        result = self.supabase.table("video_tags").select("""
            video_id,
            videos (
                id,
                title,
                video_url,
                recorded_date,
                thumbnail_url,
                sub_playlists (
                    id,
                    title,
                    playlists (
                        id,
                        title,
                        name,
                        year
                    )
                )
            ),
            tags (
                name
            )
        """).in_("tags.name", tag_names).execute()
        
        # 動画IDでグループ化
        videos_dict = {}
        for item in result.data:
            video = item["videos"]
            video_id = video["id"]
            
            if video_id not in videos_dict:
                videos_dict[video_id] = {
                    **video,
                    "matched_tags": []
                }
            
            videos_dict[video_id]["matched_tags"].append(item["tags"]["name"])
        
        return list(videos_dict.values())