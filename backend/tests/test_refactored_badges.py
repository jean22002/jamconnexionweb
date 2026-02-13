"""
Test suite for refactored backend and badge system
Tests:
- Authentication (login, register, me)
- Badge system (initialization, all, my-badges, user badges, check)
- Event creation with auto badge attribution
- Friend system with badge attribution
- Venue subscriptions with badge attribution
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
VENUE_EMAIL = "bar@gmail.com"
VENUE_PASSWORD = "test"
MUSICIAN_EMAIL = "musician@gmail.com"
MUSICIAN_PASSWORD = "test"
MELOMANE_EMAIL = "melomane@gmail.com"
MELOMANE_PASSWORD = "test"


class TestAuthentication:
    """Test auth endpoints after refactoring"""
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        # Root returns HTML for frontend
        print("SUCCESS: Root endpoint accessible")
    
    def test_venue_login(self):
        """Test venue login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENUE_EMAIL,
            "password": VENUE_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "venue"
        print(f"SUCCESS: Venue login - user_id: {data['user']['id']}")
        return data
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("SUCCESS: Invalid credentials correctly rejected")
    
    def test_auth_me_without_token(self):
        """Test /auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("SUCCESS: /auth/me without token returns 401")
    
    def test_auth_me_with_token(self):
        """Test /auth/me with valid token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENUE_EMAIL,
            "password": VENUE_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Then get /me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == VENUE_EMAIL
        assert data["role"] == "venue"
        print(f"SUCCESS: /auth/me returned user data: {data['email']}")


