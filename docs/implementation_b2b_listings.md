# Implementation Plan: B2B Listings Dummy Data & UI Upgrade

## Objective
The user wants to populate the B2B Listings page (`/b2b/listings`) with robust, production-ready dummy data without breaking the manual onboarding logic. Additionally, the UI of the Listings Table and Listing Preview pages must be upgraded to look highly premium and modern.

## Strategy
Instead of hardcoding dummy data directly in the React frontend (which would break the manual onboarding flow since the frontend maps over state), we will seed high-quality dummy properties directly into the MongoDB `hotels` collection. 

This ensures:
1. The backend `/api/listings` automatically fetches them.
2. The `/b2b/listings` table renders them properly.
3. The Listing Preview page (`/b2b/preview/:id`) loads all their nested details (rooms, accessibility, sustainability, location).
4. Newly created manual listings still append to the database and render exactly the same way.

## Step 1: Seed High-Quality Dummy Listings
- Create a Python script (`database/seed_b2b_dummy_listings.py`) to insert 3-4 premium dummy hotel listings into the `hotels` collection.
- These listings will include:
  - High-quality Unsplash image URLs for `photos`.
  - Detailed `accessibility_items` (e.g., wheelchair ramps, tactile paths).
  - Detailed `sustainability_items` (e.g., zero waste, solar power, greywater).
  - Proper `rooms` arrays.
  - Correct `translations` structures for English, Hindi, and Marathi.
  - High `star_rating` and realistic `price_inr_per_night`.

## Step 2: Modernize `ListingTablePage.tsx`
- Improve the card design for each listing:
  - Add gradient overlays to the images.
  - Enhance the typography (font weights, spacing).
  - Add quick-glance chips for Rooms, Sustainability, and Accessibility counts.
  - Implement smooth hover effects (scale, shadow) on the cards.

## Step 3: Execute and Verify
- Run the python seed script to populate MongoDB.
- Verify that `http://localhost:5173/b2b/listings` correctly displays the beautiful new cards alongside any existing properties.
- Verify that clicking into a property opens a fully populated Preview page.
