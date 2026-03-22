"""
Locust Load Testing Script for JamConnexion API
Tests performance optimization impact with 1000+ concurrent users
"""

from locust import HttpUser, task, between, TaskSet
import random
import json

class MusicianBehavior(TaskSet):
    """Simule le comportement d'un musicien"""
    
    @task(3)
    def list_musicians_paginated(self):
        """Test pagination on musicians endpoint"""
        page = random.randint(1, 5)
        limit = random.choice([10, 25, 50])
        self.client.get(
            f"/api/musicians?page={page}&limit={limit}",
            name="/api/musicians (paginated)"
        )
    
    @task(2)
    def search_musicians_by_instrument(self):
        """Test filtered search with pagination"""
        instruments = ["guitare", "batterie", "piano", "basse", "chant"]
        instrument = random.choice(instruments)
        page = random.randint(1, 3)
        self.client.get(
            f"/api/musicians?instrument={instrument}&page={page}&limit=20",
            name="/api/musicians (filtered)"
        )
    
    @task(2)
    def search_musicians_by_city(self):
        """Test city filter with pagination"""
        cities = ["paris", "lyon", "toulouse", "marseille", "bordeaux"]
        city = random.choice(cities)
        self.client.get(
            f"/api/musicians?city={city}&page=1&limit=20",
            name="/api/musicians (by city)"
        )
    
    @task(1)
    def get_specific_musician(self):
        """Test getting a specific musician profile"""
        # Note: In real scenario, we'd get actual musician IDs first
        # For now, we'll just test the list endpoint
        pass


class VenueBehavior(TaskSet):
    """Simule le comportement d'un établissement"""
    
    @task(3)
    def list_venues_paginated(self):
        """Test pagination on venues endpoint"""
        page = random.randint(1, 5)
        limit = random.choice([10, 25, 50])
        self.client.get(
            f"/api/venues?page={page}&limit={limit}",
            name="/api/venues (paginated)"
        )
    
    @task(2)
    def search_venues_by_city(self):
        """Test city filter with pagination"""
        cities = ["paris", "lyon", "toulouse", "marseille"]
        city = random.choice(cities)
        self.client.get(
            f"/api/venues?city={city}&page=1&limit=20",
            name="/api/venues (by city)"
        )
    
    @task(1)
    def search_venues_by_style(self):
        """Test style filter with pagination"""
        styles = ["Rock", "Jazz", "Blues", "Pop"]
        style = random.choice(styles)
        self.client.get(
            f"/api/venues?style={style}&page=1&limit=20",
            name="/api/venues (by style)"
        )


class GeneralBehavior(TaskSet):
    """Simule un utilisateur général naviguant sur le site"""
    
    @task(5)
    def browse_musicians(self):
        """Browse musicians list"""
        page = random.randint(1, 3)
        self.client.get(
            f"/api/musicians?page={page}&limit=25",
            name="/api/musicians (browse)"
        )
    
    @task(5)
    def browse_venues(self):
        """Browse venues list"""
        page = random.randint(1, 3)
        self.client.get(
            f"/api/venues?page={page}&limit=25",
            name="/api/venues (browse)"
        )
    
    @task(2)
    def search_combined(self):
        """Combined search with multiple filters"""
        instrument = random.choice(["guitare", "batterie", "piano"])
        city = random.choice(["paris", "lyon", "toulouse"])
        self.client.get(
            f"/api/musicians?instrument={instrument}&city={city}&page=1&limit=15",
            name="/api/musicians (combined filters)"
        )


class ApiUser(HttpUser):
    """Simule différents types d'utilisateurs de l'API"""
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    tasks = {
        MusicianBehavior: 3,
        VenueBehavior: 3,
        GeneralBehavior: 4
    }
    
    def on_start(self):
        """Called when a simulated user starts"""
        # Could perform login here if needed
        pass


class AuthenticatedUser(HttpUser):
    """Simule des utilisateurs authentifiés"""
    wait_time = between(2, 5)
    
    token = None
    
    def on_start(self):
        """Login before starting tasks"""
        # Try to login as a test user
        response = self.client.post("/api/auth/login", json={
            "email": "musician@gmail.com",
            "password": "test"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
    
    @task(2)
    def get_my_profile(self):
        """Get authenticated user profile"""
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.get(
                "/api/musicians/me",
                headers=headers,
                name="/api/musicians/me (auth)"
            )
    
    @task(1)
    def get_friends(self):
        """Get friends list"""
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.get(
                "/api/friends",
                headers=headers,
                name="/api/friends (auth)"
            )


# Scenarios de test spécifiques
class HighLoadScenario(HttpUser):
    """Test de charge élevée - 1000+ utilisateurs simultanés"""
    wait_time = between(0.5, 2)
    
    @task(10)
    def rapid_pagination_requests(self):
        """Simulate rapid page navigation"""
        for page in range(1, 4):
            self.client.get(
                f"/api/musicians?page={page}&limit=50",
                name="/api/musicians (rapid pagination)"
            )
    
    @task(5)
    def stress_test_filters(self):
        """Test filters under load"""
        instruments = ["guitare", "batterie", "piano", "basse"]
        for instrument in instruments:
            self.client.get(
                f"/api/musicians?instrument={instrument}&page=1&limit=20",
                name="/api/musicians (stress filters)"
            )


if __name__ == "__main__":
    print("""
    🚀 JamConnexion Load Testing Script
    
    Usage:
    ------
    # Run with Web UI:
    locust -f locust_load_test.py --host=https://pro-musician-sub.preview.emergentagent.com
    
    # Run headless with specific user count:
    locust -f locust_load_test.py --host=https://pro-musician-sub.preview.emergentagent.com --headless -u 100 -r 10 --run-time 2m
    
    # High load test (1000 users):
    locust -f locust_load_test.py --host=https://pro-musician-sub.preview.emergentagent.com --headless -u 1000 -r 50 --run-time 3m --only-summary
    
    Parameters:
    -----------
    -u : Number of users to simulate
    -r : Spawn rate (users spawned per second)
    --run-time : Test duration (e.g., 2m, 30s)
    --headless : Run without web UI
    --only-summary : Show only summary statistics
    
    Test Scenarios:
    ---------------
    1. ApiUser - General API usage (default)
    2. AuthenticatedUser - Authenticated requests
    3. HighLoadScenario - Stress test with 1000+ users
    """)
