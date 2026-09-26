import os
import re

directories = ['src/b2c/pages', 'src/b2c/components', 'src/shared']
out = []
for root, _, files in os.walk('.'):
    normalized_root = root.replace(chr(92), '/')
    if not any(normalized_root.startswith(f'./{d}') or normalized_root == f'./{d}' for d in directories):
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                matches = re.findall(r'>([^<>{}]*[a-zA-Z]+[^<>{}]*)<', content)
                matches = [m.strip() for m in matches if m.strip() and not m.startswith('t(')]
                
                attr_matches = re.findall(r'(?:title|aria-label)="([^"]*[a-zA-Z]+[^"]*)"', content)
                attr_matches = [m for m in attr_matches if 't(' not in m]
                
                if matches or attr_matches:
                    out.append(f'--- {path} ---')
                    for m in (matches + attr_matches):
                        out.append(f'  {m}')

with open('strings_output.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
