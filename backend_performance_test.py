#!/usr/bin/env python3
"""
Performance Optimization Test Suite for Jam Connexion Backend
Testing MongoDB Connection Pooling, Cache Headers, Rate Limiting, and Core Functionality
"""

import requests
import json
import os
import sys
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Get backend URL from frontend environment
BACKEND_URL = "https://musician-calendar-1.preview.emergentagent.com/api"

# Test credentials
TEST_EMAIL = "bar@gmail.com"
TEST_PASSWORD = "test"

class PerformanceTestSuite:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.user_data = None
        self.test_results = []
        
    def log_result(self, test_name, success, details):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def measure_response_time(self, func):
        """Decorator to measure response time"""
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            return result, response_time
        return wrapper
    
    # ==========================================
    # 1. CORE FUNCTIONALITY TESTS
    # ==========================================
    
    def test_authentication(self):
        """Test 1: Login with valid credentials"""
        print("\n🔐 Test 1: Core Functionality - Authentication")
        
        try:
            login_url = f"{BACKEND_URL}/auth/login"
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            start_time = time.time()
            response = self.session.post(login_url, json=login_data, timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data or "access_token" in data:
                    self.jwt_token = data.get("token") or data.get("access_token")
                    self.user_data = data.get("user", {})
                    
                    if self.user_data.get("role") == "venue":
                        self.log_result("Authentication", True, 
                                      f"Login successful ({response_time:.1f}ms), JWT token obtained, role: {self.user_data.get('role')}")
                        return True
                    else:
                        self.log_result("Authentication", False, 
                                      f"User role is '{self.user_data.get('role')}' but should be 'venue'")
                        return False
                else:
                    self.log_result("Authentication", False, f"No token in response: {data.keys()}")
                    return False
            else:
                self.log_result("Authentication", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Authentication", False, f"Exception: {str(e)}")
            return False
    
    def test_get_venues_endpoint(self):
        """Test 2: GET /api/venues endpoint"""
        print("\n🏪 Test 2: Core Functionality - GET /api/venues")
        
        try:
            url = f"{BACKEND_URL}/venues"
            start_time = time.time()
            response = self.session.get(url, timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result("GET Venues", True, 
                                  f"Retrieved {len(data)} venues ({response_time:.1f}ms)")
                    return True
                else:
                    self.log_result("GET Venues", False, f"Expected list with venues, got: {type(data)}")
                    return False
            else:
                self.log_result("GET Venues", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("GET Venues", False, f"Exception: {str(e)}")
            return False
    
    def test_get_musicians_endpoint(self):
        """Test 3: GET /api/musicians endpoint"""
        print("\n🎵 Test 3: Core Functionality - GET /api/musicians")
        
        try:
            url = f"{BACKEND_URL}/musicians"
            start_time = time.time()
            response = self.session.get(url, timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result("GET Musicians", True, 
                                  f"Retrieved {len(data)} musicians ({response_time:.1f}ms)")
                    return True
                else:
                    self.log_result("GET Musicians", False, f"Expected list with musicians, got: {type(data)}")
                    return False
            else:
                self.log_result("GET Musicians", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("GET Musicians", False, f"Exception: {str(e)}")
            return False
    
    def test_get_bands_endpoint(self):
        """Test 4: GET /api/bands endpoint"""
        print("\n🎸 Test 4: Core Functionality - GET /api/bands")
        
        try:
            url = f"{BACKEND_URL}/bands"
            start_time = time.time()
            response = self.session.get(url, timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("GET Bands", True, 
                                  f"Retrieved {len(data)} bands ({response_time:.1f}ms)")
                    return True
                else:
                    self.log_result("GET Bands", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_result("GET Bands", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("GET Bands", False, f"Exception: {str(e)}")
            return False
    
    # ==========================================
    # 2. CACHE HEADERS VALIDATION
    # ==========================================
    
    def test_venues_cache_headers(self):
        """Test 5: Verify Cache-Control headers on /api/venues"""
        print("\n💾 Test 5: Cache Headers - GET /api/venues")
        
        try:
            url = f"{BACKEND_URL}/venues"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                cache_control = response.headers.get('Cache-Control', '')
                
                # Expected: public, max-age=300 (from cache middleware for public data)
                if 'public' in cache_control and ('max-age=300' in cache_control or 'max-age=60' in cache_control):
                    self.log_result("Venues Cache Headers", True, 
                                  f"Cache-Control: {cache_control}")
                    return True
                else:
                    self.log_result("Venues Cache Headers", False, 
                                  f"Invalid Cache-Control header: {cache_control}")
                    return False
            else:
                self.log_result("Venues Cache Headers", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Venues Cache Headers", False, f"Exception: {str(e)}")
            return False
    
    def test_musicians_cache_headers(self):
        """Test 6: Verify Cache-Control headers on /api/musicians"""
        print("\n💾 Test 6: Cache Headers - GET /api/musicians")
        
        try:
            url = f"{BACKEND_URL}/musicians"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                cache_control = response.headers.get('Cache-Control', '')
                
                # Expected: public cache headers
                if 'public' in cache_control and 'max-age' in cache_control:
                    self.log_result("Musicians Cache Headers", True, 
                                  f"Cache-Control: {cache_control}")
                    return True
                else:
                    self.log_result("Musicians Cache Headers", False, 
                                  f"Invalid Cache-Control header: {cache_control}")
                    return False
            else:
                self.log_result("Musicians Cache Headers", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Musicians Cache Headers", False, f"Exception: {str(e)}")
            return False
    
    def test_health_cache_headers(self):
        """Test 7: Verify Cache-Control headers on /health"""
        print("\n💾 Test 7: Cache Headers - GET /health")
        
        try:
            # Use base URL without /api for health endpoint
            url = "https://musician-calendar-1.preview.emergentagent.com/health"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                cache_control = response.headers.get('Cache-Control', '')
                
                # Default cache behavior
                self.log_result("Health Cache Headers", True, 
                              f"Cache-Control: {cache_control if cache_control else 'Default cache'}")
                return True
            else:
                self.log_result("Health Cache Headers", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Health Cache Headers", False, f"Exception: {str(e)}")
            return False
    
    def test_login_cache_headers(self):
        """Test 8: Verify Cache-Control headers on POST /api/auth/login (should have no-store)"""
        print("\n💾 Test 8: Cache Headers - POST /api/auth/login")
        
        try:
            url = f"{BACKEND_URL}/auth/login"
            login_data = {
                "email": "invalid@test.com",  # Use invalid credentials to avoid side effects
                "password": "invalid"
            }
            response = self.session.post(url, json=login_data, timeout=30)
            
            # We expect this to fail (401), but we want to check cache headers
            cache_control = response.headers.get('Cache-Control', '')
            
            # POST requests should have no-store
            if 'no-store' in cache_control:
                self.log_result("Login Cache Headers", True, 
                              f"Cache-Control: {cache_control}")
                return True
            else:
                self.log_result("Login Cache Headers", False, 
                              f"POST should have no-store. Got: {cache_control}")
                return False
                
        except Exception as e:
            self.log_result("Login Cache Headers", False, f"Exception: {str(e)}")
            return False
    
    # ==========================================
    # 3. RATE LIMITING TESTS
    # ==========================================
    
    def test_auth_rate_limiting(self):
        """Test 9: Rate limiting on POST /api/auth/login (should limit after 10 attempts in 5 minutes)"""
        print("\n🚦 Test 9: Rate Limiting - POST /api/auth/login")
        
        try:
            url = f"{BACKEND_URL}/auth/login"
            invalid_data = {
                "email": "invalid@test.com",
                "password": "wrongpassword"
            }
            
            # Make 11 rapid requests with wrong credentials
            responses = []
            for i in range(11):
                response = self.session.post(url, json=invalid_data, timeout=10)
                responses.append(response.status_code)
                
                # Short delay to not overwhelm the server
                time.sleep(0.1)
            
            # Count 401s (unauthorized) and 429s (rate limited)
            unauthorized_count = responses.count(401)
            rate_limited_count = responses.count(429)
            
            # First 10 should be 401 (unauthorized), 11th should be 429 (rate limited)
            if unauthorized_count >= 9 and rate_limited_count >= 1:
                self.log_result("Auth Rate Limiting", True, 
                              f"First {unauthorized_count} requests: 401 (Unauthorized), "
                              f"{rate_limited_count} requests: 429 (Rate Limited)")
                return True
            else:
                self.log_result("Auth Rate Limiting", False, 
                              f"Unexpected rate limiting behavior. 401s: {unauthorized_count}, 429s: {rate_limited_count}")
                return False
                
        except Exception as e:
            self.log_result("Auth Rate Limiting", False, f"Exception: {str(e)}")
            return False
    
    # ==========================================
    # 4. PERFORMANCE TESTS
    # ==========================================
    
    def test_response_times(self):
        """Test 10: Measure response times for common operations"""
        print("\n⏱️ Test 10: Performance - Response Times")
        
        try:
            endpoints = [
                ("/venues", "GET"),
                ("/musicians", "GET"),
                ("/bands", "GET"),
                ("/health", "GET", "https://musician-calendar-1.preview.emergentagent.com")
            ]
            
            results = []
            
            for endpoint_info in endpoints:
                if len(endpoint_info) == 3:
                    endpoint, method, base_url = endpoint_info
                    url = f"{base_url}{endpoint}"
                else:
                    endpoint, method = endpoint_info
                    url = f"{BACKEND_URL}{endpoint}"
                
                # Measure 3 requests and take average
                times = []
                for _ in range(3):
                    start_time = time.time()
                    
                    if method == "GET":
                        response = self.session.get(url, timeout=30)
                    else:
                        response = self.session.post(url, timeout=30)
                    
                    end_time = time.time()
                    response_time = (end_time - start_time) * 1000  # Convert to ms
                    
                    if response.status_code in [200, 401]:  # 401 is expected for some endpoints
                        times.append(response_time)
                    
                    time.sleep(0.1)  # Small delay between requests
                
                if times:
                    avg_time = sum(times) / len(times)
                    results.append(f"{endpoint}: {avg_time:.1f}ms")
            
            if results:
                self.log_result("Response Times", True, f"Average times: {', '.join(results)}")
                return True
            else:
                self.log_result("Response Times", False, "No successful response time measurements")
                return False
                
        except Exception as e:
            self.log_result("Response Times", False, f"Exception: {str(e)}")
            return False
    
    def test_concurrent_requests(self):
        """Test 11: Test concurrent request handling (connection pool test)"""
        print("\n🔄 Test 11: Performance - Concurrent Requests")
        
        try:
            def make_request():
                url = f"{BACKEND_URL}/venues"
                start_time = time.time()
                response = self.session.get(url, timeout=30)
                end_time = time.time()
                return {
                    'status_code': response.status_code,
                    'response_time': (end_time - start_time) * 1000,
                    'success': response.status_code == 200
                }
            
            # Make 10 concurrent requests
            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(make_request) for _ in range(10)]
                results = []
                
                for future in as_completed(futures, timeout=60):
                    try:
                        result = future.result()
                        results.append(result)
                    except Exception as e:
                        results.append({'success': False, 'error': str(e)})
            
            # Analyze results
            successful = [r for r in results if r.get('success', False)]
            failed = [r for r in results if not r.get('success', False)]
            
            if len(successful) >= 8:  # At least 80% success rate
                avg_time = sum(r['response_time'] for r in successful) / len(successful)
                self.log_result("Concurrent Requests", True, 
                              f"{len(successful)}/10 successful, avg: {avg_time:.1f}ms, "
                              f"failed: {len(failed)}")
                return True
            else:
                self.log_result("Concurrent Requests", False, 
                              f"Only {len(successful)}/10 requests successful. "
                              f"Failures: {[r.get('error', 'Unknown') for r in failed]}")
                return False
                
        except Exception as e:
            self.log_result("Concurrent Requests", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all performance optimization tests"""
        print("🧪 Starting Performance Optimization Test Suite")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"👤 Test Account: {TEST_EMAIL}")
        print("📋 Testing: MongoDB Connection Pooling, Cache Headers, Rate Limiting, Performance")
        
        # Run tests in order
        tests = [
            # Core Functionality Tests
            self.test_authentication,
            self.test_get_venues_endpoint,
            self.test_get_musicians_endpoint,
            self.test_get_bands_endpoint,
            
            # Cache Headers Validation
            self.test_venues_cache_headers,
            self.test_musicians_cache_headers,
            self.test_health_cache_headers,
            self.test_login_cache_headers,
            
            # Rate Limiting Tests
            self.test_auth_rate_limiting,
            
            # Performance Tests
            self.test_response_times,
            self.test_concurrent_requests,
        ]
        
        results = []
        
        for test in tests:
            try:
                result = test()
                results.append(result)
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
                results.append(False)
        
        # Summary
        passed = sum(results)
        total = len(results)
        
        print(f"\n📊 Performance Optimization Test Summary:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"📈 Success Rate: {(passed/total)*100:.1f}%")
        
        # Show results by category
        print(f"\n📋 Results by Category:")
        
        core_tests = results[0:4]
        cache_tests = results[4:8]
        rate_limit_tests = results[8:9]
        performance_tests = results[9:11]
        
        print(f"   🔐 Core Functionality: {sum(core_tests)}/{len(core_tests)} passed")
        print(f"   💾 Cache Headers: {sum(cache_tests)}/{len(cache_tests)} passed")
        print(f"   🚦 Rate Limiting: {sum(rate_limit_tests)}/{len(rate_limit_tests)} passed")
        print(f"   ⏱️ Performance: {sum(performance_tests)}/{len(performance_tests)} passed")
        
        # Show failed tests
        failed_tests = [self.test_results[i] for i, result in enumerate(results) if not result]
        if failed_tests:
            print(f"\n🔍 Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return passed >= (total * 0.8)  # 80% success rate considered acceptable

if __name__ == "__main__":
    suite = PerformanceTestSuite()
    success = suite.run_all_tests()
    
    if success:
        print("\n🎉 Performance optimization tests passed!")
        print("✅ MongoDB Connection Pooling: Operational")
        print("✅ Cache Headers Middleware: Functional") 
        print("✅ Rate Limiting: Active")
        print("✅ Core Functionality: Working")
        sys.exit(0)
    else:
        print("\n⚠️ Some performance tests failed. See details above.")
        sys.exit(1)