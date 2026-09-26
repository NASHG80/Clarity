// Single source of truth for all fetch calls — must match docs/API_CONTRACT.md
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

// =============================================================================
// B2B — AI Inspection & Confirmation (C11/C13) & Photo Upload (B7/B8)
// =============================================================================

export interface PhotoUploadResponse {
  url: string;
  public_id: string;
  bucket: string;
}

/**
 * Proxies the photo to backend, which uploads to Cloudinary securely.
 * This ensures Cloudinary secrets are never exposed to the frontend.
 */
export const uploadPhotoToCloudinary = async (file: File, bucket: string): Promise<PhotoUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);

  const response = await fetch(`${API_BASE_URL}/api/business/upload-photo`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  return await response.json();
};

import { Detection } from '../b2b/components/onboarding/AiAnalysisStep';

// NOTE: These queries are temporary mock configuration for B8 and are NOT canonical project data.
// They serve as fallbacks because the actual backend query configuration is not yet implemented.
export const FALLBACK_QUERIES = [
  'wheelchair ramp',
  'handrail',
  'grab bar',
  'solar panel',
  'recycling bin'
];

const mockAttemptTracker: Record<string, number> = {};

/**
 * Mocks the POST /api/ai/inspect-property-image endpoint.
 * This is used because the backend endpoint does not exist yet.
 */
export const mockInspectPropertyImage = async (photoId: string, bucket: string): Promise<Detection[]> => {
  // Simulate GPU inference latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  mockAttemptTracker[photoId] = (mockAttemptTracker[photoId] || 0) + 1;
  
  // Deterministic failure scenario:
  // To demonstrate partial failure and independent retry, the 'parking' bucket will always 
  // fail on the first attempt, and succeed on the second attempt.
  if (bucket === 'parking' && mockAttemptTracker[photoId] === 1) {
    throw new Error('Simulated network timeout');
  }

  // Deterministic success scenario:
  // Return empty detections for 'room' to demonstrate successful empty analysis,
  // otherwise return a mocked detection.
  if (bucket === 'room') {
    return [];
  }

  return [
    { label: FALLBACK_QUERIES[0], bbox: [10, 10, 100, 100], confidence: 0.85 }
  ];
};

/**
 * Canonical request item for POST /api/ai/confirm-detections per docs/API_CONTRACT.md.
 * NOTE CONTRACT GAP: The contract specifies { label, confirmed, image_id }, but lacks
 * a unique detection_id. If an image contains multiple detections with the same label,
 * { label, image_id } cannot disambiguate them.
 */
export interface DetectionConfirmationItem {
  label: string;
  confirmed: boolean;
  image_id: string;
}

export interface ConfirmDetectionsResponse {
  success: boolean;
  confirmed_count: number;
  rejected_count: number;
  updated_checklist_items: string[];
}

let mockConfirmAttemptTracker = 0;

/**
 * Maps AI detection labels to canonical property accessibility/sustainability checklist keys.
 * Confirmed items update the matching item's data_state to "reported".
 */
export function mapDetectionLabelToChecklistKey(label: string): string | null {
  const normalized = label.toLowerCase().trim();
  if (normalized === 'wheelchair ramp') {
    return 'step_free_entrance';
  }
  if (normalized === 'grab bar') {
    return 'accessible_toilet';
  }
  if (normalized === 'solar panel') {
    return 'solar_power';
  }
  if (normalized === 'recycling bin') {
    return 'waste_program';
  }
  return null;
}

/**
 * Deterministic mock for POST /api/ai/confirm-detections.
 * Used when backend endpoint is not yet deployed.
 */
export const mockConfirmDetections = async (
  items: DetectionConfirmationItem[]
): Promise<ConfirmDetectionsResponse> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  mockConfirmAttemptTracker++;

  const shouldFailAlways = items.some(item => item.image_id === 'simulate_fail');
  const shouldFailOnce = items.some(item => item.image_id === 'fail_once') && mockConfirmAttemptTracker === 1;

  if (shouldFailAlways || shouldFailOnce) {
    throw new Error('Deterministic network timeout during confirmation submission. Please retry.');
  }

  const confirmedItems = items.filter(i => i.confirmed);
  const rejectedItems = items.filter(i => !i.confirmed);

  const updatedChecklistItems: string[] = [];
  confirmedItems.forEach(item => {
    const mapped = mapDetectionLabelToChecklistKey(item.label);
    if (mapped && !updatedChecklistItems.includes(mapped)) {
      updatedChecklistItems.push(mapped);
    }
  });

  return {
    success: true,
    confirmed_count: confirmedItems.length,
    rejected_count: rejectedItems.length,
    updated_checklist_items: updatedChecklistItems,
  };
};

