import os
import re

grep_output = [
    "/Users/marcovanzo/Fusion ERP/js/modules/staff_v3.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/staff_v2.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/staff/StaffView.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/admin.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/website.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/tasks.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/athletes.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/athletes/AthleteHealth.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/transport/TransportView.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/athletes/AthletesView.js",
    "/Users/marcovanzo/Fusion ERP/js/modules/ecommerce/EcommerceView.js"
]
files = sorted(list(set(grep_output)))

for filepath in files:
    with open(filepath, 'r') as f:
        lines = f.read().splitlines()
    
    new_lines = []
    skip_next = False
    
    for i in range(len(lines)):
        if skip_next:
            skip_next = False
            continue
            
        if 'eslint-disable-next-line no-useless-assignment' in lines[i]:
            # Next line usually has the variable
            next_line = lines[i+1]
            # Replace `let varName = anything;` with `let varName;`
            # or `varName = anything;` with just deleting it? Wait, some are `let x = '';`, others are assignments `x = '';`.
            # Let's see: `let statusBadge = ''`
            
            # If it's a let/const declaration:
            match = re.match(r'^(\s*(?:let|var)\s+[a-zA-Z0-9_$]+)\s*=.*(;?)$', next_line)
            if match:
                refined = match.group(1) + match.group(2)
                new_lines.append(refined)
            else:
                # If it's an assignment like `e = '<option...';` we shouldn't just remove it if it's the only line? Wait, if we remove `e = ...`, we just drop the line?
                # For safety, let's print if no match
                print(f"NO MATCH in {filepath}: {next_line}")
                new_lines.append(lines[i]) # keep comment
                new_lines.append(next_line)
                
            skip_next = True
        else:
            new_lines.append(lines[i])
            
    with open(filepath, 'w') as f:
        f.write('\n'.join(new_lines) + '\n')
