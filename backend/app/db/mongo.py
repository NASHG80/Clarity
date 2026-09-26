"""
MongoDB connection and client access layer (Task D1).

Provides a reusable, singleton MongoDB client and accessors for all collections
defined in docs/DATA_MODEL.md.
"""

import os
from typing import Optional, Tuple
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pathlib import Path

try:
    from dotenv import load_dotenv
    # Find backend/.env relative to this file
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

# Environment variable keys
ENV_MONGO_URI = "MONGO_URI"
ENV_MONGO_DB_NAME = "MONGO_DB_NAME"

# Defaults per docs/TECH_STACK.md and .env.example
DEFAULT_MONGO_URI = "mongodb://localhost:27017"
DEFAULT_DB_NAME = "green_travel"

# Canonical collection names per docs/DATA_MODEL.md
COLLECTION_HOTELS = "hotels"
COLLECTION_TRANSPORT_ROUTES = "transport_routes"
COLLECTION_EXPERIENCES = "experiences"
COLLECTION_BUSINESSES = "businesses"
COLLECTION_CONFIRMATIONS = "confirmations"
COLLECTION_AI_INSPECTIONS = "ai_inspections"
COLLECTION_ANALYTICS_EVENTS = "analytics_events"

ALL_COLLECTIONS: Tuple[str, ...] = (
    COLLECTION_HOTELS,
    COLLECTION_TRANSPORT_ROUTES,
    COLLECTION_EXPERIENCES,
    COLLECTION_BUSINESSES,
    COLLECTION_CONFIRMATIONS,
    COLLECTION_AI_INSPECTIONS,
    COLLECTION_ANALYTICS_EVENTS,
)

# Reusable client and database singletons to avoid per-request client creation
_client: Optional[MongoClient] = None
_db: Optional[Database] = None


def get_mongo_uri() -> str:
    """Retrieve the configured MongoDB connection URI."""
    return os.getenv(ENV_MONGO_URI, DEFAULT_MONGO_URI)


def get_mongo_db_name() -> str:
    """Retrieve the configured MongoDB database name."""
    return os.getenv(ENV_MONGO_DB_NAME, DEFAULT_DB_NAME)


def get_mongo_client() -> MongoClient:
    """
    Get or create the singleton MongoClient instance.

    Uses connect=False so background server monitoring is deferred until the
    first operation, avoiding connection errors on import if MongoDB is not reachable.
    """
    global _client
    if _client is None:
        uri = get_mongo_uri()
        _client = MongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            connect=False,
        )
    return _client


def get_db(db_name: Optional[str] = None) -> Database:
    """
    Get or create the Database instance from the shared MongoClient.

    If db_name is not provided, uses the database specified in the URI if present,
    or falls back to MONGO_DB_NAME / 'green_travel'.
    """
    global _db
    if _db is None or (db_name is not None and _db.name != db_name):
        client = get_mongo_client()
        target_name = db_name or get_mongo_db_name()
        try:
            _db = client.get_default_database(default=target_name)
        except Exception:
            _db = client[target_name]
    return _db


def close_mongo_client() -> None:
    """Close the active MongoClient connection and reset singletons."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None


def get_collection(name: str, db: Optional[Database] = None) -> Collection:
    """Obtain a collection by name from the active database."""
    target_db = db if db is not None else get_db()
    return target_db[name]


def get_hotels_collection(db: Optional[Database] = None) -> Collection:
    """Accessor for 'hotels' collection."""
    return get_collection(COLLECTION_HOTELS, db)


def get_transport_routes_collection(db: Optional[Database] = None) -> Collection:
    """Accessor for 'transport_routes' collection."""
    return get_collection(COLLECTION_TRANSPORT_ROUTES, db)


def get_experiences_collection(db: Optional[Database] = None) -> Collection:
    """Accessor for 'experiences' collection."""
    return get_collection(COLLECTION_EXPERIENCES, db)


def get_businesses_collection(db: Optional[Database] = None) -> Collection:
    """Accessor for 'businesses' collection."""
    return get_collection(COLLECTION_BUSINESSES, db)


def get_confirmations_collection(db: Optional[Database] = None) -> Collection:
    """Accessor for 'confirmations' collection."""
    return get_collection(COLLECTION_CONFIRMATIONS, db)


def get_ai_inspections_collection(db: Optional[Database] = None) -> Collection:
    """Accessor for 'ai_inspections' collection."""
    return get_collection(COLLECTION_AI_INSPECTIONS, db)


def get_analytics_events_collection(db: Optional[Database] = None) -> Collection:
    """Accessor for 'analytics_events' collection."""
    return get_collection(COLLECTION_ANALYTICS_EVENTS, db)
