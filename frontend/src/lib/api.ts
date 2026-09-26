// Single source of truth for all fetch calls — must match docs/API_CONTRACT.md
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

export interface NLUExtractedData {
  origin?: string;
  destination?: string;
  adult_count?: number;
  children_count?: number;
  senior_count?: number;
  accessibility_flags?: string[];
  accessibility_required?: string[];
  budget_max?: number;
  time_max_hours?: number;
  date?: string;
  nights?: number;
}

export interface NLUMissingOrAmbiguousItem {
  field: string;
  prompt: string;
}

export interface NLUExtractResponse {
  extracted: NLUExtractedData;
  missing_or_ambiguous?: NLUMissingOrAmbiguousItem[];
}

/**
 * Calls POST /api/nlu/extract with the user's natural language trip text.
 * Strictly adheres to docs/API_CONTRACT.md.
 */
export async function extractTripNLU(text: string): Promise<NLUExtractResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
    signal: controller.signal,
  };

  try {
    // First try the configured API_BASE_URL
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/nlu/extract`, requestOptions);
    } catch (primaryErr) {
      // If primary URL failed (e.g. backend at port 8000 offline in local dev), try local relative /api/nlu/extract
      if (API_BASE_URL !== "" && API_BASE_URL !== window.location.origin) {
        response = await fetch("/api/nlu/extract", requestOptions);
      } else {
        throw primaryErr;
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NLU extraction server returned status ${response.status}`);
    }

    const data: NLUExtractResponse = await response.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("NLU extraction timed out");
    }
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Transport Search API (A10)
// -----------------------------------------------------------------------------

export interface TransportSearchRequest {
  origin: string;
  destination: string;
  budget_max: number;
  time_max_hours: number;
  accessibility_required: string[];
  weights: {
    environmental: number;
    accessibility: number;
    affordability: number;
    convenience: number;
  };
  include_unverified: boolean;
}

export type EmissionsData =
  | { method: 'estimated'; co2e_kg: number; distance_km: number; emission_factor: number; }
  | { method: 'route_benchmark'; co2e_kg: number; benchmark_kg: number; reduction_pct: number; };

export interface AccessibilityData {
  value: string;
  data_state: string;
}

export interface TransportSegment {
  type: string;
  distance_m?: number;
  duration_minutes?: number;
  accessible?: boolean;
  data_state?: string;
}

export interface TransportResult {
  id: string;
  mode: string;
  cost_inr: number;
  duration_minutes: number;
  emissions?: EmissionsData;
  accessibility: AccessibilityData;
  personal_match_pct?: number;
  trade_off_summary: string[];
  segments: TransportSegment[];
}

export interface TransportSearchResponse {
  results: TransportResult[];
}

export async function searchTransport(payload: TransportSearchRequest): Promise<TransportSearchResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  };

  try {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/search/transport`, requestOptions);
    } catch (primaryErr) {
      if (API_BASE_URL !== "" && API_BASE_URL !== window.location.origin) {
        response = await fetch("/api/search/transport", requestOptions);
      } else {
        throw primaryErr;
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Transport search failed with status ${response.status}`);
    }

    const data: TransportSearchResponse = await response.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Transport search timed out");
    }
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Accommodation Search API (A14)
// -----------------------------------------------------------------------------

export interface AccommodationSearchRequest extends TransportSearchRequest {
  destination_city: string;
}

export interface AccommodationItem {
  label: string;
  data_state: string;
  value: any;
}

export interface AccommodationResult {
  id: string;
  translations: Record<string, { name: string; description?: string }>;
  city: string;
  price_inr_per_night: number;
  star_rating?: number;
  photos: string[];
  data_state: string;
  accessibility_items: AccommodationItem[];
  sustainability_items: AccommodationItem[];
}

export interface AccommodationSearchResponse {
  results: AccommodationResult[];
}

