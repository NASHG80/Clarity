# ML Re-Ranker: Phase 1 Implementation Note

## 1. Current Pipeline
The recommendation engine follows a strict rule-based pipeline:
1. **Filtering (`filters.py`)**: Applies absolute constraints (budget ceiling, maximum duration, mandatory accessibility).
2. **Sub-Scoring (`scoring.py`)**: Computes 0-1 scores for:
   - Affordability (based on `cost_inr`)
   - Convenience (based on `duration_minutes`)
   - Environmental (based on `emissions`)
   - Accessibility (based on verified checklist items)
3. **Ranking (`rank.py`)**: Calculates a weighted score using user-defined axes weights, sorts descending, and applies data-state precedence for tie-breaking.
4. **Trade-offs**: Generates delta comparisons between the top option and the closest alternative.

## 2. Available Candidate Features
Available real features from the database:
- `cost_inr`
- `duration_minutes` / `distance_km`
- `emissions` (estimated via factor or route benchmark)
- `accessibility_items` and `sustainability_items` (including their strict 5-tier `data_state` labels)
- User-specified preference weights (`SearchWeights`)
- Categorical features: `city`, `star_rating`, `mode` (for transport)

## 3. Possible ML Target
The best ML target is predicting user conversion based on the existing `analytics_events` collection. 
We can construct session-level interactions where the target is `y = 1` if the event is `save`, `booking_start`, or `booking_complete`, and `y = 0` for mere `listing_impression` or `listing_open`. A pairwise learning-to-rank (BPR) or point-wise regression approach can be used to re-rank the final candidates.

## 4. Data Limitations
According to `DATA_MODEL.md`, the dataset is highly limited:
- **Synthetic Analytics**: Interaction data (`analytics_events`) is currently entirely synthetic and limited to 2-3 demo businesses.
- **Sparse Inventory**: Only ~20 properties exist (5 anchors, 10-15 budget, plus demo synthetic).
- **Conclusion**: There is insufficient legitimate data to train a real-world personalization model. The ML model MUST be treated as an experimental prototype using synthetic interactions. Model performance will reflect learning of synthetic patterns, not real human behavior.

## 5. Fallback Behavior
The ML re-ranker will act as a strict optional layer at the end of `rank.py`.
- If the model is missing, fails inference, or `ML_ENABLED=False` is set in configuration, the system will transparently return the standard rule-based ranking list.
- Hard filters, accessibility truth, missing data (`not_verified`), and data-state badges are untouched and remain authoritative.
