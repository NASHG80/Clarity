# B7 Photo Upload Design Notes

## Research Findings

| Source | Relevant UX pattern | Use in B7? | Why |
| ------ | ------------------- | ---------- | --- |
| Airbnb | Organizing photos explicitly into rooms/spaces instead of a flat gallery. | Yes | AI analysis needs to know the context of the image (e.g., parking vs entrance). |
| Booking.com | Explicit technical file limits (JPEG/PNG, 50MB) and landscape orientation priority. | Yes | Gives users clear boundaries before hitting API errors. |
| Vrbo | Explicit assignment to a specific room/bucket during upload. | Yes | Allows clean segregation. |
| Cloudinary | Drag & Drop + immediate client-side previews and progress indicators. | Yes | Provides instant feedback without waiting for server response. |

## Application to B7

1. **Four Explicit Buckets:** We will provide four distinct zones (Entrance, Bathroom, Room, Parking) matching the exact B7 scope.
2. **Immediate Preview & Mock Upload:** Since the API contract does not currently define a `POST /api/business/photos` endpoint, I will use `URL.createObjectURL` for immediate client-side previews and simulate an upload delay, fulfilling the "local preview only pending backend support" requirement.
3. **Client-side Validation:** Before simulating the upload, I will reject files that aren't JPEG/PNG or are larger than 5MB. A clear error will be shown without breaking other uploaded photos.
4. **Responsive Layout:** A grid on desktop (`md:grid-cols-2`), falling back to a single column stack on mobile, ensuring drop zones are touch-friendly targets.
