#!/usr/bin/env python3
"""
Focused Melomane System Testing Script
Tests the complete Melomane functionality as requested in the review.
"""

import requests
import sys
import json
from datetime import datetime

class MelomaneSystemTester:
    def __init__(self, base_url="https://venue-debug.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.melomane_token = None
        self.melomane_user = None
        self.melomane_profile_id = None
        self.test_venue = None
        self.test_jam_id = None
        self.test_concert_id = None
        self.participation_ids = []

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

    def test_1_register_melomane(self):
        """TEST 1: Inscrire un nouvel utilisateur avec role='melomane'"""
        try:
            test_data = {
                "email": "melomane2.test@test.fr",
                "password": "Test1234!",
                "name": "Mélomane Passionné",
                "role": "melomane"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.melomane_token = data.get('token')
                self.melomane_user = data.get('user')
                user_role = self.melomane_user.get('role')
                
                if user_role == "melomane" and self.melomane_token:
                    details = f"✅ User ID: {self.melomane_user.get('id')}, Role: {user_role}, Token: {bool(self.melomane_token)}"
                else:
                    success = False
                    details = f"❌ Invalid response - Role: {user_role}, Token: {bool(self.melomane_token)}"
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("TEST 1 - Inscription Mélomane", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 1 - Inscription Mélomane", False, f"❌ Error: {str(e)}")
            return False

    def test_2_login_melomane(self):
        """TEST 2: Se connecter avec les credentials"""
        try:
            login_data = {
                "email": "melomane2.test@test.fr",
                "password": "Test1234!"
            }
            
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                token = data.get('token')
                user = data.get('user')
                role = user.get('role') if user else None
                
                if token and role == "melomane":
                    self.melomane_token = token
                    self.melomane_user = user
                    details = f"✅ Login successful, Token received, Role: {role}"
                else:
                    success = False
                    details = f"❌ Invalid login - Role: {role}, Token: {bool(token)}"
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("TEST 2 - Connexion Mélomane", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 2 - Connexion Mélomane", False, f"❌ Error: {str(e)}")
            return False

    def test_3_create_melomane_profile(self):
        """TEST 3: Créer profil Mélomane avec données spécifiées"""
        try:
            melomane_data = {
                "pseudo": "Mélomane Passionné",
                "bio": "J'adore la musique live !",
                "city": "Paris",
                "favorite_styles": ["Rock", "Jazz"],
                "notifications_enabled": True,
                "notification_radius_km": 50
            }
            
            headers = {'Authorization': f'Bearer {self.melomane_token}'}
            response = requests.post(f"{self.base_url}/melomanes/", json=melomane_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.melomane_profile_id = data.get('id')
                
                # Verify all fields are present
                expected_fields = ['id', 'pseudo', 'bio', 'city', 'favorite_styles', 'notifications_enabled', 'notification_radius_km']
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details = f"❌ Profile created but missing fields: {missing_fields}"
                else:
                    details = f"✅ Profile ID: {self.melomane_profile_id}, Pseudo: {data.get('pseudo')}, City: {data.get('city')}, Radius: {data.get('notification_radius_km')}km, Styles: {data.get('favorite_styles')}"
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("TEST 3 - Création Profil Mélomane", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 3 - Création Profil Mélomane", False, f"❌ Error: {str(e)}")
            return False

    def test_4_verify_melomane_profile(self):
        """TEST 4: Vérifier le profil avec GET /api/melomanes/me"""
        try:
            headers = {'Authorization': f'Bearer {self.melomane_token}'}
            response = requests.get(f"{self.base_url}/melomanes/me", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_values = {
                    'pseudo': 'Mélomane Passionné',
                    'bio': "J'adore la musique live !",
                    'city': 'Paris',
                    'favorite_styles': ['Rock', 'Jazz'],
                    'notifications_enabled': True,
                    'notification_radius_km': 50
                }
                
                mismatches = []
                for field, expected_value in expected_values.items():
                    actual_value = data.get(field)
                    if actual_value != expected_value:
                        mismatches.append(f"{field}: expected {expected_value}, got {actual_value}")
                
                if mismatches:
                    success = False
                    details = f"❌ Profile data mismatches: {', '.join(mismatches)}"
                else:
                    details = f"✅ Profile verified: {data.get('pseudo')} in {data.get('city')}, Styles: {data.get('favorite_styles')}, Notifications: {data.get('notifications_enabled')}"
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("TEST 4 - Vérification Profil", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 4 - Vérification Profil", False, f"❌ Error: {str(e)}")
            return False

    def test_5_get_venues_list(self):
        """TEST 5: Récupérer la liste des établissements"""
        try:
            response = requests.get(f"{self.base_url}/venues", timeout=10)
            success = response.status_code == 200
            
            if success:
                venues = response.json()
                if venues:
                    self.test_venue = venues[0]  # Use first venue for testing
                    details = f"✅ Retrieved {len(venues)} venues, Test venue: {self.test_venue.get('name')} (ID: {self.test_venue.get('id')})"
                else:
                    success = False
                    details = "❌ No venues available for testing"
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("TEST 5 - Liste Établissements", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 5 - Liste Établissements", False, f"❌ Error: {str(e)}")
            return False

    def test_6_get_venue_events(self):
        """TEST 6: Récupérer les événements d'un établissement"""
        try:
            if not self.test_venue:
                self.log_test("TEST 6 - Événements Établissement", False, "❌ No test venue available")
                return False
            
            venue_id = self.test_venue.get('id')
            
            # Get jams
            jams_response = requests.get(f"{self.base_url}/venues/{venue_id}/jams", timeout=10)
            jams_success = jams_response.status_code == 200
            jams = jams_response.json() if jams_success else []
            
            # Get concerts
            concerts_response = requests.get(f"{self.base_url}/venues/{venue_id}/concerts", timeout=10)
            concerts_success = concerts_response.status_code == 200
            concerts = concerts_response.json() if concerts_success else []
            
            success = jams_success and concerts_success
            
            if success:
                if jams:
                    self.test_jam_id = jams[0].get('id')
                if concerts:
                    self.test_concert_id = concerts[0].get('id')
                
                details = f"✅ Venue events - Jams: {len(jams)}, Concerts: {len(concerts)}"
                if self.test_jam_id:
                    details += f", Test Jam ID: {self.test_jam_id}"
                if self.test_concert_id:
                    details += f", Test Concert ID: {self.test_concert_id}"
            else:
                details = f"❌ Failed to get events - Jams: {jams_response.status_code}, Concerts: {concerts_response.status_code}"
            
            self.log_test("TEST 6 - Événements Établissement", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 6 - Événements Établissement", False, f"❌ Error: {str(e)}")
            return False

    def test_7_melomane_join_jam(self):
        """TEST 7: Marquer participation à un bœuf"""
        try:
            if not self.test_jam_id:
                self.log_test("TEST 7 - Participation Bœuf", False, "❌ No jam available for testing")
                return False
            
            headers = {'Authorization': f'Bearer {self.melomane_token}'}
            response = requests.post(f"{self.base_url}/events/{self.test_jam_id}/join?event_type=jam", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                join_data = response.json()
                participation_id = join_data.get('participation_id')
                venue_name = join_data.get('venue_name')
                
                if participation_id:
                    self.participation_ids.append(participation_id)
                    details = f"✅ Successfully joined jam at {venue_name}, Participation ID: {participation_id}"
                else:
                    success = False
                    details = f"❌ Join successful but no participation_id returned"
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("TEST 7 - Participation Bœuf", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 7 - Participation Bœuf", False, f"❌ Error: {str(e)}")
            return False

    def test_8_melomane_join_concert(self):
        """TEST 8: Marquer participation à un concert"""
        try:
            if not self.test_concert_id:
                self.log_test("TEST 8 - Participation Concert", False, "❌ No concert available for testing")
                return False
            
            headers = {'Authorization': f'Bearer {self.melomane_token}'}
            response = requests.post(f"{self.base_url}/events/{self.test_concert_id}/join?event_type=concert", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                join_data = response.json()
                participation_id = join_data.get('participation_id')
                venue_name = join_data.get('venue_name')
                
                if participation_id:
                    self.participation_ids.append(participation_id)
                    details = f"✅ Successfully joined concert at {venue_name}, Participation ID: {participation_id}"
                else:
                    success = False
                    details = f"❌ Join successful but no participation_id returned"
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("TEST 8 - Participation Concert", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 8 - Participation Concert", False, f"❌ Error: {str(e)}")
            return False

    def test_9_verify_participation_storage(self):
        """TEST 9: Vérifier que la participation est enregistrée avec participant_type='melomane'"""
        try:
            headers = {'Authorization': f'Bearer {self.melomane_token}'}
            response = requests.get(f"{self.base_url}/melomanes/me/participations", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                participations = response.json()
                details = f"✅ Retrieved {len(participations)} participations"
                
                if participations:
                    # Verify participant_type is 'melomane'
                    melomane_participations = [p for p in participations if p.get('participant_type') == 'melomane']
                    
                    if len(melomane_participations) == len(participations):
                        details += f", All participations have participant_type='melomane'"
                        
                        # Check for required fields
                        first_participation = participations[0]
                        required_fields = ['id', 'event_id', 'event_type', 'venue_name', 'participant_type']
                        missing_fields = [field for field in required_fields if field not in first_participation]
                        
                        if missing_fields:
                            success = False
                            details += f", Missing fields: {missing_fields}"
                        else:
                            details += f", All required fields present"
                    else:
                        success = False
                        details += f", Wrong participant_type count: {len(melomane_participations)}/{len(participations)}"
                else:
                    success = False
                    details += ", No participations found"
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("TEST 9 - Vérification Stockage", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 9 - Vérification Stockage", False, f"❌ Error: {str(e)}")
            return False

    def test_10_melomane_leave_event(self):
        """TEST 10: Retrait de participation"""
        try:
            headers = {'Authorization': f'Bearer {self.melomane_token}'}
            
            # Get current participations
            response = requests.get(f"{self.base_url}/melomanes/me/participations", headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("TEST 10 - Retrait Participation", False, f"❌ Failed to get participations: {response.status_code}")
                return False
            
            participations = response.json()
            if not participations:
                self.log_test("TEST 10 - Retrait Participation", False, "❌ No active participations to leave")
                return False
            
            # Leave the first participation
            participation = participations[0]
            event_id = participation.get('event_id')
            
            response = requests.post(f"{self.base_url}/events/{event_id}/leave", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                details = f"✅ Successfully left event {event_id}"
                
                # Verify participation is deactivated (active=False)
                response = requests.get(f"{self.base_url}/melomanes/me/participations", headers=headers, timeout=10)
                if response.status_code == 200:
                    updated_participations = response.json()
                    # Check if the specific event is no longer in active participations
                    still_active = [p for p in updated_participations if p.get('event_id') == event_id and p.get('active', True)]
                    
                    if not still_active:
                        details += ", Participation correctly deactivated (active=False)"
                    else:
                        details += ", WARNING: Participation still active"
                        success = False
            else:
                details = f"❌ Status: {response.status_code}, Error: {response.text[:200]}"
            
            self.log_test("TEST 10 - Retrait Participation", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 10 - Retrait Participation", False, f"❌ Error: {str(e)}")
            return False

    def test_11_melomane_notifications(self):
        """TEST 11: Test des notifications"""
        try:
            headers = {'Authorization': f'Bearer {self.melomane_token}'}
            
            # Test GET /api/notifications
            notifications_response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            notifications_success = notifications_response.status_code == 200
            
            # Test GET /api/notifications/unread-count
            unread_response = requests.get(f"{self.base_url}/notifications/unread-count", headers=headers, timeout=10)
            unread_success = unread_response.status_code == 200
            
            success = notifications_success and unread_success
            
            if success:
                notifications = notifications_response.json()
                unread_data = unread_response.json()
                unread_count = unread_data.get('count', 0)
                
                details = f"✅ Notifications API working - Retrieved {len(notifications)} notifications, Unread count: {unread_count}"
            else:
                details = f"❌ Notifications: {notifications_response.status_code}, Unread count: {unread_response.status_code}"
            
            self.log_test("TEST 11 - Notifications Mélomane", success, details)
            return success
        except Exception as e:
            self.log_test("TEST 11 - Notifications Mélomane", False, f"❌ Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all Melomane system tests"""
        print("🎭 TESTING COMPLET DU SYSTÈME MÉLOMANE")
        print("=" * 60)
        print("Tests demandés dans la review request:")
        print("1. Test d'inscription et connexion Mélomane")
        print("2. Test création de profil Mélomane")
        print("3. Test de participation aux événements")
        print("4. Test de retrait de participation")
        print("5. Test des notifications")
        print("=" * 60)
        
        # Run tests in sequence
        tests = [
            self.test_1_register_melomane,
            self.test_2_login_melomane,
            self.test_3_create_melomane_profile,
            self.test_4_verify_melomane_profile,
            self.test_5_get_venues_list,
            self.test_6_get_venue_events,
            self.test_7_melomane_join_jam,
            self.test_8_melomane_join_concert,
            self.test_9_verify_participation_storage,
            self.test_10_melomane_leave_event,
            self.test_11_melomane_notifications
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Unexpected error: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"🎭 RÉSULTATS TESTS MÉLOMANE: {self.tests_passed}/{self.tests_run} réussis")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Taux de réussite: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 TOUS LES TESTS MÉLOMANE RÉUSSIS!")
        else:
            print("⚠️ Certains tests ont échoué. Voir détails ci-dessus.")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = MelomaneSystemTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)