/**
 * Calls POST /api/ai/confirm-detections per docs/API_CONTRACT.md.
 */
export const confirmDetections = async (
  items: DetectionConfirmationItem[]
): Promise<ConfirmDetectionsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/confirm-detections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ detections: items }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Transform backend schema to frontend expected format
      const updatedChecklistItems: string[] = [];
      (data.confirmed_labels || []).forEach((label: string) => {
        const mapped = mapDetectionLabelToChecklistKey(label);
        if (mapped && !updatedChecklistItems.includes(mapped)) {
          updatedChecklistItems.push(mapped);
        }
      });

      return {
        success: data.status === 'processed',
        confirmed_count: (data.confirmed_labels || []).length,
        rejected_count: (data.rejected_labels || []).length,
        updated_checklist_items: updatedChecklistItems
      };
    }

    if (response.status === 404 || response.status === 501) {
      console.warn(`POST /api/ai/confirm-detections returned ${response.status}. Falling back to deterministic mock.`);
      return await mockConfirmDetections(items);
    }

    throw new Error(`Confirmation request failed with status ${response.status}`);
  } catch (error: any) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('fetch failed') || error.message.includes('Network request failed'))) {
      console.warn('Backend server offline. Falling back to deterministic mock for POST /api/ai/confirm-detections.');
      return await mockConfirmDetections(items);
    }
    throw error;
  }
};

export type DataState = 'verified' | 'reported' | 'community_confirmed' | 'not_verified' | 'demo_synthetic';

export interface ListingFeatureItem {
  label: string;
  value: boolean | null;
  data_state: DataState;
}

export interface ListingPayload {
  _id?: string;
  name: string;
  city: string;
  price_inr_per_night: number | null;
  star_rating: number | null;
  accessibility_items: ListingFeatureItem[];
  sustainability_items: ListingFeatureItem[];
  data_state: 'reported' | 'demo_synthetic';
}

export interface ListingResponse extends ListingPayload {
  _id: string;
  translations?: Record<string, any>;
}

export const mockGetListing = async (id: string): Promise<ListingResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    _id: id,
    name: 'Mock Demo Listing',
    city: 'Goa',
    price_inr_per_night: 3000,
    star_rating: 3,
    accessibility_items: [],
    sustainability_items: [],
    data_state: 'demo_synthetic'
  };
};

export const mockCreateListing = async (payload: ListingPayload): Promise<ListingResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    ...payload,
    _id: `mock_listing_${Date.now()}`
  };
};

export const getListing = async (id: string): Promise<ListingResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/listings/${id}`);
    if (response.ok) {
      return await response.json();
    }
    if (response.status === 404 || response.status === 501) {
      return await mockGetListing(id);
    }
    throw new Error(`Failed to fetch listing with status ${response.status}`);
  } catch (error: any) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('fetch failed') || error.message.includes('Network request failed'))) {
      return await mockGetListing(id);
    }
    throw error;
  }
};

export const createListing = async (payload: ListingPayload): Promise<ListingResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return await response.json();
    }
    if (response.status === 404 || response.status === 501) {
      return await mockCreateListing(payload);
    }
    throw new Error(`Failed to create listing with status ${response.status}`);
  } catch (error: any) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('fetch failed') || error.message.includes('Network request failed'))) {
      return await mockCreateListing(payload);
    }
    throw error;
  }
};

export interface Opportunity {
  severity: string;
  title: string;
  estimate?: string;
  suggested_action: string;
  is_demo_data?: boolean;
}

export interface OpportunitiesResponse {
  opportunities: Opportunity[];
}

export const mockGetOpportunities = async (businessId: string): Promise<OpportunitiesResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  if (businessId === 'error_case') {
    throw new Error('Deterministic network timeout');
  }

  if (businessId === 'empty_case') {
    return { opportunities: [] };
  }

  return {
    opportunities: [
      {
        severity: "red",
        title: "Food Waste",
        estimate: "18 kg/day",
        suggested_action: "Reduce buffet production by ~10%",
        is_demo_data: true
      },
      {
        severity: "red",
        title: "Demand gap: roll-in shower",
        suggested_action: "Confirm or add this feature — 214 recent searches",
        is_demo_data: true
      },
      {
        severity: "yellow",
        title: "Water consumption",
        estimate: "220L / guest night",
        suggested_action: "Consider low-flow fixtures in common areas",
        is_demo_data: true
      }
    ]
  };
};

export const getOpportunities = async (businessId: string): Promise<OpportunitiesResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/business/${businessId}/opportunities`);
    if (response.ok) {
      return await response.json();
    }
    if (response.status === 404 || response.status === 501) {
      return await mockGetOpportunities(businessId);
    }
    throw new Error(`Failed to fetch opportunities with status ${response.status}`);
  } catch (error: any) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('fetch failed') || error.message.includes('Network request failed'))) {
      return await mockGetOpportunities(businessId);
    }
    throw error;
  }
};

