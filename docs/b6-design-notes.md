# B6 Sustainability Design Notes

## Research Findings

| Source | Relevant UX pattern | Use in B6? | Why |
| ------ | ------------------- | ---------- | --- |
| Google Hotels | Explicit separation of self-reported practices from third-party eco-certifications. Categorization by energy, water, waste, and sourcing. | Yes | It clarifies that selecting a practice doesn't confer a certification badge, perfectly aligning with our data model's `reported` vs `verified` distinction. |
| Booking.com | Translating complex frameworks into understandable, specific property attributes (e.g., waste reduction rather than carbon accounting). | Yes | Keeps the onboarding fast and approachable for hospitality businesses without needing technical audits. |
| Green Key | Clear criteria statements with simple Yes/No/NA applicability. | Yes (Partially) | We will use independent checkboxes for specific practices, but avoid their heavy audit-style Yes/No requirement for every possible question to maintain B5's fast checklist pattern. |

## Application to B6

1. **Clear Feature Labels**: We will use specific practice labels like "Solar power" and "Local sourcing" rather than asking a generic "Are you sustainable?".
2. **Explanatory Helper Text**: We will provide a 1-line description of each practice so business owners understand what qualifies (e.g. "Energy-saving programs or carbon-free sources like solar").
3. **Self-Reported Transparency**: We will include the same prominent "Note" banner used in B5 to remind the user that this data is simply self-reported by the property and not a certification.
4. **No Aggregate Scoring**: We will avoid generating any "Eco Score" or "X% Sustainable" progress metric.
