import re
import json

with open("src/shared/homepage.tsx", "r", encoding="utf-8") as f:
    text = f.read()

match = re.search(r'export const translations = ({[\s\S]*?\n  }\n});', text)
if not match:
    print("Match failed")
    exit(1)

obj_str = match.group(1)
obj_str = re.sub(r'as DataStateType', '', obj_str)

with open("temp.js", "w", encoding="utf-8") as f:
    f.write(f"const translations = {obj_str};\n")
    f.write("import fs from 'fs';\n")
    f.write("for (const lang of ['en', 'hi', 'mr']) {\n")
    f.write("    const path = `src/i18n/${lang}/b2c.json`;\n")
    f.write("    const dict = JSON.parse(fs.readFileSync(path, 'utf8'));\n")
    f.write("    dict['home'] = translations[lang];\n")
    f.write("    fs.writeFileSync(path, JSON.stringify(dict, null, 2), 'utf8');\n")
    f.write("}\n")
print("Wrote temp.js")
