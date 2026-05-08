"""
Tests for Badges and Push Notifications features - Jam Connexion
Tests: badge initialization, retrieval, attribution, stats, and push notifications
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBadgesSystem:
    """Badge System endpoint tests"""
    
    @pytest.fixture(scope="class")
    def venue_user(self):
        """Create and authenticate a venue user"""
        email = f"test_venue_badges_{uuid.uuid4().hex[:8]}@test.com"
        register_data = {
            "email": email,
            "password": "test123",
            "name": "Test Venue Badges",
            "role": "venue"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 200:
            data = response.json()
            return {"token": data["token"], "user": data["user"], "email": email}
        # If user already exists, try login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bar@gmail.com",
            "password": "test"
        })
        if login_response.status_code == 200:
            data = login_response.json()
            return {"token": data["token"], "user": data["user"], "email": "bar@gmail.com"}
        pytest.skip("Could not create or login venue user")
    
    @pytest.fixture(scope="class")
    def musician_user(self):
        """Create and authenticate a musician user"""
        email = f"test_musician_badges_{uuid.uuid4().hex[:8]}@test.com"
        register_data = {
            "email": email,
            "password": "test123",
            "name": "Test Musician Badges",
            "role": "musician"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 200:
            data = response.json()
            return {"token": data["token"], "user": data["user"], "email": email}
        pytest.skip("Could not create musician user")
    
    def test_badge_initialization(self, venue_user):
        """Test POST /api/badges/initialize - Initialize default badges"""
        headers = {"Authorization": f"Bearer {venue_user['token']}"}
        response = requests.post(f"{BASE_URL}/api/badges/initialize", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should either initialize badges or indicate they already exist
        assert "message" in data
        assert "initialized" in data
        print(f"Badge initialization: {data['message']}")
    
    def test_get_all_badges(self, venue_user):
        """Test GET /api/badges/all - Get all badges with unlock status"""
        headers = {"Authorization": f"Bearer {venue_user['token']}"}
        response = requests.get(f"{BASE_URL}/api/badges/all", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        badges = response.json()
        
        # Should return a list of badges
        assert isinstance(badges, list), "Expected list of badges"
        
        # Check badge structure if badges exist
        if len(badges) > 0:
            badge = badges[0]
            required_fields = ["id", "name", "description", "icon", "category", "tier", 
                              "requirement_type", "requirement_value", "points", "unlocked"]
            for field in required_fields:
                assert field in badge, f"Badge missing field: {field}"
            
            print(f"Found {len(badges)} badges for venue user")
    
    def test_get_my_badges(self, venue_user):
        """Test GET /api/badges/my-badges - Get user's unlocked badges"""
        headers = {"Authorization": f"Bearer {venue_user['token']}"}
        response = requests.get(f"{BASE_URL}/api/badges/my-badges", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        badges = response.json()
        
        # Should return a list (may be empty if no badges unlocked yet)
        assert isinstance(badges, list), "Expected list of unlocked badges"
        
        # All returned badges should be unlocked
        for badge in badges:
            assert badge.get("unlocked") == True, "All my-badges should be unlocked"
        
        print(f"User has {len(badges)} unlocked badges")
    
    def test_get_user_stats(self, venue_user):
        """Test GET /api/badges/stats - Get user gamification stats"""
        headers = {"Authorization": f"Bearer {venue_user['token']}"}
        response = requests.get(f"{BASE_URL}/api/badges/stats", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        stats = response.json()
        
        # Check required stats fields
        required_fields = ["user_id", "total_points", "badges_count", "badges_by_tier", 
                          "level", "level_progress", "next_level_points"]
        for field in required_fields:
            assert field in stats, f"Stats missing field: {field}"
        
        # Validate data types
        assert isinstance(stats["total_points"], int), "total_points should be int"
        assert isinstance(stats["badges_count"], int), "badges_count should be int"
        assert isinstance(stats["level"], int), "level should be int"
        assert isinstance(stats["badges_by_tier"], dict), "badges_by_tier should be dict"
        
        # Check badges_by_tier structure
        expected_tiers = ["bronze", "silver", "gold", "platinum", "legendary"]
        for tier in expected_tiers:
            assert tier in stats["badges_by_tier"], f"Missing tier: {tier}"
        
        print(f"User stats: Level {stats['level']}, {stats['total_points']} points, {stats['badges_count']} badges")
    
    def test_check_and_award_badges(self, venue_user):
        """Test POST /api/badges/check - Check and award badges based on activity"""
        headers = {"Authorization": f"Bearer {venue_user['token']}"}
        response = requests.post(f"{BASE_URL}/api/badges/check", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "message" in data
        assert "newly_unlocked" in data
        assert isinstance(data["newly_unlocked"], list), "newly_unlocked should be list"
        
        # If badges were unlocked, verify structure
        for badge in data["newly_unlocked"]:
            assert "id" in badge
            assert "name" in badge
            assert "icon" in badge
        
        print(f"Badge check result: {data['message']}")
    
    def test_badges_for_musician(self, musician_user):
        """Test badges retrieval for musician role"""
        headers = {"Authorization": f"Bearer {musician_user['token']}"}
        
        # Get all badges for musician
        response = requests.get(f"{BASE_URL}/api/badges/all", headers=headers)
        assert response.status_code == 200
        badges = response.json()
        
        # Verify badges are filtered by role (musician or universal)
        for badge in badges:
            assert badge["category"] in ["musician", "universal"], \
                f"Musician should only see musician/universal badges, got: {badge['category']}"
        
        print(f"Musician can see {len(badges)} badges")
    
    def test_badges_unauthorized(self):
        """Test badges endpoints require authentication"""
        endpoints = [
            ("GET", "/api/badges/all"),
            ("GET", "/api/badges/my-badges"),
            ("GET", "/api/badges/stats"),
            ("POST", "/api/badges/check"),
            ("POST", "/api/badges/initialize"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}")
            
            assert response.status_code == 401, \
                f"Expected 401 for {method} {endpoint} without auth, got {response.status_code}"


class TestPushNotifications:
    """Push Notification endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_user(self):
        """Create and authenticate a user for push tests"""
        email = f"test_push_{uuid.uuid4().hex[:8]}@test.com"
        register_data = {
            "email": email,
            "password": "test123",
            "name": "Test Push User",
            "role": "venue"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 200:
            data = response.json()
            return {"token": data["token"], "user": data["user"]}
        # Try existing user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bar@gmail.com",
            "password": "test"
        })
        if login_response.status_code == 200:
            data = login_response.json()
            return {"token": data["token"], "user": data["user"]}
        pytest.skip("Could not authenticate user for push tests")
    
    def test_push_status_no_subscription(self, auth_user):
        """Test GET /api/notifications/push/status - Get push status without subscription"""
        headers = {"Authorization": f"Bearer {auth_user['token']}"}
        response = requests.get(f"{BASE_URL}/api/notifications/push/status", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "subscribed" in data
        assert "subscription_count" in data
        assert "subscriptions" in data
        assert isinstance(data["subscriptions"], list)
        
        print(f"Push status: subscribed={data['subscribed']}, count={data['subscription_count']}")
    
    def test_push_subscribe(self, auth_user):
        """Test POST /api/notifications/push/subscribe - Subscribe to push notifications"""
        headers = {
            "Authorization": f"Bearer {auth_user['token']}",
            "Content-Type": "application/json"
        }
        
        # Create a mock subscription object (simulating browser's PushSubscription)
        mock_subscription = {
            "subscription": {
                "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
                "keys": {
                    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                    "auth": "tBHItJI5svbpez7KI4CCXg"
                }
            },
            "user_agent": "Mozilla/5.0 (Test)",
            "platform": "Test Platform"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/notifications/push/subscribe", 
            headers=headers, 
            json=mock_subscription
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "id" in data
        print(f"Push subscribe: {data['message']}, id={data['id']}")
        
        return data["id"]
    
    def test_push_status_with_subscription(self, auth_user):
        """Test push status after subscription"""
        # First subscribe
        headers = {
            "Authorization": f"Bearer {auth_user['token']}",
            "Content-Type": "application/json"
        }
        
        mock_subscription = {
            "subscription": {
                "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
                "keys": {
                    "p256dh": "test_key",
                    "auth": "test_auth"
                }
            },
            "user_agent": "Test",
            "platform": "Test"
        }
        
        requests.post(f"{BASE_URL}/api/notifications/push/subscribe", headers=headers, json=mock_subscription)
        
        # Check status
        response = requests.get(f"{BASE_URL}/api/notifications/push/status", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["subscribed"] == True
        assert data["subscription_count"] >= 1
    
    def test_push_unsubscribe(self, auth_user):
        """Test POST /api/notifications/push/unsubscribe - Unsubscribe from push"""
        headers = {
            "Authorization": f"Bearer {auth_user['token']}",
            "Content-Type": "application/json"
        }
        
        # First subscribe
        endpoint = f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}"
        mock_subscription = {
            "subscription": {
                "endpoint": endpoint,
                "keys": {"p256dh": "test", "auth": "test"}
            },
            "user_agent": "Test",
            "platform": "Test"
        }
        
        requests.post(f"{BASE_URL}/api/notifications/push/subscribe", headers=headers, json=mock_subscription)
        
        # Then unsubscribe
        unsubscribe_data = {"endpoint": endpoint}
        response = requests.post(
            f"{BASE_URL}/api/notifications/push/unsubscribe",
            headers=headers,
            json=unsubscribe_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Push unsubscribe: {data['message']}")
    
    def test_push_unsubscribe_not_found(self, auth_user):
        """Test unsubscribe with non-existent endpoint"""
        headers = {
            "Authorization": f"Bearer {auth_user['token']}",
            "Content-Type": "application/json"
        }
        
        unsubscribe_data = {"endpoint": f"https://nonexistent/{uuid.uuid4().hex}"}
        response = requests.post(
            f"{BASE_URL}/api/notifications/push/unsubscribe",
            headers=headers,
            json=unsubscribe_data
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent subscription"
    
    def test_push_unauthorized(self):
        """Test push endpoints require authentication"""
        endpoints = [
            ("GET", "/api/notifications/push/status"),
            ("POST", "/api/notifications/push/subscribe"),
            ("POST", "/api/notifications/push/unsubscribe"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            
            assert response.status_code == 401, \
                f"Expected 401 for {method} {endpoint} without auth, got {response.status_code}"


class TestMessagesWithPushIntegration:
    """Test message sending triggers push notifications"""
    
    @pytest.fixture(scope="class")
    def two_users(self):
        """Create two users for messaging test"""
        users = []
        for i, role in enumerate(["musician", "venue"]):
            email = f"test_msg_push_{role}_{uuid.uuid4().hex[:8]}@test.com"
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": email,
                "password": "test123",
                "name": f"Test {role.title()} Msg",
                "role": role
            })
            if response.status_code == 200:
                data = response.json()
                users.append({"token": data["token"], "user": data["user"]})
        
        if len(users) < 2:
            pytest.skip("Could not create two users for message test")
        return users
    
    def test_send_message_creates_notification(self, two_users):
        """Test sending message creates notification for recipient"""
        sender = two_users[0]
        recipient = two_users[1]
        
        # Create profiles first
        if sender["user"]["role"] == "musician":
            requests.post(f"{BASE_URL}/api/musicians", 
                headers={"Authorization": f"Bearer {sender['token']}"},
                json={
                    "pseudo": f"TestMusician{uuid.uuid4().hex[:4]}",
                    "city": "Paris",
                    "instruments": ["guitar"],
                    "music_styles": ["rock"],
                    "experience_level": "intermediate",
                    "concerts": []
                }
            )
        
        if recipient["user"]["role"] == "venue":
            requests.post(f"{BASE_URL}/api/venues",
                headers={"Authorization": f"Bearer {recipient['token']}"},
                json={
                    "name": f"TestVenue{uuid.uuid4().hex[:4]}",
                    "city": "Paris",
                    "postal_code": "75001",
                    "address": "123 Test St",
                    "venue_type": "bar",
                    "music_styles": ["rock"],
                    "capacity": 100,
                    "latitude": 48.8566,
                    "longitude": 2.3522
                }
            )
        
        # Send message
        headers = {
            "Authorization": f"Bearer {sender['token']}",
            "Content-Type": "application/json"
        }
        message_data = {
            "recipient_id": recipient["user"]["id"],
            "subject": f"Test Message {uuid.uuid4().hex[:6]}",
            "content": "This is a test message to verify push notification integration"
        }
        
        response = requests.post(f"{BASE_URL}/api/messages", headers=headers, json=message_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify notification was created for recipient
        notif_response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {recipient['token']}"}
        )
        assert notif_response.status_code == 200
        notifications = notif_response.json()
        
        # Find the new_message notification
        new_msg_notifs = [n for n in notifications if n.get("type") == "new_message"]
        assert len(new_msg_notifs) > 0, "No new_message notification found for recipient"
        print(f"Message sent and notification created: {new_msg_notifs[0].get('title')}")


class TestFriendRequestWithPushIntegration:
    """Test friend request triggers push notifications"""
    
    @pytest.fixture(scope="class") 
    def two_musicians(self):
        """Create two musician users for friend request test"""
        musicians = []
        for i in range(2):
            email = f"test_friend_push_{i}_{uuid.uuid4().hex[:8]}@test.com"
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": email,
                "password": "test123",
                "name": f"Musician{i} Friend Test",
                "role": "musician"
            })
            if response.status_code == 200:
                data = response.json()
                # Create musician profile
                profile_response = requests.post(
                    f"{BASE_URL}/api/musicians",
                    headers={"Authorization": f"Bearer {data['token']}"},
                    json={
                        "pseudo": f"FriendTestMusician{i}_{uuid.uuid4().hex[:4]}",
                        "city": "Lyon",
                        "instruments": ["drums"],
                        "music_styles": ["jazz"],
                        "experience_level": "advanced",
                        "concerts": []
                    }
                )
                musicians.append({"token": data["token"], "user": data["user"]})
        
        if len(musicians) < 2:
            pytest.skip("Could not create two musicians for friend test")
        return musicians
    
    def test_friend_request_creates_notification(self, two_musicians):
        """Test sending friend request creates notification"""
        sender = two_musicians[0]
        recipient = two_musicians[1]
        
        # Send friend request
        headers = {
            "Authorization": f"Bearer {sender['token']}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            f"{BASE_URL}/api/friends/request",
            headers=headers,
            json={"to_user_id": recipient["user"]["id"]}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check notification for recipient
        notif_response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {recipient['token']}"}
        )
        assert notif_response.status_code == 200
        notifications = notif_response.json()
        
        friend_notifs = [n for n in notifications if n.get("type") == "friend_request"]
        assert len(friend_notifs) > 0, "No friend_request notification found"
        print(f"Friend request notification created: {friend_notifs[0].get('title')}")


# Additional health check
def test_api_health():
    """Test API health endpoint"""
    response = requests.get(f"{BASE_URL}/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"
    print(f"API healthy at {BASE_URL}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
