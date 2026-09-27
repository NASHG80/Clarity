import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Users, AlertCircle, Loader2 } from 'lucide-react';
import { DashboardPhase, TripState, AccommodationResult } from '../../../../lib/api';
import PlanningStepCard from './PlanningStepCard';
import HotelResultsSection from './HotelResultsSection';

interface PlanningCanvasProps {
  phase: DashboardPhase;
  currentState: Pick<TripState,
    | 'destination' | 'adults' | 'children' | 'rooms' | 'arrival_date' | 'departure_date'
    | 'accessibility_required' | 'sustainability_preferred' | 'budget_max' | 'weights'
  >;
  hotelResults: AccommodationResult[];
  searchLoading: boolean;
  searchError: string | null;
  onBasicsSubmit: (basics: {
    destination: string;
    adults: number;
    children: number;
    rooms: number;
    arrival_date: string;
    departure_date: string;
  }) => Promise<void>;
  onBasicsUpdate: (basics: {
    destination: string;
    adults: number;
    children: number;
    rooms: number;
    arrival_date: string;
    departure_date: string;
  }) => Promise<void>;
  onAdvancePhase: (to: DashboardPhase) => Promise<void>;
  onResultOpened: (id: string, name: string) => void;
  onResultSaved: (id: string, name: string) => void;
  onFindStays: () => void;
  onResetTrip?: () => void;
}

