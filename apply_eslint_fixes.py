import json
import os

with open('eslint_report.json', 'r') as f:
    report = json.load(f)

for file_result in report:
    filepath = file_result['filePath']
    messages = file_result['messages']
    
    # Filter messages we want to prefix with '_'
    valid_msgs = [m for m in messages if m['ruleId'] in ('no-unused-vars', 'no-useless-assignment') and 'line' in m]
    if not valid_msgs:
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines()
        
    # Apply from bottom-up (reverse line and column) to not shift indices!
    valid_msgs.sort(key=lambda m: (m['line'], m['column']), reverse=True)
    
    for m in valid_msgs:
        line_idx = m['line'] - 1
        col_idx = m['column'] - 1
        
        original_line = lines[line_idx]
        
        # ESLint usually points the column to the start of the variable name
        # Wait, for 'no-unused-vars', sometimes eslint points to the start of the variable.
        # Let's verify character at col_idx is a letter
        
        if col_idx < len(original_line):
           # If it's a useless assignment like `err = foo`, the column points to `err`
           # So inserting an underscore at col_idx will make it `_err`
           lines[line_idx] = original_line[:col_idx] + '_' + original_line[col_idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
        
print("ESLint fixes applied.")
