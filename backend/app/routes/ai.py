"""AI inspection routes — YOLO-World-S image analysis + confirmation.

C1 stubs: return deterministic contract-shaped responses.

Routes:
    POST /api/ai/inspect-property-image
    POST /api/ai/confirm-detections

Rules (AGENTS.md §2.4 / API_CONTRACT.md):
  - confidence is INTERNAL / ENGINEERING ONLY.
    It must NEVER be shown to travelers as an accessibility percentage.
  - detections do not change any data_state until the business explicitly
    confirms them via /api/ai/confirm-detections.
  - Only confirmed detections cause a checklist item's data_state to
    become "reported".
"""

import os
import json
import logging
import httpx

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.models.schemas import (
    AiInspectResponse,
    ConfirmDetectionsRequest,
    ConfirmDetectionsResponse,
    Detection,
)

router = APIRouter(prefix="/api/ai", tags=["AI Vision"])
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# C11 — YOLO-World-S AI vision integration
# ---------------------------------------------------------------------------

@router.post("/inspect-property-image", response_model=AiInspectResponse)
async def inspect_property_image(
    image: UploadFile = File(...),
    queries: str = Form(...),
) -> AiInspectResponse:
    """Forward property image to YOLO-World-S for object detection.

    C11: Forwards multipart request to ai-vision-service.
    No model weights or GPU logic exist here (process isolation).
    Detections do not alter listing data_state directly.

    IMPORTANT: `confidence` is internal/engineering information only.
    It must NEVER be presented to travelers as an accessibility percentage.
    Detections do NOT change any data_state until the business explicitly
    confirms them via POST /api/ai/confirm-detections.
    """
    # 1. Validate inbound request
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=422,
            detail="Uploaded file must be an image (image/jpeg, image/png, etc.).",
        )

    try:
        parsed_queries = json.loads(queries)
        if not isinstance(parsed_queries, list):
            raise ValueError("queries must be a JSON array")
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail=f"'queries' must be a JSON-encoded array of strings. Error: {exc}",
        )

    # 2. Forward to downstream ai-vision-service
    vision_url = os.getenv("AI_VISION_URL", "http://localhost:8001").rstrip("/")
    
    # ai-vision-service contract expects: file + queries (JSON string)
    data = {"queries": json.dumps(parsed_queries)}
    
    try:
        image_bytes = await image.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Failed to read uploaded image.")
        
    files = {"file": (image.filename or "image.jpg", image_bytes, image.content_type or "image/jpeg")}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{vision_url}/inspect",
                data=data,
                files=files,
                timeout=30.0,
            )
            resp.raise_for_status()
            downstream_json = resp.json()
    except httpx.TimeoutException:
        logger.warning("ai-vision-service timed out.")
        raise HTTPException(
            status_code=504,
            detail={"code": "ERR_AI_VISION_TIMEOUT", "detail": "AI vision service unavailable (timeout). Please try again later."},
        )
    except httpx.RequestError as exc:
        logger.warning(f"ai-vision-service unreachable: {exc}")
        raise HTTPException(
            status_code=503,
            detail={"code": "ERR_AI_VISION_UNREACHABLE", "detail": "AI analysis unavailable, please fill the checklist manually."},
        )
    except httpx.HTTPStatusError as exc:
        logger.warning(f"ai-vision-service returned HTTP {exc.response.status_code}")
        raise HTTPException(
            status_code=502,
            detail={"code": "ERR_AI_VISION_BAD_GATEWAY", "detail": "AI analysis unavailable, please fill the checklist manually."},
        )
    except json.JSONDecodeError as exc:
        logger.error(f"ai-vision-service returned malformed JSON: {exc}")
        raise HTTPException(
            status_code=502,
            detail={"code": "ERR_AI_VISION_MALFORMED_RESPONSE", "detail": "AI vision service returned malformed data."},
        )

    # 3. Parse and map downstream response
    if not isinstance(downstream_json, list):
        logger.error("ai-vision-service response is not a list")
        raise HTTPException(
            status_code=502,
            detail={"code": "ERR_AI_VISION_MALFORMED_RESPONSE", "detail": "AI vision service returned malformed data."},
        )

    detections = []
    for item in downstream_json:
        try:
            detections.append(
                Detection(
                    label=item["label"],
                    bbox=item["bbox"],
                    confidence=item["confidence"],
                )
            )
        except (KeyError, TypeError, ValueError) as exc:
            logger.error(f"Malformed detection item from ai-vision-service: {exc}")
            raise HTTPException(
                status_code=502,
                detail={"code": "ERR_AI_VISION_MALFORMED_RESPONSE", "detail": "AI vision service returned malformed detection data."},
            )

    return AiInspectResponse(
        detections=detections,
        image_filename=image.filename,
        queries_received=parsed_queries,
        note="Processed by C11 YOLO-World-S integration.",
    )


