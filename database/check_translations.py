import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "seed_data"

def check_translations(collection_name, file_name, expected_fields):
    file_path = DATA_DIR / file_name
    if not file_path.exists():
        print(f"File not found: {file_path}")
        return 0, 0

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    errors = 0
    checked = 0

    for doc in data:
        doc_id = doc.get("_id")
        checked += 1
        
        translations = doc.get("translations", {})
        
        for lang in ["en", "hi", "mr"]:
            if lang not in translations:
                print(f"[{collection_name}] {doc_id} missing language block '{lang}'")
                errors += 1
                continue
                
            lang_data = translations[lang]
            for field in expected_fields:
                val = lang_data.get(field)
                if val is None:
                    # Is it an intentional fallback? We'll log it as an error for D10 audit
                    print(f"[{collection_name}] {doc_id} missing field '{field}' in '{lang}'")
                    errors += 1
                elif not isinstance(val, str) or val.strip() == "":
                    print(f"[{collection_name}] {doc_id} empty field '{field}' in '{lang}'")
                    errors += 1
                elif val in ["...", "TBD", "same as English", "Hindi translation", "Marathi translation"]:
                    print(f"[{collection_name}] {doc_id} placeholder field '{field}' in '{lang}'")
                    errors += 1

    return checked, errors

def main():
    print("=== D10 Translation Audit ===")
    
    total_checked = 0
    total_errors = 0
    
    c, e = check_translations("hotels", "hotels.json", ["name", "description"])
    total_checked += c
    total_errors += e
    
    c, e = check_translations("experiences", "experiences.json", ["name", "description"])
    total_checked += c
    total_errors += e

    print(f"\nAudit complete. Checked {total_checked} records.")
    if total_errors == 0:
        print("Status: PASS. All required translations are fully populated.")
        sys.exit(0)
    else:
        print(f"Status: FAIL. Found {total_errors} translation errors.")
        sys.exit(1)

if __name__ == "__main__":
    main()
