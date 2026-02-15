#!/usr/bin/env python3
"""
Melomane Profile Bug Fix Test - Specific to Review Request
Tests the correction of the profile_picture field bug in melomane profile creation.
"""

import requests
import sys
import json
from datetime import datetime

class MelomaneBugFixTester:
    def __init__(self, base_url="https://admin-analytics-44.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def test_melomane_registration(self):
        """Test 1: Create melomane account with exact credentials from review request"""
        try:
            # Use unique email to avoid conflicts
            timestamp = datetime.now().strftime('%H%M%S')
            test_data = {
                "email": f"melomane.final.test.{timestamp}@test.fr",
                "password": "Test1234!",
                "name": "Test Final Melomane",
                "role": "melomane"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.token = data.get('token')
                self.user = data.get('user')
                details = f"✅ Melomane registered: {self.user.get('id')}, Role: {self.user.get('role')}"
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:300]}"
            
            self.log_test("1. Melomane Registration", success, details)
            return success
        except Exception as e:
            self.log_test("1. Melomane Registration", False, f"Error: {str(e)}")
            return False

    def test_create_melomane_profile(self):
        """Test 2: Create melomane profile with profile_picture field - VALIDATE BUG FIX"""
        try:
            # Exact data from review request
            melomane_data = {
                "pseudo": "Mélomane Final Test",
                "bio": "Test de sauvegarde du profil",
                "city": "Carcassonne",
                "region": "Occitanie",
                "postal_code": "11000",
                "favorite_styles": ["Metal symphonique", "Rock"],
                "profile_picture": "",
                "notifications_enabled": True,
                "notification_radius_km": 50
            }
            
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.post(f"{self.base_url}/melomanes/", json=melomane_data, headers=headers, timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.profile_id = data.get('id')
                details = f"✅ PROFILE CREATED - ID: {self.profile_id}, Pseudo: {data.get('pseudo')}"
                
                # CRITICAL: Verify profile_picture field is present (this was the bug)
                if 'profile_picture' in data:
                    details += f" ✅ profile_picture field PRESENT: '{data.get('profile_picture')}'"
                    
                    # Verify all expected fields from review request
                    expected_fields = {
                        'pseudo': 'Mélomane Final Test',
                        'bio': 'Test de sauvegarde du profil',
                        'city': 'Carcassonne',
                        'region': 'Occitanie',
                        'postal_code': '11000',
                        'profile_picture': '',
                        'notifications_enabled': True,
                        'notification_radius_km': 50
                    }
                    
                    field_errors = []
                    for field, expected in expected_fields.items():
                        if data.get(field) != expected:
                            field_errors.append(f"{field} (expected: {expected}, got: {data.get(field)})")
                    
                    if field_errors:
                        details += f" ❌ FIELD ERRORS: {', '.join(field_errors)}"
                        success = False
                    else:
                        details += f" ✅ ALL FIELDS CORRECT"
                        
                    # Check favorite_styles array
                    expected_styles = ["Metal symphonique", "Rock"]
                    actual_styles = data.get('favorite_styles', [])
                    if set(actual_styles) == set(expected_styles):
                        details += f" ✅ favorite_styles correct: {actual_styles}"
                    else:
                        details += f" ❌ favorite_styles wrong (expected: {expected_styles}, got: {actual_styles})"
                        success = False
                else:
                    details += f" ❌ profile_picture field MISSING - BUG NOT FIXED!"
                    success = False
                    
            else:
                details = f"❌ FAILED - Status: {response.status_code}, Error: {response.text[:300]}"
            
            self.log_test("2. Create Melomane Profile (Bug Fix Validation)", success, details)
            return success
        except Exception as e:
            self.log_test("2. Create Melomane Profile (Bug Fix Validation)", False, f"Error: {str(e)}")
            return False

    def test_get_melomane_profile(self):
        """Test 3: Verify profile with GET /api/melomanes/me"""
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(f"{self.base_url}/melomanes/me", headers=headers, timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"✅ PROFILE RETRIEVED - Pseudo: {data.get('pseudo')}, City: {data.get('city')}"
                
                # CRITICAL: Verify profile_picture field persists in database
                if 'profile_picture' in data:
                    details += f" ✅ profile_picture field PERSISTED: '{data.get('profile_picture')}'"
                    
                    # Verify complete data integrity
                    expected_complete_data = {
                        'pseudo': 'Mélomane Final Test',
                        'bio': 'Test de sauvegarde du profil',
                        'city': 'Carcassonne',
                        'region': 'Occitanie',
                        'postal_code': '11000',
                        'profile_picture': '',
                        'notifications_enabled': True,
                        'notification_radius_km': 50
                    }
                    
                    persistence_errors = []
                    for field, expected in expected_complete_data.items():
                        if data.get(field) != expected:
                            persistence_errors.append(f"{field} (expected: {expected}, got: {data.get(field)})")
                    
                    if persistence_errors:
                        details += f" ❌ PERSISTENCE ERRORS: {', '.join(persistence_errors)}"
                        success = False
                    else:
                        details += f" ✅ ALL DATA PERSISTED CORRECTLY"
                else:
                    details += f" ❌ profile_picture field LOST IN DATABASE - BUG NOT FIXED!"
                    success = False
                    
            else:
                details = f"❌ FAILED - Status: {response.status_code}, Error: {response.text[:300]}"
            
            self.log_test("3. Verify Profile Created", success, details)
            return success
        except Exception as e:
            self.log_test("3. Verify Profile Created", False, f"Error: {str(e)}")
            return False

    def test_update_melomane_profile(self):
        """Test 4: Update profile with PUT /api/melomanes/me"""
        try:
            # Exact update data from review request
            update_data = {
                "pseudo": "Mélomane Modifié",
                "bio": "Bio mise à jour",
                "city": "Paris",
                "favorite_styles": ["Jazz", "Blues"]
            }
            
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.put(f"{self.base_url}/melomanes/me", json=update_data, headers=headers, timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"✅ PROFILE UPDATED - New Pseudo: {data.get('pseudo')}, New City: {data.get('city')}"
                
                # Verify updates applied correctly
                expected_updates = {
                    'pseudo': 'Mélomane Modifié',
                    'bio': 'Bio mise à jour',
                    'city': 'Paris'
                }
                
                update_errors = []
                for field, expected in expected_updates.items():
                    if data.get(field) != expected:
                        update_errors.append(f"{field} (expected: {expected}, got: {data.get(field)})")
                
                if update_errors:
                    details += f" ❌ UPDATE ERRORS: {', '.join(update_errors)}"
                    success = False
                else:
                    details += f" ✅ UPDATES APPLIED CORRECTLY"
                    
                # CRITICAL: Verify profile_picture field is preserved during update
                if 'profile_picture' in data:
                    details += f" ✅ profile_picture PRESERVED during update: '{data.get('profile_picture')}'"
                else:
                    details += f" ❌ profile_picture field LOST during update - BUG NOT FULLY FIXED!"
                    success = False
                    
                # Verify favorite_styles update
                expected_new_styles = ["Jazz", "Blues"]
                actual_new_styles = data.get('favorite_styles', [])
                if set(actual_new_styles) == set(expected_new_styles):
                    details += f" ✅ favorite_styles updated correctly: {actual_new_styles}"
                else:
                    details += f" ❌ favorite_styles update failed (expected: {expected_new_styles}, got: {actual_new_styles})"
                    success = False
                    
            else:
                details = f"❌ FAILED - Status: {response.status_code}, Error: {response.text[:300]}"
            
            self.log_test("4. Update Melomane Profile", success, details)
            return success
        except Exception as e:
            self.log_test("4. Update Melomane Profile", False, f"Error: {str(e)}")
            return False

    def test_final_verification(self):
        """Test 5: Re-verify profile with GET /api/melomanes/me"""
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(f"{self.base_url}/melomanes/me", headers=headers, timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"✅ FINAL VERIFICATION - Pseudo: {data.get('pseudo')}, City: {data.get('city')}"
                
                # Verify final state matches expected result from review request
                expected_final_state = {
                    'pseudo': 'Mélomane Modifié',
                    'bio': 'Bio mise à jour',
                    'city': 'Paris',
                    'region': 'Occitanie',  # Should be preserved
                    'postal_code': '11000',  # Should be preserved
                    'profile_picture': '',  # CRITICAL: Should be preserved
                    'notifications_enabled': True,  # Should be preserved
                    'notification_radius_km': 50  # Should be preserved
                }
                
                final_errors = []
                for field, expected in expected_final_state.items():
                    if data.get(field) != expected:
                        final_errors.append(f"{field} (expected: {expected}, got: {data.get(field)})")
                
                if final_errors:
                    details += f" ❌ FINAL STATE ERRORS: {', '.join(final_errors)}"
                    success = False
                else:
                    details += f" ✅ FINAL STATE PERFECT"
                    
                # Final verification of profile_picture field
                if 'profile_picture' in data:
                    details += f" ✅ profile_picture CONFIRMED in final state: '{data.get('profile_picture')}'"
                else:
                    details += f" ❌ profile_picture MISSING in final state - BUG NOT FIXED!"
                    success = False
                    
                # Final verification of favorite_styles
                expected_final_styles = ["Jazz", "Blues"]
                actual_final_styles = data.get('favorite_styles', [])
                if set(actual_final_styles) == set(expected_final_styles):
                    details += f" ✅ favorite_styles final state correct: {actual_final_styles}"
                else:
                    details += f" ❌ favorite_styles final state wrong (expected: {expected_final_styles}, got: {actual_final_styles})"
                    success = False
                    
            else:
                details = f"❌ FAILED - Status: {response.status_code}, Error: {response.text[:300]}"
            
            self.log_test("5. Re-verify Profile After Update", success, details)
            return success
        except Exception as e:
            self.log_test("5. Re-verify Profile After Update", False, f"Error: {str(e)}")
            return False

    def run_bug_fix_tests(self):
        """Run all melomane profile bug fix tests"""
        print("🔧 MELOMANE PROFILE BUG FIX VALIDATION")
        print("=" * 60)
        print("Testing the correction of profile_picture field bug")
        print("Review Request: Le bug de sauvegarde du profil mélomane a été corrigé")
        print("=" * 60)
        
        # Run tests in sequence
        tests = [
            self.test_melomane_registration,
            self.test_create_melomane_profile,
            self.test_get_melomane_profile,
            self.test_update_melomane_profile,
            self.test_final_verification
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Unexpected error: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 BUG FIX TEST SUMMARY")
        print("=" * 60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 BUG FIX VALIDATION SUCCESSFUL!")
            print("✅ All melomane profile operations work without error")
            print("✅ profile_picture field is correctly handled in all operations")
        else:
            print("⚠️ BUG FIX VALIDATION FAILED!")
            print("❌ Some operations still have issues")
            
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = MelomaneBugFixTester()
    success = tester.run_bug_fix_tests()
    sys.exit(0 if success else 1)