import os
for root, dirs, files in os.walk('.'):
    rel_path = os.path.relpath(root, '.')
    rel_path_unix = rel_path.replace('\\', '/')
    if 'assets' in rel_path_unix:
        print(f"Path: {rel_path_unix}, Dirs: {dirs}, Files: {files}")
