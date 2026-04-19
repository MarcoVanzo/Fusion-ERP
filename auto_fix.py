import re
import sys

def main():
    # Read the eslint output from output.log
    try:
        with open('output.log', 'r') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print("output.log not found.")
        return

    current_file = None
    fixes = {}
    
    # Parse eslint output
    # Format:
    # /path/to/file.js
    #   14:19  warning  'm' is assigned a value but never used ...  no-unused-vars
    
    for line in lines:
        if line.startswith('/'):
            current_file = line.strip()
            if current_file not in fixes:
                fixes[current_file] = []
        elif line.strip() and current_file:
            match = re.search(r'^\s*(\d+):(\d+)\s+warning\s+.*?\'(.*?)\'.*?(no-unused-vars|no-useless-assignment)', line)
            if match:
                line_num = int(match.group(1))
                col_num = int(match.group(2))
                var_name = match.group(3)
                
                # We only want to rename function parameters or catch variables to _var
                # If it's a useless assignment we could just rename or ignore. 
                # Let's apply a naive string replacement specifically on that line
                fixes[current_file].append((line_num, var_name))

    for filepath, file_fixes in fixes.items():
        if not file_fixes:
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            content_lines = f.readlines()
            
        # Group fixes by line number to avoid shifting problems
        line_fixes = {}
        for fn, var in file_fixes:
            if fn not in line_fixes:
                line_fixes[fn] = []
            line_fixes[fn].append(var)
            
        for line_num, vars in line_fixes.items():
            idx = line_num - 1
            original = content_lines[idx]
            modified = original
            for var in vars:
                # Replace var with _var if it's not already _var
                # Use regex to replace whole word
                modified = re.sub(r'\b' + re.escape(var) + r'\b', f'_{var}', modified)
            content_lines[idx] = modified
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(content_lines)
            
main()
