import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to find the first 'use ' statement that is NOT preceded by another use statement.
    # Wait, simple approach:
    # If file contains "namespace ", find its end.
    # We collect all "require " and "require_once " lines that appear BEFORE the first "use " and AFTER "namespace".
    # And move them AFTER the last "use " statement.
    # Actually, simpler: Any `require` or `require_once` that is before `use` should be moved below `use`.
    
    # Let's do it with a simple replacement: 
    # Just move ALL `use ...;` statements to the top, right under `namespace ...;` or `<?php`.
    
    lines = content.split('\n')
    
    uses = []
    other_lines = []
    
    namespace_idx = -1
    for i, line in enumerate(lines):
        if line.startswith('namespace '):
            namespace_idx = i
            break
            
    header = lines[:namespace_idx+1] if namespace_idx != -1 else []
    if namespace_idx == -1:
        if lines and lines[0].startswith('<?php'):
            header = [lines[0]]
            lines = lines[1:]
        else:
            header = []
    else:
        lines = lines[namespace_idx+1:]
        
    for line in lines:
        if line.startswith('use ') and line.endswith(';'):
            uses.append(line)
        else:
            other_lines.append(line)
            
    # Reassemble:
    if not uses:
        return # No use statements, no need to fix
        
    # We want to keep use statements together.
    # Find any existing use statements that were collected and remove them from other_lines (already done).
    
    # Are we safe to just prepend `uses`? Yes, unless there are block comments before uses.
    pass

