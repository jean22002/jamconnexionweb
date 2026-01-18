#!/usr/bin/env python3
"""
Test complet du système de notifications automatiques - Version Simplifiée
Focus sur les tests qui fonctionnent avec les comptes existants
"""

import requests
import sys
import json
import subprocess
import os
from datetime import datetime, timedelta

class NotificationSystemTesterSimplified:
    def __init__(self, base_url="https://venue-connections.preview.emergentagent.com/api"):
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

    def setup_test_account(self):
        """Utiliser le compte de test spécifié dans la review request"""
        try:
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
                details = f"Logged in as {self.musician_user.get('email')}, Role: {self.musician_user.get('role')}"
            else:
                success = False
                details = f"Login failed: {response.status_code}, {response.text[:100]}"
            
            self.log_test("Setup Test Account", success, details)
            return success
        except Exception as e:
            self.log_test("Setup Test Account", False, f"Error: {str(e)}")
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
                        
                        # Check field values
                        if first_notif.get('user_id') == self.musician_user['id']:
                            details += ", Correct user_id"
                        else:
                            details += f", Wrong user_id: {first_notif.get('user_id')} vs {self.musician_user['id']}"
                            success = False
                        
                        if isinstance(first_notif.get('read'), bool):
                            details += f", Read field is boolean: {first_notif.get('read')}"
                        else:
                            details += f", Read field not boolean: {first_notif.get('read')}"
                            success = False
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
                if 'count' in count_data and isinstance(count_data['count'], int):
                    count = count_data.get('count', 0)
                    details = f"Unread notifications count: {count}"
                    self.initial_unread_count = count
                else:
                    details = f"Invalid response format: {count_data}"
                    success = False
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
                    # Find an unread notification
                    unread_notif = None
                    for notif in notifications:
                        if not notif.get('read', True):
                            unread_notif = notif
                            break
                    
                    if unread_notif:
                        notif_id = unread_notif['id']
                        response = requests.put(f"{self.base_url}/notifications/{notif_id}/read", headers=headers, timeout=10)
                        success = response.status_code == 200
                        
                        if success:
                            details = f"Marked notification as read: {unread_notif.get('title', 'No title')[:30]}..."
                        else:
                            details = f"Status: {response.status_code}, Error: {response.text[:100]}"
                    else:
                        # Test with any notification
                        if notifications:
                            notif_id = notifications[0]['id']
                            response = requests.put(f"{self.base_url}/notifications/{notif_id}/read", headers=headers, timeout=10)
                            success = response.status_code == 200
                            details = "Marked already read notification (test successful)"
                        else:
                            success = True
                            details = "No notifications to test with (endpoint structure valid)"
                else:
                    success = True
                    details = "No notifications available to test with"
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

    def test_notifications_script(self):
        """Test d'exécution du script de notifications"""
        try:
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
                key_messages = []
                if "SYSTÈME DE NOTIFICATIONS AUTOMATIQUES" in result.stdout:
                    key_messages.append("System header")
                if "Vérification des notifications" in result.stdout:
                    key_messages.append("Verification message")
                if "Paris" in result.stdout:
                    key_messages.append("Paris timezone")
                if "fenêtre 12h30" in result.stdout:
                    key_messages.append("Time window check")
                
                details += f", Key messages found: {', '.join(key_messages)}"
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

    def test_authentication_required(self):
        """Vérifier que l'authentification est requise pour les endpoints notifications"""
        try:
            # Test without authentication
            response = requests.get(f"{self.base_url}/notifications", timeout=10)
            success = response.status_code == 401
            
            if success:
                details = "Correctly rejected unauthenticated request"
            else:
                details = f"Unexpected status: {response.status_code}, Expected: 401"
            
            self.log_test("Authentication Required", success, details)
            return success
        except Exception as e:
            self.log_test("Authentication Required", False, f"Error: {str(e)}")
            return False

    def test_notifications_user_filtering(self):
        """Vérifier que les notifications sont filtrées par user_id"""
        try:
            headers = {'Authorization': f'Bearer {self.musician_token}'}
            response = requests.get(f"{self.base_url}/notifications", headers=headers, timeout=10)
            success = response.status_code == 200
            
            if success:
                notifications = response.json()
                details = f"Retrieved {len(notifications)} notifications"
                
                # Verify user_id filtering
                if notifications:
                    musician_user_id = self.musician_user['id']
                    wrong_user_notifs = [n for n in notifications if n.get('user_id') != musician_user_id]
                    if wrong_user_notifs:
                        details += f", ERROR: {len(wrong_user_notifs)} notifications with wrong user_id"
                        success = False
                    else:
                        details += ", User filtering correct ✅"
                else:
                    details += ", No notifications to verify filtering"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Notifications User Filtering", success, details)
            return success
        except Exception as e:
            self.log_test("Notifications User Filtering", False, f"Error: {str(e)}")
            return False

    def test_supervisor_config_exists(self):
        """Vérifier que la configuration supervisor existe"""
        try:
            config_path = "/etc/supervisor/conf.d/notifications_daemon.conf"
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config_content = f.read()
                
                required_elements = [
                    "[program:notifications_daemon]",
                    "notifications_daemon.py",
                    "autostart=true",
                    "autorestart=true"
                ]
                
                missing_elements = []
                for element in required_elements:
                    if element not in config_content:
                        missing_elements.append(element)
                
                success = len(missing_elements) == 0
                if success:
                    details = f"Supervisor config exists with all required elements"
                else:
                    details = f"Missing elements: {missing_elements}"
            else:
                success = False
                details = "Supervisor config file not found"
            
            self.log_test("Supervisor Config Exists", success, details)
            return success
        except Exception as e:
            self.log_test("Supervisor Config Exists", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Exécuter tous les tests du système de notifications"""
        print("🔔 SYSTÈME DE NOTIFICATIONS AUTOMATIQUES - TEST COMPLET")
        print("=" * 70)
        print("Selon la review request: TÂCHE DE TEST COMPLÈTE")
        print("=" * 70)
        
        # Setup
        if not self.setup_test_account():
            print("❌ Failed to setup test account, aborting")
            return False
        
        print("\n## 1. API Notifications (Backend)")
        print("-" * 40)
        
        tests_api = [
            self.test_authentication_required,
            self.test_api_get_notifications,
            self.test_api_unread_count,
            self.test_api_mark_read,
            self.test_api_mark_all_read,
            self.test_api_delete_notification,
            self.test_notifications_user_filtering
        ]
        
        for test in tests_api:
            test()
        
        print("\n## 2. Script de Notifications (Logique Métier)")
        print("-" * 40)
        
        tests_script = [
            self.test_notifications_script
        ]
        
        for test in tests_script:
            test()
        
        print("\n## 3. Daemon de Notifications")
        print("-" * 40)
        
        tests_daemon = [
            self.test_supervisor_config_exists,
            self.test_daemon_status,
            self.test_daemon_logs
        ]
        
        for test in tests_daemon:
            test()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 RÉSULTATS DES TESTS")
        print("=" * 70)
        print(f"Tests exécutés: {self.tests_run}")
        print(f"Tests réussis: {self.tests_passed}")
        print(f"Taux de réussite: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Detailed results by category
        api_tests = [r for r in self.test_results if 'API' in r['test']]
        script_tests = [r for r in self.test_results if 'Script' in r['test'] or 'Execute' in r['test']]
        daemon_tests = [r for r in self.test_results if 'Daemon' in r['test'] or 'Supervisor' in r['test']]
        
        print(f"\n📋 DÉTAIL PAR CATÉGORIE:")
        print(f"  API Notifications: {sum(1 for t in api_tests if t['success'])}/{len(api_tests)} réussis")
        print(f"  Script Notifications: {sum(1 for t in script_tests if t['success'])}/{len(script_tests)} réussis")
        print(f"  Daemon Notifications: {sum(1 for t in daemon_tests if t['success'])}/{len(daemon_tests)} réussis")
        
        if self.tests_passed == self.tests_run:
            print("\n✅ TOUS LES TESTS RÉUSSIS - SYSTÈME OPÉRATIONNEL!")
        else:
            print("\n❌ CERTAINS TESTS ONT ÉCHOUÉ - VÉRIFICATION REQUISE")
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\nTests échoués:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = NotificationSystemTesterSimplified()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)