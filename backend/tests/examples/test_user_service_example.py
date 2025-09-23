"""Example: User Service Unit Test with TDD Approach"""

import pytest
from unittest.mock import AsyncMock, Mock
from datetime import datetime

from tests.base import BaseServiceTest
from tests.factories.user_factory import UserFactory


class TestUserServiceTDD(BaseServiceTest):
    """TDD Example for User Service
    
    Following the TDD cycle:
    1. Write test first (this file)
    2. Run test and see it fail
    3. Implement minimal code to pass
    4. Refactor if needed
    """
    
    @pytest.fixture
    def user_factory(self):
        """Provide user factory"""
        return UserFactory()
    
    @pytest.fixture
    def mock_user_repository(self, mocker):
        """Mock user repository"""
        mock = mocker.Mock()
        mock.find_by_email = AsyncMock(return_value=None)
        mock.create = AsyncMock()
        mock.update = AsyncMock()
        mock.delete = AsyncMock()
        return mock
    
    @pytest.fixture
    def mock_email_service(self, mocker):
        """Mock email service"""
        mock = mocker.Mock()
        mock.send_welcome_email = AsyncMock()
        mock.send_verification_email = AsyncMock()
        return mock
    
    @pytest.fixture
    def user_service(self, mock_user_repository, mock_email_service):
        """Create user service with mocked dependencies"""
        from app.services.user_service import UserService
        return UserService(
            repository=mock_user_repository,
            email_service=mock_email_service
        )
    
    # ============= RED PHASE: Write failing tests first =============
    
    @pytest.mark.asyncio
    async def test_create_user_with_valid_data_should_succeed(self, user_service, user_factory, mock_user_repository):
        """Test: Creating user with valid data should succeed"""
        # Arrange
        user_data = user_factory.create(
            email="newuser@example.com",
            password="SecurePass123!"
        )
        expected_user_id = "generated-user-id"
        mock_user_repository.create.return_value = {"id": expected_user_id, **user_data}
        
        # Act
        result = await user_service.create_user(
            email=user_data["email"],
            password=user_data["password"]
        )
        
        # Assert
        assert result["id"] == expected_user_id
        assert result["email"] == user_data["email"]
        mock_user_repository.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_user_with_duplicate_email_should_fail(self, user_service, user_factory, mock_user_repository):
        """Test: Creating user with duplicate email should raise error"""
        # Arrange
        existing_user = user_factory.create(email="existing@example.com")
        mock_user_repository.find_by_email.return_value = existing_user
        
        # Act & Assert
        with pytest.raises(ValueError, match="Email already registered"):
            await user_service.create_user(
                email="existing@example.com",
                password="AnyPassword123!"
            )
        
        mock_user_repository.find_by_email.assert_called_once_with("existing@example.com")
        mock_user_repository.create.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_create_user_should_hash_password(self, user_service, mock_user_repository):
        """Test: Password should be hashed before storage"""
        # Arrange
        plain_password = "PlainTextPassword123!"
        mock_user_repository.create.return_value = {"id": "user-id"}
        
        # Act
        await user_service.create_user(
            email="test@example.com",
            password=plain_password
        )
        
        # Assert
        call_args = mock_user_repository.create.call_args[0][0]
        assert call_args["password"] != plain_password  # Password should be hashed
        assert call_args["password"].startswith("$2b$")  # bcrypt hash format
    
    @pytest.mark.asyncio
    async def test_create_user_should_send_welcome_email(self, user_service, mock_email_service, mock_user_repository):
        """Test: Welcome email should be sent after user creation"""
        # Arrange
        user_data = {"id": "user-id", "email": "new@example.com"}
        mock_user_repository.create.return_value = user_data
        
        # Act
        result = await user_service.create_user(
            email="new@example.com",
            password="Password123!"
        )
        
        # Assert
        mock_email_service.send_welcome_email.assert_called_once_with(
            email="new@example.com",
            user_id="user-id"
        )
    
    @pytest.mark.asyncio
    async def test_update_user_profile_should_validate_fields(self, user_service, mock_user_repository):
        """Test: Profile update should validate allowed fields only"""
        # Arrange
        user_id = "user-123"
        updates = {
            "name": "New Name",
            "bio": "New bio",
            "password": "ShouldNotUpdate",  # This should be ignored
            "email": "should.not.update@example.com"  # This should be ignored
        }
        
        # Act
        await user_service.update_profile(user_id, updates)
        
        # Assert
        call_args = mock_user_repository.update.call_args[0]
        assert call_args[0] == user_id
        assert "name" in call_args[1]
        assert "bio" in call_args[1]
        assert "password" not in call_args[1]  # Should be filtered out
        assert "email" not in call_args[1]  # Should be filtered out
    
    @pytest.mark.asyncio
    async def test_delete_user_should_soft_delete_by_default(self, user_service, mock_user_repository):
        """Test: Deleting user should perform soft delete by default"""
        # Arrange
        user_id = "user-to-delete"
        
        # Act
        await user_service.delete_user(user_id)
        
        # Assert
        mock_user_repository.update.assert_called_once_with(
            user_id,
            {"deleted_at": pytest.approx(datetime.utcnow(), abs=60)}  # Within 60 seconds
        )
        mock_user_repository.delete.assert_not_called()  # Should not hard delete
    
    @pytest.mark.asyncio
    async def test_verify_user_email_with_valid_token_should_succeed(self, user_service, mock_user_repository):
        """Test: Email verification with valid token should update user status"""
        # Arrange
        user_id = "user-123"
        token = "valid-verification-token"
        mock_user_repository.find_by_verification_token = AsyncMock(
            return_value={"id": user_id, "is_verified": False}
        )
        
        # Act
        result = await user_service.verify_email(token)
        
        # Assert
        assert result["success"] is True
        mock_user_repository.update.assert_called_once_with(
            user_id,
            {"is_verified": True, "verification_token": None}
        )
    
    # ============= Parametrized Tests =============
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("email,should_pass", [
        ("valid@example.com", True),
        ("another.valid@example.co.jp", True),
        ("invalid-email", False),
        ("@example.com", False),
        ("user@", False),
        ("", False),
        (None, False),
    ])
    async def test_email_validation(self, user_service, email, should_pass, mock_user_repository):
        """Test: Email validation should work correctly"""
        if should_pass:
            # Should not raise exception
            mock_user_repository.create.return_value = {"id": "test-id"}
            result = await user_service.create_user(email=email, password="Valid123!")
            assert result is not None
        else:
            # Should raise validation error
            with pytest.raises(ValueError, match="Invalid email"):
                await user_service.create_user(email=email, password="Valid123!")
    
    # ============= Performance Tests =============
    
    @pytest.mark.benchmark
    @pytest.mark.asyncio
    async def test_bulk_user_creation_performance(self, user_service, user_factory, mock_user_repository, benchmark):
        """Test: Bulk user creation should complete within performance threshold"""
        # Arrange
        users_data = user_factory.create_batch(100)
        mock_user_repository.create.return_value = {"id": "test-id"}
        
        # Act & Assert
        async def create_users():
            for user in users_data:
                await user_service.create_user(
                    email=user["email"],
                    password=user["password"]
                )
        
        # Benchmark the operation
        result = benchmark.pedantic(
            create_users,
            rounds=5,
            iterations=1
        )
        
        # Assert performance threshold (100 users in < 1 second)
        assert benchmark.stats["mean"] < 1.0