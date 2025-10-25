"""
スケジューリング最適化サービス

練習スケジュールの自動最適化機能を提供します。
"""
from typing import Dict, Any, List, Optional
from uuid import UUID
import logging

from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage
from app.repositories.practice_schedule_repository import PracticeScheduleRepository
from app.repositories.schedule_available_venue_repository import ScheduleAvailableVenueRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.part_repository import PartRepository
from app.repositories.member_assignment_repository import MemberAssignmentRepository
from app.repositories.user_repository import UserRepository
from app.services.optimization.adapters import SchedulingDataAdapter
from app.services.optimization.optimizer import SchedulingOptimizer
from app.services.optimization.models import SchedulingProblem, SchedulingSolution
from app.services.optimization.constants import DEFAULT_OPTIMIZATION_PARAMS, ErrorMessages

logger = logging.getLogger(__name__)


class SchedulingOptimizationService:
    """スケジューリング最適化サービス"""
    
    def __init__(
        self,
        practice_schedule_repository: PracticeScheduleRepository,
        schedule_available_venue_repository: ScheduleAvailableVenueRepository,
        session_repository: SessionRepository,
        part_repository: PartRepository,
        member_assignment_repository: MemberAssignmentRepository,
        user_repository: UserRepository
    ):
        self.practice_schedule_repository = practice_schedule_repository
        self.schedule_available_venue_repository = schedule_available_venue_repository
        self.session_repository = session_repository
        self.part_repository = part_repository
        self.member_assignment_repository = member_assignment_repository
        self.user_repository = user_repository
    
    async def optimize_schedule(
        self, 
        schedule_id: UUID, 
        optimization_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """スケジュールを最適化し、結果をデータベースに保存"""
        
        try:
            # パラメータの設定
            params = DEFAULT_OPTIMIZATION_PARAMS.copy()
            if optimization_params:
                params.update(optimization_params)
            
            # スケジュールデータを取得
            schedule_data = await self._get_schedule_data(schedule_id)
            if not schedule_data:
                raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
            
            # 関連データを取得
            venues_data, parts_data, users_data, member_assignments_data = await self._get_related_data(schedule_id)
            
            # データの妥当性を検証
            validation_errors = SchedulingDataAdapter.validate_scheduling_data(
                schedule_data, venues_data, parts_data, users_data, member_assignments_data
            )
            if validation_errors:
                raise APIException(f"データ検証エラー: {'; '.join(validation_errors)}")
            
            # OR-Tools用の問題を作成
            problem = SchedulingDataAdapter.db_to_scheduling_problem(
                schedule_data, venues_data, parts_data, users_data, member_assignments_data
            )
            
            # 最適化を実行
            optimizer = SchedulingOptimizer(problem)
            solution = optimizer.solve(
                time_limit_seconds=params['time_limit_seconds'],
                equality_weight=params['equality_weight']
            )
            
            if not solution:
                raise APIException(ErrorMessages.NO_SOLUTION_FOUND)
            
            # 既存のセッションを削除
            await self.session_repository.delete_by_schedule(schedule_id)
            
            # 新しいセッションを作成
            venue_mapping = SchedulingDataAdapter.create_venue_mapping(venues_data)
            part_mapping = SchedulingDataAdapter.create_part_mapping(parts_data)
            
            sessions_created = await self._create_sessions_from_solution(
                solution, schedule_id, venue_mapping, part_mapping
            )
            
            # 結果を返す
            return {
                "status": "success",
                "schedule_id": str(schedule_id),
                "sessions_created": sessions_created,
                "objective_value": solution.objective_value,
                "is_optimal": solution.is_optimal,
                "solve_time_seconds": solution.solve_time_seconds,
                "instructor_distribution": solution.get_instructor_distribution(),
                "part_distribution": {part.value: count for part, count in solution.get_part_distribution().items()}
            }
            
        except APIException:
            raise
        except Exception as e:
            logger.error(f"スケジュール最適化エラー: {e}")
            raise APIException(ErrorMessages.OPTIMIZATION_FAILED)
    
    async def preview_optimization(
        self, 
        schedule_id: UUID, 
        optimization_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """最適化結果をプレビュー（データベースに保存しない）"""
        
        try:
            # パラメータの設定
            params = DEFAULT_OPTIMIZATION_PARAMS.copy()
            if optimization_params:
                params.update(optimization_params)
            
            # スケジュールデータを取得
            schedule_data = await self._get_schedule_data(schedule_id)
            if not schedule_data:
                raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
            
            # 関連データを取得
            venues_data, parts_data, users_data, member_assignments_data = await self._get_related_data(schedule_id)
            
            # データの妥当性を検証
            validation_errors = SchedulingDataAdapter.validate_scheduling_data(
                schedule_data, venues_data, parts_data, users_data, member_assignments_data
            )
            if validation_errors:
                raise APIException(f"データ検証エラー: {'; '.join(validation_errors)}")
            
            # OR-Tools用の問題を作成
            problem = SchedulingDataAdapter.db_to_scheduling_problem(
                schedule_data, venues_data, parts_data, users_data, member_assignments_data
            )
            
            # 最適化を実行
            optimizer = SchedulingOptimizer(problem)
            solution = optimizer.solve(
                time_limit_seconds=params['time_limit_seconds'],
                equality_weight=params['equality_weight']
            )
            
            if not solution:
                raise APIException(ErrorMessages.NO_SOLUTION_FOUND)
            
            # プレビュー用の結果を返す
            return {
                "status": "success",
                "schedule_id": str(schedule_id),
                "preview": True,
                "sessions_count": len(solution.sessions),
                "objective_value": solution.objective_value,
                "is_optimal": solution.is_optimal,
                "solve_time_seconds": solution.solve_time_seconds,
                "instructor_distribution": solution.get_instructor_distribution(),
                "part_distribution": {part.value: count for part, count in solution.get_part_distribution().items()},
                "schedule_matrix": solution.get_schedule_matrix()
            }
            
        except APIException:
            raise
        except Exception as e:
            logger.error(f"スケジュール最適化プレビューエラー: {e}")
            raise APIException(ErrorMessages.OPTIMIZATION_FAILED)
    
    async def _get_schedule_data(self, schedule_id: UUID) -> Optional[Dict[str, Any]]:
        """スケジュールデータを取得"""
        return await self.practice_schedule_repository.find_by_id(schedule_id)
    
    async def _get_related_data(self, schedule_id: UUID) -> tuple:
        """関連データを取得"""
        # 1. スケジュール情報を取得（stage_id含む）
        schedule_data = await self.practice_schedule_repository.find_by_id(schedule_id)
        stage_id = schedule_data.get('stage_id')
        
        if not stage_id:
            raise APIException("スケジュールにステージが設定されていません")
        
        # 2. 利用可能会場を取得
        venues_data = await self.schedule_available_venue_repository.find_by_schedule(schedule_id)
        
        # 3. ステージに紐づく全パートを取得
        parts_data = await self.part_repository.find_by_stage_id(stage_id)
        
        # 4. ユーザーデータ
        users_data = await self.user_repository.find_all()
        
        # 5. メンバー割り当てデータ
        member_assignments_data = await self.member_assignment_repository.find_all()
        
        return venues_data, parts_data, users_data, member_assignments_data
    
    async def _create_sessions_from_solution(
        self, 
        solution: SchedulingSolution, 
        schedule_id: UUID, 
        venue_mapping: Dict[int, str],
        part_mapping: Dict[str, str]
    ) -> int:
        """最適化結果からセッションを作成"""
        
        sessions_created = 0
        
        for session in solution.sessions:
            # 会場IDを取得
            venue_id = venue_mapping.get(session.room_id)
            if not venue_id:
                logger.warning(f"会場マッピングが見つかりません: room_id={session.room_id}")
                continue
            
            # セッションデータを作成
            session_data = {
                "schedule_id": str(schedule_id),
                "part_id": session.part_id,  # UUIDをそのまま使用
                "title": f"{session.part_name}パート練習",
                "slot_order": session.time_slot_id,
                "schedule_available_venue_id": venue_id,
                "priority": 0
            }
            
            try:
                await self.session_repository.create(session_data)
                sessions_created += 1
            except Exception as e:
                logger.error(f"セッション作成エラー: {e}")
                continue
        
        return sessions_created
