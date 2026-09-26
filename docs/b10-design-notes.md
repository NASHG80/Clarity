# B10 Review & Confirm Flow — Design Notes

## Human-in-the-Loop AI Review Research

| Source | Pattern studied | Adopted? | Adaptation |
| ------ | --------------- | -------- | ---------- |
| **Label Studio** | ML predictions as pre-annotations requiring explicit human accept/reject before becoming formal annotations; batch vs individual decisions. | **Yes** | Detections from YOLO-World-S are treated strictly as candidate pre-annotations in a pending state. Each detection requires an explicit Confirm or Reject action. Confirmed items become business-reported claims (`data_state: "reported"`); rejected items are discarded. Batch submission sends all decisions to `POST /api/ai/confirm-detections`. |
| **Amazon SageMaker Ground Truth** | Dedicated Label Verification workflow distinct from primary annotation; human workers verify existing labels/bounding boxes without model automation overriding human decisions. | **Yes** | Business user reviews model-suggested bounding boxes and labels to verify presence on property. Human rejection always overrides model prediction regardless of confidence score. No automated active learning alters the human decision. |
| **TouchRight ReportAssist AI** | AI-generated property inspection findings presented as review drafts; human inspector retains ultimate responsibility and approval; findings remain tied to photographic evidence. | **Yes** | AI findings are clearly framed as suggestions needing property confirmation. The UI keeps each detection visually linked to its photo and bucket evidence. Confirmation copy states "Reported by property", ensuring clarity of responsibility without claiming verification. |
| **Wheel the World** | Strict separation of granular photographic evidence from independent verification; distinction between self-reported data and verified claims. | **Yes** | Confirmed features update property claims to `data_state: "reported"` (business self-reported), strictly never `"verified"`. Photographic evidence remains associated with the claim, but no certification seal or third-party audit status is implied. |

---

## Detailed Pattern Breakdown

### Adopted Patterns

1. **Per-Detection Decision Controls**:
   - Each detected object within an image gets dedicated, independent **Confirm** and **Reject** buttons.
   - Users can confirm one feature (e.g., ramp) and reject another (e.g., broken handrail) within the same photo.

2. **Visual Evidence Association**:
   - Detections remain visually tied to the photo and their bounding box coordinates.
   - Focusing, hovering, or tapping a detection card highlights the corresponding bounding box overlay on the image.

3. **Explicit Decision Required (No Auto-Confirmation)**:
   - Default state for every detection is `pending`.
   - AI confidence score (e.g. 0.85) is never used to pre-confirm, rank, or hide detections.
   - No silent confirmation of unreviewed items.

4. **Reversible Decisions Before Submit**:
   - The user can freely change their mind (Confirm ↔ Reject) prior to clicking the final submission button.
   - Local state tracks drafts until the batch `POST /api/ai/confirm-detections` request is dispatched.

5. **Batch Submission**:
   - Submits all per-detection decisions in a single canonical list payload matching `docs/API_CONTRACT.md`.
   - Clear loading and disabling of duplicate submission during in-flight requests.
   - On network error, all draft decisions are preserved with translated retry options.

6. **Server-Owned Data-State Transition**:
   - Confirmed items transition corresponding checklist items to `data_state: "reported"`.
   - Never transitions to `data_state: "verified"` (reserved for official 3rd-party audits).
   - Rejected items are discarded and do not create negative claims (`value: false`).

---

### Patterns Not Adopted (Out of Scope / Prohibited)

1. **Full Annotation Canvas / Bounding Box Editor**:
   - No dragging, resizing, or redrawing of bounding boxes (not building Label Studio/CVAT).
2. **Model Retraining & Active Learning**:
   - No retraining pipelines, weights updates, or model fine-tuning feedback loops.
3. **Multi-Reviewer Consensus & Workforce Management**:
   - Single business owner context; no multi-worker arbitration or agreement scoring.
4. **Certification System / Audit Seal**:
   - Explicitly forbidden by project rules (`AGENTS.md`). Confirmation means self-reported, not certified.
5. **Confidence-Driven Automation or Scoring**:
   - Confidence is completely stripped from traveler/business display and does not affect data state.
6. **Wheel the World's 200+ Field Audit**:
   - We maintain our streamlined 9 accessibility features and 4 sustainability practices.
