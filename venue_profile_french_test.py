#!/usr/bin/env python3
"""
Jam Connexion - Venue Profile Bug Test (French Review Request)
Test exact scenario: "Venue profile not found" après création de profil établissement
"""

import requests
import sys
import json
from datetime import datetime

class VenueProfileBugTestFrench:
    def __init__(self, base_url="https://venuedb.preview.emergentagent.com/api"):
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
        
        status = "✅ RÉUSSI" if success else "❌ ÉCHEC"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def test_exact_user_scenario(self):
        """Test du scénario exact de l'utilisateur français"""
        try:
            print("\n🇫🇷 TEST DU SCÉNARIO EXACT DE L'UTILISATEUR")
            print("=" * 50)
            print("1. Utilisateur crée un compte établissement")
            print("2. Utilisateur remplit le formulaire de création de profil")
            print("3. Frontend envoie POST /api/venues avec les données")
            print("4. Utilisateur est redirigé vers le dashboard")
            print("5. ERREUR: 'Venue profile not found' s'affiche")
            print()
            
            # Étape 1: Créer compte établissement
            print("ÉTAPE 1: Création compte établissement...")
            venue_data = {
                "email": f"etablissement_test_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "MotDePasse123!",
                "name": "Mon Établissement",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Étape 1 - Création compte établissement", False, f"Échec création compte: {response.status_code}, {response.text}")
                return False
                
            auth_data = response.json()
            token = auth_data.get('token')
            user = auth_data.get('user')
            
            self.log_test("Étape 1 - Création compte établissement", True, f"Compte créé: {venue_data['email']}")
            
            # Étape 2: Créer profil avec données minimales (comme dans la review request)
            print("ÉTAPE 2: Création profil établissement...")
            profile_data = {
                "name": "Mon Établissement",
                "address": "123 Rue Test",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522
            }
            
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.post(f"{self.base_url}/venues", json=profile_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Étape 2 - Création profil établissement", False, f"Échec création profil: {response.status_code}, {response.text}")
                return False
                
            created_profile = response.json()
            profile_id = created_profile.get('id')
            
            self.log_test("Étape 2 - Création profil établissement", True, f"Profil créé avec ID: {profile_id}")
            
            # Étape 3: Récupérer profil (simulation redirection dashboard)
            print("ÉTAPE 3: Récupération profil (simulation dashboard)...")
            response = requests.get(f"{self.base_url}/venues/me", headers=headers, timeout=10)
            
            if response.status_code == 404:
                self.log_test("Étape 3 - Récupération profil", False, f"🚨 BUG CONFIRMÉ: 'Venue profile not found' - {response.status_code}, {response.text}")
                return False
            elif response.status_code != 200:
                self.log_test("Étape 3 - Récupération profil", False, f"Erreur inattendue: {response.status_code}, {response.text}")
                return False
            
            retrieved_profile = response.json()
            retrieved_id = retrieved_profile.get('id')
            
            if retrieved_id != profile_id:
                self.log_test("Étape 3 - Récupération profil", False, f"🚨 BUG: ID profil différent. Créé: {profile_id}, Récupéré: {retrieved_id}")
                return False
            
            self.log_test("Étape 3 - Récupération profil", True, f"Profil récupéré avec succès: {retrieved_id}")
            
            # Vérification des champs requis
            print("ÉTAPE 4: Vérification intégrité des données...")
            required_fields = ["name", "address", "city", "postal_code", "latitude", "longitude"]
            missing_fields = []
            
            for field in required_fields:
                if field not in retrieved_profile or retrieved_profile[field] is None:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_test("Étape 4 - Vérification intégrité", False, f"Champs manquants: {missing_fields}")
                return False
            
            self.log_test("Étape 4 - Vérification intégrité", True, "Tous les champs requis présents")
            
            # Test global
            self.log_test("TEST SCÉNARIO UTILISATEUR COMPLET", True, "✅ AUCUN BUG DÉTECTÉ - Le flux fonctionne correctement")
            return True
            
        except Exception as e:
            self.log_test("TEST SCÉNARIO UTILISATEUR COMPLET", False, f"Erreur: {str(e)}")
            return False

    def test_mongodb_verification(self):
        """Vérifier que le profil existe dans MongoDB"""
        try:
            # Créer un nouveau compte pour ce test
            venue_data = {
                "email": f"mongo_test_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "MotDePasse123!",
                "name": "Test MongoDB",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                self.log_test("MongoDB Test - Création compte", False, "Échec création compte")
                return False
                
            auth_data = response.json()
            token = auth_data.get('token')
            user_id = auth_data.get('user', {}).get('id')
            
            # Créer profil
            profile_data = {
                "name": "Test MongoDB Venue",
                "address": "456 Avenue MongoDB",
                "city": "Lyon",
                "postal_code": "69001",
                "latitude": 45.7640,
                "longitude": 4.8357
            }
            
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.post(f"{self.base_url}/venues", json=profile_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("MongoDB Test - Création profil", False, "Échec création profil")
                return False
                
            created_profile = response.json()
            profile_id = created_profile.get('id')
            
            # Vérifier via endpoint public
            response = requests.get(f"{self.base_url}/venues/{profile_id}", timeout=10)
            
            if response.status_code != 200:
                self.log_test("MongoDB Test - Vérification existence", False, f"Profil non trouvé dans MongoDB: {response.status_code}")
                return False
            
            public_profile = response.json()
            
            # Vérifier que user_id correspond
            if public_profile.get('user_id') != user_id:
                self.log_test("MongoDB Test - Vérification user_id", False, f"user_id ne correspond pas. Profil: {public_profile.get('user_id')}, Utilisateur: {user_id}")
                return False
            
            self.log_test("MongoDB Test - Vérification complète", True, f"Profil existe dans MongoDB avec user_id correct: {user_id}")
            return True
            
        except Exception as e:
            self.log_test("MongoDB Test - Vérification complète", False, f"Erreur: {str(e)}")
            return False

    def test_double_creation_prevention(self):
        """Test que la double création est bien empêchée"""
        try:
            # Créer compte
            venue_data = {
                "email": f"double_test_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "MotDePasse123!",
                "name": "Test Double Création",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Double Création - Setup", False, "Échec création compte")
                return False
                
            auth_data = response.json()
            token = auth_data.get('token')
            
            # Première création
            profile_data = {
                "name": "Premier Profil",
                "address": "123 Rue Premier",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522
            }
            
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.post(f"{self.base_url}/venues", json=profile_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Double Création - Premier profil", False, "Échec première création")
                return False
            
            # Tentative de deuxième création (doit échouer)
            second_profile_data = {
                "name": "Deuxième Profil",
                "address": "456 Rue Deuxième",
                "city": "Lyon",
                "postal_code": "69001",
                "latitude": 45.7640,
                "longitude": 4.8357
            }
            
            response = requests.post(f"{self.base_url}/venues", json=second_profile_data, headers=headers, timeout=10)
            
            if response.status_code == 400 and "already exists" in response.text.lower():
                self.log_test("Double Création - Prévention", True, f"Double création correctement empêchée: {response.status_code}")
                return True
            else:
                self.log_test("Double Création - Prévention", False, f"Double création non empêchée: {response.status_code}, {response.text}")
                return False
            
        except Exception as e:
            self.log_test("Double Création - Prévention", False, f"Erreur: {str(e)}")
            return False

    def test_profile_update_flow(self):
        """Test de mise à jour du profil"""
        try:
            # Créer compte et profil
            venue_data = {
                "email": f"update_test_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "MotDePasse123!",
                "name": "Test Mise à Jour",
                "role": "venue"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=venue_data, timeout=10)
            if response.status_code != 200:
                self.log_test("Mise à Jour - Setup", False, "Échec création compte")
                return False
                
            auth_data = response.json()
            token = auth_data.get('token')
            
            # Créer profil initial
            initial_profile = {
                "name": "Profil Initial",
                "address": "123 Rue Initiale",
                "city": "Paris",
                "postal_code": "75001",
                "latitude": 48.8566,
                "longitude": 2.3522
            }
            
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.post(f"{self.base_url}/venues", json=initial_profile, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Mise à Jour - Création initiale", False, "Échec création profil initial")
                return False
            
            # Mise à jour du profil
            updated_profile = {
                "name": "Profil Mis à Jour",
                "address": "456 Avenue Mise à Jour",
                "city": "Lyon",
                "postal_code": "69001",
                "latitude": 45.7640,
                "longitude": 4.8357,
                "description": "Description ajoutée",
                "phone": "+33123456789"
            }
            
            response = requests.put(f"{self.base_url}/venues", json=updated_profile, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Mise à Jour - PUT request", False, f"Échec mise à jour: {response.status_code}, {response.text}")
                return False
            
            # Vérifier que les modifications sont sauvegardées
            response = requests.get(f"{self.base_url}/venues/me", headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Mise à Jour - Vérification", False, "Échec récupération profil mis à jour")
                return False
            
            final_profile = response.json()
            
            # Vérifier les changements
            if (final_profile.get('name') == updated_profile['name'] and 
                final_profile.get('city') == updated_profile['city'] and
                final_profile.get('description') == updated_profile['description'] and
                final_profile.get('phone') == updated_profile['phone']):
                
                self.log_test("Mise à Jour - Vérification complète", True, "Toutes les modifications sauvegardées correctement")
                return True
            else:
                self.log_test("Mise à Jour - Vérification complète", False, "Modifications non sauvegardées correctement")
                return False
            
        except Exception as e:
            self.log_test("Mise à Jour - Vérification complète", False, f"Erreur: {str(e)}")
            return False

    def run_all_tests(self):
        """Exécuter tous les tests du scénario français"""
        print("🇫🇷 JAM CONNEXION - TEST BUG PROFIL ÉTABLISSEMENT")
        print("=" * 60)
        print("Test du bug critique: 'Venue profile not found' après création")
        print("Scénario utilisateur français complet")
        print()
        
        # Test principal - Scénario exact de l'utilisateur
        main_success = self.test_exact_user_scenario()
        
        if main_success:
            print("\n✅ TEST PRINCIPAL RÉUSSI - Aucun bug détecté")
            print("Exécution des tests de vérification supplémentaires...")
            
            print("\n🔍 TESTS DE VÉRIFICATION SUPPLÉMENTAIRES")
            print("-" * 40)
            self.test_mongodb_verification()
            self.test_double_creation_prevention()
            self.test_profile_update_flow()
        else:
            print("\n❌ TEST PRINCIPAL ÉCHOUÉ - Bug confirmé!")
            print("Arrêt des tests supplémentaires.")
        
        # Résumé
        print()
        print("=" * 60)
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 60)
        print(f"Tests exécutés: {self.tests_run}")
        print(f"Réussis: {self.tests_passed}")
        print(f"Échoués: {self.tests_run - self.tests_passed}")
        print(f"Taux de réussite: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print()
            print("🎉 TOUS LES TESTS RÉUSSIS!")
            print("✅ Le flux de création de profil établissement fonctionne correctement")
            print("✅ Aucun bug 'Venue profile not found' détecté")
            print("✅ Toutes les opérations CRUD fonctionnelles")
            print()
            print("🔍 CONCLUSION:")
            print("   Le bug signalé par l'utilisateur n'est PAS reproduit")
            print("   Le système fonctionne comme attendu")
            return True
        else:
            print()
            print("❌ CERTAINS TESTS ONT ÉCHOUÉ - BUG DÉTECTÉ!")
            failed_tests = [r for r in self.test_results if not r['success']]
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
            
            # Analyse spécifique du bug
            main_failed = any(r['test'] == 'TEST SCÉNARIO UTILISATEUR COMPLET' and not r['success'] for r in self.test_results)
            if main_failed:
                print()
                print("🚨 BUG CRITIQUE CONFIRMÉ:")
                print("   Le bug 'Venue profile not found' est RÉEL")
                print("   Les utilisateurs ne peuvent pas récupérer leur profil après création")
                print("   Cela bloque complètement le flux d'onboarding des établissements")
            
            return False

if __name__ == "__main__":
    tester = VenueProfileBugTestFrench()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)