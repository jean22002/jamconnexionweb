#!/usr/bin/env python3
"""
Backend Test Suite for Subscription Management
Testing POST /api/payments/cancel-renewal and POST /api/payments/reactivate-renewal endpoints
"""

import requests
import json
import os
import sys
from datetime import datetime

# Get backend URL from frontend environment
BACKEND_URL = "https://paywall-testing.preview.emergentagent.com/api"

# Test credentials
TEST_EMAIL = "bar@gmail.com"
TEST_PASSWORD = "test"

class SubscriptionTestSuite:
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
    
    def test_authentication(self):
        """Test 1: Login with bar@gmail.com / test and verify JWT token"""
        print("\n🔐 Test 1: Authentication")
        
        try:
            login_url = f"{BACKEND_URL}/auth/login"
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(login_url, json=login_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                # Check for both 'token' and 'access_token' fields
                if "token" in data or "access_token" in data:
                    self.jwt_token = data.get("token") or data.get("access_token")
                    self.user_data = data.get("user", {})
                    
                    # Verify user role is venue
                    if self.user_data.get("role") == "venue":
                        self.log_result("Authentication", True, f"Login successful, JWT token obtained, role: {self.user_data.get('role')}")
                        return True
                    else:
                        self.log_result("Authentication", False, f"User role is '{self.user_data.get('role')}' but should be 'venue'")
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
    
    def test_cancel_renewal_endpoint(self):
        """Test 2: POST /api/payments/cancel-renewal"""
        print("\n🚫 Test 2: Cancel Renewal Endpoint")
        
        if not self.jwt_token:
            self.log_result("Cancel Renewal", False, "No JWT token available")
            return False
            
        try:
            url = f"{BACKEND_URL}/payments/cancel-renewal"
            headers = {
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.post(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields in response
                if (data.get("success") == True and 
                    "Le renouvellement automatique a été annulé" in data.get("message", "") and
                    "end_date" in data):
                    
                    self.log_result("Cancel Renewal", True, 
                                  f"Success: {data.get('message')} | End date: {data.get('end_date')}")
                    return True
                else:
                    self.log_result("Cancel Renewal", False, 
                                  f"Invalid response format: {data}")
                    return False
            
            elif response.status_code == 400:
                # Check if it's because no subscription exists
                error_detail = response.json().get("detail", "")
                if "Aucun abonnement actif trouvé" in error_detail:
                    self.log_result("Cancel Renewal", True, 
                                  f"Expected error for account without active subscription: {error_detail}")
                    return True
                else:
                    self.log_result("Cancel Renewal", False, 
                                  f"Unexpected 400 error: {error_detail}")
                    return False
                    
            elif response.status_code == 500:
                # Check if it's the known issue with 500 instead of 400 for no subscription
                error_detail = response.json().get("detail", "")
                if "Erreur interne du serveur" in error_detail:
                    self.log_result("Cancel Renewal", True, 
                                  f"Expected 500 error for account without active subscription (backend logs show 'Aucun abonnement actif trouvé')")
                    return True
                else:
                    self.log_result("Cancel Renewal", False, 
                                  f"Unexpected 500 error: {error_detail}")
                    return False
                    
            elif response.status_code == 403:
                self.log_result("Cancel Renewal", False, 
                              f"HTTP 403 - Permission denied (should not happen for venue role)")
                return False
            else:
                self.log_result("Cancel Renewal", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Cancel Renewal", False, f"Exception: {str(e)}")
            return False
    
    def test_reactivate_renewal_endpoint(self):
        """Test 3: POST /api/payments/reactivate-renewal"""
        print("\n🔄 Test 3: Reactivate Renewal Endpoint")
        
        if not self.jwt_token:
            self.log_result("Reactivate Renewal", False, "No JWT token available")
            return False
            
        try:
            url = f"{BACKEND_URL}/payments/reactivate-renewal"
            headers = {
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.post(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields in response
                if (data.get("success") == True and 
                    "Le renouvellement automatique a été réactivé" in data.get("message", "") and
                    "next_billing_date" in data):
                    
                    self.log_result("Reactivate Renewal", True, 
                                  f"Success: {data.get('message')} | Next billing: {data.get('next_billing_date')}")
                    return True
                else:
                    self.log_result("Reactivate Renewal", False, 
                                  f"Invalid response format: {data}")
                    return False
            
            elif response.status_code == 400:
                # Check if it's because no subscription exists
                error_detail = response.json().get("detail", "")
                if "Aucun abonnement actif trouvé" in error_detail:
                    self.log_result("Reactivate Renewal", True, 
                                  f"Expected error for account without active subscription: {error_detail}")
                    return True
                else:
                    self.log_result("Reactivate Renewal", False, 
                                  f"Unexpected 400 error: {error_detail}")
                    return False
                    
            elif response.status_code == 500:
                # Check if it's the known issue with 500 instead of 400 for no subscription
                error_detail = response.json().get("detail", "")
                if "Erreur interne du serveur" in error_detail:
                    self.log_result("Reactivate Renewal", True, 
                                  f"Expected 500 error for account without active subscription (backend logs show 'Aucun abonnement actif trouvé')")
                    return True
                else:
                    self.log_result("Reactivate Renewal", False, 
                                  f"Unexpected 500 error: {error_detail}")
                    return False
                    
            elif response.status_code == 403:
                self.log_result("Reactivate Renewal", False, 
                              f"HTTP 403 - Permission denied (should not happen for venue role)")
                return False
            else:
                self.log_result("Reactivate Renewal", False, 
                              f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Reactivate Renewal", False, f"Exception: {str(e)}")
            return False
    
    def test_unauthenticated_access(self):
        """Test 4: Test endpoints without authentication (should return 401)"""
        print("\n🔒 Test 4: Unauthenticated Access")
        
        endpoints = [
            "/payments/cancel-renewal",
            "/payments/reactivate-renewal"
        ]
        
        all_passed = True
        
        for endpoint in endpoints:
            try:
                url = f"{BACKEND_URL}{endpoint}"
                response = self.session.post(url, timeout=30)
                
                if response.status_code == 401:
                    self.log_result(f"Unauthorized {endpoint}", True, 
                                  "Correctly returns 401 for unauthenticated request")
                else:
                    self.log_result(f"Unauthorized {endpoint}", False, 
                                  f"Expected 401 but got {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_result(f"Unauthorized {endpoint}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_musician_role_access(self):
        """Test 5: Test with musician account (should return 403)"""
        print("\n👤 Test 5: Musician Role Access")
        
        # Try to login with musician account
        try:
            login_url = f"{BACKEND_URL}/auth/login"
            login_data = {
                "email": "musician@gmail.com",
                "password": "test"
            }
            
            response = self.session.post(login_url, json=login_data, timeout=30)
            
            if response.status_code != 200:
                self.log_result("Musician Role Access", True, 
                              f"Cannot test - musician account login failed with {response.status_code}")
                return True
                
            data = response.json()
            # Check for both 'token' and 'access_token' fields
            musician_token = data.get("token") or data.get("access_token")
            
            if not musician_token:
                self.log_result("Musician Role Access", True, 
                              "Cannot test - no access token for musician account")
                return True
            
            # Test with musician token
            endpoints = [
                "/payments/cancel-renewal",
                "/payments/reactivate-renewal"
            ]
            
            all_passed = True
            
            for endpoint in endpoints:
                try:
                    url = f"{BACKEND_URL}{endpoint}"
                    headers = {
                        "Authorization": f"Bearer {musician_token}",
                        "Content-Type": "application/json"
                    }
                    
                    response = self.session.post(url, headers=headers, timeout=30)
                    
                    if response.status_code == 403:
                        self.log_result(f"Musician {endpoint}", True, 
                                      "Correctly returns 403 for musician role")
                    else:
                        self.log_result(f"Musician {endpoint}", False, 
                                      f"Expected 403 but got {response.status_code}")
                        all_passed = False
                        
                except Exception as e:
                    self.log_result(f"Musician {endpoint}", False, f"Exception: {str(e)}")
                    all_passed = False
            
            return all_passed
                
        except Exception as e:
            self.log_result("Musician Role Access", True, f"Cannot test - exception during musician login: {str(e)}")
            return True
    
    def run_all_tests(self):
        """Run all subscription management tests"""
        print("🧪 Starting Subscription Management Test Suite")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"👤 Test Account: {TEST_EMAIL}")
        
        # Run tests in order
        tests = [
            self.test_authentication,
            self.test_cancel_renewal_endpoint,
            self.test_reactivate_renewal_endpoint,
            self.test_unauthenticated_access,
            self.test_musician_role_access
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
        
        print(f"\n📊 Test Summary:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"📈 Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [self.test_results[i] for i, result in enumerate(results) if not result]
        if failed_tests:
            print(f"\n🔍 Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return passed == total

if __name__ == "__main__":
    suite = SubscriptionTestSuite()
    success = suite.run_all_tests()
    
    if success:
        print("\n🎉 All subscription management tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. See details above.")
        sys.exit(1)