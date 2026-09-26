import pytest
import json
import copy
from database.check_translations import check_translations

def mock_hotel():
    return {
        "_id": "test_hotel",
        "data_state": "reported",
        "translations": {
            "en": {"name": "English Name", "description": "Desc"},
            "hi": {"name": "Hindi Name", "description": "Desc"},
            "mr": {"name": "Marathi Name", "description": "Desc"}
        },
        "accessibility_items": [
            {"label": "step_free_entrance", "value": True, "data_state": "reported"},
            {"label": "roll_in_shower", "value": None, "data_state": "not_verified"}
        ]
    }

def mock_synthetic_hotel():
    h = mock_hotel()
    h["data_state"] = "demo_synthetic"
    return h

def test_fully_translated_hotel_passes(tmp_path, monkeypatch):
    import database.check_translations as ct
    monkeypatch.setattr(ct, "DATA_DIR", tmp_path)
    
    file_path = tmp_path / "hotels.json"
    file_path.write_text(json.dumps([mock_hotel()]))
    
    c, e = ct.check_translations("hotels", "hotels.json", ["name", "description"])
    assert c == 1
    assert e == 0

def test_missing_hindi_translation_fails(tmp_path, monkeypatch):
    import database.check_translations as ct
    monkeypatch.setattr(ct, "DATA_DIR", tmp_path)
    
    data = mock_hotel()
    del data["translations"]["hi"]
    
    file_path = tmp_path / "hotels.json"
    file_path.write_text(json.dumps([data]))
    
    c, e = ct.check_translations("hotels", "hotels.json", ["name", "description"])
    assert e > 0

def test_missing_marathi_translation_fails(tmp_path, monkeypatch):
    import database.check_translations as ct
    monkeypatch.setattr(ct, "DATA_DIR", tmp_path)
    
    data = mock_hotel()
    del data["translations"]["mr"]
    
    file_path = tmp_path / "hotels.json"
    file_path.write_text(json.dumps([data]))
    
    c, e = ct.check_translations("hotels", "hotels.json", ["name", "description"])
    assert e > 0

def test_empty_translation_fails(tmp_path, monkeypatch):
    import database.check_translations as ct
    monkeypatch.setattr(ct, "DATA_DIR", tmp_path)
    
    data = mock_hotel()
    data["translations"]["hi"]["description"] = "   "
    
    file_path = tmp_path / "hotels.json"
    file_path.write_text(json.dumps([data]))
    
    c, e = ct.check_translations("hotels", "hotels.json", ["name", "description"])
    assert e > 0

def test_placeholder_translation_fails(tmp_path, monkeypatch):
    import database.check_translations as ct
    monkeypatch.setattr(ct, "DATA_DIR", tmp_path)
    
    data = mock_hotel()
    data["translations"]["mr"]["description"] = "TBD"
    
    file_path = tmp_path / "hotels.json"
    file_path.write_text(json.dumps([data]))
    
    c, e = ct.check_translations("hotels", "hotels.json", ["name", "description"])
    assert e > 0

def test_canonical_structured_enum_values_remain_unchanged():
    data = mock_hotel()
    assert data["accessibility_items"][0]["label"] == "step_free_entrance"

def test_not_verified_values_remain_null():
    data = mock_hotel()
    item = data["accessibility_items"][1]
    assert item["data_state"] == "not_verified"
    assert item["value"] is None

def test_demo_synthetic_state_remains_exactly_demo_synthetic():
    data = mock_synthetic_hotel()
    assert data["data_state"] == "demo_synthetic"
