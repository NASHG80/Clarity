"""
Database initialization layer for MongoDB (Task D1 & Index Setup).

Handles index creation and ensures required collections are prepared
for the FastAPI application without inserting seed or mock data.
"""

from typing import Dict, List, Optional
import pymongo
from pymongo.database import Database

from .mongo import (
    get_db,
    COLLECTION_AI_INSPECTIONS,
    COLLECTION_ANALYTICS_EVENTS,
)


def ensure_indexes(db: Database) -> Dict[str, List[str]]:
    """
    Ensure required indexes exist across collections per docs/DATA_MODEL.md & docs/TEAM_SPLIT.md.

    Required indexes:
    - ai_inspections: business_id, image_id (Task D7)
    - analytics_events: compound index on (business_id, event_type, timestamp) (Task D8)

    Idempotent: PyMongo create_index is a no-op if the index already exists.

    Returns:
        Dict mapping collection names to lists of created/verified index names.
    """
    results: Dict[str, List[str]] = {}

    # D7: ai_inspections index on business_id and image_id for fast lookups
    ai_col = db[COLLECTION_AI_INSPECTIONS]
    idx_ai_biz = ai_col.create_index("business_id", name="idx_ai_inspections_business_id")
    idx_ai_img = ai_col.create_index("image_id", name="idx_ai_inspections_image_id")
    results[COLLECTION_AI_INSPECTIONS] = [idx_ai_biz, idx_ai_img]

    # D8: analytics_events compound index on (business_id, event_type, timestamp) for aggregation queries
    analytics_col = db[COLLECTION_ANALYTICS_EVENTS]
    idx_analytics = analytics_col.create_index(
        [
            ("business_id", pymongo.ASCENDING),
            ("event_type", pymongo.ASCENDING),
            ("timestamp", pymongo.ASCENDING),
        ],
        name="idx_analytics_events_biz_type_ts",
    )
    results[COLLECTION_ANALYTICS_EVENTS] = [idx_analytics]

    return results


def init_db(db: Optional[Database] = None) -> Database:
    """
    Initialize database connection and ensure required indexes exist.

    Args:
        db: Optional Database instance. If None, uses get_db().

    Returns:
        The initialized Database instance.
    """
    target_db = db if db is not None else get_db()
    ensure_indexes(target_db)
    return target_db
