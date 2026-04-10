import re

def parse_env(file_path):
    keys = set()
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    keys.add(line.split('=')[0])
    except FileNotFoundError:
        pass
    return keys

example = parse_env('.env.example')
prod = parse_env('.env.prod')

print("In .env.example but missing in .env.prod:")
print(example - prod)
print("\nIn .env.prod but missing in .env.example:")
print(prod - example)
