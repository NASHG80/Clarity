"""Community confirmation route — POST /api/confirmations

C1 stub: accepts the submission and returns a deterministic success response.
Real threshold logic (community_confirmed after n confirmations) implemented
in later C tasks, using the threshold from recommendation_engine/config.py.

Rule (API_CONTRACT.md): the confirmation threshold lives in
recommendation-engine config, not hardcoded in the frontend or this file.
"""

from fastapi import APIRouter

from app.models.schemas import (
    ConfirmationRequest,
    ConfirmationResponse,
)

router = APIRouter(prefix="/api", tags=["Confirmations"])


# ---------------------------------------------------------------------------
# C1 STUB — real threshold + data_state promotion implemented in later C tasks
# ---------------------------------------------------------------------------

@router.post("/confirmations", status_code=202, response_model=ConfirmationResponse)
async def submit_confirmation(payload: ConfirmationRequest) -> ConfirmationResponse:
    """Submit a community accessibility/sustainability confirmation.

    C1 stub: accepts payload, returns stub success.
    Real logic: once confirmed_by_count >= threshold (from
    recommendation_engine/config.py), the item's data_state
    is promoted to "community_confirmed". Not implemented until later C tasks.
    """
    return ConfirmationResponse(
        status="stub_accepted",
        hotel_id=payload.hotel_id,
        item_label=payload.item_label,
        note=(
            "C1 stub — not persisted. "
            "Real community-confirmation threshold logic implemented in later C tasks."
        ),
    )
