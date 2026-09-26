# B8 AI Analysis Design Notes

## Research Findings

| Source | Relevant pattern | Adopted? | Adaptation |
| ------ | ---------------- | -------- | ---------- |
| Booking.com API | Processing queue has distinct status (new, ok, error, duplicate) separate from upload itself. | Yes | AI analysis state is kept strictly separate from the B7 photo selection state. |
| Airbnb Photo Tour | Processing happens automatically but allows manual control afterward. Wait times are short. | Yes | Once the "Analyze Photos" trigger is pressed, per-photo loading begins immediately. |
| Cloudinary Widget | Per-file upload progress and retry events rather than a single monolithic failure. | Yes | Error states and retry buttons will be scoped to individual photos (e.g. one failed photo will not block or reset the others). |
| Google Cloud Vision | Partial failures in a batch should only retry the failed objects, not the successful ones. | Yes | A single "failed" image can be retried independently without discarding or re-running the successful images. |

## UX Decisions for B8

1. **How should per-image processing be shown?**
   Using an indeterminate spinning loader per photo with "Analyzing..." text to indicate async AI inference.
2. **How should partial success be represented?**
   Each photo tracks its own status (`ready`, `analyzing`, `completed`, `failed`). The UI renders independent checkmarks or error states.
3. **How should retry work?**
   A "Retry" button appears on failed photos. Clicking it initiates a new API request *only* for that specific photo.
4. **Should overall progress be shown?**
   Yes, a simple text indicator like "2 of 4 analyzed" is acceptable and preferable to a fake time-based progress bar.
5. **How should timeout/error be communicated?**
   A clear, translated text message indicating the failure on the specific image thumbnail (e.g., "Analysis failed").
6. **How should the transition from B8 → B9 be represented?**
   Once all photos are in the `completed` state (even if `detections` is empty), the standard "Continue" button unlocks, allowing the user to navigate to the B9 review step.
