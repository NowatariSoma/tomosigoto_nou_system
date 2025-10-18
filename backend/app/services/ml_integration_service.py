"""
MLエンジン連携サービス
機械学習エンジン（8001番ポート）との通信を管理するサービス
"""
import httpx
import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from app.core.config import settings

logger = logging.getLogger(__name__)


class MLIntegrationService:
    """MLエンジンとの連携を管理するサービス"""
    
    def __init__(self):
        self.ml_engine_url = settings.ML_ENGINE_URL
        self.timeout = 30.0
    
    async def optimize_schedule(
        self, 
        schedule_id: UUID,
        schedule_data: Dict[str, Any],
        members: List[Dict[str, Any]],
        venues: List[Dict[str, Any]],
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        スケジュール最適化をMLエンジンに依頼
        
        Args:
            schedule_id: スケジュールID
            schedule_data: スケジュール基本情報
            members: メンバー情報リスト
            venues: 会場情報リスト
            constraints: 制約条件
            
        Returns:
            MLエンジンからの最適化結果
        """
        try:
            # MLエンジンへのリクエストデータを構築
            request_data = {
                "schedule_data": schedule_data,
                "members": members,
                "venues": venues,
                "constraints": constraints or {}
            }
            
            logger.info(f"MLエンジンにスケジュール最適化を依頼: schedule_id={schedule_id}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.ml_engine_url}/api/v1/ml/predict/schedule-optimization",
                    json=request_data
                )
                response.raise_for_status()
                
                result = response.json()
                logger.info(f"MLエンジンからの応答取得成功: schedule_id={schedule_id}")
                
                return result
                
        except httpx.TimeoutException:
            logger.error(f"MLエンジンへのリクエストがタイムアウト: schedule_id={schedule_id}")
            raise Exception("MLエンジンへの接続がタイムアウトしました")
            
        except httpx.HTTPStatusError as e:
            logger.error(f"MLエンジンからエラーレスポンス: {e.response.status_code}, schedule_id={schedule_id}")
            raise Exception(f"MLエンジンでエラーが発生しました: {e.response.status_code}")
            
        except Exception as e:
            logger.error(f"MLエンジン連携で予期しないエラー: {str(e)}, schedule_id={schedule_id}")
            raise Exception(f"スケジュール最適化中にエラーが発生しました: {str(e)}")
    
    async def check_ml_engine_health(self) -> Dict[str, Any]:
        """
        MLエンジンのヘルスチェック
        
        Returns:
            ヘルスチェック結果
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.ml_engine_url}/api/v1/ml/health")
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"MLエンジンヘルスチェック失敗: {str(e)}")
            raise Exception(f"MLエンジンに接続できません: {str(e)}")
    
    async def get_model_status(self) -> Dict[str, Any]:
        """
        MLモデルの状態確認
        
        Returns:
            モデル状態情報
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.ml_engine_url}/api/v1/ml/models/status")
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"MLモデル状態確認失敗: {str(e)}")
            raise Exception(f"MLモデルの状態を確認できません: {str(e)}")
