"""
APIエンドポイントのテスト

FastAPIアプリケーションのテスト
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.optimization import OptimizationRequest
from app.models.schedule import ScheduleData, Member, Venue, Constraints


class TestAPI:
    """APIエンドポイントのテストクラス"""
    
    @pytest.fixture
    def client(self):
        """テストクライアントの作成"""
        return TestClient(app)
    
    @pytest.fixture
    def sample_request(self):
        """サンプルリクエストの作成"""
        return OptimizationRequest(
            schedule_data=ScheduleData(
                start_date="2024-01-01",
                end_date="2024-01-31",
                practice_days=["monday", "wednesday", "friday"]
            ),
            members=[
                Member(
                    id="member_1",
                    name="田中太郎",
                    part="シテ",
                    skill_level="上級",
                    availability=["monday", "wednesday"]
                ),
                Member(
                    id="member_2",
                    name="佐藤花子",
                    part="ワキ",
                    skill_level="中級",
                    availability=["monday", "friday"]
                )
            ],
            venues=[
                Venue(
                    id="venue_1",
                    name="大ホール",
                    capacity=30,
                    available_times=["09:00-12:00", "14:00-17:00"],
                    priority=5
                ),
                Venue(
                    id="venue_2",
                    name="中ホール",
                    capacity=20,
                    available_times=["09:00-12:00", "14:00-17:00"],
                    priority=4
                )
            ],
            constraints=Constraints(
                max_practice_hours_per_week=10,
                min_members_per_session=1,
                max_sessions_per_day=4,
                min_break_time=30
            )
        )
    
    def test_root_endpoint(self, client):
        """ルートエンドポイントのテスト"""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "OR-Tools最適化エンジン"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"
    
    def test_health_check(self, client):
        """ヘルスチェックエンドポイントのテスト"""
        response = client.get("/api/v1/ml/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ortools-engine"
        assert data["port"] == 8001
        assert "endpoints" in data
        assert len(data["endpoints"]) > 0
    
    def test_model_status(self, client):
        """モデル状態確認エンドポイントのテスト"""
        response = client.get("/api/v1/ml/models/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["model_name"] == "ortools-optimizer"
        assert data["version"] == "1.0.0"
        assert data["status"] == "loaded"
        assert "performance_metrics" in data
        assert data["performance_metrics"]["model_loaded"] is True
    
    def test_schedule_optimization_success(self, client, sample_request):
        """スケジュール最適化の成功テスト"""
        response = client.post(
            "/api/v1/ml/predict/schedule-optimization",
            json=sample_request.model_dump()
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["error"] is None
        assert data["processing_time"] > 0
        
        result = data["result"]
        assert result is not None
        assert result["constraints_satisfied"] is True
        assert result["optimization_status"] in ["OPTIMAL", "FEASIBLE"]
        assert result["reward"] > 0
        
        schedule = result["optimized_schedule"]
        assert schedule is not None
        assert len(schedule["sessions"]) > 0
        assert len(schedule["assignments"]) > 0
    
    def test_schedule_optimization_invalid_request(self, client):
        """無効なリクエストでのスケジュール最適化テスト"""
        invalid_request = {
            "schedule_data": {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "practice_days": ["monday"]
            },
            "members": [],  # メンバーなし
            "venues": [
                {
                    "id": "venue_1",
                    "name": "大ホール",
                    "capacity": 30,
                    "available_times": ["09:00-12:00"]
                }
            ]
        }
        
        response = client.post(
            "/api/v1/ml/predict/schedule-optimization",
            json=invalid_request
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is False
        assert data["error"] is not None
        assert "制約検証に失敗しました" in data["error"]
    
    def test_schedule_optimization_missing_fields(self, client):
        """必須フィールド不足でのスケジュール最適化テスト"""
        incomplete_request = {
            "schedule_data": {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "practice_days": ["monday"]
            },
            "members": [
                {
                    "id": "member_1",
                    "name": "田中太郎",
                    "part": "シテ",
                    "skill_level": "上級",
                    "availability": ["monday"]
                }
            ]
            # venues フィールドが不足
        }
        
        response = client.post(
            "/api/v1/ml/predict/schedule-optimization",
            json=incomplete_request
        )
        
        assert response.status_code == 422  # Validation Error
    
    def test_schedule_optimization_invalid_date_format(self, client):
        """無効な日付形式でのスケジュール最適化テスト"""
        invalid_date_request = {
            "schedule_data": {
                "start_date": "2024/01/01",  # 無効な日付形式
                "end_date": "2024-01-31",
                "practice_days": ["monday"]
            },
            "members": [
                {
                    "id": "member_1",
                    "name": "田中太郎",
                    "part": "シテ",
                    "skill_level": "上級",
                    "availability": ["monday"]
                }
            ],
            "venues": [
                {
                    "id": "venue_1",
                    "name": "大ホール",
                    "capacity": 30,
                    "available_times": ["09:00-12:00"]
                }
            ]
        }
        
        response = client.post(
            "/api/v1/ml/predict/schedule-optimization",
            json=invalid_date_request
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is False
        assert data["error"] is not None
        assert "制約検証に失敗しました" in data["error"]
    
    def test_cors_headers(self, client):
        """CORSヘッダーのテスト"""
        response = client.options("/api/v1/ml/health")
        # FastAPIのCORSミドルウェアはOPTIONSリクエストを自動処理
        assert response.status_code in [200, 405]  # 405はMethod Not Allowed（正常）
    
    def test_api_documentation(self, client):
        """APIドキュメントのテスト"""
        # Swagger UI
        response = client.get("/docs")
        assert response.status_code == 200
        
        # OpenAPIスキーマ
        response = client.get("/openapi.json")
        assert response.status_code == 200
        
        schema = response.json()
        assert schema["info"]["title"] == "OR-Tools最適化エンジン"
        assert schema["info"]["version"] == "1.0.0"
