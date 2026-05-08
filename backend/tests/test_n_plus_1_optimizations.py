"""
Test suite for N+1 optimizations and bug fixes in Jam Connexion
Testing optimized MongoDB aggregation pipelines for:
- /api/my-subscriptions (venue enrichment with $lookup)
- /api/friends/requests (user data enrichment)
- /api/friends (friends list enrichment)
- /api/friends/sent (sent requests enrichment)
- /api/venues/{id}/jams (participants_count via aggregation)
- /api/venues/{id}/concerts (participants_count via aggregation)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_MUSICIAN = {"email": "musician@gmail.com", "password": "test"}
TEST_VENUE = {"email": "bar@gmail.com", "password": "test"}
TEST_MELOMANE = {"email": "melomane@gmail.com", "password": "test"}


@pytest.fixture(scope="module")
def musician_token():
    """Authenticate as musician and return token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_MUSICIAN)
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip(f"Musician authentication failed: {response.status_code}")


@pytest.fixture(scope="module")
def venue_token():
    """Authenticate as venue and return token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_VENUE)
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip(f"Venue authentication failed: {response.status_code}")


@pytest.fixture(scope="module")
def venue_id(venue_token):
    """Get venue ID for venue user"""
    headers = {"Authorization": f"Bearer {venue_token}"}
    response = requests.get(f"{BASE_URL}/api/venues/me", headers=headers)
    if response.status_code == 200:
        return response.json()["id"]
    pytest.skip("Could not get venue ID")


class TestMySubscriptions:
    """Tests for /api/my-subscriptions endpoint with venue enrichment"""
    
    def test_my_subscriptions_returns_200(self, musician_token):
        """Test that endpoint returns 200 for authenticated user"""
        headers = {"Authorization": f"Bearer {musician_token}"}
        response = requests.get(f"{BASE_URL}/api/my-subscriptions", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_my_subscriptions_venue_data_enriched(self, musician_token):
        """Test that subscriptions contain enriched venue data (name, city, image)"""
        headers = {"Authorization": f"Bearer {musician_token}"}
        response = requests.get(f"{BASE_URL}/api/my-subscriptions", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            sub = data[0]
            # Verify enriched fields from $lookup pipeline
            assert "venue_name" in sub, "Missing venue_name field (enrichment)"
            assert "city" in sub, "Missing city field (enrichment)"
            assert "venue_image" in sub, "Missing venue_image field (enrichment)"
            assert "venue_id" in sub, "Missing venue_id field"
            
            # Verify venue_name is not null/empty (bug fix verification)
            assert sub.get("venue_name"), f"venue_name is empty/null: {sub.get('venue_name')}"
            print(f"✓ Subscription enriched with venue_name='{sub['venue_name']}', city='{sub.get('city')}'")
        else:
            pytest.skip("No subscriptions found for testing")
    
    def test_my_subscriptions_no_mongodb_id(self, musician_token):
        """Verify that MongoDB _id is not exposed in response"""
        headers = {"Authorization": f"Bearer {musician_token}"}
        response = requests.get(f"{BASE_URL}/api/my-subscriptions", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        for sub in data:
            assert "_id" not in sub, "MongoDB _id should not be in response"


class TestFriendsRequests:
    """Tests for /api/friends/requests endpoint with N+1 optimization"""
    
    def test_friends_requests_returns_200(self, musician_token):
        """Test that endpoint returns 200"""
        headers = {"Authorization": f"Bearer {musician_token}"}
        response = requests.get(f"{BASE_URL}/api/friends/requests", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_friends_requests_enriched_data(self, musician_token):
        """Test that friend requests contain enriched user data"""
        headers = {"Authorization": f"Bearer {musician_token}"}
        response = requests.get(f"{BASE_URL}/api/friends/requests", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            req = data[0]
            # Verify enriched fields from aggregation
            expected_fields = ["from_user_id", "from_user_name", "from_user_role", 
                            "from_user_image", "from_user_city", "from_profile_id"]
            for field in expected_fields:
                assert field in req, f"Missing field: {field}"
            print(f"✓ Friend request enriched with name='{req.get('from_user_name')}', city='{req.get('from_user_city')}'")


class TestFriendsList:
    """Tests for /api/friends endpoint with N+1 optimization"""
    
    def test_friends_list_returns_200(self, musician_token):
        """Test that endpoint returns 200"""
        headers = {"Authorization": f"Bearer {musician_token}"}
        response = requests.get(f"{BASE_URL}/api/friends", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_friends_list_enriched_data(self, musician_token):
        """Test that friends list contains enriched user data"""
        headers = {"Authorization": f"Bearer {musician_token}"}
        response = requests.get(f"{BASE_URL}/api/friends", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            friend = data[0]
            # Verify enriched fields from aggregation
            expected_fields = ["friend_id", "friend_name", "friend_role", 
                            "profile_id", "pseudo", "city"]
            for field in expected_fields:
                assert field in friend, f"Missing field: {field}"
            
            # Verify friend data is enriched
            assert friend.get("pseudo"), "pseudo should not be empty"
            print(f"✓ Friend enriched with pseudo='{friend['pseudo']}', city='{friend.get('city')}'")
        else:
            pytest.skip("No friends found for testing")


class TestFriendsSent:
    """Tests for /api/friends/sent endpoint with N+1 optimization"""
    
    def test_friends_sent_returns_200(self, musician_token):
        """Test that endpoint returns 200"""
        headers = {"Authorization": f"Bearer {musician_token}"}
        response = requests.get(f"{BASE_URL}/api/friends/sent", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_friends_sent_enriched_data(self, musician_token):
        """Test that sent requests contain enriched user data"""
        headers = {"Authorization": f"Bearer {musician_token}"}
        response = requests.get(f"{BASE_URL}/api/friends/sent", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            sent = data[0]
            # Verify enriched fields
            expected_fields = ["to_user_id", "pseudo", "profile_image", "city"]
            for field in expected_fields:
                assert field in sent, f"Missing field: {field}"
            print(f"✓ Sent request enriched with pseudo='{sent.get('pseudo')}'")


class TestVenueJams:
    """Tests for /api/venues/{id}/jams endpoint with participants_count"""
    
    def test_venue_jams_returns_200(self, venue_id):
        """Test that endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/venues/{venue_id}/jams")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_venue_jams_has_participants_count(self, venue_id):
        """Test that jams contain participants_count field from aggregation"""
        response = requests.get(f"{BASE_URL}/api/venues/{venue_id}/jams")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            jam = data[0]
            # Verify participants_count field exists
            assert "participants_count" in jam, "Missing participants_count field"
            assert isinstance(jam["participants_count"], int), "participants_count should be int"
            print(f"✓ Jam has participants_count={jam['participants_count']}")
        else:
            # No jams is OK - just verify structure
            print("✓ No jams found but API working")


