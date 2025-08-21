"""Base Test Classes for Different Test Levels"""

import asyncio
import pytest
from typing import Any, Dict, Optional
from abc import ABC, abstractmethod
from unittest.mock import Mock, AsyncMock
from fastapi.testclient import TestClient
import time


class BaseTest(ABC):
    """Base class for all tests"""
    
    @pytest.fixture(autouse=True)
    def setup_method_base(self):
        """Setup before each test method"""
        self.start_time = time.time()
        yield
        execution_time = time.time() - self.start_time
        if execution_time > self.max_execution_time:
            pytest.warning(
                f"Test execution time ({execution_time:.2f}s) "
                f"exceeded limit ({self.max_execution_time}s)"
            )
    
    @property
    @abstractmethod
    def max_execution_time(self) -> float:
        """Maximum allowed execution time in seconds"""
        pass


class BaseUnitTest(BaseTest):
    """Base class for unit tests"""
    
    max_execution_time = 0.1  # 100ms
    
    @pytest.fixture(autouse=True)
    def auto_mock_external_dependencies(self, mocker):
        """Automatically mock all external dependencies"""
        # Mock Supabase
        mocker.patch('app.core.supabase.get_supabase_client')
        
        # Mock external HTTP calls
        mocker.patch('httpx.AsyncClient.get', new_callable=AsyncMock)
        mocker.patch('httpx.AsyncClient.post', new_callable=AsyncMock)
        
        # Mock file system operations
        mocker.patch('builtins.open', new_callable=Mock)
        
        # Mock environment variables
        mocker.patch.dict('os.environ', {
            'TESTING': 'true',
            'SUPABASE_URL': 'http://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-key'
        })
    
    def assert_called_with_subset(self, mock_obj: Mock, **expected_kwargs):
        """Assert mock was called with at least the expected kwargs"""
        _, actual_kwargs = mock_obj.call_args
        for key, expected_value in expected_kwargs.items():
            assert key in actual_kwargs
            assert actual_kwargs[key] == expected_value


class BaseIntegrationTest(BaseTest):
    """Base class for integration tests"""
    
    max_execution_time = 1.0  # 1 second
    
    @pytest.fixture
    def test_db(self):
        """Provide test database connection"""
        # This would use testcontainers or pytest-postgresql
        # to spin up a temporary database
        pass
    
    @pytest.fixture
    def db_transaction(self, test_db):
        """Wrap each test in a transaction that rolls back"""
        transaction = test_db.begin()
        yield test_db
        transaction.rollback()
    
    @pytest.fixture
    def authenticated_client(self, client: TestClient):
        """Provide authenticated test client"""
        client.headers = {
            "Authorization": "Bearer test-token"
        }
        return client


class BaseE2ETest(BaseTest):
    """Base class for E2E tests"""
    
    max_execution_time = 10.0  # 10 seconds
    
    @pytest.fixture(scope="class")
    def e2e_client(self):
        """Provide E2E test client with real backend"""
        from app.main import app
        return TestClient(app)
    
    @pytest.fixture
    def test_user_credentials(self):
        """Provide test user credentials"""
        return {
            "email": "e2e-test@example.com",
            "password": "TestPassword123!"
        }
    
    def login_as_user(self, client: TestClient, email: str, password: str) -> str:
        """Helper to login and return access token"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def assert_response_ok(self, response):
        """Assert response is successful"""
        assert response.status_code in range(200, 300), (
            f"Response failed with status {response.status_code}: "
            f"{response.text}"
        )


class BaseAPITest(BaseIntegrationTest):
    """Base class for API endpoint tests"""
    
    @pytest.fixture
    def api_client(self, client: TestClient):
        """Provide API test client"""
        client.base_url = "http://testserver/api/v1"
        return client
    
    def assert_paginated_response(self, response_data: Dict[str, Any]):
        """Assert response has pagination structure"""
        assert "items" in response_data
        assert "total" in response_data
        assert "page" in response_data
        assert "page_size" in response_data
        assert isinstance(response_data["items"], list)
    
    def assert_error_response(self, response, expected_status: int, expected_detail: Optional[str] = None):
        """Assert error response structure"""
        assert response.status_code == expected_status
        data = response.json()
        assert "detail" in data
        if expected_detail:
            assert expected_detail in data["detail"]


class BaseRepositoryTest(BaseIntegrationTest):
    """Base class for repository tests"""
    
    @pytest.fixture
    def repository(self):
        """Override to provide repository instance"""
        raise NotImplementedError("Must provide repository fixture")
    
    async def assert_exists_in_db(self, table: str, **conditions):
        """Assert record exists in database with conditions"""
        # Implementation would query the test database
        pass
    
    async def assert_not_exists_in_db(self, table: str, **conditions):
        """Assert record does not exist in database"""
        # Implementation would query the test database
        pass


class BaseServiceTest(BaseUnitTest):
    """Base class for service layer tests"""
    
    @pytest.fixture
    def mock_repository(self, mocker):
        """Provide mock repository"""
        return mocker.Mock()
    
    @pytest.fixture
    def service(self, mock_repository):
        """Override to provide service instance with mocked dependencies"""
        raise NotImplementedError("Must provide service fixture")
    
    def assert_business_rule_applied(self, result, rule_name: str):
        """Assert specific business rule was applied"""
        # Custom assertion for business logic
        pass


class BaseBenchmarkTest(BaseTest):
    """Base class for performance/benchmark tests"""
    
    max_execution_time = 30.0  # 30 seconds for benchmarks
    
    @pytest.fixture
    def benchmark_rounds(self):
        """Number of rounds for benchmark"""
        return 100
    
    def assert_performance_threshold(self, execution_time: float, threshold: float):
        """Assert execution time is within threshold"""
        assert execution_time < threshold, (
            f"Performance threshold exceeded: {execution_time:.3f}s > {threshold:.3f}s"
        )
    
    @pytest.mark.benchmark
    def benchmark_operation(self, benchmark, operation):
        """Benchmark an operation"""
        result = benchmark(operation)
        return result