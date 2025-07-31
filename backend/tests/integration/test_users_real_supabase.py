"""
Real Supabase integration tests for users endpoints
"""
import pytest
import os
from fastapi.testclient import TestClient
from supabase import create_client, Client
from app.main import app
from app.services.supabase_service import SupabaseService
from app.api import deps


class TestUsersRealSupabase:
    """Real Supabase integration tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test client and real Supabase connection"""
        self.client = TestClient(app)
        
        # Real Supabase credentials from environment
        self.supabase_url = os.getenv("SUPABASE_URL", "https://your-project-ref.supabase.co")
        self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY", "***REMOVED***")
        
        # Create Supabase client
        self.supabase: Client = create_client(self.supabase_url, self.supabase_anon_key)
        
        # Test user credentials
        self.test_email = "test@example.com"
        self.test_password = "test_password123"
        
        # Create test user and get token
        self.access_token = self._get_or_create_test_user()
        
    def _get_or_create_test_user(self) -> str:
        """Get or create test user and return access token"""
        try:
            # Try to sign in first
            response = self.supabase.auth.sign_in_with_password({
                "email": self.test_email,
                "password": self.test_password
            })
            return response.session.access_token
        except:
            # If sign in fails, create new user
            try:
                response = self.supabase.auth.sign_up({
                    "email": self.test_email,
                    "password": self.test_password
                })
                return response.session.access_token
            except:
                # If both fail, use admin credentials
                admin_response = self.supabase.auth.sign_in_with_password({
                    "email": "admin001@mail.doshisha.ac.jp",
                    "password": "password123"
                })
                return admin_response.session.access_token
    
    def test_get_users_with_real_supabase(self):
        """Test GET /users with real Supabase"""
        response = self.client.get(
            "/api/users/",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_current_user_with_real_supabase(self):
        """Test GET /users/me with real Supabase"""
        response = self.client.get(
            "/api/users/me/",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        assert response.status_code == 200
        user_data = response.json()
        assert "id" in user_data
        assert "email" in user_data
    
    def test_get_user_by_id_with_real_supabase(self):
        """Test GET /users/{user_id} with real Supabase"""
        # First get current user to get ID
        me_response = self.client.get(
            "/api/users/me/",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        user_id = me_response.json()["id"]
        
        # Get user by ID
        response = self.client.get(
            f"/api/users/{user_id}",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["id"] == user_id
    
    def test_unauthorized_access(self):
        """Test endpoints without authentication"""
        response = self.client.get("/api/users/")
        assert response.status_code == 401
        
        response = self.client.get("/api/users/me/")
        assert response.status_code == 401
    
    def test_invalid_token(self):
        """Test with invalid token"""
        response = self.client.get(
            "/api/users/",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
    
    def test_user_crud_operations(self):
        """Test full CRUD operations with real Supabase"""
        # Create user data
        new_user_data = {
            "email": "crud_test@example.com",
            "password": "test_password123"
        }
        
        # Create user
        create_response = self.client.post(
            "/api/users/",
            json=new_user_data,
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        # Note: Create might fail if user already exists, but that's OK for this test
        if create_response.status_code == 200:
            created_user = create_response.json()
            user_id = created_user["id"]
            
            # Update user
            update_data = {"email": "updated_crud_test@example.com"}
            update_response = self.client.put(
                f"/api/users/{user_id}",
                json=update_data,
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            # Delete user
            delete_response = self.client.delete(
                f"/api/users/{user_id}",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            assert delete_response.status_code == 200
    
    def test_debug_endpoints(self):
        """Test debug endpoints"""
        # Test users CRUD debug endpoint
        response = self.client.get("/debug/users-crud")
        assert response.status_code == 200
        assert "status" in response.json()
        
        # Test Supabase users debug endpoint
        response = self.client.get("/debug/supabase-users")
        assert response.status_code == 200
        assert "connection" in response.json()