# Real Property Sources & Evidence Tracking

This document establishes the audit trail and ground truth for all real Indian anchor properties used in the Green & Inclusive Travel platform (Task D20). Every accessibility and sustainability claim in the database must be traceable to the verified primary or secondary sources documented below.

---

## 1. Ground Rules & Data State Governance

Per `AGENTS.md` and `docs/DATA_MODEL.md`, the platform strictly adheres to a 5-state data integrity model:
- `verified`: Formally audited by accredited third-party certification bodies (e.g. USGBC LEED, EarthCheck, IGBC).
- `reported`: Self-reported by the property via official hotel portals or brand websites.
- `community_confirmed`: Validated by at least $n \ge 3$ travelers through community reporting.
- `not_verified`: No reliable, verifiable evidence exists. **Must have `value: null` or omitted**. Never inferred from star ratings, pricing, photos, or generic marketing language.
- `demo_synthetic`: Strictly reserved for rehearsed demo-only fallback items; never mixed into real anchor claims.

### Prototype Translation Quality Notice (Task D10 & D20)
Dynamic seed translations (`_en`, `_hi`, `_mr`) for property names, amenities, and descriptions are prototype-grade machine/assisted translations created for demonstration and localization purposes. They are not professional or native-certified legal translations.

---

## 2. Anchor Property Dossiers

### Property 1: Andaz Delhi (Aerocity)

