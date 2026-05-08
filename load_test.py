#!/usr/bin/env python3
"""
Simple Load Test Script
Tests performance before/after optimizations
"""
import asyncio
import httpx
import time
from statistics import mean, median
import json

BASE_URL = "http://localhost:8001"

async def test_endpoint(client, method, path, data=None, headers=None):
    """Test a single endpoint and return response time"""
    start = time.time()
    try:
        if method == "GET":
            response = await client.get(f"{BASE_URL}{path}", headers=headers or {})
        elif method == "POST":
            response = await client.post(
                f"{BASE_URL}{path}",
                json=data,
                headers=headers or {}
            )
        elapsed = (time.time() - start) * 1000  # Convert to ms
        return {
            "success": True,
            "status": response.status_code,
            "time_ms": round(elapsed, 2)
        }
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return {
            "success": False,
            "error": str(e),
            "time_ms": round(elapsed, 2)
        }


async def run_concurrent_requests(endpoint_config, num_requests=10):
    """Run multiple requests concurrently"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [
            test_endpoint(
                client,
                endpoint_config["method"],
                endpoint_config["path"],
                endpoint_config.get("data"),
                endpoint_config.get("headers")
            )
            for _ in range(num_requests)
        ]
        results = await asyncio.gather(*tasks)
        return results


def analyze_results(results, endpoint_name):
    """Analyze and print results"""
    times = [r["time_ms"] for r in results if r["success"]]
    errors = [r for r in results if not r["success"]]
    
    if not times:
        print(f"\n❌ {endpoint_name}: All requests failed")
        return
    
    print(f"\n📊 {endpoint_name}")
    print(f"  Total requests: {len(results)}")
    print(f"  Successful: {len(times)} ({len(times)/len(results)*100:.1f}%)")
    print(f"  Failed: {len(errors)}")
    print(f"  Average response time: {mean(times):.2f}ms")
    print(f"  Median response time: {median(times):.2f}ms")
    print(f"  Min response time: {min(times):.2f}ms")
    print(f"  Max response time: {max(times):.2f}ms")
    
    # Percentiles
    sorted_times = sorted(times)
    p50 = sorted_times[len(sorted_times)//2]
    p95 = sorted_times[int(len(sorted_times)*0.95)]
    p99 = sorted_times[int(len(sorted_times)*0.99)] if len(sorted_times) > 10 else sorted_times[-1]
    
    print(f"  P50 (median): {p50:.2f}ms")
    print(f"  P95: {p95:.2f}ms")
    print(f"  P99: {p99:.2f}ms")


async def main():
    print("=" * 70)
    print("🔥 TEST DE CHARGE - JAMCONNEXION.COM")
    print("=" * 70)
    print("\nCe test mesure les performances des endpoints critiques")
    print("avec les optimisations de la Phase 1 appliquées.\n")
    
    print("⚠️  Tests sans authentification (pour éviter rate limiting)")
    
    # Test configurations (public endpoints only)
    tests = [
        {
            "name": "GET /api/venues (Public, cached)",
            "config": {
                "method": "GET",
                "path": "/api/venues"
            },
            "num_requests": 50
        },
        {
            "name": "GET /api/musicians (Public, cached)",
            "config": {
                "method": "GET",
                "path": "/api/musicians"
            },
            "num_requests": 50
        },
        {
            "name": "GET /api/bands (Public, cached)",
            "config": {
                "method": "GET",
                "path": "/api/bands"
            },
            "num_requests": 50
        },
        {
            "name": "GET /health (Health check)",
            "config": {
                "method": "GET",
                "path": "/health"
            },
            "num_requests": 100
        },
        {
            "name": "GET /api/venues (Repeated - testing cache)",
            "config": {
                "method": "GET",
                "path": "/api/venues"
            },
            "num_requests": 100
        }
    ]
    
    # Run tests
    all_times = []
    for test in tests:
        print(f"\n🔄 Running: {test['name']} ({test['num_requests']} requests)...")
        results = await run_concurrent_requests(test["config"], test["num_requests"])
        analyze_results(results, test["name"])
        
        # Collect times for overall stats
        times = [r["time_ms"] for r in results if r["success"]]
        all_times.extend(times)
        
        await asyncio.sleep(0.5)  # Small delay between tests
    
    # Overall summary
    if all_times:
        print("\n" + "=" * 70)
        print("📈 RÉSUMÉ GLOBAL")
        print("=" * 70)
        print(f"  Total requests: {len(all_times)}")
        print(f"  Average response time: {mean(all_times):.2f}ms")
        print(f"  Median response time: {median(all_times):.2f}ms")
        print(f"  Min: {min(all_times):.2f}ms | Max: {max(all_times):.2f}ms")
        
        # Performance rating
        avg_time = mean(all_times)
        if avg_time < 100:
            rating = "🟢 EXCELLENT"
        elif avg_time < 300:
            rating = "🟡 BON"
        elif avg_time < 800:
            rating = "🟠 ACCEPTABLE"
        else:
            rating = "🔴 LENT"
        
        print(f"\n  Performance globale: {rating}")
        
        print("\n" + "=" * 70)
        print("✅ Test de charge terminé")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
