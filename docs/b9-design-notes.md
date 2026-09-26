# B9 AI Analysis Review Design Notes

## Research Findings

| Source | Pattern studied | Adopted? | Adaptation |
| ------ | --------------- | -------- | ---------- |
| Label Studio | Pre-annotation box overlay + human review workflow | Yes | Display model predictions over the photo clearly, keeping the "human-in-the-loop" framing without building a full box-editing UI. |
| Supervisely | Visual gallery with issue tracking | No | B9 doesn't need issue tracking or box editing; it just presents the predicted evidence for the downstream B10 step. |
| Roboflow | Bounding box + class label visualization | Yes | Overlay simple boxes with labels attached for context, using responsive CSS scaling. |
| TouchRight | AI provides draft narrative for human approval | Yes | Use helper copy to clarify that AI suggestions are just suggestions until the business confirms them. |
| Google Vision | Normalized `[0,1]` vs pixel coordinate bounding boxes | Yes | The UI must safely scale coordinate boxes. Since the mock provides pixel coordinates `[x, y, w, h]`, we will convert these to percentages using the image's `naturalWidth` and `naturalHeight` to ensure perfect responsiveness without box drift. |

## Adopted Patterns
- **Image + bounding-box overlay**: Shows the reviewer exactly what region the AI identified.
- **Detection list linked to visual regions**: Hovering a detection in the list will highlight the corresponding box on the image.
- **Human-review framing**: Helper copy explicitly states "AI suggestions are ready for your review."
- **Per-photo grouping**: Keeps detections tied to their source bucket/image.

## Intentionally NOT Adopted
- **Full annotation editor**: B9 is a review screen, not a CV labeling platform.
- **Model confidence dashboard**: Model confidence is omitted from the UI to prevent it from becoming an accessibility score.
- **Automatic verification**: B9 does not confirm the claim; it just displays the prediction.
