import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from './components/DashboardLayout';
import FilterPanel from './components/FilterPanel';
import PlanningCanvas from './components/PlanningCanvas';
import MemoryRail from './components/MemoryRail';
import ChatBar from './components/ChatBar';
import {
  DashboardPhase,
  TripState,
  TripWeights,
  TripInteraction,
  AccommodationResult,
  createTrip,
  getActiveTrip,
  patchTripState,
  postTripInteraction,
  getTripInteractions,
  searchAccommodation,
} from '../../../lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEFAULT_WEIGHTS: TripWeights = {
  environmental: 0.25,
  accessibility: 0.25,
  affordability: 0.25,
  convenience: 0.25,
};

function makeSessionId(): string {
  return `sess_${Math.random().toString(36).slice(2, 10)}`;
}

function makeClientEventId(): string {
  return `ce_${Math.random().toString(36).slice(2, 16)}`;
}

function getSessionId(): string {
  let id = sessionStorage.getItem('clarity_session_id');
  if (!id) {
    id = makeSessionId();
    sessionStorage.setItem('clarity_session_id', id);
  }
  return id;
}

function getUserId(): string | null {
  return sessionStorage.getItem('clarity_user_id');
}

// ---------------------------------------------------------------------------
// CustomerDashboardPage
// ---------------------------------------------------------------------------
export default function CustomerDashboardPage() {
  const { t } = useTranslation('b2c');
  const navigate = useNavigate();

  // Auth
  const userId = getUserId();
  const sessionId = getSessionId();

  // Trip identity
  const [tripId, setTripId] = useState<string | null>(null);

  // Planning phase
  const [phase, setPhase] = useState<DashboardPhase>('EMPTY');

  // Mutable current trip state (source of truth for UI)
  const [currentState, setCurrentState] = useState<Omit<TripState, 'trip_id' | 'user_id' | 'created_at' | 'last_updated' | 'phase' | 'last_search_result_count'>>({
    destination: '',
    adults: 1,
    children: 0,
    rooms: 1,
    arrival_date: '',
    departure_date: '',
    accessibility_required: [],
    sustainability_preferred: [],
    budget_max: null,
    weights: DEFAULT_WEIGHTS,
    include_unverified: false,
  });

  // Hotel results
  const [hotelResults, setHotelResults] = useState<AccommodationResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Memory rail
  const [interactions, setInteractions] = useState<TripInteraction[]>([]);

  // Resume notice
  const [resumed, setResumed] = useState(false);

  // Abort controller for search
  const searchAbortRef = useRef<AbortController | null>(null);

  // Debounce timers
  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Auth guard
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!userId) {
      navigate('/auth?returnTo=/customer-dashboard', { replace: true });
    }
  }, [userId, navigate]);

  // ---------------------------------------------------------------------------
  // On mount: resume active trip if one exists
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const { trip } = await getActiveTrip(userId);
        if (trip) {
          setTripId(trip.trip_id);
          setPhase(trip.phase);
          setCurrentState({
            destination: trip.destination,
            adults: trip.adults,
            children: trip.children,
            rooms: trip.rooms,
            arrival_date: trip.arrival_date,
            departure_date: trip.departure_date,
            accessibility_required: trip.accessibility_required,
            sustainability_preferred: trip.sustainability_preferred,
            budget_max: trip.budget_max,
            weights: trip.weights,
            include_unverified: trip.include_unverified,
          });
          setResumed(true);
          setTimeout(() => setResumed(false), 4000);

          // Restore memory
          const { interactions: hist } = await getTripInteractions(trip.trip_id, userId);
          setInteractions(hist);

          // If was in RESULTS phase, auto re-run search
          if (trip.phase === 'RESULTS' || trip.phase === 'SEARCHING') {
            await runSearch(trip.trip_id, trip);
          }
        }
      } catch {
        // Non-fatal — start fresh
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Post interaction (fire-and-forget)
  // ---------------------------------------------------------------------------
  const postInteraction = useCallback(async (
    tid: string,
    eventType: string,
    payload: Record<string, unknown>
  ) => {
    if (!userId) return;
    const interaction = await postTripInteraction(tid, {
      user_id: userId,
      session_id: sessionId,
      event_type: eventType,
      payload: { ...payload, client_event_id: makeClientEventId() },
    });
    if (interaction.interaction_id) {
      // Optimistically append to memory rail
      setInteractions(prev => [...prev, {
        interaction_id: interaction.interaction_id,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        payload: { ...payload, client_event_id: '' },
      }]);
    }
  }, [userId, sessionId]);

  // ---------------------------------------------------------------------------
  // Debounced patch
  // ---------------------------------------------------------------------------
  const schedulePatch = useCallback((tid: string, fields: Partial<TripState>) => {
    if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
    patchTimerRef.current = setTimeout(async () => {
      if (!userId) return;
      try {
        await patchTripState(tid, { ...fields, user_id: userId });
      } catch (e) {
        console.warn('Patch trip state failed', e);
      }
    }, 800);
  }, [userId]);

  // ---------------------------------------------------------------------------
  // Hotel search
  // ---------------------------------------------------------------------------
  const runSearch = useCallback(async (
    tid: string,
    state: typeof currentState
  ) => {
    if (searchAbortRef.current) searchAbortRef.current.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await searchAccommodation({
        destination_city: state.destination,
        budget_max: state.budget_max !== null ? state.budget_max : undefined,
        accessibility_required: state.accessibility_required,
        sustainability_preferred: state.sustainability_preferred,
        weights: state.weights,
        include_unverified: state.include_unverified,
        arrival_date: state.arrival_date || undefined,
        departure_date: state.departure_date || undefined,
      });


      if (controller.signal.aborted) return;

      setHotelResults(res.results);
      setPhase('RESULTS');

      // Persist result count
      await patchTripState(tid, {
        user_id: userId!,
        phase: 'RESULTS',
        last_search_result_count: res.results.length,
      });
      
      postInteraction(tid, 'search_performed', {
        result_count: res.results.length,
      });

    } catch (err: any) {
      if (controller.signal.aborted) return;
      setSearchError(err.message || 'Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }, [userId, postInteraction]);

  // ---------------------------------------------------------------------------
  // Handler: TripBasicsForm submit
  // ---------------------------------------------------------------------------
  const handleBasicsSubmit = useCallback(async (basics: {
    destination: string;
    adults: number;
    children: number;
    rooms: number;
    arrival_date: string;
    departure_date: string;
  }) => {
    if (!userId) return;

    try {
      const res = await createTrip({
        user_id: userId,
        ...basics,
      });

      const newTripId = res.trip_id;
      setTripId(newTripId);
      setCurrentState(prev => ({ ...prev, ...basics }));
      setPhase('BASICS_SAVED');

      await postInteraction(newTripId, 'trip_basics_submitted', basics);
    } catch (err: any) {
      console.error('Create trip failed', err);
    }
  }, [userId, postInteraction]);

  // ---------------------------------------------------------------------------
  // Handler: TripBasicsForm update
  // ---------------------------------------------------------------------------
  const handleBasicsUpdate = useCallback(async (basics: {
    destination: string;
    adults: number;
    children: number;
    rooms: number;
    arrival_date: string;
    departure_date: string;
  }) => {
    if (!tripId || !userId) return;
    setCurrentState(prev => ({ ...prev, ...basics }));
    patchTripState(tripId, { user_id: userId, ...basics });
    
    // Log the update interaction, we can reuse dates_changed or traveler_count_changed
    // For simplicity, we'll log it as a generic edit (or just rely on the new values applied).
    postInteraction(tripId, 'dates_changed', basics);
    
    // Auto-search if already in results
    if (phase === 'RESULTS') {
      runSearch(tripId, { ...currentState, ...basics });
    }
  }, [tripId, userId, phase, currentState, runSearch, postInteraction]);

  // ---------------------------------------------------------------------------
  // Handler: Start Over / Cancel Trip
  // ---------------------------------------------------------------------------
  const handleResetTrip = useCallback(() => {
    setTripId(null);
    setPhase('EMPTY');
    setHotelResults([]);
    setInteractions([]);
    setCurrentState({
      destination: '',
      adults: 1,
      children: 0,
      rooms: 1,
      arrival_date: '',
      departure_date: '',
      accessibility_required: [],
      sustainability_preferred: [],
      budget_max: null,
      weights: DEFAULT_WEIGHTS,
      include_unverified: false,
    });
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Handler: accessibility chips change
  // ---------------------------------------------------------------------------
  const handleAccessibilityChange = useCallback((newList: string[]) => {
    setCurrentState(prev => ({ ...prev, accessibility_required: newList }));
    if (!tripId || !userId) return;
    schedulePatch(tripId, { accessibility_required: newList });
  }, [tripId, userId, schedulePatch]);

  const handleAccessibilityCommit = useCallback((eventType: string, filter: string) => {
    if (!tripId) return;
    postInteraction(tripId, eventType, { filter });
  }, [tripId, postInteraction]);

  // ---------------------------------------------------------------------------
  // Handler: phase advance buttons
  // ---------------------------------------------------------------------------
  const handleAdvancePhase = useCallback(async (toPhase: DashboardPhase) => {
    setPhase(toPhase);
    if (!tripId || !userId) return;
    await patchTripState(tripId, { user_id: userId, phase: toPhase });
  }, [tripId, userId]);

  // ---------------------------------------------------------------------------
  // Handler: sustainability chips change
  // ---------------------------------------------------------------------------
  const handleSustainabilityChange = useCallback((newList: string[]) => {
    setCurrentState(prev => ({ ...prev, sustainability_preferred: newList }));
    if (!tripId || !userId) return;
    schedulePatch(tripId, { sustainability_preferred: newList });
  }, [tripId, userId, schedulePatch]);

  const handleSustainabilityCommit = useCallback((eventType: string, filter: string) => {
    if (!tripId) return;
    postInteraction(tripId, eventType, { filter });
  }, [tripId, postInteraction]);

  // ---------------------------------------------------------------------------
  // Handler: budget change
  // ---------------------------------------------------------------------------
  const handleBudgetChange = useCallback((val: number | null) => {
    setCurrentState(prev => ({ ...prev, budget_max: val }));
    if (!tripId || !userId) return;
    schedulePatch(tripId, { budget_max: val ?? undefined });
  }, [tripId, userId, schedulePatch]);

  const handleBudgetCommit = useCallback((from: number | null, to: number | null) => {
    if (!tripId) return;
    postInteraction(tripId, 'budget_changed', { from, to });
  }, [tripId, postInteraction]);

  // ---------------------------------------------------------------------------
  // Handler: weights change
  // ---------------------------------------------------------------------------
  const handleWeightsChange = useCallback((weights: TripWeights) => {
    setCurrentState(prev => ({ ...prev, weights }));
    if (!tripId || !userId) return;
    schedulePatch(tripId, { weights });
  }, [tripId, userId, schedulePatch]);

  // ---------------------------------------------------------------------------
  // Handler: Find Stays
  // ---------------------------------------------------------------------------
  const handleFindStays = useCallback(async () => {
    if (!tripId || searchLoading) return;

    const isRefine = phase === 'RESULTS';
    await postInteraction(tripId, isRefine ? 'filter_changed_after_results' : 'search_performed', {
      accessibility_required: currentState.accessibility_required,
      sustainability_preferred: currentState.sustainability_preferred,
      budget_max: currentState.budget_max,
    });

    await runSearch(tripId, currentState);
  }, [tripId, searchLoading, phase, currentState, postInteraction, runSearch]);

  // ---------------------------------------------------------------------------
  // Handler: hotel card interactions
  // ---------------------------------------------------------------------------
  const handleResultOpened = useCallback((hotelId: string, hotelName: string) => {
    if (!tripId) return;
    postInteraction(tripId, 'result_opened', { hotel_id: hotelId, hotel_name: hotelName });
  }, [tripId, postInteraction]);

  const handleResultSaved = useCallback((hotelId: string, hotelName: string) => {
    if (!tripId) return;
    postInteraction(tripId, 'result_saved', { hotel_id: hotelId, hotel_name: hotelName });
  }, [tripId, postInteraction]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (!userId) return null;

  return (
    <div className="min-h-screen bg-[#F1EDE9] flex flex-col">
      {resumed && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#26382D] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg animate-fade-in">
          {t('dashboard.resumeNotice')}
        </div>
      )}
      <main className="flex-1 pt-4 pb-20">
        <DashboardLayout
          filterPanel={
            <FilterPanel
              phase={phase}
              currentState={currentState}
              searchLoading={searchLoading}
              onAccessibilityChange={handleAccessibilityChange}
              onAccessibilityCommit={handleAccessibilityCommit}
              onSustainabilityChange={handleSustainabilityChange}
              onSustainabilityCommit={handleSustainabilityCommit}
              onBudgetChange={handleBudgetChange}
              onBudgetCommit={handleBudgetCommit}
              onWeightsChange={handleWeightsChange}
              onFindStays={handleFindStays}
            />
          }
          canvas={
            <PlanningCanvas
              phase={phase}
              currentState={currentState}
              hotelResults={hotelResults}
              searchLoading={searchLoading}
              searchError={searchError}
              onBasicsSubmit={handleBasicsSubmit}
              onBasicsUpdate={handleBasicsUpdate}
              onAdvancePhase={handleAdvancePhase}
              onResultOpened={handleResultOpened}
              onResultSaved={handleResultSaved}
              onFindStays={handleFindStays}
              onResetTrip={handleResetTrip}
            />
          }
          memoryRail={
            <MemoryRail interactions={interactions} />
          }
        />
      </main>
      <ChatBar />
    </div>
  );
}