class TestBadgesSystem:
    """Test badge system after refactoring"""
    
    @pytest.fixture
    def venue_token(self):
        """Get venue token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENUE_EMAIL,
            "password": VENUE_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Venue login failed: {response.text}")
        return response.json()["token"]
    
    def test_badges_all_without_auth(self):
        """Test /badges/all requires authentication"""
        response = requests.get(f"{BASE_URL}/api/badges/all")
        assert response.status_code == 401
        print("SUCCESS: /badges/all requires authentication")
    
    def test_badges_all_with_auth(self, venue_token):
        """Test getting all badges"""
        response = requests.get(f"{BASE_URL}/api/badges/all", headers={
            "Authorization": f"Bearer {venue_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} badges for venue")
        
        # Check badge structure
        if len(data) > 0:
            badge = data[0]
            assert "id" in badge
            assert "name" in badge
            assert "icon" in badge
            assert "category" in badge
            assert "tier" in badge
            assert "progress" in badge
            assert "progress_percentage" in badge
            print(f"SUCCESS: Badge structure valid - first badge: {badge['name']}")
    
    def test_badges_my_badges(self, venue_token):
        """Test getting user's unlocked badges"""
        response = requests.get(f"{BASE_URL}/api/badges/my-badges", headers={
            "Authorization": f"Bearer {venue_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: User has {len(data)} unlocked badges")
    
    def test_badges_user_public_endpoint(self, venue_token):
        """Test public endpoint /badges/user/{user_id}"""
        # First get user id from /auth/me
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {venue_token}"
        })
        user_id = me_response.json()["id"]
        
        # Test public endpoint (no auth required)
        response = requests.get(f"{BASE_URL}/api/badges/user/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Public badges endpoint returned {len(data)} badges for user {user_id}")
    
    def test_badges_stats(self, venue_token):
        """Test getting user gamification stats"""
        response = requests.get(f"{BASE_URL}/api/badges/stats", headers={
            "Authorization": f"Bearer {venue_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "total_points" in data
        assert "badges_count" in data
        assert "level" in data
        assert "badges_by_tier" in data
        print(f"SUCCESS: User stats - Level: {data['level']}, Points: {data['total_points']}, Badges: {data['badges_count']}")
    
    def test_badges_check(self, venue_token):
        """Test badge check and award endpoint"""
        response = requests.post(f"{BASE_URL}/api/badges/check", headers={
            "Authorization": f"Bearer {venue_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "newly_unlocked" in data
        print(f"SUCCESS: Badge check - {data['message']}")


class TestVenueProfilesAndEvents:
    """Test venue profile and events after refactoring"""
    
    @pytest.fixture
    def venue_auth(self):
        """Get venue token and user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENUE_EMAIL,
            "password": VENUE_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Venue login failed: {response.text}")
        data = response.json()
        return {"token": data["token"], "user": data["user"]}
    
    def test_venues_me(self, venue_auth):
        """Test getting own venue profile"""
        response = requests.get(f"{BASE_URL}/api/venues/me", headers={
            "Authorization": f"Bearer {venue_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        print(f"SUCCESS: Got venue profile - {data.get('name', 'Unknown')}")
        return data
    
    def test_venues_list(self):
        """Test public venues list"""
        response = requests.get(f"{BASE_URL}/api/venues")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} venues")
    
    def test_venues_jams_list(self, venue_auth):
        """Test getting venue jams"""
        # First get venue profile to get venue_id
        venue_response = requests.get(f"{BASE_URL}/api/venues/me", headers={
            "Authorization": f"Bearer {venue_auth['token']}"
        })
        venue = venue_response.json()
        
        response = requests.get(f"{BASE_URL}/api/venues/{venue['id']}/jams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} jams for venue")
    
    def test_venues_concerts_list(self, venue_auth):
        """Test getting venue concerts"""
        venue_response = requests.get(f"{BASE_URL}/api/venues/me", headers={
            "Authorization": f"Bearer {venue_auth['token']}"
        })
        venue = venue_response.json()
        
        response = requests.get(f"{BASE_URL}/api/venues/{venue['id']}/concerts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} concerts for venue")


class TestMusicianSystem:
    """Test musician endpoints after refactoring"""
    
    @pytest.fixture
    def musician_token(self):
        """Get or create musician token"""
        # Try to login first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MUSICIAN_EMAIL,
            "password": MUSICIAN_PASSWORD
        })
        
        if response.status_code == 200:
            return response.json()["token"]
        
        # Create musician if doesn't exist
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": MUSICIAN_EMAIL,
            "password": MUSICIAN_PASSWORD,
            "name": "Test Musician",
            "role": "musician"
        })
        
        if register_response.status_code == 200:
            return register_response.json()["token"]
        
        pytest.skip("Could not login or register musician")
    
    def test_musicians_list(self):
        """Test public musicians list"""
        response = requests.get(f"{BASE_URL}/api/musicians")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} musicians")
    
    def test_musicians_me(self, musician_token):
        """Test getting own musician profile"""
        response = requests.get(f"{BASE_URL}/api/musicians/me", headers={
            "Authorization": f"Bearer {musician_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"SUCCESS: Got musician profile - pseudo: {data.get('pseudo', 'Unknown')}")


class TestFriendSystem:
    """Test friend system after refactoring"""
    
    @pytest.fixture
    def musician_auth(self):
        """Get musician auth"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MUSICIAN_EMAIL,
            "password": MUSICIAN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            return {"token": data["token"], "user": data["user"]}
        
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": MUSICIAN_EMAIL,
            "password": MUSICIAN_PASSWORD,
            "name": "Test Musician",
            "role": "musician"
        })
        
        if register_response.status_code == 200:
            data = register_response.json()
            return {"token": data["token"], "user": data["user"]}
        
        pytest.skip("Could not login or register musician")
    
    def test_friends_list(self, musician_auth):
        """Test getting friends list"""
        response = requests.get(f"{BASE_URL}/api/friends/", headers={
            "Authorization": f"Bearer {musician_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Musician has {len(data)} friends")
    
    def test_friend_requests(self, musician_auth):
        """Test getting friend requests"""
        response = requests.get(f"{BASE_URL}/api/friends/requests", headers={
            "Authorization": f"Bearer {musician_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Musician has {len(data)} pending friend requests")
    
    def test_sent_friend_requests(self, musician_auth):
        """Test getting sent friend requests"""
        response = requests.get(f"{BASE_URL}/api/friends/sent", headers={
            "Authorization": f"Bearer {musician_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Musician sent {len(data)} friend requests")


class TestMelomaneSystem:
    """Test melomane endpoints after refactoring"""
    
    @pytest.fixture
    def melomane_auth(self):
        """Get or create melomane auth"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MELOMANE_EMAIL,
            "password": MELOMANE_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            return {"token": data["token"], "user": data["user"]}
        
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": MELOMANE_EMAIL,
            "password": MELOMANE_PASSWORD,
            "name": "Test Melomane",
            "role": "melomane"
        })
        
        if register_response.status_code == 200:
            data = register_response.json()
            return {"token": data["token"], "user": data["user"]}
        
        pytest.skip("Could not login or register melomane")
    
    def test_melomanes_list(self):
        """Test public melomanes list"""
        response = requests.get(f"{BASE_URL}/api/melomanes/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} melomanes")
    
    def test_melomanes_me(self, melomane_auth):
        """Test getting own melomane profile"""
        response = requests.get(f"{BASE_URL}/api/melomanes/me", headers={
            "Authorization": f"Bearer {melomane_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"SUCCESS: Got melomane profile - pseudo: {data.get('pseudo', 'Unknown')}")


class TestNotificationsSystem:
    """Test notifications after refactoring"""
    
    @pytest.fixture
    def venue_token(self):
        """Get venue token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENUE_EMAIL,
            "password": VENUE_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Venue login failed: {response.text}")
        return response.json()["token"]
    
    def test_notifications_list(self, venue_token):
        """Test getting notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications/", headers={
            "Authorization": f"Bearer {venue_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} notifications")
    
    def test_notifications_unread_count(self, venue_token):
        """Test getting unread count"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers={
            "Authorization": f"Bearer {venue_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"SUCCESS: Unread notifications: {data['count']}")


class TestVenueSubscription:
    """Test venue subscription for badge attribution"""
    
    @pytest.fixture
    def musician_auth(self):
        """Get musician auth"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MUSICIAN_EMAIL,
            "password": MUSICIAN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Musician login failed")
        data = response.json()
        return {"token": data["token"], "user": data["user"]}
    
    @pytest.fixture
    def venue_id(self):
        """Get a venue id"""
        response = requests.get(f"{BASE_URL}/api/venues")
        if response.status_code != 200 or not response.json():
            pytest.skip("No venues found")
        return response.json()[0]["id"]
    
    def test_subscribe_to_venue(self, musician_auth, venue_id):
        """Test subscribing to venue"""
        response = requests.post(f"{BASE_URL}/api/venues/{venue_id}/subscribe", headers={
            "Authorization": f"Bearer {musician_auth['token']}"
        })
        # Either 200 (success) or 400 (already subscribed)
        assert response.status_code in [200, 400]
        print(f"SUCCESS: Subscribe response - {response.status_code}: {response.json().get('message', response.json().get('detail', 'OK'))}")
    
    def test_subscription_status(self, musician_auth, venue_id):
        """Test getting subscription status"""
        response = requests.get(f"{BASE_URL}/api/venues/{venue_id}/subscription-status", headers={
            "Authorization": f"Bearer {musician_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "subscribed" in data
        print(f"SUCCESS: Subscription status: {data['subscribed']}")


class TestEventParticipation:
    """Test event participation for badge attribution"""
    
    @pytest.fixture
    def musician_auth(self):
        """Get musician auth"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MUSICIAN_EMAIL,
            "password": MUSICIAN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Musician login failed")
        data = response.json()
        return {"token": data["token"], "user": data["user"]}
    
    def test_get_musician_participations(self, musician_auth):
        """Test getting musician's event participations"""
        response = requests.get(f"{BASE_URL}/api/musicians/me/participations", headers={
            "Authorization": f"Bearer {musician_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Musician has {len(data)} event participations")


class TestMessagingSystem:
    """Test messaging system after refactoring"""
    
    @pytest.fixture
    def venue_token(self):
        """Get venue token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENUE_EMAIL,
            "password": VENUE_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Venue login failed")
        return response.json()["token"]
    
    def test_messages_list(self, venue_token):
        """Test getting messages"""
        response = requests.get(f"{BASE_URL}/api/messages/", headers={
            "Authorization": f"Bearer {venue_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} messages")
    
    def test_conversations(self, venue_token):
        """Test getting conversations"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations", headers={
            "Authorization": f"Bearer {venue_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} conversations")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
