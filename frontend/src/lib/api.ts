// Single source of truth for all fetch calls — must match docs/API_CONTRACT.md
export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ?? "http://localhost:8000";

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
 * Deterministic test scenario:
 * - If any item has image_id === 'simulate_fail', or if an item has image_id === 'fail_once'
 *   and this is the first attempt, it simulates a network failure to test retry behavior.
 * - Otherwise succeeds deterministically, mapping confirmed features to reported claims.
 */
export const mockConfirmDetections = async (
  items: DetectionConfirmationItem[]
): Promise<ConfirmDetectionsResponse> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  mockConfirmAttemptTracker++;

  // Deterministic failure test trigger:
  const shouldFailAlways = items.some(item => item.image_id === 'simulate_fail');
  const shouldFailOnce = items.some(item => item.image_id === 'fail_once') && mockConfirmAttemptTracker === 1;

  if (shouldFailAlways || shouldFailOnce) {
    throw new Error('Deterministic network timeout during confirmation submission. Please retry.');
  }

  const confirmedItems = items.filter(i => i.confirmed);
  const rejectedItems = items.filter(i => !i.confirmed);

  // Map confirmed labels to property checklist keys
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
 * Dispatches real HTTP request to API_BASE_URL.
 * Falls back to deterministic mock if endpoint returns 404/501 or backend is offline.
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
      body: JSON.stringify(items),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
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

  // Mutate mock state to simulate backend
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
