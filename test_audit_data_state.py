import sys
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))
from database.audit_data_state import audit_documents

def test_passing_cases():
    docs = [
        {
            "_id": "doc1",
            "info": {
                "data_state": "not_verified",
                "value": None
            }
        },
        {
            "_id": "doc2",
            "info": {
                "data_state": "not_verified"
            }
        },
        {
            "_id": "doc3",
            "info": {
                "data_state": "verified",
                "value": True
            }
        },
        {
            "_id": "doc4",
            "arr": [
                {
                    "data_state": "reported",
                    "value": 1
                },
                {
                    "data_state": "community_confirmed",
                    "value": "yes"
                },
                {
                    "data_state": "demo_synthetic",
                    "value": {"a": 1}
                }
            ]
        }
    ]
    
    docs_scanned, states_scanned, violations = audit_documents("test_coll", docs)
    assert docs_scanned == 4
    assert states_scanned == 6
    assert len(violations) == 0

def test_failing_cases():
    docs = [
        {
            "_id": "fail1",
            "info": {
                "data_state": "not_verified",
                "value": True
            }
        },
        {
            "_id": "fail2",
            "info": {
                "data_state": "not_verified",
                "value": False
            }
        },
        {
            "_id": "fail3",
            "info": {
                "data_state": "not_verified",
                "value": 0
            }
        },
        {
            "_id": "fail4",
            "info": {
                "data_state": "not_verified",
                "value": ""
            }
        },
        {
            "_id": "fail5",
            "deep": {
                "nested": {
                    "data_state": "not_verified",
                    "value": {"x": 1}
                }
            }
        },
        {
            "_id": "fail6",
            "arr": [
                {
                    "data_state": "unverified",
                    "value": None
                }
            ]
        }
    ]
    
    docs_scanned, states_scanned, violations = audit_documents("test_coll", docs)
    assert docs_scanned == 6
    assert states_scanned == 6
    assert len(violations) == 6
    
    types = [v.error_type for v in violations]
    assert types.count("not_verified_non_null") == 5
    assert types.count("invalid_data_state") == 1
    
    # Check paths
    paths = [v.path for v in violations]
    assert "info.value" in paths
    assert "deep.nested.value" in paths
    assert "arr[0].data_state" in paths

if __name__ == "__main__":
    test_passing_cases()
    test_failing_cases()
    print("All unit tests for audit_data_state passed!")
