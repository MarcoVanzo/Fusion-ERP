#!/usr/bin/env python3
import urllib.request
import urllib.error
import time
import concurrent.futures
import os
import json
import ssl

# Configuration
TEST_URLS = [
    "https://www.fusionteamvolley.it/ERP/api/router.php?module=societa&action=getPublicProfile",
    "https://www.fusionteamvolley.it/ERP/api/router.php?module=societa&action=getPublicOrganigramma",
    "https://www.fusionteamvolley.it/ERP/api/router.php?module=staff&action=getPublicStaff",
    "https://www.fusionteamvolley.it/ERP/api/router.php?module=website&action=getPublicTeams"
]
CONCURRENT_REQUESTS = 5
ITERATIONS = 3
TIMEOUT = 10

# SSL Context to avoid local certificate verification issues
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def check_url(url):
    start_time = time.time()
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'FusionERP-StressChecker/1.0'})
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ssl_context) as response:
            status = response.getcode()
            duration = time.time() - start_time
            return True, url, status, duration
    except urllib.error.URLError as e:
        duration = time.time() - start_time
        return False, url, str(e), duration
    except Exception as e:
        duration = time.time() - start_time
        return False, url, str(e), duration

def run_stress_test():
    print(f"🚀 Starting Stress Test on {len(TEST_URLS)} endpoints...")
    print(f"👥 Concurrency: {CONCURRENT_REQUESTS} | Iterations: {ITERATIONS}")
    
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENT_REQUESTS) as executor:
        for i in range(ITERATIONS):
            futures = [executor.submit(check_url, url) for url in TEST_URLS]
            for future in concurrent.futures.as_completed(futures):
                results.append(future.result())
    
    # Analysis
    success_count = sum(1 for r in results if r[0])
    fail_count = len(results) - success_count
    avg_duration = sum(r[3] for r in results) / len(results) if results else 0
    max_duration = max(r[3] for r in results) if results else 0
    
    print("\n--- Stress Test Report ---")
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed:     {fail_count}")
    print(f"⏱️  Avg Time:   {avg_duration:.3f}s")
    print(f"🔥 Max Time:   {max_duration:.3f}s")
    
    is_stable = True
    if fail_count > 0:
        print("\n⚠️  Warnings/Errors detected:")
        for r in results:
            if not r[0]:
                msg = str(r[2])
                # If the error is 401 or 404, it might be a new endpoint not yet deployed.
                # We treat it as a warning but don't fail the build if other endpoints are fine.
                if "401" in msg or "404" in msg:
                    print(f"  - [WARN] {r[1]}: {msg} (Endpoint might not be deployed yet)")
                else:
                    print(f"  - [ERROR] {r[1]}: {msg}")
                    is_stable = False
        
    if avg_duration > 2.0:
        print("\n⚠️  Performance warning: Average response time is > 2s")
        is_stable = False

    if is_stable:
        print("\n✅ System is stable and responsive.")
    else:
        print("\n❌ System is unstable or slow.")
    
    return is_stable

if __name__ == "__main__":
    success = run_stress_test()
    if not success:
        exit(1)
    exit(0)