export async function searchAccommodation(payload: AccommodationSearchRequest): Promise<AccommodationSearchResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  };

  try {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/search/accommodation`, requestOptions);
    } catch (primaryErr) {
      if (API_BASE_URL !== "" && API_BASE_URL !== window.location.origin) {
        response = await fetch("/api/search/accommodation", requestOptions);
      } else {
        throw primaryErr;
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Since backend doesn't exist yet, we fall back to a mock if we get 404 or any other error.
      console.warn(`Accommodation search failed with status ${response.status}, falling back to mock.`);
      return getAccommodationMockData(payload);
    }

    const data: AccommodationSearchResponse = await response.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    // If it's not an abort, it's likely a network error (e.g. backend down/no endpoint), use mock
    if (err.name !== "AbortError") {
      console.warn("Accommodation search network error, falling back to mock.", err);
      return getAccommodationMockData(payload);
    }
    throw new Error("Accommodation search timed out");
  }
}

function getAccommodationMockData(payload: AccommodationSearchRequest): AccommodationSearchResponse {
  return {
    results: [
      {
        id: "mock_hotel_001",
        translations: {
          en: { name: "Accessible Resort & Spa" },
          hi: { name: "सुलभ रिज़ॉर्ट और स्पा" },
          mr: { name: "सुलभ रिसॉर्ट आणि स्पा" }
        },
        city: payload.destination_city || payload.destination,
        price_inr_per_night: 8500,
        star_rating: 4,
        photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"],
        data_state: "demo_synthetic",
        accessibility_items: [
          { label: "step_free_entrance", data_state: "reported", value: true },
          { label: "wheelchair_accessible_room", data_state: "demo_synthetic", value: true },
          { label: "roll_in_shower", data_state: "not_verified", value: null }
        ],
        sustainability_items: [
          { label: "solar_power", data_state: "not_verified", value: null },
          { label: "no_single_use_plastic", data_state: "demo_synthetic", value: true }
        ]
      },
      {
        id: "mock_hotel_002",
        translations: {
          en: { name: "City Center Budget Inn" }
          // intentionally missing HI/MR to test fallback
        },
        city: payload.destination_city || payload.destination,
        price_inr_per_night: 3200,
        star_rating: 3,
        photos: [],
        data_state: "not_verified",
        accessibility_items: [
          { label: "elevator", data_state: "not_verified", value: null }
        ],
        sustainability_items: []
      }
    ]
  };
}

// -----------------------------------------------------------------------------
// Listing Detail API (A15)
// -----------------------------------------------------------------------------

export interface ConfirmationData {
  item_label: string;
  confirmed_by_count: number;
  disputed_count: number;
}

export interface ListingDetailResponse {
  id: string;
  translations: Record<string, { name: string; description?: string }>;
  city: string;
  price_inr_per_night: number;
  star_rating?: number;
  photos: string[];
  data_state: string;
  accessibility_items: AccommodationItem[];
  sustainability_items: AccommodationItem[];
  confirmations: ConfirmationData[];
}

export async function getListingDetail(id: string): Promise<ListingDetailResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal: controller.signal,
  };

  try {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/listings/${id}`, requestOptions);
    } catch (primaryErr) {
      if (API_BASE_URL !== "" && API_BASE_URL !== window.location.origin) {
        response = await fetch(`/api/listings/${id}`, requestOptions);
      } else {
        throw primaryErr;
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Listing detail fetch failed with status ${response.status}, falling back to mock.`);
      return getListingDetailMockData(id);
    }

    const data: ListingDetailResponse = await response.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name !== "AbortError") {
      console.warn("Listing detail network error, falling back to mock.", err);
      return getListingDetailMockData(id);
    }
    throw new Error("Listing detail fetch timed out");
  }
}

function getListingDetailMockData(id: string): ListingDetailResponse {
  if (id === "mock_hotel_001") {
    return {
      id: "mock_hotel_001",
      translations: {
        en: { 
          name: "Accessible Resort & Spa",
          description: "A wonderful place to relax with fully accessible facilities for all guests."
        },
        hi: { 
          name: "सुलभ रिज़ॉर्ट और स्पा",
          description: "सभी मेहमानों के लिए पूरी तरह से सुलभ सुविधाओं के साथ आराम करने के लिए एक शानदार जगह।"
        },
        mr: { 
          name: "सुलभ रिसॉर्ट आणि स्पा",
          description: "सर्व अतिथींसाठी पूर्णपणे प्रवेशयोग्य सुविधांसह आराम करण्यासाठी एक अद्भुत ठिकाण."
        }
      },
      city: "Goa",
      price_inr_per_night: 8500,
      star_rating: 4,
      photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"],
      data_state: "demo_synthetic",
      accessibility_items: [
        { label: "step_free_entrance", data_state: "reported", value: true },
        { label: "wheelchair_accessible_room", data_state: "demo_synthetic", value: true },
        { label: "roll_in_shower", data_state: "not_verified", value: null }
      ],
      sustainability_items: [
        { label: "solar_power", data_state: "not_verified", value: null },
        { label: "no_single_use_plastic", data_state: "demo_synthetic", value: true }
      ],
      confirmations: [
        { item_label: "step_free_entrance", confirmed_by_count: 12, disputed_count: 0 },
        { item_label: "wheelchair_accessible_room", confirmed_by_count: 2, disputed_count: 1 }
      ]
    };
  }
  
  // Default fallback mock
  return {
    id: id,
    translations: {
      en: { 
        name: "Standard City Hotel",
        description: "A nice standard hotel with basic amenities in the city center."
      }
    },
    city: "Delhi",
    price_inr_per_night: 3200,
    star_rating: 3,
    photos: [],
    data_state: "not_verified",
    accessibility_items: [
      { label: "elevator", data_state: "not_verified", value: null }
    ],
    sustainability_items: [],
    confirmations: []
  };
}

// ---------------------------------------------------------------------------
// EXPLORE (A16)
// ---------------------------------------------------------------------------

export type ExperienceTranslation = {
  name: string;
  description: string;
};

export type ExperienceAttribute = {
  value: string | null;
  data_state: "verified" | "reported" | "community_confirmed" | "not_verified" | "demo_synthetic";
};

export interface ExperienceResult {
  id: string;
  translations: Record<string, ExperienceTranslation>;
  accessibility: ExperienceAttribute;
  environmental_impact: ExperienceAttribute;
  cost_inr: number;
  duration_minutes: number;
  distance_km: number;
  data_state: "verified" | "reported" | "community_confirmed" | "not_verified" | "demo_synthetic";
}

export interface ExploreResponse {
  results: ExperienceResult[];
}

export async function getExplore(city: string, abortSignal?: AbortSignal): Promise<ExploreResponse> {
  const requestOptions: RequestInit = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: abortSignal,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/explore/${encodeURIComponent(city)}`, requestOptions);
    if (!response.ok) {
      console.warn(`Explore API returned ${response.status}. Falling back to mock.`);
      return getExploreMockData(city);
    }
    return await response.json();
  } catch (err) {
    console.warn("Explore API failed. Falling back to mock.", err);
    return getExploreMockData(city);
  }
}

