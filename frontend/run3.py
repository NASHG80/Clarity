import re
with open("src/shared/homepage.tsx", "r", encoding="utf-8") as f:
    text = f.read()

start_str = "export const translations = {"
end_str = "// ==========================================\n// 3. NLU EXTRACTION & CLARIFICATION"

start_idx = text.find(start_str)
end_idx = text.find(end_str)
if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + text[end_idx:]
    with open("src/shared/homepage.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Removed translations from homepage.tsx")
else:
    print("Not found")
