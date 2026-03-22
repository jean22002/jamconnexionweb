#!/usr/bin/env python3
"""
Performance Testing Script for JamConnexion
Tests pagination performance with realistic load
"""

import requests
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict
import json

BASE_URL = "https://pro-musician-sub.preview.emergentagent.com/api"

class PerformanceTester:
    def __init__(self):
        self.results = {
            "musicians_paginated": [],
            "venues_paginated": [],
            "musicians_filtered": [],
            "venues_filtered": []
        }
    
    def test_endpoint(self, endpoint: str, params: dict = None) -> Dict:
        """Test a single endpoint and return metrics"""
        start_time = time.time()
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", params=params, timeout=10)
            elapsed = time.time() - start_time
            
            return {
                "success": response.status_code == 200,
                "status_code": response.status_code,
                "response_time": elapsed * 1000,  # Convert to ms
                "size": len(response.content) if response.status_code == 200 else 0,
                "items_count": len(response.json()) if response.status_code == 200 and isinstance(response.json(), list) else 0
            }
        except Exception as e:
            elapsed = time.time() - start_time
            return {
                "success": False,
                "status_code": 0,
                "response_time": elapsed * 1000,
                "size": 0,
                "items_count": 0,
                "error": str(e)
            }
    
    def test_musicians_pagination(self, concurrent_users: int = 10):
        """Test musicians endpoint with pagination"""
        print(f"\n📊 Testing Musicians Pagination ({concurrent_users} concurrent users)...")
        
        test_cases = [
            {"page": 1, "limit": 10},
            {"page": 1, "limit": 25},
            {"page": 1, "limit": 50},
            {"page": 2, "limit": 25},
            {"page": 3, "limit": 10},
        ]
        
        results = []
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = []
            for _ in range(concurrent_users):
                for params in test_cases:
                    future = executor.submit(self.test_endpoint, "/musicians", params)
                    futures.append(future)
            
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                if result["success"]:
                    self.results["musicians_paginated"].append(result["response_time"])
        
        self._print_stats("Musicians Pagination", results)
        return results
    
    def test_venues_pagination(self, concurrent_users: int = 10):
        """Test venues endpoint with pagination"""
        print(f"\n📊 Testing Venues Pagination ({concurrent_users} concurrent users)...")
        
        test_cases = [
            {"page": 1, "limit": 10},
            {"page": 1, "limit": 25},
            {"page": 1, "limit": 50},
            {"page": 2, "limit": 25},
        ]
        
        results = []
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = []
            for _ in range(concurrent_users):
                for params in test_cases:
                    future = executor.submit(self.test_endpoint, "/venues", params)
                    futures.append(future)
            
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                if result["success"]:
                    self.results["venues_paginated"].append(result["response_time"])
        
        self._print_stats("Venues Pagination", results)
        return results
    
    def test_filtered_search(self, concurrent_users: int = 10):
        """Test filtered search with pagination"""
        print(f"\n📊 Testing Filtered Search ({concurrent_users} concurrent users)...")
        
        test_cases = [
            ("/musicians", {"instrument": "guitare", "page": 1, "limit": 20}),
            ("/musicians", {"style": "rock", "page": 1, "limit": 20}),
            ("/musicians", {"city": "paris", "page": 1, "limit": 20}),
            ("/venues", {"city": "lyon", "page": 1, "limit": 20}),
            ("/venues", {"style": "Jazz", "page": 1, "limit": 20}),
        ]
        
        results = []
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = []
            for _ in range(concurrent_users):
                for endpoint, params in test_cases:
                    future = executor.submit(self.test_endpoint, endpoint, params)
                    futures.append(future)
            
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                if result["success"]:
                    if "musicians" in str(test_cases):
                        self.results["musicians_filtered"].append(result["response_time"])
                    else:
                        self.results["venues_filtered"].append(result["response_time"])
        
        self._print_stats("Filtered Search", results)
        return results
    
    def test_progressive_load(self):
        """Test with progressively increasing load"""
        print("\n" + "="*70)
        print("🚀 PROGRESSIVE LOAD TEST")
        print("="*70)
        
        user_counts = [5, 10, 20, 30]
        
        for user_count in user_counts:
            print(f"\n--- Testing with {user_count} concurrent users ---")
            time.sleep(2)  # Brief pause between tests
            
            self.test_musicians_pagination(user_count)
            time.sleep(1)
            
            self.test_venues_pagination(user_count)
            time.sleep(1)
    
    def _print_stats(self, test_name: str, results: List[Dict]):
        """Print statistics for a test"""
        successful = [r for r in results if r["success"]]
        failed = [r for r in results if not r["success"]]
        
        if successful:
            response_times = [r["response_time"] for r in successful]
            sizes = [r["size"] for r in successful]
            items = [r["items_count"] for r in successful]
            
            print(f"\n  ✅ {test_name} Results:")
            print(f"     Total Requests: {len(results)}")
            print(f"     Successful: {len(successful)} ({len(successful)/len(results)*100:.1f}%)")
            print(f"     Failed: {len(failed)} ({len(failed)/len(results)*100:.1f}%)")
            print(f"     Response Time:")
            print(f"       - Min: {min(response_times):.2f}ms")
            print(f"       - Max: {max(response_times):.2f}ms")
            print(f"       - Avg: {statistics.mean(response_times):.2f}ms")
            print(f"       - Median: {statistics.median(response_times):.2f}ms")
            if len(response_times) > 1:
                print(f"       - StdDev: {statistics.stdev(response_times):.2f}ms")
            print(f"     Payload Size:")
            print(f"       - Avg: {statistics.mean(sizes)/1024:.2f}KB")
            print(f"     Items Returned:")
            print(f"       - Avg: {statistics.mean(items):.1f} items")
        else:
            print(f"\n  ❌ {test_name}: All requests failed")
            if failed:
                status_codes = [r.get("status_code", 0) for r in failed]
                print(f"     Status codes: {set(status_codes)}")
    
    def generate_report(self):
        """Generate final performance report"""
        print("\n" + "="*70)
        print("📈 FINAL PERFORMANCE REPORT")
        print("="*70)
        
        for test_name, times in self.results.items():
            if times:
                print(f"\n{test_name.upper().replace('_', ' ')}:")
                print(f"  Total Requests: {len(times)}")
                print(f"  Avg Response Time: {statistics.mean(times):.2f}ms")
                print(f"  Median Response Time: {statistics.median(times):.2f}ms")
                print(f"  95th Percentile: {sorted(times)[int(len(times)*0.95)] if len(times) > 20 else 'N/A':.2f}ms" if len(times) > 20 else f"  95th Percentile: N/A")
                print(f"  Min: {min(times):.2f}ms")
                print(f"  Max: {max(times):.2f}ms")
        
        print("\n" + "="*70)
        print("✅ PERFORMANCE TEST COMPLETED")
        print("="*70)


def main():
    print("""
╔══════════════════════════════════════════════════════════════════════╗
║          JamConnexion Performance Testing Suite                      ║
║          Testing Pagination Optimization Impact                      ║
╚══════════════════════════════════════════════════════════════════════╝
    """)
    
    tester = PerformanceTester()
    
    # Run tests
    print("\n🔍 Starting Performance Tests...")
    
    # Test 1: Basic pagination tests
    print("\n" + "="*70)
    print("TEST 1: BASIC PAGINATION PERFORMANCE")
    print("="*70)
    tester.test_musicians_pagination(concurrent_users=10)
    time.sleep(2)
    tester.test_venues_pagination(concurrent_users=10)
    
    # Test 2: Filtered search
    time.sleep(2)
    print("\n" + "="*70)
    print("TEST 2: FILTERED SEARCH PERFORMANCE")
    print("="*70)
    tester.test_filtered_search(concurrent_users=10)
    
    # Test 3: Progressive load
    time.sleep(2)
    tester.test_progressive_load()
    
    # Generate final report
    tester.generate_report()


if __name__ == "__main__":
    main()