class TestVenueConcerts:
    """Tests for /api/venues/{id}/concerts endpoint with participants_count"""
    
    def test_venue_concerts_returns_200(self, venue_id):
        """Test that endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/venues/{venue_id}/concerts")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_venue_concerts_has_participants_count(self, venue_id):
        """Test that concerts contain participants_count field from aggregation"""
        response = requests.get(f"{BASE_URL}/api/venues/{venue_id}/concerts")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            concert = data[0]
            # Verify participants_count field exists
            assert "participants_count" in concert, "Missing participants_count field"
            assert isinstance(concert["participants_count"], int), "participants_count should be int"
            print(f"✓ Concert '{concert.get('title', 'N/A')}' has participants_count={concert['participants_count']}")
        else:
            print("✓ No concerts found but API working")


class TestConcertsList:
    """Tests for /api/concerts endpoint with participants_count"""
    
    def test_concerts_list_returns_200(self):
        """Test that endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/concerts")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_concerts_list_has_participants_count(self):
        """Test that concerts list contains participants_count"""
        response = requests.get(f"{BASE_URL}/api/concerts")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            concert = data[0]
            assert "participants_count" in concert, "Missing participants_count field"
            print(f"✓ Concerts list has participants_count")


class TestFriendshipFlow:
    """Integration tests for friend system (no regression from optimizations)"""
    
    def test_friendship_endpoints_authenticated(self, musician_token):
        """Test that all friendship endpoints require authentication"""
        # Without token should fail
        endpoints = ["/api/friends", "/api/friends/requests", "/api/friends/sent"]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code in [401, 403], f"{endpoint} should require auth"
        print("✓ All friendship endpoints require authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
