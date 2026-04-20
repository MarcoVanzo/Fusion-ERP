import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simply remove 'catch (err)' to basic 'catch (err)' and avoid replacing it blindly
    content = content.replace('catch (_err)', 'catch (err)')
    content = content.replace('catch (_e)', 'catch (e)')
    content = content.replace('catch (_error)', 'catch (error)')
    
    # We MUST ensure _parseError is not left orphaned if the catch variable is renamed.
    content = content.replace('cause: _parseError', 'cause: err')

    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('js'):
    for file in files:
        if file.endswith('.js'):
            process_file(os.path.join(root, file))
print("Done patching catch blocks.")
