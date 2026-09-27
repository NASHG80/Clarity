"""Route package — one module per resource, matching docs/API_CONTRACT.md.

Modules:
    nlu           POST /api/nlu/extract
    search        POST /api/search/transport, POST /api/search/accommodation
    listings      GET  /api/listings/{id}, POST /api/listings
    business      POST /api/business/onboard, GET /api/business/{id}/analytics
                  GET  /api/business/{id}/demand, GET /api/business/{id}/opportunities
                  GET  /api/explore/{city}
    ai            POST /api/ai/inspect-property-image, POST /api/ai/confirm-detections
    analytics     POST /api/analytics/events
    payments      POST /api/booking/create-order, POST /api/booking/verify-payment
    confirmations POST /api/confirmations
"""

from app.routes import (
    nlu,
    search,
    listings,
    business,
    ai,
    analytics,
    payments,
    confirmations,
    proxy,
)

__all__ = [
    "nlu",
    "search",
    "listings",
    "business",
    "ai",
    "analytics",
    "payments",
    "confirmations",
    "proxy",
]
