import re
import json
import os

with open("src/b2c/pages/RequirementFormPage.tsx", "r", encoding="utf-8") as f:
    text = f.read()

start_str = "const t = {"
start_idx = text.find(start_str)
end_str = "}[currentLang]"
end_idx = text.find(end_str, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Not found")
    exit(1)

obj_str = text[start_idx:end_idx + 1] # captures from `const t = {` to `}`

# write JS script
with open("temp2.js", "w", encoding="utf-8") as f:
    f.write(f"{obj_str}\n")
    f.write("import fs from 'fs';\n")
    f.write("for (const lang of ['en', 'hi', 'mr']) {\n")
    f.write("    const path = `src/i18n/${lang}/b2c.json`;\n")
    f.write("    const dict = JSON.parse(fs.readFileSync(path, 'utf8'));\n")
    f.write("    dict['reqForm'] = t[lang];\n")
    f.write("    fs.writeFileSync(path, JSON.stringify(dict, null, 2), 'utf8');\n")
    f.write("}\n")
print("Wrote temp2.js")
