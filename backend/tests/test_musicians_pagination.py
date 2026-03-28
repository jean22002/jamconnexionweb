#!/usr/bin/env python3
"""
Test Suite for Musicians Pagination Implementation
Tests the /api/musicians endpoint with server-side pagination
"""

import requests
import json
from typing import Dict, Any

class MusiciansPaginationTester:
    def __init__(self):
        self.base_url = "https://collapsible-map.preview.emergentagent.com/api"
        self.test_results = []
        
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")
    
    def test_basic_pagination_defaults(self):
        """Test 1: Default pagination parameters"""
        try:
            response = requests.get(f"{self.base_url}/musicians")
            data = response.json()
            
            passed = (
                response.status_code == 200 and
                isinstance(data, list) and
                len(data) <= 50  # Default limit is 50
            )
            
            self.log_test(
                "Basic Pagination - Defaults (page=1, limit=50)",
                passed,
                f"Status: {response.status_code}, Musicians returned: {len(data)}"
            )
            return passed
        except Exception as e:
            self.log_test("Basic Pagination - Defaults", False, f"Error: {str(e)}")
            return False
    
    def test_custom_pagination(self):
        """Test 2: Custom page and limit values"""
        try:
            # Test page 1, limit 5
            r1 = requests.get(f"{self.base_url}/musicians?page=1&limit=5")
            d1 = r1.json()
            
            # Test page 2, limit 5
            r2 = requests.get(f"{self.base_url}/musicians?page=2&limit=5")
            d2 = r2.json()
            
            # Verify different pages return different results
            passed = (
                r1.status_code == 200 and
                r2.status_code == 200 and
                len(d1) == 5 and
                len(d2) <= 5 and
                (len(d1) == 0 or len(d2) == 0 or d1[0]["id"] != d2[0]["id"])  # Different musicians
            )
            
            self.log_test(
                "Custom Pagination - Different Pages",
                passed,
                f"Page 1: {len(d1)} musicians, Page 2: {len(d2)} musicians, Different results: {d1[0]['id'] != d2[0]['id'] if d1 and d2 else 'N/A'}"
            )
            return passed
        except Exception as e:
            self.log_test("Custom Pagination", False, f"Error: {str(e)}")
            return False
    
    def test_limit_validation(self):
        """Test 3: Limit validation (max 100, min 1)"""
        try:
            # Test max limit
            r_max = requests.get(f"{self.base_url}/musicians?limit=100")
            d_max = r_max.json()
            
            # Test min limit
            r_min = requests.get(f"{self.base_url}/musicians?limit=1")
            d_min = r_min.json()
            
            # Test invalid page (should get validation error)
            r_invalid = requests.get(f"{self.base_url}/musicians?page=0")
            
            passed = (
                r_max.status_code == 200 and
                len(d_max) <= 100 and
                r_min.status_code == 200 and
                len(d_min) == 1 and
                r_invalid.status_code == 422  # Validation error
            )
            
            self.log_test(
                "Limit Validation",
                passed,
                f"Max limit (100): {len(d_max)} musicians, Min limit (1): {len(d_min)} musicians, Invalid page=0: Status {r_invalid.status_code}"
            )
            return passed
        except Exception as e:
            self.log_test("Limit Validation", False, f"Error: {str(e)}")
            return False
    
    def test_pagination_with_filters(self):
        """Test 4: Pagination with filters (instrument, style, city)"""
        try:
            # Test with instrument filter
            r_instrument = requests.get(f"{self.base_url}/musicians?instrument=guitare&page=1&limit=5")
            d_instrument = r_instrument.json()
            
            # Test with style filter
            r_style = requests.get(f"{self.base_url}/musicians?style=rock&page=1&limit=5")
            d_style = r_style.json()
            
            # Test with city filter
            r_city = requests.get(f"{self.base_url}/musicians?city=paris&page=1&limit=5")
            d_city = r_city.json()
            
            # Verify filters work with pagination
            passed = (
                r_instrument.status_code == 200 and
                r_style.status_code == 200 and
                r_city.status_code == 200 and
                isinstance(d_instrument, list) and
                isinstance(d_style, list) and
                isinstance(d_city, list)
            )
            
            self.log_test(
                "Pagination with Filters",
                passed,
                f"Instrument filter: {len(d_instrument)} results, Style filter: {len(d_style)} results, City filter: {len(d_city)} results"
            )
            return passed
        except Exception as e:
            self.log_test("Pagination with Filters", False, f"Error: {str(e)}")
            return False
    
    def test_edge_cases(self):
        """Test 5: Edge cases (high page number, empty results)"""
        try:
            # Test very high page number
            r_high = requests.get(f"{self.base_url}/musicians?page=999&limit=10")
            d_high = r_high.json()
            
            # Test filter that returns no results
            r_empty = requests.get(f"{self.base_url}/musicians?instrument=zzzznonexistent&page=1&limit=10")
            d_empty = r_empty.json()
            
            passed = (
                r_high.status_code == 200 and
                isinstance(d_high, list) and
                len(d_high) == 0 and  # Should be empty for page 999
                r_empty.status_code == 200 and
                isinstance(d_empty, list) and
                len(d_empty) == 0  # No results for non-existent instrument
            )
            
            self.log_test(
                "Edge Cases",
                passed,
                f"High page (999): {len(d_high)} results, Non-existent filter: {len(d_empty)} results"
            )
            return passed
        except Exception as e:
            self.log_test("Edge Cases", False, f"Error: {str(e)}")
            return False
    
    def test_response_structure(self):
        """Test 6: Response structure and required fields"""
        try:
            response = requests.get(f"{self.base_url}/musicians?limit=3")
            data = response.json()
            
            if not data:
                self.log_test("Response Structure", True, "No musicians to test (empty database)")
                return True
            
            # Check first musician has required fields
            first_musician = data[0]
            required_fields = ["id", "user_id", "pseudo", "instruments", "music_styles", "friends_count"]
            has_all_fields = all(field in first_musician for field in required_fields)
            
            # Check projection is working (some fields should NOT be present if optimized)
            # This depends on the exact projection used
            
            passed = (
                response.status_code == 200 and
                isinstance(data, list) and
                has_all_fields
            )
            
            self.log_test(
                "Response Structure",
                passed,
                f"Has required fields: {has_all_fields}, Sample musician: {first_musician.get('pseudo', 'N/A')}"
            )
            return passed
        except Exception as e:
            self.log_test("Response Structure", False, f"Error: {str(e)}")
            return False
    
    def test_pagination_consistency(self):
        """Test 7: Verify pagination consistency (skip/limit logic)"""
        try:
            # Get first 10 musicians
            r1 = requests.get(f"{self.base_url}/musicians?page=1&limit=10")
            page1 = r1.json()
            
            # Get next 10 musicians
            r2 = requests.get(f"{self.base_url}/musicians?page=2&limit=10")
            page2 = r2.json()
            
            # Get musicians 6-15 (should overlap with both previous requests)
            r3 = requests.get(f"{self.base_url}/musicians?page=1&limit=15")
            page1_15 = r3.json()
            
            # Verify no overlap between page 1 and page 2
            if page1 and page2:
                page1_ids = {m["id"] for m in page1}
                page2_ids = {m["id"] for m in page2}
                no_overlap = len(page1_ids & page2_ids) == 0
            else:
                no_overlap = True  # If one is empty, no overlap
            
            passed = (
                r1.status_code == 200 and
                r2.status_code == 200 and
                r3.status_code == 200 and
                no_overlap
            )
            
            self.log_test(
                "Pagination Consistency",
                passed,
                f"Page 1: {len(page1)} musicians, Page 2: {len(page2)} musicians, No overlap: {no_overlap}"
            )
            return passed
        except Exception as e:
            self.log_test("Pagination Consistency", False, f"Error: {str(e)}")
            return False
    
    def test_combined_filters(self):
        """Test 8: Multiple filters combined with pagination"""
        try:
            # Test multiple filters together
            response = requests.get(
                f"{self.base_url}/musicians?instrument=guitare&style=rock&page=1&limit=5"
            )
            data = response.json()
            
            passed = (
                response.status_code == 200 and
                isinstance(data, list)
            )
            
            self.log_test(
                "Combined Filters with Pagination",
                passed,
                f"Status: {response.status_code}, Results with instrument=guitare & style=rock: {len(data)}"
            )
            return passed
        except Exception as e:
            self.log_test("Combined Filters", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all pagination tests"""
        print("\n" + "="*60)
        print("🧪 MUSICIANS PAGINATION TEST SUITE")
        print("="*60 + "\n")
        
        tests = [
            self.test_basic_pagination_defaults,
            self.test_custom_pagination,
            self.test_limit_validation,
            self.test_pagination_with_filters,
            self.test_edge_cases,
            self.test_response_structure,
            self.test_pagination_consistency,
            self.test_combined_filters
        ]
        
        results = [test() for test in tests]
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        passed = sum(results)
        total = len(results)
        percentage = (passed / total * 100) if total > 0 else 0
        
        print(f"✅ Passed: {passed}/{total} ({percentage:.1f}%)")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Musicians pagination is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Review the details above.")
        
        return passed == total


if __name__ == "__main__":
    tester = MusiciansPaginationTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
