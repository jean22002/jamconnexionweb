#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class TitleTimeBugTester:
    def __init__(self, base_url="https://musicvenue-update.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.venue_token = None
        self.venue_user = None
        self.venue_profile_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def setup_venue(self):
        """Setup venue for testing"""
        try:
            # Register venue
            test_data = {
                "email": f"venue_title_time_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test Venue Title Time",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=test_data, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to register venue: {response.status_code}")
                return False
                
            data = response.json()
            self.venue_token = data.get('token')
            self.venue_user = data.get('user')
            
            # Create venue profile
            venue_data = {
                "name": "Test Jazz Club Title Time",
                "description": "A test venue for title/time bug testing",
                "address": "123 Test Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "phone": "+33123456789",
                "has_stage": True,
                "has_sound_engineer": True,
                "equipment": ["Piano", "Drums"],
                "music_styles": ["Jazz", "Blues"],
                "opening_hours": "19:00-02:00"
            }
            
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.post(f"{self.base_url}/venues", json=venue_data, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to create venue profile: {response.status_code}")
                return False
            
            venue_profile = response.json()
            self.venue_profile_id = venue_profile.get('id')
            print(f"✅ Venue setup complete: {self.venue_profile_id}")
            return True
            
        except Exception as e:
            print(f"❌ Setup error: {str(e)}")
            return False

    def test_planning_slot_title_time_creation(self):
        """Test Bug Fix: Titre et heure sauvegardés lors de la création - TEST 1"""
        try:
            headers_venue = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Test 1: Création avec titre et heure selon spécifications du review request
            planning_data_with_title_time = {
                "date": "2025-02-05",
                "time": "21:30",
                "title": "Soirée Blues Rock",
                "description": "Concert blues avec ambiance rock",
                "expected_band_style": "Blues rock",
                "payment": "350€",
                "music_styles": ["Blues", "Rock"],
                "is_open": True
            }
            
            response = requests.post(f"{self.base_url}/planning", json=planning_data_with_title_time, headers=headers_venue, timeout=10)
            success = response.status_code == 200
            
            if success:
                planning_response = response.json()
                self.title_time_slot_id = planning_response.get('id')
                details = f"Planning slot created with title and time: {planning_response.get('date')}"
                
                # Vérifier via API que TOUS les champs sont sauvegardés
                response = requests.get(f"{self.base_url}/planning", timeout=10)
                if response.status_code == 200:
                    all_slots = response.json()
                    our_slot = None
                    for slot in all_slots:
                        if slot.get('id') == self.title_time_slot_id:
                            our_slot = slot
                            break
                    
                    if our_slot:
                        # Vérifier que time et title sont présents
                        if our_slot.get('time') == '21:30' and our_slot.get('title') == 'Soirée Blues Rock':
                            details += " ✅ TIME et TITLE correctement sauvegardés"
                        else:
                            details += f" ❌ TIME: {our_slot.get('time')} (attendu: 21:30), TITLE: {our_slot.get('title')} (attendu: Soirée Blues Rock)"
                            success = False
                    else:
                        details += " ❌ Slot non trouvé dans la liste"
                        success = False
                else:
                    details += f" ❌ Échec récupération slots: {response.status_code}"
                    success = False
            else:
                details = f"❌ Échec création slot: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Planning Slot Title/Time Bug Fix - Creation Test", success, details)
            return success
        except Exception as e:
            self.log_test("Planning Slot Title/Time Bug Fix - Creation Test", False, f"Error: {str(e)}")
            return False

    def test_planning_slot_title_time_persistence(self):
        """Test Bug Fix: Titre et heure persistent lors de la modification - TEST 2"""
        try:
            headers_venue = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Test 2: Modification et persistance selon spécifications
            # 1. Créer un créneau avec time="20:00" et title="Concert Rock"
            initial_planning_data = {
                "date": "2025-02-10",
                "time": "20:00",
                "title": "Concert Rock",
                "description": "Concert rock initial",
                "expected_band_style": "Rock",
                "payment": "300€",
                "music_styles": ["Rock"],
                "is_open": True
            }
            
            response = requests.post(f"{self.base_url}/planning", json=initial_planning_data, headers=headers_venue, timeout=10)
            if response.status_code != 200:
                self.log_test("Planning Slot Title/Time Bug Fix - Persistence Test", False, "Failed to create initial slot")
                return False
            
            initial_response = response.json()
            persistence_slot_id = initial_response.get('id')
            
            # 2. Vérifier que les données initiales sont bien sauvegardées
            response = requests.get(f"{self.base_url}/planning", timeout=10)
            if response.status_code == 200:
                all_slots = response.json()
                our_slot = None
                for slot in all_slots:
                    if slot.get('id') == persistence_slot_id:
                        our_slot = slot
                        break
                
                if our_slot and our_slot.get('time') == '20:00' and our_slot.get('title') == 'Concert Rock':
                    # 3. Modifier time à "21:00" et title à "Grande Soirée Rock"
                    updated_planning_data = {
                        "date": "2025-02-10",
                        "time": "21:00",
                        "title": "Grande Soirée Rock",
                        "description": "Concert rock modifié",
                        "expected_band_style": "Rock",
                        "payment": "350€",
                        "music_styles": ["Rock"],
                        "is_open": True
                    }
                    
                    # Utiliser PUT endpoint pour mise à jour
                    response = requests.put(f"{self.base_url}/planning/{persistence_slot_id}", json=updated_planning_data, headers=headers_venue, timeout=10)
                    if response.status_code == 200:
                        # 4. Vérifier que les modifications sont persistées
                        response = requests.get(f"{self.base_url}/planning", timeout=10)
                        if response.status_code == 200:
                            updated_slots = response.json()
                            updated_slot = None
                            for slot in updated_slots:
                                if slot.get('id') == persistence_slot_id:
                                    updated_slot = slot
                                    break
                            
                            if updated_slot:
                                if updated_slot.get('time') == '21:00' and updated_slot.get('title') == 'Grande Soirée Rock':
                                    details = "✅ MODIFICATION ET PERSISTANCE RÉUSSIES - time='21:00' et title='Grande Soirée Rock' correctement sauvegardés"
                                    success = True
                                else:
                                    details = f"❌ PERSISTANCE ÉCHOUÉE - TIME: {updated_slot.get('time')} (attendu: 21:00), TITLE: {updated_slot.get('title')} (attendu: Grande Soirée Rock)"
                                    success = False
                            else:
                                details = "❌ Slot modifié non trouvé"
                                success = False
                        else:
                            details = f"❌ Échec récupération après modification: {response.status_code}"
                            success = False
                    else:
                        details = f"❌ Échec modification: {response.status_code}"
                        success = False
                else:
                    details = f"❌ Données initiales incorrectes - TIME: {our_slot.get('time') if our_slot else 'None'}, TITLE: {our_slot.get('title') if our_slot else 'None'}"
                    success = False
            else:
                details = f"❌ Échec récupération initiale: {response.status_code}"
                success = False
            
            self.log_test("Planning Slot Title/Time Bug Fix - Persistence Test", success, details)
            return success
        except Exception as e:
            self.log_test("Planning Slot Title/Time Bug Fix - Persistence Test", False, f"Error: {str(e)}")
            return False

    def test_planning_slot_title_time_all_fields(self):
        """Test Bug Fix: Tous les champs persistent correctement - TEST 3"""
        try:
            headers_venue = {'Authorization': f'Bearer {self.venue_token}'}
            
            # Test 3: Créer un créneau complet avec TOUS les champs
            complete_planning_data = {
                "date": "2025-02-15",
                "time": "19:30",
                "title": "Soirée Complète Test",
                "description": "Test de tous les champs de planning",
                "expected_band_style": "Jazz fusion",
                "expected_attendance": 150,
                "payment": "450€",
                "num_bands_needed": 2,
                "has_catering": True,
                "catering_drinks": 8,
                "catering_respect": True,
                "catering_tbd": False,
                "has_accommodation": True,
                "accommodation_capacity": 4,
                "accommodation_tbd": False,
                "music_styles": ["Jazz", "Fusion"],
                "is_open": True
            }
            
            response = requests.post(f"{self.base_url}/planning", json=complete_planning_data, headers=headers_venue, timeout=10)
            success = response.status_code == 200
            
            if success:
                planning_response = response.json()
                complete_slot_id = planning_response.get('id')
                details = f"Planning slot complet créé: {planning_response.get('date')}"
                
                # Vérifier que TOUS les champs sont là
                response = requests.get(f"{self.base_url}/planning", timeout=10)
                if response.status_code == 200:
                    all_slots = response.json()
                    our_slot = None
                    for slot in all_slots:
                        if slot.get('id') == complete_slot_id:
                            our_slot = slot
                            break
                    
                    if our_slot:
                        # Vérifier TOUS les champs selon spécifications
                        expected_fields = {
                            'date': '2025-02-15',
                            'time': '19:30',
                            'title': 'Soirée Complète Test',
                            'description': 'Test de tous les champs de planning',
                            'expected_band_style': 'Jazz fusion',
                            'expected_attendance': 150,
                            'payment': '450€',
                            'has_catering': True,
                            'catering_drinks': 8,
                            'catering_respect': True,
                            'catering_tbd': False,
                            'has_accommodation': True,
                            'accommodation_capacity': 4,
                            'accommodation_tbd': False
                        }
                        
                        missing_or_incorrect = []
                        for field, expected_value in expected_fields.items():
                            actual_value = our_slot.get(field)
                            if actual_value != expected_value:
                                missing_or_incorrect.append(f"{field} (attendu: {expected_value}, reçu: {actual_value})")
                        
                        if not missing_or_incorrect:
                            details += " ✅ TOUS LES CHAMPS CORRECTEMENT PERSISTÉS - Bug titre/heure RÉSOLU!"
                        else:
                            details += f" ❌ CHAMPS INCORRECTS: {', '.join(missing_or_incorrect)}"
                            success = False
                    else:
                        details += " ❌ Slot complet non trouvé"
                        success = False
                else:
                    details += f" ❌ Échec récupération: {response.status_code}"
                    success = False
            else:
                details = f"❌ Échec création slot complet: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Planning Slot Title/Time Bug Fix - All Fields Test", success, details)
            return success
        except Exception as e:
            self.log_test("Planning Slot Title/Time Bug Fix - All Fields Test", False, f"Error: {str(e)}")
            return False

    def run_tests(self):
        """Run the title/time bug fix tests"""
        print("🔧 TESTING BUG FIX: Titre et heure non sauvegardés dans les créneaux")
        print("=" * 70)
        
        if not self.setup_venue():
            print("❌ Setup failed - stopping tests")
            return False
        
        print("\n📋 Running specific bug fix tests...")
        print("-" * 50)
        
        # Run the three specific tests
        self.test_planning_slot_title_time_creation()
        self.test_planning_slot_title_time_persistence()
        self.test_planning_slot_title_time_all_fields()
        
        # Print summary
        print("-" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 BUG FIX VALIDÉ - Titre et heure sont maintenant correctement sauvegardés!")
        else:
            print("⚠️  BUG FIX INCOMPLET - Certains tests ont échoué")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = TitleTimeBugTester()
    success = tester.run_tests()
    sys.exit(0 if success else 1)