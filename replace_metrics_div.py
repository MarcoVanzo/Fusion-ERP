import sys
with open('js/modules/athletes.js', 'r') as f:
    text = f.read()

target = '\\x3c!-- PAGAMENTI --\\x3e'
if target in text:
    if '</div>\\n\\n          \\x3c!-- PAGAMENTI --\\x3e' not in text:
        new_text = text.replace(target, '</div>\\n\\n          \\x3c!-- PAGAMENTI --\\x3e')
        with open('js/modules/athletes.js', 'w') as f:
            f.write(new_text)
        print('SUCCESS! Injected </div> before PAGAMENTI.')
    else:
        print('ALREADY INJECTED!')
else:
    print('Target not found..')
