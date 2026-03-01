#!/usr/bin/env python3
"""Test Cognito Forms API - fetch entries from all forms."""
import urllib.request
import urllib.error
import json
import sys

TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6Ijg4YmYzNWNmLWM3ODEtNDQ3ZC1hYzc5LWMyODczMjNkNzg3ZCIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25JZCI6IjYzMDNjODZhLTFlOTItNDIwMC1hMGRmLTM5N2RjOGZiZWExNyIsImludGVncmF0aW9uSWQiOiJiZTBkYTNmZS05YzkyLTQ0ZTQtYmNlNy1iZmJjMDUyNDBmMGQiLCJjbGllbnRJZCI6IjNkZTNmODMwLWNiYzctNDZlNi1iOTZlLTVmMDE2NzcyMTgzMCIsImp0aSI6ImFhZTUzNTJiLTViMjQtNDAxZi1iMjgwLWRmMGZiNTA0ZDA5NiIsImlhdCI6MTc3MjMyMDQ3NiwiaXNzIjoiaHR0cHM6Ly93d3cuY29nbml0b2Zvcm1zLmNvbS8iLCJhdWQiOiJhcGkifQ.VMfAPoXw05Wgcp2WLTxk7Cz6nPguf91TnaFh8snTVp0"

BASE = "https://www.cognitoforms.com/api"

def api_get(path):
    """Make authenticated GET request."""
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return resp.status, data
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body
    except Exception as e:
        return 0, str(e)

# 1. List all forms
print("=" * 60)
print("FORMS LIST")
print("=" * 60)
status, forms = api_get("/forms")
print(f"HTTP {status}")
if isinstance(forms, list):
    for f in forms:
        print(f"  ID:{f['Id']:4s}  {f['Name']}")
else:
    print(f"  Error: {forms}")

# 2. Try entries on each form
print()
print("=" * 60)
print("ENTRIES PER FORM")
print("=" * 60)
form_ids = [f['Id'] for f in forms] if isinstance(forms, list) else ['20']
for fid in form_ids:
    status, data = api_get(f"/forms/{fid}/entries")
    if isinstance(data, list):
        print(f"  Form {fid}: ✅ HTTP {status} — {len(data)} entries")
        for i, entry in enumerate(data[:3]):
            # Print first few fields
            keys = [k for k in entry.keys() if k not in ('Entry', 'Order', 'Form', '$type')]
            preview = {k: entry[k] for k in keys[:5]}
            print(f"    [{i+1}] {preview}")
    else:
        msg = data.get('Message', data) if isinstance(data, dict) else data
        print(f"  Form {fid}: ❌ HTTP {status} — {msg}")
