"""
Test suite for verify-email page and registration PRO status changes
Tests:
1. GET /api/auth/verify-email?token=invalid returns 404
2. POST /api/auth/resend-verification?email=test@gmail.com endpoint accessible
3. POST /api/auth/register does NOT assign PRO status (subscription_tier: free, is_pro: false)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVerifyEmailEndpoints:
    """Tests for email verification endpoints"""
    
    def test_verify_email_invalid_token_returns_404(self):
        """GET /api/auth/verify-email with invalid token should return 404"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-email?token=invalid_token_12345")
        
        # Should return 404 for invalid token
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Response should contain 'detail' field"
        print(f"✅ Invalid token returns 404 with message: {data.get('detail')}")
    
    def test_resend_verification_endpoint_accessible(self):
        """POST /api/auth/resend-verification endpoint should be accessible"""
        # Test with existing email (test@gmail.com)
        response = requests.post(f"{BASE_URL}/api/auth/resend-verification?email=test@gmail.com")
        
        # Should return 400 (already verified) or 404 (not found) or 200 (success) or 429 (rate limited)
        # NOT 500 (server error) or 405 (method not allowed)
        assert response.status_code in [200, 400, 404, 429], f"Expected 200/400/404/429, got {response.status_code}: {response.text}"
        
        print(f"✅ Resend verification endpoint accessible, status: {response.status_code}")
        if response.status_code == 400:
            data = response.json()
            print(f"   Response: {data.get('detail', data)}")


class TestRegistrationNoPROStatus:
    """Tests for registration NOT assigning PRO status automatically"""
    
    def test_register_musician_no_pro_status(self):
        """POST /api/auth/register for musician should NOT assign PRO status"""
        # Generate unique email for test
        unique_email = f"test_no_pro_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpassword123",
            "name": "Test No PRO User",
            "role": "musician"
        })
        
        # Registration should succeed
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        
        token = data["token"]
        
        # Now fetch the musician profile to verify PRO status
        profile_response = requests.get(
            f"{BASE_URL}/api/musicians/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert profile_response.status_code == 200, f"Expected 200, got {profile_response.status_code}"
        
        profile = profile_response.json()
        
        # Verify NO PRO status
        subscription_tier = profile.get("subscription_tier", "free")
        is_pro = profile.get("is_pro", False)
        pro_subscription_status = profile.get("pro_subscription_status", "inactive")
        
        assert subscription_tier == "free", f"Expected subscription_tier='free', got '{subscription_tier}'"
        assert is_pro == False, f"Expected is_pro=False, got {is_pro}"
        assert pro_subscription_status == "inactive", f"Expected pro_subscription_status='inactive', got '{pro_subscription_status}'"
        
        print(f"✅ New musician registered without PRO status:")
        print(f"   subscription_tier: {subscription_tier}")
        print(f"   is_pro: {is_pro}")
        print(f"   pro_subscription_status: {pro_subscription_status}")
        
        # Cleanup: We can't easily delete the user, but the test email is unique


class TestLoginWithTestCredentials:
    """Test login with test@gmail.com / test credentials"""
    
    def test_login_test_user(self):
        """Login with test@gmail.com / test should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@gmail.com",
            "password": "test"
        })
        
        # Should succeed
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == "test@gmail.com"
        
        print(f"✅ Login with test@gmail.com / test successful")
        print(f"   User role: {data['user'].get('role')}")
        
        return data["token"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
