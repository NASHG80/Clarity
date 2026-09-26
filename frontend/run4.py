import re
with open("src/b2c/pages/RequirementFormPage.tsx", "r", encoding="utf-8") as f:
    text = f.read()

start_str = "// Translations\n"
start_idx = text.find(start_str)
end_str = "}[currentLang];\n"
end_idx = text.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    end_idx += len(end_str)
    # The code after the object might be `const renderContent = () => (`
    text = text[:start_idx] + text[end_idx:]
    with open("src/b2c/pages/RequirementFormPage.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Removed translations from RequirementFormPage.tsx")
else:
    print("Not found")
