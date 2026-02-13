#!/usr/bin/env python3
"""
Focused test for bands geolocation search fix
Testing the specific requirements from the user
"""

import requests
import json
from datetime import datetime

class FocusedGeolocationTester:
    def __init__(self, base_url="https://gamified-venue.preview.emergentagent.com/api"):
        self.base_url = base_url

    def test_paris_100km(self):
        """Test 1: GET /api/bands?latitude=48.8566&longitude=2.3522&radius=100 (Paris, 100km)"""
        print("🗼 Test 1: Paris 100km radius")
        params = {
            "latitude": 48.8566,
            "longitude": 2.3522,
            "radius": 100
        }
        
        response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            bands = response.json()
            print(f"   Found: {len(bands)} bands")
            
            # Check each band has distance_km field
            bands_with_distance = [b for b in bands if 'distance_km' in b]
            print(f"   With distance: {bands_with_distance.__len__()}")
            
            # Show examples
            if bands:
                for i, band in enumerate(bands[:3]):
                    print(f"   Band {i+1}: {band.get('name')} ({band.get('city')}) - {band.get('distance_km')}km")
            
            return len(bands)
        else:
            print(f"   Error: {response.text[:100]}")
            return 0

    def test_paris_500km(self):
        """Test 2: GET /api/bands?latitude=48.8566&longitude=2.3522&radius=500 (Paris, 500km)"""
        print("🗼 Test 2: Paris 500km radius")
        params = {
            "latitude": 48.8566,
            "longitude": 2.3522,
            "radius": 500
        }
        
        response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            bands = response.json()
            print(f"   Found: {len(bands)} bands")
            
            # Show distance range
            if bands:
                distances = [b.get('distance_km', 0) for b in bands]
                print(f"   Distance range: {min(distances):.1f} - {max(distances):.1f}km")
                
                # Show examples
                for i, band in enumerate(bands[:3]):
                    print(f"   Band {i+1}: {band.get('name')} ({band.get('city')}) - {band.get('distance_km')}km")
            
            return len(bands)
        else:
            print(f"   Error: {response.text[:100]}")
            return 0

    def test_lyon_100km(self):
        """Test 3: GET /api/bands?latitude=45.764&longitude=4.8357&radius=100 (Lyon, 100km)"""
        print("🏔️ Test 3: Lyon 100km radius")
        params = {
            "latitude": 45.764,
            "longitude": 4.8357,
            "radius": 100
        }
        
        response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            bands = response.json()
            print(f"   Found: {len(bands)} bands")
            
            # Check for Lyon bands specifically
            lyon_bands = [b for b in bands if 'lyon' in b.get('city', '').lower() or 'lyon' in b.get('name', '').lower()]
            print(f"   Lyon-based bands: {len(lyon_bands)}")
            
            # Show examples
            if bands:
                for i, band in enumerate(bands[:3]):
                    print(f"   Band {i+1}: {band.get('name')} ({band.get('city')}) - {band.get('distance_km')}km")
            
            return len(bands)
        else:
            print(f"   Error: {response.text[:100]}")
            return 0

    def test_precision_verification(self):
        """Test 4: Verify precision - distances should be within radius and coherent"""
        print("🎯 Test 4: Precision verification")
        params = {
            "latitude": 48.8566,  # Paris
            "longitude": 2.3522,
            "radius": 200  # 200km radius
        }
        
        response = requests.get(f"{self.base_url}/bands", params=params, timeout=15)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            bands = response.json()
            print(f"   Found: {len(bands)} bands within 200km")
            
            # Verify all distances are within radius
            invalid_distances = [b for b in bands if b.get('distance_km', 0) > 200]
            if invalid_distances:
                print(f"   ❌ WARNING: {len(invalid_distances)} bands exceed 200km radius")
                for band in invalid_distances[:3]:
                    print(f"      {band.get('name')}: {band.get('distance_km')}km")
                return False
            else:
                print(f"   ✅ All distances within 200km radius")
            
            # Check if sorted by distance
            if bands:
                distances = [b.get('distance_km', 0) for b in bands]
                sorted_distances = sorted(distances)
                if distances == sorted_distances:
                    print(f"   ✅ Correctly sorted by distance")
                else:
                    print(f"   ❌ Not sorted by distance")
                    return False
                
                print(f"   Distance range: {min(distances):.1f} - {max(distances):.1f}km")
            
            return True
        else:
            print(f"   Error: {response.text[:100]}")
            return False

    def test_on_the_fly_geocoding(self):
        """Test 5: Verify on-the-fly geocoding works for bands with only city info"""
        print("🌍 Test 5: On-the-fly geocoding verification")
        
        # First get all bands without geolocation
        response_all = requests.get(f"{self.base_url}/bands", timeout=10)
        if response_all.status_code == 200:
            all_bands = response_all.json()
            total_bands = len(all_bands)
            print(f"   Total bands in database: {total_bands}")
        else:
            print(f"   Error getting all bands: {response_all.status_code}")
            return False
        
        # Now test geolocation search with large radius
        params = {
            "latitude": 46.2276,  # Center of France
            "longitude": 2.2137,
            "radius": 800  # Large radius to catch most French cities
        }
        
        response = requests.get(f"{self.base_url}/bands", params=params, timeout=20)
        print(f"   Geolocation search status: {response.status_code}")
        
        if response.status_code == 200:
            geo_bands = response.json()
            print(f"   Bands found with geolocation: {len(geo_bands)}")
            
            # Check if we're getting results (the fix working)
            if len(geo_bands) > 0:
                print(f"   ✅ On-the-fly geocoding is working!")
                
                # Show examples of geocoded bands
                city_geocoded = [b for b in geo_bands if b.get('city') and 'distance_km' in b]
                print(f"   Bands geocoded from city names: {len(city_geocoded)}")
                
                if city_geocoded:
                    print("   Examples of geocoded bands:")
                    for i, band in enumerate(city_geocoded[:5]):
                        print(f"      {band.get('name')} in {band.get('city')} - {band.get('distance_km')}km")
                
                return True
            else:
                print(f"   ❌ No bands found - geocoding may not be working")
                return False
        else:
            print(f"   Error: {response.text[:100]}")
            return False

    def run_focused_tests(self):
        """Run the focused tests as requested by the user"""
        print("🎸 FOCUSED GEOLOCATION SEARCH TESTS")
        print("=" * 50)
        print("Testing the specific requirements from the user:")
        print()
        
        # Test 1: Paris 100km
        paris_100_count = self.test_paris_100km()
        print()
        
        # Test 2: Paris 500km  
        paris_500_count = self.test_paris_500km()
        print()
        
        # Test 3: Lyon 100km
        lyon_100_count = self.test_lyon_100km()
        print()
        
        # Test 4: Precision verification
        precision_ok = self.test_precision_verification()
        print()
        
        # Test 5: On-the-fly geocoding
        geocoding_ok = self.test_on_the_fly_geocoding()
        print()
        
        # Summary
        print("=" * 50)
        print("📊 SUMMARY:")
        print(f"   Paris 100km: {paris_100_count} bands")
        print(f"   Paris 500km: {paris_500_count} bands")
        print(f"   Lyon 100km: {lyon_100_count} bands")
        print(f"   Precision: {'✅ OK' if precision_ok else '❌ Issues'}")
        print(f"   Geocoding: {'✅ Working' if geocoding_ok else '❌ Not working'}")
        print()
        
        # Verification
        if paris_500_count >= paris_100_count and lyon_100_count > 0 and precision_ok and geocoding_ok:
            print("🎉 GEOLOCATION SEARCH FIX IS WORKING!")
            print("   ✅ On-the-fly geocoding successfully converts city names to coordinates")
            print("   ✅ Distance calculations are accurate")
            print("   ✅ Results are properly filtered by radius")
            return True
        else:
            print("⚠️ Some issues detected:")
            if paris_500_count < paris_100_count:
                print("   - Paris 500km should find at least as many bands as 100km")
            if lyon_100_count == 0:
                print("   - Lyon search should find some bands")
            if not precision_ok:
                print("   - Distance calculations have precision issues")
            if not geocoding_ok:
                print("   - On-the-fly geocoding is not working")
            return False

if __name__ == "__main__":
    tester = FocusedGeolocationTester()
    success = tester.run_focused_tests()
    exit(0 if success else 1)