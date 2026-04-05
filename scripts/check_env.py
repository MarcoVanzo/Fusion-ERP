import os
import re

API_DIR = "../api"
ENV_FILE = "../.env.prod"

def get_env_keys(env_path):
    keys = set()
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key = line.split("=")[0].strip()
                keys.add(key)
    return keys

def find_env_usage(api_dir):
    usage_pattern = re.compile(r"(?:getenv\(['\"]([^'\"]+)['\"]\)|(?:\$_ENV\[['\"])([^'\"]+)(?:['\"]\]))")
    usages = set()
    for root, _, files in os.walk(api_dir):
        for file in files:
            if file.endswith(".php"):
                with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                    content = f.read()
                    matches = usage_pattern.findall(content)
                    for match in matches:
                        if match[0]:
                            usages.add(match[0])
                        if match[1]:
                            usages.add(match[1])
    return usages

prod_keys = get_env_keys(ENV_FILE)
used_keys = find_env_usage(API_DIR)

missing = used_keys - prod_keys
unused = prod_keys - used_keys

print(f"Total keys in .env.prod: {len(prod_keys)}")
print(f"Total keys extracted from API PHP code: {len(used_keys)}\n")

print("Keys used in code but MISSING in .env.prod:")
for k in sorted(missing):
    print(f" - {k}")

print("\nKeys in .env.prod but UNUSED (or injected elsewhere):")
for k in sorted(unused):
    print(f" - {k}")