- **City / State:** New Delhi, Delhi (Aerocity)
- **Official Property Page:** [https://www.hyatt.com/andaz/delaz-andaz-delhi](https://www.hyatt.com/andaz/delaz-andaz-delhi)
- **Research Date:** 2026-09-26

#### Accessibility Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| Step-free public entrance | Yes | `reported` | Hyatt Official Hotel Amenities / Expedia Hotel Spec | Ground-level lobby entrance with automatic sliding doors and level threshold. |
| Wheelchair-accessible elevators | Yes | `reported` | Hyatt Official Amenities | Wide elevator cabins servicing all guest floors with lowered control buttons. |
| Dedicated accessible guest rooms | Yes | `reported` | Hyatt Official Booking / Hotelier India | Hotel maintains 2 specifically designed accessible rooms with wider door clearances. |
| Roll-in shower | Yes | `reported` | Hyatt Official Room Specs ("Accessible Room") | Roll-in shower stall with level entry and wall-mounted shower seat. |
| Bathroom grab rails | Yes | `reported` | Hyatt Official Specs / Momondo Room Amenities | Grab rails installed beside toilet and inside shower enclosure. |
| Visual / strobe fire alarms | Insufficient | `not_verified` | None | Strobe alarm specifications are not documented on public channels. Value must remain `null`. |
| Braille signage in all elevators | Insufficient | `not_verified` | None | Tactile/Braille markings in elevators cannot be confirmed from primary sources. |

#### Sustainability Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| LEED Gold Certification | Yes | `verified` | U.S. Green Building Council (USGBC) / Juniper Hotels ESG Disclosures | Certified LEED Gold for Building Design & Construction (BD+C). |
| Zero single-use plastic water bottles | Yes | `reported` | Hotelier India / Juniper Hotels Sustainability Report | On-site automated water bottling plant providing purified still/sparkling water in reusable glass bottles. |
| On-site renewable solar generation | Yes | `reported` | Juniper Hotels ESG Disclosures | On-site rooftop solar PV modules contributing ~2% of total hotel power; balance supplemented by hydro procurement. |
| 100% wastewater recycling | Yes | `reported` | Hotelier India Sustainability Feature | Zero-discharge facility operating on-site sewage treatment plant (STP) for cooling towers and landscaping. |
| Organic kitchen waste composting | Yes | `reported` | Hotelier India | Automated wet garbage composting converting food waste into organic landscape compost within 24 hours. |

#### Known Limitations & Ambiguities
- Only two rooms are formally configured as accessible; availability is constrained and requires direct advance confirmation.
- Clear door opening widths (exact inches) are not published on the public website.

---

### Property 2: ITC Maratha

- **City / State:** Mumbai, Maharashtra (Andheri East / International Airport zone)
- **Official Property Page:** [https://www.itchotels.com/in/en/itcmaratha-mumbai](https://www.itchotels.com/in/en/itcmaratha-mumbai)
- **Research Date:** 2026-09-26

#### Accessibility Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| 32-inch wide doorway clearances | Yes | `reported` | Marriott / ITC Official Accessibility Disclosure | Published spec: Accessible guest rooms feature minimum 32-inch clear width doors. |
| Roll-in shower with grab bars | Yes | `reported` | ITC / Marriott Hotel Accessibility Profile | Bathroom equipped with step-free roll-in shower and secure grab rails. |
| Wheelchair-height toilets | Yes | `reported` | ITC / Marriott Hotel Accessibility Profile | Toilet seat height engineered to ADA/accessible standards with adjacent support bar. |
| Accessible path from entrance to all key amenities | Yes | `reported` | ITC Hotels Accessibility Spec | Continuous step-free path from main entrance to front desk, restaurants, business center, and meeting rooms. |
| Wheelchair-accessible self-parking | Yes | `reported` | Marriott Property Profile | Dedicated accessible parking stalls and van-accessible parking spaces. |
| Accessible airport shuttle vehicle | Insufficient | `not_verified` | None | Airport transfer vehicles are standard luxury sedans; wheelchair lift vehicles are not confirmed. Kept `null`. |
| Hoist / pool lift | Insufficient | `not_verified` | None | Swimming pool has ramped access to deck, but mechanical pool hoist is unconfirmed. |

#### Sustainability Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| LEED Platinum Certification | Yes | `verified` | USGBC Certification Registry / ITC "Responsible Luxury" | Certified LEED Platinum under Existing Buildings: Operations and Maintenance (EB:OM). |
| LEED Zero Carbon Certification | Yes | `verified` | USGBC LEED Zero Program Registry | Officially certified LEED Zero Carbon for net-zero operational carbon emissions. |
| LEED Zero Water Certification | Yes | `verified` | USGBC LEED Zero Program Registry | Officially certified LEED Zero Water for 100% water offset and recycling. |
| Renewable energy usage (Wind) | Yes | `reported` | ITC Sustainability Report / Hotelier India | Captive wind farm energy powers significant share of hotel electricity requirements. |
| Single-use plastic mitigation | Yes | `reported` | ITC "Responsible Luxury" Disclosures | "SunyaAqua" in-house purified water in reusable glass bottles; bamboo and bio-plastic room amenities. |

#### Known Limitations & Ambiguities
- While paths between public spaces are step-free, certain heritage-themed exterior courtyard areas may require staff assistance.

---

### Property 3: ITC Grand Goa Resort & Spa

- **City / State:** Cansaulim, Goa (Arossim Beach)
- **Official Property Page:** [https://www.itchotels.com/in/en/itcgrandgoa-goa](https://www.itchotels.com/in/en/itcgrandgoa-goa)
- **Research Date:** 2026-09-26

#### Accessibility Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| Accessible guest rooms with roll-in shower | Yes | `reported` | Marriott / ITC Grand Goa Accessibility Spec | Dedicated mobility-accessible rooms featuring roll-in showers with adjustable handheld wands. |
| Non-slip grab rails in bathroom | Yes | `reported` | ITC Official Room Specs | Grab rails mounted adjacent to toilet and inside shower area. |
| Step-free access to public facilities | Yes | `reported` | ITC Grand Goa Property Guide | Paved ramps connecting reception, restaurants, ballroom, and poolside deck. |
| Wheelchair-accessible parking | Yes | `reported` | Marriott Property Spec | On-site accessible self-parking and valet parking for modified vehicles. |
| Beach wheelchair / matting to water line | Insufficient | `not_verified` | None | Direct beach sand pathway does not have permanent mobi-matting or beach wheelchairs documented. Must stay `not_verified`. |
| Tactile floor guidance pathways | Insufficient | `not_verified` | None | Resort pathways are paved stone without tactile ground indicators. |

#### Sustainability Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| LEED Platinum Certification | Yes | `verified` | USGBC / ITC Hotels Official Release | First resort in India to achieve LEED Platinum certification from USGBC. |
| SunyaAqua Zero-Mile Water | Yes | `reported` | ITC Responsible Luxury Program | On-site water purification and glass bottling plant eliminating commercial plastic water bottles. |
| Elimination of single-use plastic room amenities | Yes | `reported` | Hospitality Biz / ITC Disclosures | Bamboo toothbrushes, wooden combs, paper/cornstarch wrappers, and refillable bathroom dispensers. |
| Local food sourcing initiative | Yes | `reported` | ITC WelcomEnviron Audited Program | Sourcing indigenous Goan agricultural produce within regional radius to minimize food miles. |

#### Known Limitations & Ambiguities
- Property is spread across a 45-acre village-style campus. Electric golf buggies are used for transfer, but standard buggies lack ramp boarding; wheelchair users must transfer into buggy seat or use paved walkways.

---

### Property 4: Lemon Tree Premier, Delhi Airport

- **City / State:** New Delhi, Delhi (Aerocity)
- **Official Property Page:** [https://www.lemontreehotels.com/lemon-tree-premier/delhi/delhi-airport](https://www.lemontreehotels.com/lemon-tree-premier/delhi/delhi-airport)
- **Research Date:** 2026-09-26

#### Accessibility Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| Dedicated "Universally Accessible Room" | Yes | `reported` | Lemon Tree Hotels Official Room Directory | Custom room category engineered specifically for differently-abled guests. |
| Wide doorway clearance | Yes | `reported` | Lemon Tree Official Spec Sheet | Extra-wide guest room entrance and bathroom doors accommodating standard wheelchairs. |
| Low-height vanity counters | Yes | `reported` | Lemon Tree Accessibility Standards | Lowered bathroom washbasin and mirror accessible from a seated position. |
| Toilet grab bars | Yes | `reported` | Lemon Tree Amenities / Hotels.com Verification | Sturdy grab rails positioned alongside the commode. |
| Emergency pull cords in bathroom | Yes | `reported` | Lemon Tree Accessibility Directory | Emergency assistance pull cords installed near floor level in bathroom. |
| Roll-in shower (zero threshold) | Insufficient | `not_verified` | None | While shower area has grab bars, published specifications do not confirm a completely flush zero-threshold curb. Retained as `not_verified`. |
| Vibrating pillow alarm | Insufficient | `not_verified` | None | Sensory assistive technology is not listed. |

#### Sustainability Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| IGBC Green Building Certification | Yes | `verified` | Indian Green Building Council (IGBC) / Lemon Tree ESG Disclosure | Portfolio-wide green building certification across owned hotels under IGBC standards. |
| Zero single-use plastic in guest rooms | Yes | `reported` | Lemon Tree Hotels ESG Report (2026) | Replaced plastic bottles, toiletries, and single-use packaging across guest rooms. |
| On-site sewage treatment & water reuse | Yes | `reported` | Lemon Tree Annual Sustainability Filing | Secondary treated water used for air-conditioning cooling towers and landscaping. |
| Renewable energy usage | Yes | `reported` | Lemon Tree Corporate ESG Task Force | Procurement of solar/wind power fulfilling ~50% of operational electricity across owned portfolio. |

#### Known Limitations & Ambiguities
- Low/midscale business tier with limited accessible room inventory (typically 1–2 rooms per property).
- Wheelchair access to certain auxiliary facilities (e.g. gym equipment) is not audited.

---

### Property 5: Alila Diwa Goa

- **City / State:** Majorda, South Goa
- **Official Property Page:** [https://www.hyatt.com/alila/goadi-alila-diwa-goa](https://www.hyatt.com/alila/goadi-alila-diwa-goa)
- **Research Date:** 2026-09-26

#### Accessibility Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| Dedicated ADA-friendly suite / accessible rooms | Yes | `reported` | Hyatt Room Directory / Alila Diwa Goa Booking Portal | Explicitly cataloged accessible room category with step-free entrance. |
| Roll-in shower | Yes | `reported` | Hyatt Official Room Specifications | Accessible bathroom features level-entry roll-in shower. |
| Step-free circulation paths throughout resort | Yes | `reported` | Expedia Hotel Specs / Alila Resort Guide | Paved paths connect guest suites, infinity pool, restaurants, and main lobby. |
| Elevator access | Yes | `reported` | Hyatt Amenities | Elevators connect upper-level guest wings and public dining terraces. |
| Roll-in bathtub with hoist | Insufficient | `not_verified` | None | Deep soaking tubs are featured in luxury suites, but no accessibility hoists exist. |
| Audio induction loops at concierge | Insufficient | `not_verified` | None | Hearing loop technology is not documented on property. |

#### Sustainability Evidence
| Claim / Feature | Supported? | Data-State Implication | Source | Evidence / Notes |
|---|---|---|---|---|
| EarthCheck Certification | Yes | `verified` | EarthCheck Sustainable Tourism Registry | Rigorous science-backed benchmarking for carbon, energy, and water efficiency under EarthCheck standards. |
| In-house automated water bottling plant | Yes | `reported` | Hyatt Official Press Release / Hotelier India | First hotel in Goa to implement automated glass water bottling (Boon/WaterCube system), eliminating ~350,000 plastic bottles/year. |
| Bulk refillable bath amenities | Yes | `reported` | Hyatt Environmental Initiatives | Metal dispensers replacing miniature plastic shampoo and conditioner bottles. |
| Indigenous laterite stone architecture | Yes | `reported` | The Organic Magazine / Architectural Digest India | Sustainable design utilizing local brick-red laterite stone and preserved tree canopies to minimize heat gain and embodied carbon. |
| Areca palm leaf biodegradable catering | Yes | `reported` | TradeLink Media Hospitality Review | Compostable tableware made from naturally fallen Areca palm leaves used for outdoor events. |

#### Known Limitations & Ambiguities
- Property is surrounded by natural paddy fields. Certain nature trail extensions off the paved paths are unpaved dirt and may be inaccessible to motorized or narrow-wheel wheelchairs, especially during monsoon seasons.

---

## 3. Real Budget Properties (Honest Incomplete / Unverified Baseline)

Per Task D2, 12 real hospitality properties across Delhi, Mumbai, and Goa were researched to provide representative budget inventory. In adherence to Rule 1 ("never convert missing data into a score or estimate"), accessibility and sustainability items lacking primary audit verification are strictly recorded as `data_state: "not_verified"` with `value: null`.

| Property Name | City | Estimated Tariff | Verified Amenities (`reported`) | Source | Unverified Claims (`not_verified`, `value: null`) |
|---|---|---|---|---|---|
| **Hotel City Star** | Delhi (Paharganj) | ₹2,800 | `step_free_entrance`, `elevator_access` | Official portal (hotel-citystar.com) & booking specifications | `roll_in_shower`, `grab_rails`, `solar_power`, `waste_management` |
| **Bloomrooms @ Janpath** | Delhi (Connaught Place) | ₹4,600 | `elevator_access` | Staybloom official directory / Expedia specs | `step_free_entrance`, `roll_in_shower`, `grab_rails`, `solar_power` |
| **Hotel Tara Palace** | Delhi (Chandni Chowk) | ₹2,200 | None verified | MakeMyTrip / Tripadvisor listings | `step_free_entrance`, `elevator_access`, `roll_in_shower`, `grab_rails` |
| **Zostel Delhi** | Delhi (Paharganj) | ₹1,800 | None verified | Zostel official portal | `step_free_entrance`, `elevator_access`, `roll_in_shower` |
| **Hotel Suba Palace** | Mumbai (Colaba) | ₹4,800 | `step_free_entrance`, `elevator_access` | Suba Hotels directory / Booking.com | `roll_in_shower`, `grab_rails`, `solar_power` |
| **Residency Hotel Fort** | Mumbai (Fort) | ₹5,200 | `elevator_access` | Residency Hotels portal / Booking.com | `step_free_entrance`, `roll_in_shower`, `grab_rails`, `solar_power` |
| **Hotel City Point** | Mumbai (Dadar) | ₹3,200 | None verified | Justdial / MakeMyTrip verified listings | `step_free_entrance`, `elevator_access`, `roll_in_shower`, `solar_power` |
| **Abode Bombay** | Mumbai (Colaba) | ₹5,500 | `elevator_access` (vintage lift) | Abode Bombay official site | `step_free_entrance`, `roll_in_shower`, `grab_rails`, `solar_power` |
| **GTDC Miramar Residency** | Goa (Panaji) | ₹3,200 | `step_free_entrance`, `grab_rails` | GTDC Official / Goa News Hub Purple Fest Report | `roll_in_shower`, `elevator_access`, `solar_power` |
| **GTDC Calangute Residency** | Goa (Calangute) | ₹3,800 | None verified | Goa Tourism Development Corp (goa-tourism.com) | `step_free_entrance`, `roll_in_shower`, `grab_rails`, `solar_power` |
| **Santana Beach Resort** | Goa (Candolim) | ₹4,200 | None verified | Santana Beach Resort official site | `step_free_entrance`, `roll_in_shower`, `grab_rails`, `solar_power` |
| **Castle House Goa** | Goa (Calangute) | ₹2,400 | None verified | Agoda / MakeMyTrip listings | `step_free_entrance`, `roll_in_shower`, `grab_rails`, `solar_power` |

---

## 4. Demo Synthetic Property Rationale (Task D2 & D19)

- **Property:** `[DEMO SYNTHETIC] Palm Grove Accessible Stay` (`hotel_synthetic_001`)
- **City:** Goa
- **Tariff:** ₹2,900 / night
- **Data State:** `demo_synthetic`
- **Why Required:** The rehearsed demo flow evaluates a traveler requesting wheelchair accessibility (specifically requiring a roll-in shower) on a strict low budget (< ₹3,500). Across all researched real budget properties in Goa, roll-in shower specifications are not verifiable from public disclosures (`not_verified`). Without this single watermarked synthetic record, a hard-filter search on `budget_max <= 3500` + `accessibility_required: ["roll_in_shower"]` would yield 0 matches.
- **Labeling Rule:** The name is explicitly prefixed with `[DEMO SYNTHETIC]` in all three languages (`en`, `hi`, `mr`), carries `data_state: "demo_synthetic"`, and must visibly render the DEMO badge in all client views.

---

## 5. Summary Mapping Table for Seed Data (Task D2)

| Hotel ID | Property Name | Category | City | Accessibility Highlights | Sustainability Highlights | Primary `not_verified` Fields |
|---|---|---|---|---|---|---|
| `hotel_001` | **Andaz Delhi** | Anchor (Luxury) | Delhi | Roll-in shower, grab rails, step-free entry (`reported`) | LEED Gold (`verified`), in-house glass bottling (`reported`) | Visual strobe alarms, Braille signage |
| `hotel_002` | **ITC Maratha** | Anchor (Luxury) | Mumbai | 32" doorways, roll-in shower, grab rails (`reported`) | LEED Platinum, Zero Carbon, Zero Water (`verified`), wind energy (`reported`) | Accessible shuttle, pool hoist |
| `hotel_003` | **ITC Grand Goa** | Anchor (Luxury) | Goa | Roll-in shower, grab rails, ramped access (`reported`) | LEED Platinum (`verified`), SunyaAqua zero-mile water (`reported`) | Beach mobi-matting, tactile pathways |
| `hotel_004` | **Lemon Tree Premier** | Anchor (Midscale) | Delhi | Wide doorways, low vanity, grab rails, pull cord (`reported`) | IGBC Green Building (`verified`), 50% renewable power (`reported`) | Zero-threshold roll-in curb verification |
| `hotel_005` | **Alila Diwa Goa** | Anchor (Eco-Luxury) | Goa | ADA-suite, roll-in shower, step-free paths (`reported`) | EarthCheck (`verified`), automated glass bottling (`reported`) | Audio induction loop, unpaved paddy trails |
| `hotel_006`–`009` | 4 Budget Delhi Hotels | Budget | Delhi | Elevator access at City Star / Bloomrooms; otherwise unverified | None verified | Roll-in showers, grab rails, solar power |
| `hotel_010`–`013` | 4 Budget Mumbai Hotels | Budget | Mumbai | Elevator access at Suba Palace, Residency Fort, Abode; step-free at Suba | None verified | Roll-in showers, grab rails, solar power |
| `hotel_014`–`017` | 4 Budget Goa Hotels | Budget | Goa | Barrier-free ground entry & grab rails at GTDC Miramar; others unverified | None verified | Roll-in showers, elevators, solar power |
| `hotel_synthetic_001` | **Palm Grove Stay** | Demo Synthetic | Goa | Roll-in shower, grab rails, step-free (`demo_synthetic`) | Solar water heating (`demo_synthetic`) | None (clearly watermarked demo record) |

---

## 6. Verification Checklist for D2 Implementers

Before inserting any document into the `hotels` collection in `database/seed.py`:
1. Ensure every accessibility and sustainability item contains an explicit `data_state`.
2. Ensure all fields marked `not_verified` above have `value: null`.
3. Never set `data_state: "verified"` unless backed by the third-party certifications listed in column 6 above (USGBC, IGBC, EarthCheck).
4. Do not convert self-reported features into `verified` without external audit certificates.
5. All property names and descriptions must provide `translations: { "en": ..., "hi": ..., "mr": ... }` per `docs/DATA_MODEL.md`.

---

## 7. Transport Routes Evidence & Sourcing (Task D3)

- **Research Date:** 2026-09-26
- **Corridor Scope:** Mumbai ↔ Goa, Delhi ↔ Mumbai, Delhi ↔ Goa, and Goa intra-state transfers.

### Corridor Sourcing & Data Sources
| Route ID | Origin → Destination | Mode | Distance (km) | Duration (min) | Fare (INR) | Primary Source / Basis | Caveats & Variability |
|---|---|---|---|---|---|---|---|
| `route_001` | Mumbai → Goa | `train` | 586 | 465 | ₹1,815 | IRCTC Official Schedule (Train 22229 CSMT–MAO Vande Bharat Express) | Chair Car base fare; dynamic pricing and catering charges may vary seasonally. |
| `route_002` | Mumbai → Goa | `train` | 586 | 540 | ₹1,250 | IRCTC Official Schedule (Train 22119 Tejas Express / 3AC) | Standard 3AC / AC Chair Car fare. |
| `route_003` | Mumbai → Goa | `flight` | 435 | 165 | ₹4,200 | DGCA / Airline schedules (BOM–GOI/GOX nonstop); 75m airborne + 90m buffer | Fares subject to dynamic airline pricing; representative off-peak base fare. |
| `route_004` | Mumbai → Goa | `bus` | 560 | 780 | ₹1,100 | Intercity AC Multi-axle Sleeper operators (via NH 66) | Departure via highway pickup points; traffic delays on ghat sections may extend duration. |
| `route_005` | Mumbai → Goa | `car` | 550 | 600 | ₹6,500 | NH 66 driving distance, FASTag toll calculators, petrol estimate (~14 km/L) | Assumes solo private vehicle; fuel prices and toll rates fluctuate. |
| `route_006` | Delhi → Mumbai | `train` | 1,384 | 930 | ₹2,850 | IRCTC Official Schedule (Train 12952 Mumbai Rajdhani / 3AC) | Dynamic fare applies on Rajdhani routes. |
| `route_007` | Delhi → Mumbai | `flight` | 1,148 | 225 | ₹5,500 | DEL–BOM airline nonstop schedule; 135m airborne + 90m airport terminal buffer | Representative economy booking. |
| `route_008` | Delhi → Mumbai | `car` | 1,350 | 1,080 | ₹14,000 | NE4 (Delhi–Mumbai Expressway) route calculator, toll and fuel estimate | Highway construction stages and speed limits impact travel duration. |
| `route_009` | Delhi → Goa | `flight` | 1,515 | 250 | ₹6,800 | DEL–GOI/GOX nonstop commercial airline flights (160m flight + buffer) | High holiday surge during peak Goa tourist season (Dec–Jan). |
| `route_010` | Delhi → Goa | `train` | 1,910 | 1,740 | ₹3,100 | IRCTC Official Schedule (Train 12780 Goa Express / 3AC) | Long-distance transit subject to seasonal delays during winter fog in North India. |
| `route_011` | Madgaon → Panaji | `bus` | 34 | 55 | ₹80 | Kadamba Transport Corporation (KTC) Electric Low-Floor AC Shuttle | Fixed state transport tariff. |
| `route_012` | Dabolim → Panaji | `car` | 38 | 50 | ₹1,400 | Goa Airport Official Prepaid Taxi Counter published rate card | Airport counter fixed regulated rates. |

### Emissions Methodology & Standards
In strict accordance with `docs/IMPLEMENTATION_PLAN.md` (Section 3.4) and `AGENTS.md` (Rule 5):
1. **Formula-Based Estimation (`method: "estimated"`):**
   - Formula: $\text{CO}_{2}\text{e (kg)} = \text{distance\_km} \times \text{emission\_factor}$
   - Fixed prototype factors:
     - Domestic Flight: `0.15` kg CO2e / pass-km
     - Solo Car: `0.17` kg CO2e / pass-km
     - Bus: `0.05` kg CO2e / pass-km
     - Train: `0.03` kg CO2e / pass-km
2. **Route Benchmark Comparison (`method: "route_benchmark"`):**
   - Utilized only on high-volume commercial flight routes with established typical route baselines:
     - `route_003` (BOM–GOI): Typical route benchmark is `100.0` kg CO2e; newer fuel-efficient direct fleet option is modeled at `87.0` kg CO2e (`13.0%` reduction), directly reflecting the canonical specification in `docs/API_CONTRACT.md`.
     - `route_007` (DEL–BOM): Typical route benchmark is `172.2` kg CO2e; direct modern fleet option is modeled at `155.0` kg CO2e (`10.0%` reduction).
   - Rules: `benchmark_kg` and `reduction_pct` are never merged with formula-based `emission_factor` fields.

---

## 8. Experiences Sourcing (Task D4)

- **Research Date:** 2026-09-26
- **Scope:** 10 diverse experiences across Goa, Delhi, and Mumbai representing a mix of cultural, nature, and adventure activities.

### Sourced Experiences & Evidence

| Experience ID | City | Name | Accessibility | Environmental Impact | Source / Basis |
|---|---|---|---|---|---|
| `exp_001` | Goa | Accessible Beach Walk — Miramar | `step_free_path` (`community_confirmed`) | `low` (`reported`) | Miramar Beach pathways paved for Purple Fest accessibility initiative. |
| `exp_002` | Goa | Old Goa Heritage Walk | `not_verified` (`null`) | `not_verified` (`null`) | Standard walking tours via TripAdvisor / local guides; no formal accessibility audits found. |
| `exp_003` | Goa | Spice Plantation Tour | `partial_access` (`reported`) | `low` (`verified`) | Sahakari Spice Farm eco-tour credentials and self-reported ground access. |
| `exp_004` | Goa | Dudhsagar Waterfalls Jeep Safari | `not_verified` (`null`) | `high` (`community_confirmed`) | High vehicle emission zone; accessibility is physically demanding without specialized equipment. |
| `exp_005` | Delhi | Red Fort Wheelchair Tour | `step_free_path` (`verified`) | `not_verified` (`null`) | ASI (Archaeological Survey of India) accessible pathway infrastructure installed at Red Fort. |
| `exp_006` | Delhi | Chandni Chowk Food Walk | `not_verified` (`null`) | `not_verified` (`null`) | Narrow, crowded alleys inherently difficult to navigate; no verified audits. |
| `exp_007` | Delhi | Lodhi Gardens Picnic | `step_free_path` (`reported`) | `low` (`reported`) | Municipal maintained paved pathways suitable for walking and wheelchairs. |
| `exp_008` | Mumbai | Gateway of India Promenade | `step_free_path` (`reported`) | `not_verified` (`null`) | Flat, paved public square area surrounding the Gateway. |
| `exp_009` | Mumbai | Elephanta Caves Ferry & Tour | `not_verified` (`null`) | `not_verified` (`null`) | Ferry boarding and steep steps to caves present significant barriers; no official audits. |
| `exp_010` | Mumbai | Sanjay Gandhi National Park Safari | `not_verified` (`null`) | `low` (`reported`) | Electric bus safaris exist but wheelchair access/ramps onto the buses are not officially verified. |