from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import ValidationError

from app.models.schemas import (
    AiInspectResponse,
    ConfirmDetectionsRequest,
    ConfirmDetectionsResponse,
    Detection,
)
from app.db.mongo import get_db

@router.post("/confirm-detections", response_model=ConfirmDetectionsResponse)
async def confirm_detections(payload: ConfirmDetectionsRequest) -> ConfirmDetectionsResponse:
    """Business explicitly confirms or rejects AI-detected items.
    Only confirmed=True items will cause checklist data_state → "reported".
    Rejected items are discarded.
    """
    db = get_db()
    ai_inspections = db["ai_inspections"]
    businesses = db["businesses"]
    hotels = db["hotels"]

    # First pass: Validate EVERYTHING before any DB writes
    updates = []
    for item in payload.detections:
        inspection = ai_inspections.find_one({"image_id": item.image_id})
        if not inspection:
            raise HTTPException(status_code=404, detail=f"Inspection not found for image_id: {item.image_id}")
        
        detection_exists = False
        for d in inspection.get("detections", []):
            if d.get("label") == item.label:
                detection_exists = True
                break
                
        if not detection_exists:
            raise HTTPException(status_code=404, detail=f"Detection with label '{item.label}' not found.")

        target_array = None
        hotel_id = None
        if item.confirmed:
            business = businesses.find_one({"_id": inspection["business_id"]})
            if not business or "hotel_id" not in business:
                raise HTTPException(status_code=404, detail="Business or hotel_id not found for inspection.")
            hotel_id = business["hotel_id"]
            hotel = hotels.find_one({"_id": hotel_id})
            if not hotel:
                raise HTTPException(status_code=404, detail="Hotel not found.")
            
            if any(i.get("label") == item.label for i in hotel.get("accessibility_items", [])):
                target_array = "accessibility_items"
            elif any(i.get("label") == item.label for i in hotel.get("sustainability_items", [])):
                target_array = "sustainability_items"
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Label '{item.label}' not found in canonical checklist."
                )

        updates.append({
            "inspection_id": inspection["_id"],
            "item": item,
            "target_array": target_array,
            "hotel_id": hotel_id
        })

    # Second pass: Apply updates (now safe from validation mid-flight)
    confirmed_labels = []
    rejected_labels = []

    for u in updates:
        item = u["item"]
        new_status = "confirmed" if item.confirmed else "rejected"
        ai_inspections.update_one(
            {"_id": u["inspection_id"], "detections.label": item.label},
            {"$set": {"detections.$.review_status": new_status}}
        )

        if item.confirmed:
            target_array = u["target_array"]
            hotels.update_one(
                {"_id": u["hotel_id"], f"{target_array}.label": item.label},
                {"$set": {
                    f"{target_array}.$.data_state": "reported",
                    f"{target_array}.$.value": True
                }}
            )
            confirmed_labels.append(item.label)
        else:
            rejected_labels.append(item.label)

    return ConfirmDetectionsResponse(
        status="processed",
        confirmed_labels=confirmed_labels,
        rejected_labels=rejected_labels,
        note="C13 processed: Confirmed items marked reported, rejected items marked rejected.",
    )
