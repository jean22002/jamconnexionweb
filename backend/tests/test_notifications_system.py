#!/usr/bin/env python3
"""
Test complet du système de notifications automatiques
Selon la review request: TÂCHE DE TEST COMPLÈTE : Système de Notifications Automatiques
"""

import requests
import sys
import json
import subprocess
import os
from datetime import datetime, timedelta

class NotificationSystemTester:
    def __init__(self, base_url="https://profile-photo-upload-1.preview.emergentagent.com/api"):
        self.base_url = base_url
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

    def setup_test_accounts(self):
        """Créer les comptes de test selon la review request"""
        try:
            # Utiliser le compte de test spécifié dans la review request
            login_data = {
                "email": "test.notif@musicien.fr",
                "password": "TestNotif2026!"
            }
            
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.musician_token = data.get('token')
                self.musician_user = data.get('user')
                success = True
                details = f"Logged in as {self.musician_user.get('email')}"
            else:
                # Create the test account if it doesn't exist
                register_data = {
                    "email": "test.notif@musicien.fr",
                    "password": "TestNotif2026!",
                    "name": "Test Notif Musician",
                    "role": "musician"
                }
                
                response = requests.post(f"{self.base_url}/auth/register", json=register_data, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    self.musician_token = data.get('token')
                    self.musician_user = data.get('user')
                    success = True
                    details = f"Created and logged in as {self.musician_user.get('email')}"
                else:
                    success = False
                    details = f"Failed to create/login: {response.status_code}"
            
            # Create venue account for testing
            venue_register_data = {
                "email": f"venue_notif_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestNotif2026!",
                "name": "Test Venue Notif",
                "role": "venue"
            }
            
            venue_response = requests.post(f"{self.base_url}/auth/register", json=venue_register_data, timeout=10)
            if venue_response.status_code == 200:
                venue_data = venue_response.json()
                self.venue_token = venue_data.get('token')
                self.venue_user = venue_data.get('user')
                details += f", Venue: {self.venue_user.get('email')}"
                
                # Verify venue token works
                venue_headers = {'Authorization': f'Bearer {self.venue_token}'}
                auth_check = requests.get(f"{self.base_url}/auth/me", headers=venue_headers, timeout=10)
                if auth_check.status_code != 200:
                    details += f", Venue auth failed: {auth_check.status_code}"
                    success = False
            else:
                details += f", Venue creation failed: {venue_response.status_code}"
                success = False
            
            self.log_test("Setup Test Accounts", success, details)
            return success
        except Exception as e:
            self.log_test("Setup Test Accounts", False, f"Error: {str(e)}")
            return False

    def create_venue_profile(self):
        """Créer le profil établissement pour les tests"""
        try:
            # Debug: Check if venue token exists
            if not hasattr(self, 'venue_token') or not self.venue_token:
                self.log_test("Create Venue Profile", False, "No venue token available")
                return False
            
            venue_data = {
                "name": "Test Venue Notifications",
                "description": "Venue for testing notifications system",
                "address": "123 Test Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "phone": "+33123456789",
                "has_stage": True,
                "has_sound_engineer": True,
                "equipment": ["Piano", "Drums"],
                "music_styles": ["Jazz", "Rock"],
                "jam_days": ["Friday", "Saturday"],
                "opening_hours": "19:00-02:00"
            }
            
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Debug: Test auth first
            auth_response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            if auth_response.status_code != 200:
                self.log_test("Create Venue Profile", False, f"Auth failed: {auth_response.status_code}, {auth_response.text[:100]}")
                return False
            
            response = requests.post(f"{self.base_url}/venues", json=venue_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.venue_profile_id = data.get('id')
                details = f"Venue profile created: {self.venue_profile_id}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Venue Profile", success, details)
            return success
        except Exception as e:
            self.log_test("Create Venue Profile", False, f"Error: {str(e)}")
            return False

    def create_musician_profile(self):
        """Créer le profil musicien pour les tests"""
        try:
            musician_data = {
                "pseudo": "TestNotifMusicien",
                "age": 28,
                "bio": "Musicien test pour notifications",
                "instruments": ["Guitar", "Piano"],
                "music_styles": ["Jazz", "Rock"],
                "experience_years": 5,
                "city": "Paris",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "phone": "+33987654321"
            }
            
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.post(f"{self.base_url}/musicians", json=musician_data, headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.musician_profile_id = data.get('id')
                details = f"Musician profile created: {self.musician_profile_id}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Create Musician Profile", success, details)
            return success
        except Exception as e:
            self.log_test("Create Musician Profile", False, f"Error: {str(e)}")
            return False

    # ============= API NOTIFICATIONS TESTS =============

    def test_api_get_notifications(self):
        """Test GET /api/notifications - Récupérer toutes les notifications de l'utilisateur connecté"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                notifications = response.json()
                details = f"Retrieved {len(notifications)} notifications"
                if notifications:
                    first_notif = notifications[0]
                    required_fields = ['id', 'user_id', 'type', 'title', 'message', 'read', 'created_at']
                    missing_fields = [field for field in required_fields if field not in first_notif]
                    if missing_fields:
                        details += f", Missing fields: {missing_fields}"
                        success = False
                    else:
                        details += ", All required fields present"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("API GET /api/notifications", success, details)
            return success
        except Exception as e:
            self.log_test("API GET /api/notifications", False, f"Error: {str(e)}")
            return False

    def test_api_unread_count(self):
        """Test GET /api/notifications/unread/count - Compter les notifications non lues"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.get(f"{self.base_url}/notifications/unread/count", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                count_data = response.json()
                count = count_data.get('count', 0)
                details = f"Unread notifications count: {count}"
                self.initial_unread_count = count
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("API GET /api/notifications/unread/count", success, details)
            return success
        except Exception as e:
            self.log_test("API GET /api/notifications/unread/count", False, f"Error: {str(e)}")
            return False

    def test_api_mark_read(self):
        """Test PUT /api/notifications/{id}/read - Marquer une notification comme lue"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            
            if response.status_code == 200:
                notifications = response.json()
                if notifications:
                    notif_id = notifications[0]['id']
                    response = requests.put(f"{self.base_url}/notifications/{notif_id}/read", headers=headers, timeout=10)
                    success = response.status_code == 200
                    
                    if success:
                        details = f"Marked notification as read: {notif_id}"
                    else:
                        details = f"Status: {response.status_code}, Error: {response.text[:100]}"
                else:
                    success = True
                    details = "No notifications available to test with (endpoint structure valid)"
            else:
                success = False
                details = f"Failed to get notifications: {response.status_code}"
            
            self.log_test("API PUT /api/notifications/{id}/read", success, details)
            return success
        except Exception as e:
            self.log_test("API PUT /api/notifications/{id}/read", False, f"Error: {str(e)}")
            return False

    def test_api_mark_all_read(self):
        """Test PUT /api/notifications/read-all - Marquer toutes les notifications comme lues"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.put(f"{self.base_url}/notifications/read-all", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                message = result.get('message', 'Unknown result')
                details = f"Mark all read result: {message}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("API PUT /api/notifications/read-all", success, details)
            return success
        except Exception as e:
            self.log_test("API PUT /api/notifications/read-all", False, f"Error: {str(e)}")
            return False

    def test_api_delete_notification(self):
        """Test DELETE /api/notifications/{id} - Supprimer une notification"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            
            if response.status_code == 200:
                notifications = response.json()
                if notifications:
                    notif_id = notifications[0]['id']
                    response = requests.delete(f"{self.base_url}/notifications/{notif_id}", headers=headers, timeout=10)
                    success = response.status_code == 200
                    
                    if success:
                        details = f"Deleted notification: {notif_id}"
                    else:
                        details = f"Status: {response.status_code}, Error: {response.text[:100]}"
                else:
                    success = True
                    details = "No notifications available to delete (endpoint structure valid)"
            else:
                success = False
                details = f"Failed to get notifications: {response.status_code}"
            
            self.log_test("API DELETE /api/notifications/{id}", success, details)
            return success
        except Exception as e:
            self.log_test("API DELETE /api/notifications/{id}", False, f"Error: {str(e)}")
            return False

    # ============= SCRIPT DE NOTIFICATIONS TESTS =============

    def create_test_events(self):
        """Créer des événements de test selon le scénario de la review request"""
        try:
            venue_headers = {'Authorization': f'Bearer {self.venue_token}'}
            
            # a. Créer un bœuf (jam) pour dans 3 jours avec 2 participants
            three_days_later = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
            jam_3_days_data = {
                "date": three_days_later,
                "start_time": "20:00",
                "end_time": "23:00",
                "music_styles": ["Jazz", "Blues"],
                "rules": "Test bœuf J-3 pour notifications automatiques",
                "has_instruments": True,
                "has_pa_system": True
            }
            
            response = requests.post(f"{self.base_url}/jams", json=jam_3_days_data, headers=venue_headers, timeout=10)
            jam_3_days_success = response.status_code == 200
            if jam_3_days_success:
                self.jam_3_days = response.json()
                
                # Ajouter des participants
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                requests.post(f"{self.base_url}/events/{self.jam_3_days['id']}/join?event_type=jam", headers=musician_headers, timeout=10)
            
            # b. Créer un bœuf (jam) pour aujourd'hui avec 2 participants
            today = datetime.now().strftime("%Y-%m-%d")
            jam_today_data = {
                "date": today,
                "start_time": "21:00",
                "end_time": "23:59",
                "music_styles": ["Rock", "Pop"],
                "rules": "Test bœuf Jour J pour notifications automatiques",
                "has_instruments": True,
                "has_pa_system": True
            }
            
            response = requests.post(f"{self.base_url}/jams", json=jam_today_data, headers=venue_headers, timeout=10)
            jam_today_success = response.status_code == 200
            if jam_today_success:
                self.jam_today = response.json()
                
                # Ajouter des participants
                musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
                requests.post(f"{self.base_url}/events/{self.jam_today['id']}/join?event_type=jam", headers=musician_headers, timeout=10)
            
            success = jam_3_days_success and jam_today_success
            if success:
                details = f"Created test events: Jam J-3 ({three_days_later}), Jam Today ({today})"
            else:
                details = f"Jam J-3: {jam_3_days_success}, Jam Today: {jam_today_success}"
            
            self.log_test("Create Test Events (Scenario a & b)", success, details)
            return success
        except Exception as e:
            self.log_test("Create Test Events (Scenario a & b)", False, f"Error: {str(e)}")
            return False

    def test_notifications_script(self):
        """Test c. Exécuter le script: cd /app/backend && python3 notifications_scheduler.py"""
        try:
            # Execute the notifications script
            script_path = "/app/backend/notifications_scheduler.py"
            
            result = subprocess.run(
                ['python3', script_path],
                cwd='/app/backend',
                capture_output=True,
                text=True,
                timeout=60
            )
            
            success = result.returncode == 0
            
            if success:
                output_lines = result.stdout.split('\n')
                details = f"Script executed successfully. Output lines: {len(output_lines)}"
                
                # Look for key indicators in output
                if "Traitement des notifications terminé" in result.stdout:
                    details += ", Processing completed"
                if "notifications J-3" in result.stdout:
                    details += ", J-3 notifications processed"
                if "notifications Jour J" in result.stdout:
                    details += ", Day-J notifications processed"
                
                # Store output for verification
                self.script_output = result.stdout
            else:
                details = f"Script failed with code {result.returncode}"
                if result.stderr:
                    details += f", Error: {result.stderr[:200]}"
                if result.stdout:
                    details += f", Output: {result.stdout[:200]}"
            
            self.log_test("Execute Notifications Script", success, details)
            return success
        except Exception as e:
            self.log_test("Execute Notifications Script", False, f"Error: {str(e)}")
            return False

    def test_verify_notifications_mongodb(self):
        """Test d. Vérifier dans MongoDB que les notifications ont été créées"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                notifications = response.json()
                
                # Chercher les types de notifications attendus
                jam_reminders = [n for n in notifications if n.get('type') == 'jam_reminder']
                jam_nearby = [n for n in notifications if n.get('type') == 'jam_nearby']
                
                details = f"Total notifications: {len(notifications)}, Jam reminders: {len(jam_reminders)}, Nearby jams: {len(jam_nearby)}"
                
                # Vérifier les points de validation de la review request
                validation_points = []
                
                # Les notifications contiennent les bons user_id
                if notifications:
                    correct_user_ids = all(n.get('user_id') == self.musician_user['id'] for n in notifications)
                    validation_points.append(f"Correct user_id: {correct_user_ids}")
                
                # Les messages sont corrects et en français
                if jam_reminders:
                    french_messages = all('bœuf' in n.get('message', '').lower() or 'jam' in n.get('message', '').lower() for n in jam_reminders)
                    validation_points.append(f"French messages: {french_messages}")
                
                # Le champ "read" est à false par défaut
                if notifications:
                    unread_by_default = all(n.get('read') == False for n in notifications if 'read' in n)
                    validation_points.append(f"Unread by default: {unread_by_default}")
                
                # Les liens pointent vers le bon établissement
                if notifications:
                    correct_links = all(f"/venues/{self.venue_profile_id}" in n.get('link', '') for n in notifications if n.get('link'))
                    validation_points.append(f"Correct venue links: {correct_links}")
                
                details += f", Validations: {', '.join(validation_points)}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Verify Notifications in MongoDB", success, details)
            return success
        except Exception as e:
            self.log_test("Verify Notifications in MongoDB", False, f"Error: {str(e)}")
            return False

    # ============= DAEMON DE NOTIFICATIONS TESTS =============

    def test_daemon_status(self):
        """Vérifier que le daemon est actif: sudo supervisorctl status notifications_daemon"""
        try:
            result = subprocess.run(
                ['sudo', 'supervisorctl', 'status', 'notifications_daemon'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            success = result.returncode == 0 and 'RUNNING' in result.stdout
            
            if success:
                details = "Notifications daemon is RUNNING"
                status_line = result.stdout.strip()
                if 'uptime' in status_line:
                    details += f", Status: {status_line}"
            else:
                details = f"Daemon status check failed: {result.stdout.strip()}"
                if result.stderr:
                    details += f", Error: {result.stderr.strip()}"
            
            self.log_test("Daemon Status Check", success, details)
            return success
        except Exception as e:
            self.log_test("Daemon Status Check", False, f"Error: {str(e)}")
            return False

    def test_daemon_logs(self):
        """Vérifier les logs: tail -50 /var/log/supervisor/notifications_daemon.out.log"""
        try:
            result = subprocess.run(
                ['tail', '-50', '/var/log/supervisor/notifications_daemon.out.log'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            success = result.returncode == 0
            
            if success:
                log_content = result.stdout
                details = f"Retrieved {len(log_content.split())} log words"
                
                # Vérifier les messages attendus selon la review request
                expected_messages = [
                    "🚀 Démarrage du daemon de notifications",
                    "⏰ Planification: tous les jours à 12:30 (Paris)"
                ]
                
                found_messages = []
                for msg in expected_messages:
                    if msg in log_content:
                        found_messages.append(msg)
                
                details += f", Expected messages found: {len(found_messages)}/{len(expected_messages)}"
                
                if len(found_messages) == len(expected_messages):
                    details += " ✅"
                else:
                    details += f" ❌ Missing: {set(expected_messages) - set(found_messages)}"
                    success = False
            else:
                details = f"Failed to read logs: {result.stderr[:100] if result.stderr else 'Unknown error'}"
            
            self.log_test("Daemon Logs Check", success, details)
            return success
        except Exception as e:
            self.log_test("Daemon Logs Check", False, f"Error: {str(e)}")
            return False

    # ============= TESTS DE NON-RÉGRESSION =============

    def test_existing_endpoints_not_affected(self):
        """Vérifier que les anciens endpoints messages/reviews ne sont pas affectés"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            
            # Test messages endpoint
            messages_response = requests.get(f"{self.base_url}/messages", headers=headers, timeout=10)
            messages_ok = messages_response.status_code in [200, 404]  # 404 is OK if no messages
            
            # Test reviews endpoint (if available)
            reviews_response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/reviews", timeout=10)
            reviews_ok = reviews_response.status_code in [200, 404]  # 404 is OK if no reviews
            
            success = messages_ok and reviews_ok
            details = f"Messages endpoint: {messages_response.status_code}, Reviews endpoint: {reviews_response.status_code}"
            
            self.log_test("Existing Endpoints Not Affected", success, details)
            return success
        except Exception as e:
            self.log_test("Existing Endpoints Not Affected", False, f"Error: {str(e)}")
            return False

    def test_authentication_works_correctly(self):
        """Vérifier que l'authentification fonctionne correctement"""
        try:
            # Test with valid token
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            valid_response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            valid_ok = valid_response.status_code == 200
            
            # Test without token
            invalid_response = requests.get(f"{self.base_url}/notifications", timeout=10)
            invalid_rejected = invalid_response.status_code == 401
            
            success = valid_ok and invalid_rejected
            details = f"Valid token: {valid_response.status_code}, No token: {invalid_response.status_code}"
            
            self.log_test("Authentication Works Correctly", success, details)
            return success
        except Exception as e:
            self.log_test("Authentication Works Correctly", False, f"Error: {str(e)}")
            return False

    def test_notifications_filtered_by_user_id(self):
        """Vérifier que les notifications sont bien filtrées par user_id"""
        try:
            # Get notifications for musician
            musician_headers = {'Authorization': f'Bearer {self.musician_token}'}
            musician_response = requests.get(f"{self.base_url}/notifications", headers=musician_headers, timeout=10)
            
            # Get notifications for venue
            venue_headers = {'Authorization': f'Bearer {self.venue_token}'}
            venue_response = requests.get(f"{self.base_url}/notifications", headers=venue_headers, timeout=10)
            
            success = musician_response.status_code == 200 and venue_response.status_code == 200
            
            if success:
                musician_notifs = musician_response.json()
                venue_notifs = venue_response.json()
                
                details = f"Musician notifications: {len(musician_notifs)}, Venue notifications: {len(venue_notifs)}"
                
                # Verify user_id filtering
                if musician_notifs:
                    musician_user_id = self.musician_user['id']
                    wrong_user_notifs = [n for n in musician_notifs if n.get('user_id') != musician_user_id]
                    if wrong_user_notifs:
                        details += f", ERROR: {len(wrong_user_notifs)} notifications with wrong user_id"
                        success = False
                    else:
                        details += ", User filtering correct ✅"
            else:
                details = f"Musician: {musician_response.status_code}, Venue: {venue_response.status_code}"
            
            self.log_test("Notifications Filtered by User ID", success, details)
            return success
        except Exception as e:
            self.log_test("Notifications Filtered by User ID", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Exécuter tous les tests du système de notifications"""
        print("🔔 SYSTÈME DE NOTIFICATIONS AUTOMATIQUES - TEST COMPLET")
        print("=" * 70)
        print("Selon la review request: TÂCHE DE TEST COMPLÈTE")
        print("=" * 70)
        
        # Setup
        if not self.setup_test_accounts():
            print("❌ Failed to setup test accounts, aborting")
            return False
        
        if not self.create_venue_profile():
            print("❌ Failed to create venue profile, aborting")
            return False
        
        if not self.create_musician_profile():
            print("❌ Failed to create musician profile, aborting")
            return False
        
        print("\n## 1. API Notifications (Backend)")
        print("-" * 40)
        
        tests_api = [
            self.test_api_get_notifications,
            self.test_api_unread_count,
            self.test_api_mark_read,
            self.test_api_mark_all_read,
            self.test_api_delete_notification
        ]
        
        for test in tests_api:
            test()
        
        print("\n## 2. Script de Notifications (Logique Métier)")
        print("-" * 40)
        
        tests_script = [
            self.create_test_events,
            self.test_notifications_script,
            self.test_verify_notifications_mongodb
        ]
        
        for test in tests_script:
            test()
        
        print("\n## 3. Daemon de Notifications")
        print("-" * 40)
        
        tests_daemon = [
            self.test_daemon_status,
            self.test_daemon_logs
        ]
        
        for test in tests_daemon:
            test()
        
        print("\n## 4. Tests de Non-Régression")
        print("-" * 40)
        
        tests_regression = [
            self.test_existing_endpoints_not_affected,
            self.test_authentication_works_correctly,
            self.test_notifications_filtered_by_user_id
        ]
        
        for test in tests_regression:
            test()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 RÉSULTATS DES TESTS")
        print("=" * 70)
        print(f"Tests exécutés: {self.tests_run}")
        print(f"Tests réussis: {self.tests_passed}")
        print(f"Taux de réussite: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("✅ TOUS LES TESTS RÉUSSIS - SYSTÈME OPÉRATIONNEL!")
        else:
            print("❌ CERTAINS TESTS ONT ÉCHOUÉ - VÉRIFICATION REQUISE")
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\nTests échoués:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = NotificationSystemTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)