function getExploreMockData(city: string): ExploreResponse {
  return {
    results: [
      {
        id: "exp_001",
        translations: {
          en: { name: "Accessible beach walk — Miramar", description: "A fully step-free coastal experience." },
          mr: { name: "प्रवेशयोग्य समुद्रकिनारा चालणे — मिरामार", description: "पूर्णपणे पायरी-मुक्त किनारी अनुभव." }
          // hi missing to test English fallback
        },
        accessibility: { value: "step_free_path", data_state: "community_confirmed" },
        environmental_impact: { value: "low", data_state: "reported" },
        cost_inr: 0,
        duration_minutes: 60,
        distance_km: 2.1,
        data_state: "demo_synthetic"
      },
      {
        id: "exp_002",
        translations: {
          en: { name: "Old City Heritage Tour", description: "Guided tour through historic districts." },
          hi: { name: "पुराना शहर विरासत भ्रमण", description: "ऐतिहासिक जिलों के माध्यम से निर्देशित भ्रमण।" },
          mr: { name: "जुन्या शहराचा वारसा दौरा", description: "ऐतिहासिक जिल्ह्यांमधून मार्गदर्शित दौरा." }
        },
        accessibility: { value: null, data_state: "not_verified" },
        environmental_impact: { value: "medium", data_state: "reported" },
        cost_inr: 1500,
        duration_minutes: 180,
        distance_km: 5.5,
        data_state: "reported"
      },
      {
        id: "exp_003",
        translations: {
          // Missing all to test absolute fallback safety, or missing EN completely (should rarely happen)
          en: { name: "Nature Reserve Kayaking", description: "Silent kayaking through mangroves." }
        },
        accessibility: { value: "requires_transfer", data_state: "reported" },
        environmental_impact: { value: "zero", data_state: "verified" },
        cost_inr: 2500,
        duration_minutes: 120,
        distance_km: 3.0,
        data_state: "verified"
      }
    ]
  };
}

// -----------------------------------------------------------------------------
// Booking & Payments API (A18)
// -----------------------------------------------------------------------------

export interface CreateOrderRequest {
  amount_inr: number;
  currency: string;
  receipt_id: string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  payment_verified: boolean;
  reservation_status: 'simulated' | 'confirmed';
}

export async function createBookingOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  const requestOptions: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/booking/create-order`, requestOptions);
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Create order failed with status ${response.status}`);
    }
    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Create order timed out");
    }
    throw err;
  }
}

export async function verifyBookingPayment(payload: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  const requestOptions: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/booking/verify-payment`, requestOptions);
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Verify payment failed with status ${response.status}`);
    }
    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Verify payment timed out");
    }
    throw err;
  }
}
