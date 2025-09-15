"""
スケジュール管理サービス
スケジュール最適化とMLエンジン連携のビジネスロジック
"""
import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from app.repositories.schedule_repository import ScheduleRepository
from app.services.ml_integration_service import MLIntegrationService
from app.schemas.schedule_schemas import (
    ScheduleOptimizationResponse, 
    SessionCreateData,
    MemberInfo,
    VenueInfo,
    ScheduleData,
    Constraints
)

logger = logging.getLogger(__name__)


class ScheduleService:
    """スケジュール管理のビジネスロジック"""
    
    def __init__(self):
        self.schedule_repository = ScheduleRepository()
        self.ml_integration_service = MLIntegrationService()
    
    async def optimize_schedule(self, schedule_id: UUID) -> ScheduleOptimizationResponse:
        """
        スケジュール最適化を実行
        
        Args:
            schedule_id: スケジュールID
            
        Returns:
            最適化結果
        """
        try:
            logger.info(f"スケジュール最適化開始: schedule_id={schedule_id}")
            
            # 1. スケジュール基本情報を取得
            schedule_info = await self.schedule_repository.get_schedule_with_venue(schedule_id)
            if not schedule_info:
                raise Exception(f"スケジュールが見つかりません: {schedule_id}")
            
            # 2. 関連データを取得
            members = await self._get_members_for_ml(schedule_id)
            venues = await self._get_venues_for_ml()
            schedule_data = await self._build_schedule_data_for_ml(schedule_info)
            
            # 3. MLエンジンに最適化を依頼
            ml_response = await self.ml_integration_service.optimize_schedule(
                schedule_id=schedule_id,
                schedule_data=schedule_data,
                members=members,
                venues=venues,
                constraints=Constraints().dict()
            )
            
            # 4. MLエンジンの結果をセッション形式に変換
            optimized_sessions = await self._convert_ml_response_to_sessions(
                ml_response, schedule_id
            )
            
            # 5. セッションをデータベースに保存
            created_sessions = await self._save_sessions_to_db(optimized_sessions)
            
            # 6. スケジュールステータスを更新
            await self.schedule_repository.update_schedule_status(schedule_id, "optimized")
            
            logger.info(f"スケジュール最適化完了: schedule_id={schedule_id}, sessions_count={len(created_sessions)}")
            
            return ScheduleOptimizationResponse(
                schedule_id=schedule_id,
                status="completed",
                message="スケジュール最適化が完了しました",
                optimized_sessions=created_sessions,
                processing_time=ml_response.get("processing_time", 0.0),
                model_version=ml_response.get("model_version", "unknown"),
                created_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"スケジュール最適化エラー: {str(e)}, schedule_id={schedule_id}")
            
            # エラー時はスケジュールステータスをエラーに更新
            try:
                await self.schedule_repository.update_schedule_status(schedule_id, "error")
            except:
                pass
            
            return ScheduleOptimizationResponse(
                schedule_id=schedule_id,
                status="error",
                message=f"スケジュール最適化中にエラーが発生しました: {str(e)}",
                optimized_sessions=[],
                processing_time=0.0,
                model_version="unknown",
                created_at=datetime.now()
            )
    
    async def _get_members_for_ml(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """MLエンジン用のメンバー情報を取得"""
        try:
            members_data = await self.schedule_repository.get_members_for_schedule(schedule_id)
            
            members = []
            for member in members_data:
                # メンバーの優先度を決定（パートの重要度に基づく）
                priority = self._calculate_member_priority(member)
                
                members.append({
                    "id": str(member["user_id"]),
                    "name": member["users"]["name"] if member.get("users") else "Unknown",
                    "part": member["parts"]["name"] if member.get("parts") else "Unknown",
                    "skill_level": "中級",  # デフォルト値、後で実装
                    "availability": ["monday", "wednesday", "friday"],  # デフォルト値、後で実装
                    "priority": priority  # メンバーの優先度を追加
                })
            
            return members
            
        except Exception as e:
            logger.error(f"メンバー情報取得エラー: {str(e)}")
            return []
    
    def _calculate_member_priority(self, member: Dict[str, Any]) -> int:
        """メンバーの優先度を計算（パートの重要度に基づく）"""
        part_name = member.get("parts", {}).get("name", "").lower()
        
        # パート名に基づく優先度設定
        priority_map = {
            "シテ": 5,
            "ワキ": 4,
            "舞囃子": 4,
            "地謡": 3,
            "笛": 3,
            "謡": 3,
            "仕舞": 3,
            "囃子": 3,
            "小鼓": 2,
            "大鼓": 2,
            "太鼓": 2,
            "地拍子": 2,
            "一調": 2,
            "二調": 2,
            "三調": 2,
            "四調": 2,
            "五調": 2,
            "六調": 2,
            "七調": 2,
            "八調": 2
        }
        
        # パート名から優先度を取得（デフォルトは3）
        return priority_map.get(part_name, 3)
    
    async def _get_venues_for_ml(self) -> List[Dict[str, Any]]:
        """MLエンジン用の会場情報を取得"""
        try:
            venues_data = await self.schedule_repository.get_all_venues()
            
            venues = []
            for venue in venues_data:
                venues.append({
                    "id": str(venue["id"]),
                    "name": venue["name"],
                    "capacity": venue["capacity"],
                    "available_times": ["09:00-12:00", "14:00-17:00"]  # デフォルト値、後で実装
                })
            
            return venues
            
        except Exception as e:
            logger.error(f"会場情報取得エラー: {str(e)}")
            return []
    
    async def _build_schedule_data_for_ml(self, schedule_info: Dict[str, Any]) -> Dict[str, Any]:
        """MLエンジン用のスケジュールデータを構築"""
        return {
            "start_date": str(schedule_info["schedule_date"]),
            "end_date": str(schedule_info["schedule_date"]),  # 単日の場合
            "practice_days": ["monday", "wednesday", "friday"]  # デフォルト値、後で実装
        }
    
    async def _convert_ml_response_to_sessions(
        self, 
        ml_response: Dict[str, Any], 
        schedule_id: UUID
    ) -> List[SessionCreateData]:
        """MLエンジンのレスポンスをセッション形式に変換"""
        try:
            sessions = []
            optimized_schedule = ml_response.get("optimized_schedule", {})
            sessions_data = optimized_schedule.get("sessions", [])
            
            # パート情報を取得してマッピング用辞書を作成
            parts_data = await self.schedule_repository.get_all_parts()
            part_name_to_id = {part["name"]: part["id"] for part in parts_data}
            
            for session_info in sessions_data:
                part_name = session_info.get("part", "")
                part_id = part_name_to_id.get(part_name)
                
                if not part_id:
                    logger.warning(f"パートが見つかりません: {part_name}")
                    continue
                
                # 時間文字列を解析（例: "09:00-12:00"）
                time_str = session_info.get("time", "09:00-12:00")
                start_time_str, end_time_str = time_str.split("-") if "-" in time_str else ("09:00", "12:00")
                
                session = SessionCreateData(
                    part_id=UUID(part_id),
                    title=f"{part_name}練習",
                    start_time=datetime.strptime(start_time_str, "%H:%M").time(),
                    end_time=datetime.strptime(end_time_str, "%H:%M").time(),
                    location_in_venue=session_info.get("venue", ""),
                    priority=0
                )
                
                sessions.append(session)
            
            return sessions
            
        except Exception as e:
            logger.error(f"MLレスポンス変換エラー: {str(e)}")
            return []
    
    async def _save_sessions_to_db(self, sessions: List[SessionCreateData]) -> List[SessionCreateData]:
        """セッションをデータベースに保存"""
        try:
            if not sessions:
                return []
            
            # セッションデータを辞書形式に変換
            sessions_data = []
            for session in sessions:
                session_dict = {
                    "schedule_id": str(session.part_id),  # 実際のschedule_idが必要
                    "part_id": str(session.part_id),
                    "title": session.title,
                    "start_time": session.start_time.isoformat(),
                    "end_time": session.end_time.isoformat(),
                    "location_in_venue": session.location_in_venue,
                    "priority": session.priority
                }
                sessions_data.append(session_dict)
            
            # データベースに保存
            created_sessions = await self.schedule_repository.create_multiple_sessions(sessions_data)
            
            return sessions
            
        except Exception as e:
            logger.error(f"セッション保存エラー: {str(e)}")
            return []
    
    async def check_ml_engine_health(self) -> Dict[str, Any]:
        """MLエンジンのヘルスチェック"""
        try:
            return await self.ml_integration_service.check_ml_engine_health()
        except Exception as e:
            logger.error(f"MLエンジンヘルスチェックエラー: {str(e)}")
            return {"status": "unhealthy", "error": str(e)}