export interface AnalyticsSignal {
  type: string;
  text: string;
}

export interface AnalyticsFunnel {
  listing_impressions?: number;
  listing_opens?: number;
  detail_opens?: number;
  saves?: number;
  booking_starts?: number;
  bookings?: number;
}

export interface AnalyticsResponse {
  period: string;
  is_demo_data?: boolean;
  funnel: AnalyticsFunnel;
  signals?: AnalyticsSignal[];
}

export const mockGetAnalytics = async (businessId: string): Promise<AnalyticsResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  if (businessId === 'error_case') {
    throw new Error('Deterministic network timeout');
  }

  if (businessId === 'empty_case') {
    return {
      period: 'this_week',
      is_demo_data: true,
      funnel: {
        listing_impressions: 0,
        listing_opens: 0,
        detail_opens: 0,
        saves: 0,
        booking_starts: 0,
        bookings: 0
      }
    };
  }

  return {
    period: 'this_week',
    is_demo_data: true,
    funnel: {
      listing_impressions: 1284,
      listing_opens: 906,
      detail_opens: 542,
      saves: 87,
      booking_starts: 64,
      bookings: 31
    },
    signals: [
      {
        type: "drop_off_correlation",
        text: "Users who viewed accessibility information showed a higher drop-off."
      }
    ]
  };
};

export const getAnalytics = async (businessId: string): Promise<AnalyticsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/business/${businessId}/analytics`);
    if (response.ok) {
      return await response.json();
    }
    if (response.status === 404 || response.status === 501) {
      return await mockGetAnalytics(businessId);
    }
    throw new Error(`Failed to fetch analytics with status ${response.status}`);
  } catch (error: any) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('fetch failed') || error.message.includes('Network request failed'))) {
      return await mockGetAnalytics(businessId);
    }
    throw error;
  }
};

export interface AIAnalyticsInsight {
  title: string;
  description: string;
}

export interface AIAnalyticsSummaryResponse {
  summary: string;
  key_findings: AIAnalyticsInsight[];
  demand_insights: AIAnalyticsInsight[];
  data_gaps: AIAnalyticsInsight[];
  opportunities: AIAnalyticsInsight[];
  next_actions: AIAnalyticsInsight[];
}

export const mockGetAiAnalyticsSummary = async (businessId: string): Promise<AIAnalyticsSummaryResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (businessId === 'error_case') {
    throw new Error('Deterministic network timeout');
  }

  return {
    summary: "Your property is seeing strong demand for accessibility, but missing verification is causing detail viewers to drop off.",
    key_findings: [
      { title: "High Conversion to Detail", description: "70.5% of listing opens result in a detail view." },
      { title: "Drop-off at Save", description: "Only 16% of detail viewers save the listing." }
    ],
    demand_insights: [
      { title: "Step-free Entrance", description: "Most searched accessibility requirement in your area." }
    ],
    data_gaps: [
      { title: "Roll-in Shower", description: "214 recent searches while your property remains not verified." }
    ],
    opportunities: [
      { title: "Confirm Accessibility", description: "Add roll-in shower info to capture lost demand." }
    ],
    next_actions: [
      { title: "Update Listing", description: "Go to Onboarding and complete the Accessibility section." }
    ]
  };
};

export const getAiAnalyticsSummary = async (businessId: string, period: string = 'this_week'): Promise<AIAnalyticsSummaryResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/business/${businessId}/analytics/ai-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ period }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    if (response.status === 404 || response.status === 501) {
      return await mockGetAiAnalyticsSummary(businessId);
    }
    throw new Error(`Failed to fetch AI analytics with status ${response.status}`);
  } catch (error: any) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('fetch failed') || error.message.includes('Network request failed'))) {
      return await mockGetAiAnalyticsSummary(businessId);
    }
    throw error;
  }
};

export interface DemandCount {
  label: string;
  count: number;
}

export interface DemandGap extends DemandCount {
  property_data_state: string;
}

export interface DemandResponse {
  period: string;
  is_demo_data?: boolean;
  requirement_search_counts: DemandCount[];
  gaps: DemandGap[];
}

export const mockGetDemand = async (businessId: string): Promise<DemandResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  if (businessId === 'error_case') {
    throw new Error('Deterministic network timeout');
  }

  if (businessId === 'empty_case') {
    return {
      period: 'this_week',
      is_demo_data: true,
      requirement_search_counts: [],
      gaps: []
    };
  }

  return {
    period: 'this_week',
    is_demo_data: true,
    requirement_search_counts: [
      { label: "step_free_entrance", count: 382 },
      { label: "roll_in_shower", count: 214 },
      { label: "accessible_parking", count: 176 },
      { label: "vegetarian_food", count: 98 },
      { label: "waste_recycling", count: 42 }
    ],
    gaps: [
      { label: "roll_in_shower", count: 214, property_data_state: "not_verified" }
    ]
  };
};

export const getDemand = async (businessId: string): Promise<DemandResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/business/${businessId}/demand`);
    if (response.ok) {
      return await response.json();
    }
    if (response.status === 404 || response.status === 501) {
      return await mockGetDemand(businessId);
    }
    throw new Error(`Failed to fetch demand with status ${response.status}`);
  } catch (error: any) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('fetch failed') || error.message.includes('Network request failed'))) {
      return await mockGetDemand(businessId);
    }
    throw error;
  }
};