// ---------------------------------------------------------------------------
// Stepper for adults/children/rooms
// ---------------------------------------------------------------------------
function Stepper({
  label,
  value,
  onChange,
  min = 0,
}: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-[#7C9278] uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full border border-[#D8C9BE] text-[#26382D] flex items-center justify-center text-sm hover:bg-[#D8C9BE]/40 transition-colors"
        >-</button>
        <span className="text-[#26382D] font-semibold text-[15px] w-5 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full border border-[#D8C9BE] text-[#26382D] flex items-center justify-center text-sm hover:bg-[#D8C9BE]/40 transition-colors"
        >+</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TripBasicsForm
// ---------------------------------------------------------------------------
function TripBasicsForm({ onSubmit, initialValues, onCancel }: {
  onSubmit: (basics: {
    destination: string; adults: number; children: number;
    rooms: number; arrival_date: string; departure_date: string;
  }) => Promise<void>;
  initialValues?: {
    destination: string; adults: number; children: number;
    rooms: number; arrival_date: string; departure_date: string;
  };
  onCancel?: () => void;
}) {
  const { t } = useTranslation('b2c');
  const [destination, setDestination] = useState(initialValues?.destination || '');
  const [adults, setAdults] = useState(initialValues?.adults || 1);
  const [children, setChildren] = useState(initialValues?.children || 0);
  const [rooms, setRooms] = useState(initialValues?.rooms || 1);
  const [arrivalDate, setArrivalDate] = useState(initialValues?.arrival_date || '');
  const [departureDate, setDepartureDate] = useState(initialValues?.departure_date || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!destination.trim()) e.destination = t('planning.validationDestination');
    if (adults < 1) e.adults = t('planning.validationAdults');
    if (!arrivalDate || !departureDate) e.dates = t('planning.validationDatesRequired');
    else if (departureDate <= arrivalDate) e.dates = t('planning.validationDates');
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit({ destination: destination.trim(), adults, children, rooms, arrival_date: arrivalDate, departure_date: departureDate });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Destination */}
      <div>
        <label className="text-[11px] font-bold tracking-wider uppercase text-[#7C9278] mb-1 block">
          {t('planning.destination')}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B8A3]" />
          <input
            id="dashboard-destination"
            type="text"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder={t('planning.destinationPlaceholder')}
            className="w-full pl-9 pr-4 py-3 bg-white border border-[#D8C9BE] rounded-xl text-[14px] text-[#26382D] placeholder:text-[#A99587] focus:outline-none focus:border-[#7C9278] transition-colors"
          />
        </div>
        {errors.destination && (
          <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{errors.destination}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold tracking-wider uppercase text-[#7C9278] mb-1 block">
            {t('planning.arrival')}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B8A3]" />
            <input
              id="dashboard-arrival"
              type="date"
              min={today}
              value={arrivalDate}
              onChange={e => setArrivalDate(e.target.value)}
              className="w-full pl-9 pr-2 py-3 bg-white border border-[#D8C9BE] rounded-xl text-[13px] text-[#26382D] focus:outline-none focus:border-[#7C9278] transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-wider uppercase text-[#7C9278] mb-1 block">
            {t('planning.departure')}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B8A3]" />
            <input
              id="dashboard-departure"
              type="date"
              min={arrivalDate || today}
              value={departureDate}
              onChange={e => setDepartureDate(e.target.value)}
              className="w-full pl-9 pr-2 py-3 bg-white border border-[#D8C9BE] rounded-xl text-[13px] text-[#26382D] focus:outline-none focus:border-[#7C9278] transition-colors"
            />
          </div>
        </div>
        {errors.dates && (
          <p className="col-span-2 text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{errors.dates}
          </p>
        )}
      </div>

      {/* Travellers */}
      <div className="flex flex-wrap gap-6">
        <Stepper label={t('planning.adults')} value={adults} onChange={setAdults} min={1} />
        <Stepper label={t('planning.children')} value={children} onChange={setChildren} />
        <Stepper label={t('planning.rooms')} value={rooms} onChange={setRooms} min={1} />
        {errors.adults && (
          <p className="w-full text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{errors.adults}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 self-start">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="bg-transparent text-[#A99587] text-[11px] font-bold tracking-widest uppercase px-6 py-3 hover:text-[#26382D] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          id="dashboard-start-planning"
          disabled={submitting}
          className="bg-[#26382D] text-white text-[11px] font-bold tracking-widest uppercase px-6 py-3 rounded-full hover:bg-[#1a2a1e] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
          {t('planning.startPlanning')}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Trip summary card (replaces form after BASICS_SAVED)
// ---------------------------------------------------------------------------
function TripSummaryCard({ state, onEdit, onReset }: { state: PlanningCanvasProps['currentState'], onEdit?: () => void, onReset?: () => void }) {
  const { t } = useTranslation('b2c');
  const nights = state.arrival_date && state.departure_date
    ? Math.ceil((new Date(state.departure_date).getTime() - new Date(state.arrival_date).getTime()) / 86400000)
    : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-[#26382D]">
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 text-[13px]">
          <MapPin className="w-4 h-4 text-[#7C9278]" />
          <span className="font-semibold">{state.destination}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <Calendar className="w-4 h-4 text-[#7C9278]" />
          <span>{state.arrival_date} → {state.departure_date}</span>
          {nights !== null && <span className="text-[#A99587] text-[11px]">({nights} {t('planning.nights')})</span>}
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <Users className="w-4 h-4 text-[#7C9278]" />
          <span>{state.adults}A · {state.children}C · {state.rooms}R</span>
        </div>
      </div>
      {(onEdit || onReset) && (
        <div className="flex items-center gap-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="bg-transparent text-[#7C9278] hover:text-[#26382D] text-[11px] font-bold uppercase tracking-widest transition-colors"
            >
              Edit
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="bg-transparent text-red-400 hover:text-red-600 text-[11px] font-bold uppercase tracking-widest transition-colors"
            >
              Cancel Trip
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanningCanvas
// ---------------------------------------------------------------------------
export default function PlanningCanvas({
  phase,
  currentState,
  hotelResults,
  searchLoading,
  searchError,
  onBasicsSubmit,
  onBasicsUpdate,
  onAdvancePhase,
  onResultOpened,
  onResultSaved,
  onFindStays,
  onResetTrip,
}: PlanningCanvasProps) {
  const { t } = useTranslation('b2c');
  const [isEditingBasics, setIsEditingBasics] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* EMPTY: big welcome */}
      {phase === 'EMPTY' && (
        <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-sm">
          <h1 className="font-serif text-3xl font-bold text-[#1C2B22] mb-2 leading-tight">{t('dashboard.emptyHeading')}</h1>
          <p className="text-[#5B6D62] text-[15px] mb-8">{t('dashboard.emptySubheading')}</p>
          <TripBasicsForm onSubmit={onBasicsSubmit} />
        </div>
      )}

      {/* BASICS_SAVED+: show step 1 summary + step 2 accessibility */}
      {phase !== 'EMPTY' && (
        <>
          {/* Step 1 — Trip summary or Edit Form */}
          <PlanningStepCard
            stepNumber={1}
            title={t('planning.tripSummaryTitle')}
            complete={!isEditingBasics}
          >
            {isEditingBasics ? (
              <TripBasicsForm
                initialValues={currentState as any}
                onSubmit={async (basics) => {
                  await onBasicsUpdate(basics);
                  setIsEditingBasics(false);
                }}
                onCancel={() => setIsEditingBasics(false)}
              />
            ) : (
              <TripSummaryCard
                state={currentState}
                onEdit={() => setIsEditingBasics(true)}
                onReset={onResetTrip}
              />
            )}
          </PlanningStepCard>

          {/* Step 2 — Preferences & Search */}
          <PlanningStepCard
            stepNumber={2}
            title={t('planning.step2Title')}
            subtitle={t('planning.step2Subtitle')}
            complete={['RESULTS'].includes(phase)}
          >
            <div className="flex flex-col gap-4">
              {phase === 'RESULTS' && (
                <>
                  {/* Accessibility */}
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-[#A99587] tracking-wider mb-2">Accessibility</h4>
                    {currentState.accessibility_required.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentState.accessibility_required.map(id => (
                          <span key={id} className="bg-[#26382D] text-white text-[10px] font-semibold px-3 py-1 rounded-full">
                            {t(`accessibility.chips.${id}`)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#A99587]">None selected.</p>
                    )}
                  </div>

                  {/* Sustainability */}
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-[#A99587] tracking-wider mb-2">Sustainability</h4>
                    {currentState.sustainability_preferred.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentState.sustainability_preferred.map(id => (
                          <span key={id} className="bg-[#7C9278] text-white text-[10px] font-semibold px-3 py-1 rounded-full">
                            {t(`sustainability.chips.${id}`)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#A99587]">None selected.</p>
                    )}
                  </div>
                </>
              )}

              {/* Budget & Weights */}
              <div>
                <h4 className="text-[10px] uppercase font-bold text-[#A99587] tracking-wider mb-2">Priorities</h4>
                <div className="flex flex-wrap gap-4 text-[12px] text-[#26382D]">
                  <span className="font-semibold">
                    {currentState.budget_max
                      ? `Max ₹${currentState.budget_max.toLocaleString('en-IN')}/night`
                      : t('planning.budgetNone')}
                  </span>
                  <span className="text-[#A99587] text-[11px]">
                    Weights: Env {Math.round(currentState.weights.environmental * 100)} · 
                    Access {Math.round(currentState.weights.accessibility * 100)} · 
                    Cost {Math.round(currentState.weights.affordability * 100)} · 
                    Conv {Math.round(currentState.weights.convenience * 100)}
                  </span>
                </div>
              </div>

              {/* Find Stays Button */}
              <div className="mt-2 flex items-center">
                <button
                  onClick={onFindStays}
                  disabled={searchLoading}
                  className="bg-[#26382D] text-white text-[11px] font-bold tracking-widest uppercase px-6 py-3 rounded-full hover:bg-[#1a2a1e] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {searchLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {phase === 'RESULTS' ? t('planning.refineSearch', 'Refine Search') : t('planning.findStays')} →
                </button>
              </div>
            </div>
          </PlanningStepCard>

          {/* Searching skeleton */}
          {searchLoading && (
            <div className="flex items-center gap-3 py-6 px-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#7C9278]" />
              <span className="text-[14px] text-[#A99587]">{t('planning.searching')}</span>
            </div>
          )}

          {/* Search error */}
          {searchError && !searchLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-red-700">{searchError}</p>
              </div>
            </div>
          )}

          {/* Hotel results */}
          {phase === 'RESULTS' && !searchLoading && (
            <HotelResultsSection
              results={hotelResults}
              onResultOpened={onResultOpened}
              onResultSaved={onResultSaved}
            />
          )}
        </>
      )}
    </div>
  );
}

