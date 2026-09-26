"""MongoDB connection setup — collections per docs/DATA_MODEL.md.

C1 stub: exposes a lazy `get_db()` helper.
Real query logic is added in later C tasks.
The client is created once on first call (not at import time) so that
the server can start even if MongoDB is not yet running.
"""

import os
from functools import lru_cache

from pymongo import MongoClient
from pymongo.database import Database


@lru_cache(maxsize=1)
def _client() -> MongoClient:
    uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    return MongoClient(uri)


def get_db() -> Database:
    """Return the 'clarity' database handle.

    Collections (per DATA_MODEL.md):
        hotels, transport_routes, experiences, businesses,
        confirmations, ai_inspections, analytics_events
    """
    return _client()["clarity"]
