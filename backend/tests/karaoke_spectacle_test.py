#!/usr/bin/env python3
"""
Focused test script for Karaoké and Spectacle Bug Fix Validation
Tests the fix for collection naming inconsistency (karaoke vs karaokes, spectacle vs spectacles)
"""

import requests
import json
from datetime import datetime

class KaraokeSpectacleTestRunner:
    def __init__(self, base_url="https://gamified-venue.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.venue_token = None
        self.musician_token = None
        self.venue_profile_id = None
        self.karaoke_id = None
        self.spectacle_id = None
        
    def log_result(self, test_name, success, details=""):
        """Log test result with emoji indicators"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")
        return success
    
    def setup_test_accounts(self):
        """Use existing test account from review request"""
        print("🔧 Using existing test account...")
        
        # Use the test account mentioned in the review request
        login_data = {
            "email": "ledb.test@narbonne.fr",
            "password": "TestDB2026!"
        }
        
        response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
        if response.status_code == 200:
            auth_data = response.json()
            self.venue_token = auth_data.get('token')
            user_data = auth_data.get('user', {})
            print(f"✅ Logged in as venue: {user_data.get('email')} (ID: {user_data.get('id')})")
            
            # Try to get venue profile - if it fails, we'll still proceed with tests that don't need it
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            profile_response = requests.get(f"{self.base_url}/venues/me", headers=headers, timeout=10)
            if profile_response.status_code == 200:
                venue_profile = profile_response.json()
                self.venue_profile_id = venue_profile.get('id')
                print(f"✅ Venue profile found: {self.venue_profile_id}")
            else:
                print(f"⚠️ Could not get venue profile: {profile_response.status_code}")
                # Try to get any existing venue for testing
                venues_response = requests.get(f"{self.base_url}/venues", timeout=10)
                if venues_response.status_code == 200:
                    venues = venues_response.json()
                    if venues:
                        self.venue_profile_id = venues[0].get('id')
                        print(f"✅ Using existing venue for testing: {self.venue_profile_id}")
                    else:
                        print("⚠️ No venues found, some tests may fail")
                        self.venue_profile_id = "test-venue-id"
            
            # Create musician account for security tests
            return self.create_musician_account()
        else:
            print(f"❌ Failed to login with test account: {response.status_code} - {response.text[:100]}")
            # Fallback: try to create new accounts
            return self.create_new_test_accounts()
    
    def create_musician_account(self):
        """Create musician account for security testing"""
        musician_data = {
            "email": f"musician_karaoke_test_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Musician",
            "role": "musician"
        }
        
        response = requests.post(f"{self.base_url}/auth/register", json=musician_data, timeout=10)
        if response.status_code == 200:
            musician_auth = response.json()
            self.musician_token = musician_auth.get('token')
            print(f"✅ Musician account created: {musician_auth.get('user', {}).get('id')}")
            return True
        else:
            print(f"⚠️ Failed to create musician account: {response.status_code}")
            return True  # Continue anyway, security test will be skipped
    
    def create_new_test_accounts(self):
        """Create new test accounts as fallback"""
        print("🔧 Creating new test accounts...")
        
        # Create venue account
        venue_data = {
            "email": f"venue_karaoke_test_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Venue Karaoké",
            "role": "venue"
        }
        
        response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
        if response.status_code == 200:
            venue_auth = response.json()
            self.venue_token = venue_auth.get('token')
            venue_user = venue_auth.get('user', {})
            print(f"✅ Venue account created: {venue_user.get('id')}")
            
            # Create venue profile
            venue_profile_data = {
                "name": "Test Karaoké Club",
                "description": "Club de test pour karaoké et spectacles",
                "address": "123 Test Street",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "phone": "+33123456789",
                "music_styles": ["Rock", "Pop", "Jazz"],
                "has_stage": True,
                "has_sound_engineer": True
            }
            
            headers = {'Authorization': f'Bearer {self.venue_token}'}
            response = requests.post(f"{self.base_url}/venues", json=venue_profile_data, headers=headers, timeout=10)
            if response.status_code == 200:
                venue_profile = response.json()
                self.venue_profile_id = venue_profile.get('id')
                print(f"✅ Venue profile created: {self.venue_profile_id}")
            else:
                print(f"❌ Failed to create venue profile: {response.status_code} - {response.text[:100]}")
                return False
        else:
            print(f"❌ Failed to create venue account: {response.status_code}")
            return False
        
        # Create musician account
        musician_data = {
            "email": f"musician_karaoke_test_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Musician",
            "role": "musician"
        }
        
        response = requests.post(f"{self.base_url}/auth/register", json=musician_data, timeout=10)
        if response.status_code == 200:
            musician_auth = response.json()
            self.musician_token = musician_auth.get('token')
            print(f"✅ Musician account created: {musician_auth.get('user', {}).get('id')}")
            return True
        else:
            print(f"❌ Failed to create musician account: {response.status_code}")
            return False
    
    def test_karaoke_creation(self):
        """Test 1: Create Karaoké event"""
        print("\n🎤 Test 1: Création événement Karaoké")
        
        headers = {'Authorization': f'Bearer {self.venue_token}'}
        karaoke_data = {
            "date": "2026-02-15",
            "start_time": "21:00",
            "end_time": "02:00",
            "title": "Soirée Karaoké Rock",
            "description": "Venez chanter vos tubes rock préférés !",
            "music_styles": ["Rock", "Pop"]
        }
        
        response = requests.post(f"{self.base_url}/karaoke", json=karaoke_data, headers=headers, timeout=10)
        success = response.status_code == 200
        
        if success:
            karaoke_response = response.json()
            self.karaoke_id = karaoke_response.get('id')
            details = f"Karaoké créé avec succès - ID: {self.karaoke_id}, Titre: '{karaoke_response.get('title')}'"
        else:
            details = f"Échec création - Status: {response.status_code}, Erreur: {response.text[:100]}"
        
        return self.log_result("Création Karaoké", success, details)
    
    def test_spectacle_creation(self):
        """Test 2: Create Spectacle event"""
        print("\n🎭 Test 2: Création événement Spectacle")
        
        headers = {'Authorization': f'Bearer {self.venue_token}'}
        spectacle_data = {
            "date": "2026-02-20",
            "start_time": "20:00",
            "end_time": "23:00",
            "type": "Concert",
            "artist_name": "Les Musiciens de Test",
            "description": "Spectacle de blues acoustique",
            "price": "15€"
        }
        
        response = requests.post(f"{self.base_url}/spectacle", json=spectacle_data, headers=headers, timeout=10)
        success = response.status_code == 200
        
        if success:
            spectacle_response = response.json()
            self.spectacle_id = spectacle_response.get('id')
            details = f"Spectacle créé avec succès - ID: {self.spectacle_id}, Artiste: '{spectacle_response.get('artist_name')}'"
        else:
            details = f"Échec création - Status: {response.status_code}, Erreur: {response.text[:100]}"
        
        return self.log_result("Création Spectacle", success, details)
    
    def test_karaoke_venue_listing(self):
        """Test 3: Verify Karaoké appears in venue listing"""
        print("\n📋 Test 3: Vérification liste Karaoké établissement")
        
        response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/karaoke", timeout=10)
        success = response.status_code == 200
        
        if success:
            karaoke_events = response.json()
            found_our_karaoke = any(event.get('id') == self.karaoke_id for event in karaoke_events)
            
            if found_our_karaoke:
                details = f"✅ Karaoké trouvé dans la liste établissement ({len(karaoke_events)} événements total)"
                success = True
            else:
                details = f"❌ Karaoké ABSENT de la liste établissement ({len(karaoke_events)} événements total)"
                success = False
        else:
            details = f"Erreur API - Status: {response.status_code}"
        
        return self.log_result("Liste Karaoké Établissement", success, details)
    
    def test_spectacle_venue_listing(self):
        """Test 4: Verify Spectacle appears in venue listing"""
        print("\n📋 Test 4: Vérification liste Spectacle établissement")
        
        response = requests.get(f"{self.base_url}/venues/{self.venue_profile_id}/spectacle", timeout=10)
        success = response.status_code == 200
        
        if success:
            spectacle_events = response.json()
            found_our_spectacle = any(event.get('id') == self.spectacle_id for event in spectacle_events)
            
            if found_our_spectacle:
                details = f"✅ Spectacle trouvé dans la liste établissement ({len(spectacle_events)} événements total)"
                success = True
            else:
                details = f"❌ Spectacle ABSENT de la liste établissement ({len(spectacle_events)} événements total)"
                success = False
        else:
            details = f"Erreur API - Status: {response.status_code}"
        
        return self.log_result("Liste Spectacle Établissement", success, details)
    
    def test_karaoke_global_listing(self):
        """Test 5: Verify Karaoké appears in global listing"""
        print("\n🌍 Test 5: Vérification liste globale Karaoké")
        
        response = requests.get(f"{self.base_url}/karaoke", timeout=10)
        success = response.status_code == 200
        
        if success:
            karaoke_events = response.json()
            found_our_karaoke = any(event.get('id') == self.karaoke_id for event in karaoke_events)
            
            if found_our_karaoke:
                details = f"✅ Karaoké trouvé dans la liste globale ({len(karaoke_events)} événements total)"
                success = True
            else:
                details = f"❌ Karaoké ABSENT de la liste globale ({len(karaoke_events)} événements total)"
                success = False
        else:
            details = f"Erreur API - Status: {response.status_code}"
        
        return self.log_result("Liste Globale Karaoké", success, details)
    
    def test_spectacle_global_listing(self):
        """Test 6: Verify Spectacle appears in global listing"""
        print("\n🌍 Test 6: Vérification liste globale Spectacle")
        
        response = requests.get(f"{self.base_url}/spectacle", timeout=10)
        success = response.status_code == 200
        
        if success:
            spectacle_events = response.json()
            found_our_spectacle = any(event.get('id') == self.spectacle_id for event in spectacle_events)
            
            if found_our_spectacle:
                details = f"✅ Spectacle trouvé dans la liste globale ({len(spectacle_events)} événements total)"
                success = True
            else:
                details = f"❌ Spectacle ABSENT de la liste globale ({len(spectacle_events)} événements total)"
                success = False
        else:
            details = f"Erreur API - Status: {response.status_code}"
        
        return self.log_result("Liste Globale Spectacle", success, details)
    
    def test_mongodb_collections_validation(self):
        """Test 7: Validate MongoDB collections contain correct data"""
        print("\n🗄️ Test 7: Validation collections MongoDB")
        
        # Get both collections data
        karaoke_response = requests.get(f"{self.base_url}/karaoke", timeout=10)
        spectacle_response = requests.get(f"{self.base_url}/spectacle", timeout=10)
        
        if karaoke_response.status_code == 200 and spectacle_response.status_code == 200:
            karaoke_events = karaoke_response.json()
            spectacle_events = spectacle_response.json()
            
            # Count our venue's events
            our_karaoke_count = len([k for k in karaoke_events if k.get('venue_id') == self.venue_profile_id])
            our_spectacle_count = len([s for s in spectacle_events if s.get('venue_id') == self.venue_profile_id])
            
            if our_karaoke_count >= 1 and our_spectacle_count >= 1:
                details = f"✅ Collections validées - karaoke: {our_karaoke_count} événements, spectacle: {our_spectacle_count} événements"
                success = True
            else:
                details = f"❌ Collections incomplètes - karaoke: {our_karaoke_count}, spectacle: {our_spectacle_count} (attendu ≥1 chacun)"
                success = False
        else:
            details = f"❌ Erreur accès API - karaoke: {karaoke_response.status_code}, spectacle: {spectacle_response.status_code}"
            success = False
        
        return self.log_result("Validation Collections MongoDB", success, details)
    
    def test_security_authentication(self):
        """Test 8: Verify only venues can create events"""
        print("\n🔒 Test 8: Vérification sécurité authentification")
        
        # Test with musician token (should fail with 403)
        headers = {'Authorization': f'Bearer {self.musician_token}'}
        
        karaoke_data = {"date": "2026-04-01", "start_time": "20:00", "title": "Test Non Autorisé"}
        spectacle_data = {"date": "2026-04-01", "start_time": "20:00", "type": "Concert", "artist_name": "Test Non Autorisé"}
        
        karaoke_response = requests.post(f"{self.base_url}/karaoke", json=karaoke_data, headers=headers, timeout=10)
        spectacle_response = requests.post(f"{self.base_url}/spectacle", json=spectacle_data, headers=headers, timeout=10)
        
        # Both should return 403 Forbidden
        karaoke_forbidden = karaoke_response.status_code == 403
        spectacle_forbidden = spectacle_response.status_code == 403
        
        success = karaoke_forbidden and spectacle_forbidden
        
        if success:
            details = "✅ Sécurité validée - Musiciens correctement rejetés (403 Forbidden)"
        else:
            details = f"❌ Problème sécurité - karaoke: {karaoke_response.status_code}, spectacle: {spectacle_response.status_code} (attendu 403)"
        
        return self.log_result("Sécurité Authentification", success, details)
    
    def test_delete_endpoints(self):
        """Test 9: Verify delete endpoints work (non-regression)"""
        print("\n🗑️ Test 9: Vérification endpoints de suppression")
        
        headers = {'Authorization': f'Bearer {self.venue_token}'}
        
        # Create test events to delete
        karaoke_data = {
            "date": "2026-03-01",
            "start_time": "19:00",
            "title": "Test Karaoké à supprimer"
        }
        
        spectacle_data = {
            "date": "2026-03-05",
            "start_time": "20:30",
            "type": "Humour",
            "artist_name": "Comique Test"
        }
        
        # Create and delete karaoke
        karaoke_create = requests.post(f"{self.base_url}/karaoke", json=karaoke_data, headers=headers, timeout=10)
        karaoke_delete_success = False
        if karaoke_create.status_code == 200:
            karaoke_id = karaoke_create.json().get('id')
            karaoke_delete = requests.delete(f"{self.base_url}/karaoke/{karaoke_id}", headers=headers, timeout=10)
            karaoke_delete_success = karaoke_delete.status_code == 200
        
        # Create and delete spectacle
        spectacle_create = requests.post(f"{self.base_url}/spectacle", json=spectacle_data, headers=headers, timeout=10)
        spectacle_delete_success = False
        if spectacle_create.status_code == 200:
            spectacle_id = spectacle_create.json().get('id')
            spectacle_delete = requests.delete(f"{self.base_url}/spectacle/{spectacle_id}", headers=headers, timeout=10)
            spectacle_delete_success = spectacle_delete.status_code == 200
        
        success = karaoke_delete_success and spectacle_delete_success
        
        if success:
            details = "✅ Suppressions réussies - Endpoints DELETE fonctionnels"
        else:
            details = f"❌ Problème suppression - karaoke: {karaoke_delete_success}, spectacle: {spectacle_delete_success}"
        
        return self.log_result("Endpoints Suppression", success, details)
    
    def run_all_tests(self):
        """Run all Karaoké and Spectacle bug fix tests"""
        print("🎯 TEST DU BUG CORRIGÉ : Événements Karaoké et Spectacle")
        print("=" * 60)
        print("Bug: Les événements 'Karaoké' et 'Spectacle' ne s'affichaient pas après création")
        print("Fix: Correction incohérence noms collections MongoDB (karaokes→karaoke, spectacles→spectacle)")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_accounts():
            print("❌ Échec configuration comptes de test - Arrêt des tests")
            return False
        
        # Run tests
        results = []
        results.append(self.test_karaoke_creation())
        results.append(self.test_spectacle_creation())
        results.append(self.test_karaoke_venue_listing())
        results.append(self.test_spectacle_venue_listing())
        results.append(self.test_karaoke_global_listing())
        results.append(self.test_spectacle_global_listing())
        results.append(self.test_mongodb_collections_validation())
        results.append(self.test_security_authentication())
        results.append(self.test_delete_endpoints())
        
        # Summary
        passed = sum(results)
        total = len(results)
        success_rate = (passed / total) * 100
        
        print("\n" + "=" * 60)
        print("📊 RÉSULTATS DES TESTS")
        print("=" * 60)
        print(f"Tests réussis: {passed}/{total}")
        print(f"Taux de réussite: {success_rate:.1f}%")
        
        if passed == total:
            print("🎉 TOUS LES TESTS RÉUSSIS - BUG CORRIGÉ VALIDÉ!")
            print("✅ Les événements Karaoké et Spectacle s'affichent correctement après création")
            print("✅ Les collections MongoDB utilisent les bons noms (karaoke, spectacle)")
            print("✅ Tous les endpoints fonctionnent correctement")
        else:
            print("⚠️ CERTAINS TESTS ONT ÉCHOUÉ")
            print("❌ Le bug pourrait ne pas être entièrement corrigé")
        
        return passed == total

if __name__ == "__main__":
    tester = KaraokeSpectacleTestRunner()
    success = tester.run_all_tests()
    exit(0 if success else 1)