export interface VerificationSubmission {
  id: string;
  item_label: string;
  submission_type: string;
  created_at: string;
  property_data_state: string;
}

export interface VerificationInboxResponse {
  pending_submissions: VerificationSubmission[];
  is_demo_data?: boolean;
}

export interface VerificationResponsePayload {
  success: boolean;
  status: string;
}

// In-memory store for demo
let mockInboxSubmissions: VerificationSubmission[] = [
  {
    id: "sub_001",
    item_label: "roll_in_shower",
    submission_type: "confirmation",
    created_at: "2026-09-26T10:00:00Z",
    property_data_state: "not_verified"
  },
  {
    id: "sub_002",
    item_label: "step_free_entrance",
    submission_type: "correction",
    created_at: "2026-09-25T14:30:00Z",
    property_data_state: "reported"
  }
];

export const mockGetVerificationInbox = async (businessId: string): Promise<VerificationInboxResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (businessId === 'error_case') {
    throw new Error('Deterministic network timeout');
  }

  if (businessId === 'empty_case') {
    return { pending_submissions: [], is_demo_data: true };
  }

  return {
    pending_submissions: [...mockInboxSubmissions],
    is_demo_data: true
  };
};

export const getVerificationInbox = async (businessId: string): Promise<VerificationInboxResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/business/${businessId}/verification-inbox`);
    if (response.ok) {
      return await response.json();
    }
    if (response.status === 404 || response.status === 501) {
      return await mockGetVerificationInbox(businessId);
    }
    throw new Error(`Failed to fetch verification inbox with status ${response.status}`);
  } catch (error: any) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('fetch failed') || error.message.includes('Network request failed'))) {
      return await mockGetVerificationInbox(businessId);
    }
    throw error;
  }
};

export const mockRespondToVerificationSubmission = async (businessId: string, submissionId: string, action: 'accept' | 'dispute'): Promise<VerificationResponsePayload> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  if (businessId === 'error_case') {
    throw new Error('Deterministic network timeout');
  }

  mockInboxSubmissions = mockInboxSubmissions.filter(sub => sub.id !== submissionId);

  return {
    success: true,
    status: action === 'accept' ? 'accepted' : 'disputed'
  };
};

export const respondToVerificationSubmission = async (businessId: string, submissionId: string, action: 'accept' | 'dispute'): Promise<VerificationResponsePayload> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/business/${businessId}/verification-inbox/${submissionId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    
    if (response.ok) {
      return await response.json();
    }
    if (response.status === 404 || response.status === 501) {
      return await mockRespondToVerificationSubmission(businessId, submissionId, action);
    }
    throw new Error(`Failed to respond to submission with status ${response.status}`);
  } catch (error: any) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('fetch failed') || error.message.includes('Network request failed'))) {
      return await mockRespondToVerificationSubmission(businessId, submissionId, action);
    }
    throw error;
  }
};

// =============================================================================
// B2C — NLU Extraction (A7)
// =============================================================================

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
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/nlu/extract`, requestOptions);
    } catch (primaryErr) {
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

// =============================================================================
// B2C — Transport Search (A10)
// =============================================================================

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

// =============================================================================
// B2C — Accommodation Search (A14)
// =============================================================================

export interface AccommodationSearchRequest extends TransportSearchRequest {
  destination_city: string;
  // Optional trip dates — when supplied, used for live hotel search (SerpAPI)
  // instead of the default +7/+9 day fallback. Backwards-compatible.
  arrival_date?: string;           // YYYY-MM-DD
  departure_date?: string;         // YYYY-MM-DD
  // Soft ranking preference — never a hard filter; not_verified items never boosted
  sustainability_preferred?: string[];
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
      console.warn(`Accommodation search failed with status ${response.status}, falling back to mock.`);
      return getAccommodationMockData(payload);
    }

    const data: AccommodationSearchResponse = await response.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
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

// =============================================================================
// B2C — Listing Detail (A15)
// =============================================================================

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
  amenities?: string[];
  rooms?: any[];
  rules?: any;
  address?: string;
  location?: { lat: number; lng: number };
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

// =============================================================================
// B2C — Explore (A16)
// =============================================================================

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

function getExploreMockData(_city: string): ExploreResponse {
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

// =============================================================================
// B2C — Booking & Payments (A18)
// =============================================================================

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

// =============================================================================
// B2C — Customer Dashboard Trip API
// =============================================================================

export interface TripWeights {
  environmental: number;
  accessibility: number;
  affordability: number;
  convenience: number;
}

export type DashboardPhase =
  | 'EMPTY'
  | 'BASICS_SAVED'
  | 'ACCESSIBILITY'
  | 'SUSTAINABILITY'
  | 'PRIORITIES'
  | 'SEARCHING'
  | 'RESULTS'
  | 'ERROR';

export interface TripState {
  trip_id: string;
  user_id: string;
  destination: string;
  adults: number;
  children: number;
  rooms: number;
  arrival_date: string;
  departure_date: string;
  accessibility_required: string[];
  sustainability_preferred: string[];
  budget_max: number | null;
  weights: TripWeights;
  include_unverified: boolean;
  phase: DashboardPhase;
  last_search_result_count: number | null;
  created_at: string;
  last_updated: string;
}

export interface TripCreatePayload {
  user_id: string;
  destination: string;
  adults: number;
  children: number;
  rooms: number;
  arrival_date: string;
  departure_date: string;
}

export interface TripCreateResponse {
  trip_id: string;
  phase: DashboardPhase;
  created_at: string;
}

export interface TripInteraction {
  interaction_id: string;
  event_type: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface TripInteractionPayload {
  user_id: string;
  session_id: string;
  event_type: string;
  payload: Record<string, unknown> & { client_event_id: string };
}

export async function createTrip(payload: TripCreatePayload): Promise<TripCreateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/trips/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Create trip failed: ${response.status}`);
  }
  return response.json();
}

export async function getActiveTrip(userId: string): Promise<{ trip: TripState | null }> {
  const response = await fetch(`${API_BASE_URL}/api/trips/active?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Get active trip failed: ${response.status}`);
  }
  return response.json();
}

export async function patchTripState(
  tripId: string,
  partial: Partial<TripState> & { user_id: string }
): Promise<{ trip_id: string; last_updated: string }> {
  const response = await fetch(`${API_BASE_URL}/api/trips/${encodeURIComponent(tripId)}/state`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Patch trip state failed: ${response.status}`);
  }
  return response.json();
}

export async function postTripInteraction(
  tripId: string,
  payload: TripInteractionPayload
): Promise<{ interaction_id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/api/trips/${encodeURIComponent(tripId)}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  // Fire-and-forget pattern: swallow errors silently in production
  if (!response.ok) {
    console.warn(`Interaction post failed: ${response.status}`);
    return { interaction_id: '', status: 'failed' };
  }
  return response.json();
}

export async function getTripInteractions(
  tripId: string,
  userId: string
): Promise<{ interactions: TripInteraction[] }> {
  const response = await fetch(
    `${API_BASE_URL}/api/trips/${encodeURIComponent(tripId)}/interactions?user_id=${encodeURIComponent(userId)}`
  );
  if (!response.ok) {
    throw new Error(`Get interactions failed: ${response.status}`);
  }
  return response.json();
}
