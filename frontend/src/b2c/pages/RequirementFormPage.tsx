import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Search,
  Users,
  Accessibility,
  IndianRupee,
  Clock,
  Sliders,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { NLUExtractedData } from '../../lib/api';
import { formatCurrencyINR } from '../../lib/formatters';
import Navbar from '../../shared/components/Navbar';
import BottomNavBar from '../../shared/components/BottomNavBar';

export interface RequirementFormData {
  origin: string;
  destination: string;
  adults: number;
  children: number;
  seniors: number;
  wheelchairUsers: number;
  accessibility_required: string[];
  accessibilityRequired?: string[];
  generalFlags: string[];
  budget_max: number;
  budgetMax?: number;
  time_max_hours: number;
  timeMaxHours?: number;
  weights: {
    environmental: number;
    accessibility: number;
    affordability: number;
    convenience: number;
  };
  includeUnverified: boolean;
  nights?: number;
}

export interface RequirementFormPageProps {
  initialData?: NLUExtractedData;
  fallbackNotice?: string;
  onBack?: () => void;
  onSubmitRequirements?: (data: RequirementFormData) => void;
}

// Canonical 9 accessibility items from docs/TEAM_SPLIT.md A5
export const CANONICAL_ACCESSIBILITY_IDS = [
  'step_free_entrance',
  'elevator',
  'wheelchair_accessible_room',
  'roll_in_shower',
  'accessible_toilet',
  'low_walking_distance',
  'accessible_public_transport',
  'visual_assistance',
  'hearing_assistance',
] as const;

export type CanonicalAccessibilityId = (typeof CANONICAL_ACCESSIBILITY_IDS)[number];

export const ACCESSIBILITY_CHIPS: { id: CanonicalAccessibilityId; i18nKey: string }[] =
  CANONICAL_ACCESSIBILITY_IDS.map((id) => ({
    id,
    i18nKey: `accessibility.chips.${id}`,
  }));

export type PersonaType = 'wheelchair' | 'elderly' | 'budget';

export const PERSONA_PRESETS: Record<PersonaType, { chips: CanonicalAccessibilityId[]; weights: { environmental: number; accessibility: number; affordability: number; convenience: number; } }> = {
  wheelchair: {
    chips: ['step_free_entrance', 'wheelchair_accessible_room', 'accessible_toilet'],
    weights: { environmental: 0.2, accessibility: 0.5, affordability: 0.15, convenience: 0.15 }
  },
  elderly: {
    chips: ['low_walking_distance', 'elevator', 'accessible_public_transport'],
    weights: { environmental: 0.2, accessibility: 0.4, affordability: 0.2, convenience: 0.2 }
  },
  budget: {
    chips: [],
    weights: { environmental: 0.3, accessibility: 0.2, affordability: 0.4, convenience: 0.1 }
  }
};

export const RequirementFormPage: React.FC<RequirementFormPageProps> = ({
  initialData,
  fallbackNotice,
  onBack,
  onSubmitRequirements,
}) => {
  // i18n hook for canonical translations
  const { t: tI18n, i18n } = useTranslation('b2c');
  const currentLang = (i18n.language === 'hi' || i18n.language === 'mr' ? i18n.language : 'en') as 'en' | 'hi' | 'mr';

  // Trip route & travelers
  const [origin, setOrigin] = useState<string>(initialData?.origin || '');
  const [destination, setDestination] = useState<string>(initialData?.destination || '');
  const [adults, setAdults] = useState<number | ''>(
    initialData?.adult_count !== undefined && initialData?.adult_count !== null
      ? initialData.adult_count
      : ''
  );
  const [children, setChildren] = useState<number>(initialData?.children_count ?? 0);
  const [seniors, setSeniors] = useState<number>(initialData?.senior_count ?? 0);
  const [nights, setNights] = useState<number | ''>(
    initialData?.nights !== undefined && initialData?.nights !== null
      ? initialData.nights
      : ''
  );
  
  // Wheelchair count prefill: only use explicit count if present, never infer 1 from general flag
  const [wheelchairUsers, setWheelchairUsers] = useState<number | ''>(
    (initialData as any)?.wheelchair_count !== undefined && (initialData as any)?.wheelchair_count !== null
      ? (initialData as any).wheelchair_count
      : ''
  );

  // RULE 6 & A5: Detailed chips are pre-checked ONLY from explicitly stated detailed IDs.
  // Coarse flags (wheelchair, accessible_transport, accessible_accommodation) must NOT auto-check detailed chips.
  const [selectedChips, setSelectedChips] = useState<string[]>(() => {
    const explicitFlags: string[] = [
      ...(initialData?.accessibility_required || []),
      ...(initialData?.accessibility_flags || []),
    ];
    return explicitFlags.filter((flag): flag is CanonicalAccessibilityId =>
      CANONICAL_ACCESSIBILITY_IDS.includes(flag as CanonicalAccessibilityId)
    );
  });

  // General coarse accessibility flags from NLU extraction (excluding detailed chips)
  const generalFlags = (initialData?.accessibility_flags || []).filter(
    (flag) => !CANONICAL_ACCESSIBILITY_IDS.includes(flag as any)
  );

  // Budget state (A6: range slider + numeric input synced both ways)
  const [budgetMax, setBudgetMax] = useState<number>(initialData?.budget_max || 20000);
  const [budgetInput, setBudgetInput] = useState<string>(String(initialData?.budget_max || 20000));
  
  // Time state (A7)
  const [timeMaxHours, setTimeMaxHours] = useState<number>(initialData?.time_max_hours || 8);
  const [timeInput, setTimeInput] = useState<string>(String(initialData?.time_max_hours || 8));

  const handleSliderChange = (newVal: number) => {
    setBudgetMax(newVal);
    setBudgetInput(String(newVal));
    markDirty();
  };

  const handleInputChange = (rawVal: string) => {
    const sanitized = rawVal.replace(/[^0-9]/g, '');
    setBudgetInput(sanitized);
    markDirty();

    if (sanitized === '') {
      return;
    }

    const parsed = parseInt(sanitized, 10);
    if (!isNaN(parsed)) {
      setBudgetMax(parsed);
    }
  };

  const handleInputBlur = () => {
    if (budgetInput === '' || isNaN(parseInt(budgetInput, 10))) {
      setBudgetMax(3000);
      setBudgetInput('3000');
    } else {
      const parsed = parseInt(budgetInput, 10);
      setBudgetInput(String(parsed));
    }
  };

  const handleTimeSliderChange = (newVal: number) => {
    setTimeMaxHours(newVal);
    setTimeInput(String(newVal));
    markDirty();
  };

  const handleTimeInputChange = (rawVal: string) => {
    const sanitized = rawVal.replace(/[^0-9]/g, '');
    setTimeInput(sanitized);
    markDirty();

    if (sanitized === '') return;

    const parsed = parseInt(sanitized, 10);
    if (!isNaN(parsed)) setTimeMaxHours(parsed);
  };

  const handleTimeInputBlur = () => {
    if (timeInput === '' || isNaN(parseInt(timeInput, 10))) {
      setTimeMaxHours(1);
      setTimeInput('1');
    } else {
      setTimeInput(String(parseInt(timeInput, 10)));
    }
  };

  const effectiveSliderValue = Math.min(50000, Math.max(3000, budgetMax || 3000));
  const isBelowMinimum = budgetInput !== '' && budgetMax > 0 && budgetMax < 3000;
  
  const effectiveTimeValue = Math.min(24, Math.max(1, timeMaxHours || 1));

  // Priority weights (A8)
  const [showPriorities, setShowPriorities] = useState<boolean>(false);
  const [weights, setWeights] = useState({
    environmental: 0.4,
    accessibility: 0.4,
    affordability: 0.1,
    convenience: 0.1,
  });

  const [includeUnverified, setIncludeUnverified] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [pendingPersona, setPendingPersona] = useState<PersonaType | null>(null);

  const markDirty = () => setIsDirty(true);

  // Toggle accessibility chip
  const toggleChip = (id: string) => {
    setSelectedChips((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    markDirty();
  };

  // Persona Presets (A9)
  const applyPersona = (type: PersonaType) => {
    if (isDirty) {
      setPendingPersona(type);
      return;
    }
    executePersona(type);
  };

  const executePersona = (type: PersonaType) => {
    const preset = PERSONA_PRESETS[type];
    
    if (type === 'wheelchair') {
      setWheelchairUsers((prev) => (typeof prev === 'number' && prev > 0 ? prev : 1));
    } else if (type === 'elderly') {
      setSeniors((prev) => Math.max(1, prev));
    } else if (type === 'budget') {
      setBudgetMax(10000);
      setBudgetInput('10000');
    }
    
    setSelectedChips(preset.chips);
    setWeights(preset.weights);
    setIsDirty(false); // Reset dirty tracking after intentional apply
    setPendingPersona(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adults === '' || Number(adults) < 1 || nights === '' || Number(nights) < 1) {
      return;
    }
    const effectiveBudget =
      budgetInput === '' || isNaN(parseInt(budgetInput, 10))
        ? 3000
        : parseInt(budgetInput, 10);

    // A8: Normalize weights to sum to 1.0, with zero-sum protection fallback
    const rawSum = weights.environmental + weights.accessibility + weights.affordability + weights.convenience;
    let normalizedWeights;
    if (rawSum > 0) {
      normalizedWeights = {
        environmental: weights.environmental / rawSum,
        accessibility: weights.accessibility / rawSum,
        affordability: weights.affordability / rawSum,
        convenience: weights.convenience / rawSum,
      };
    } else {
      // Fallback to the existing sane default if all sliders are set to 0
      normalizedWeights = {
        environmental: 0.4,
        accessibility: 0.4,
        affordability: 0.1,
        convenience: 0.1,
      };
    }

    const formData: RequirementFormData = {
      origin,
      destination,
      adults: Number(adults),
      children,
      seniors,
      wheelchairUsers: wheelchairUsers === '' ? 0 : Number(wheelchairUsers),
      accessibility_required: selectedChips,
      accessibilityRequired: selectedChips,
      generalFlags,
      budget_max: effectiveBudget,
      budgetMax: effectiveBudget,
      time_max_hours: effectiveTimeValue,
      timeMaxHours: effectiveTimeValue,
      weights: normalizedWeights,
      includeUnverified,
      nights: Number(nights),
    };
    setIsSubmitted(true);
    if (onSubmitRequirements) {
      onSubmitRequirements(formData);
    }
  };

  // Translations
  const t = tI18n('reqForm', { returnObjects: true }) as any;

  const renderContent = () => (
    <>
      {/* Fallback Notice if NLU extraction was unavailable */}
        {fallbackNotice && (
          <div className="bg-[#E8CFC4]/40 border border-[#A99587] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#26382D] animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-[#26382D] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">{fallbackNotice}</span>
              <span className="text-[#26382D]/75 text-[11px]">
                {tI18n('requirementForm.fallbackNoticeHelper')}
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-[#F8F6F3] rounded-3xl p-6 sm:p-8 border border-[#D8C9BE] shadow-[0_4px_20px_rgba(38,56,45,0.03)] space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7C9278]">
            <Sparkles className="w-3.5 h-3.5 text-[#7C9278]" />
            <span>{tI18n('requirementForm.eyebrow')}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#26382D]">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#26382D]/75 font-light leading-relaxed">
            {t.subtitle}
          </p>

          {/* Persona Presets (A9) */}
          <div className="pt-4 border-t border-[#D8C9BE]/50 relative">
            <div className="text-[11px] font-semibold text-[#A99587] uppercase tracking-wider mb-2">
              {tI18n('presets.heading')}
            </div>
            
            {/* Desktop Variant: hidden md:flex */}
            <div className="hidden md:flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPersona('wheelchair')}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F1EDE9] hover:bg-[#E8CFC4]/50 border border-[#D8C9BE] text-[#26382D] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
              >
                ♿ {tI18n('presets.wheelchair')}
              </button>
              <button
                type="button"
                onClick={() => applyPersona('elderly')}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F1EDE9] hover:bg-[#E8CFC4]/50 border border-[#D8C9BE] text-[#26382D] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
              >
                👥 {tI18n('presets.elderly')}
              </button>
              <button
                type="button"
                onClick={() => applyPersona('budget')}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F1EDE9] hover:bg-[#E8CFC4]/50 border border-[#D8C9BE] text-[#26382D] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
              >
                ₹ {tI18n('presets.budget')}
              </button>
            </div>

            {/* Mobile Variant: flex md:hidden */}
            <div className="flex md:hidden overflow-x-auto pb-2 -mx-2 px-2 snap-x gap-2 hide-scrollbar">
              <button
                type="button"
                onClick={() => applyPersona('wheelchair')}
                className="shrink-0 snap-start px-4 py-2.5 rounded-xl text-xs font-medium bg-white border border-[#D8C9BE] text-[#26382D] active:bg-[#F1EDE9] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
              >
                ♿ {tI18n('presets.wheelchair')}
              </button>
              <button
                type="button"
                onClick={() => applyPersona('elderly')}
                className="shrink-0 snap-start px-4 py-2.5 rounded-xl text-xs font-medium bg-white border border-[#D8C9BE] text-[#26382D] active:bg-[#F1EDE9] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
              >
                👥 {tI18n('presets.elderly')}
              </button>
              <button
                type="button"
                onClick={() => applyPersona('budget')}
                className="shrink-0 snap-start px-4 py-2.5 rounded-xl text-xs font-medium bg-white border border-[#D8C9BE] text-[#26382D] active:bg-[#F1EDE9] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
              >
                ₹ {tI18n('presets.budget')}
              </button>
            </div>

            {/* Inline Confirmation Prompt */}
            {pendingPersona && (
              <div className="mt-4 p-4 rounded-xl bg-[#E8CFC4]/50 border border-[#A99587] animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#26382D] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#26382D] mb-1">
                      {tI18n('presets.confirmHeading')}
                    </h3>
                    <p className="text-xs text-[#26382D]/80 mb-3">
                      {tI18n('presets.confirmBody')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingPersona(null)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#D8C9BE] bg-white hover:bg-[#F8F6F3] text-[#26382D] transition-colors focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none cursor-pointer"
                      >
                        {tI18n('presets.confirmCancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => executePersona(pendingPersona)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#26382D] text-white hover:bg-[#1b2820] transition-colors focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none cursor-pointer"
                      >
                        {tI18n('presets.confirmApply')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Route */}
          <div className="bg-[#F8F6F3] rounded-3xl p-6 sm:p-8 border border-[#D8C9BE] space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#26382D] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#7C9278]" />
              <span>{t.routeHeading}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#26382D]/80 mb-1">
                  {t.originLabel}
                </label>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => { setOrigin(e.target.value); markDirty(); }}
                  placeholder={t.originPlaceholder}
                  className="w-full text-sm p-3 rounded-xl border border-[#D8C9BE] bg-white text-[#26382D] focus:outline-none focus:border-[#7C9278]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26382D]/80 mb-1">
                  {t.destLabel}
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => { setDestination(e.target.value); markDirty(); }}
                  placeholder={t.destPlaceholder}
                  className="w-full text-sm p-3 rounded-xl border border-[#D8C9BE] bg-white text-[#26382D] focus:outline-none focus:border-[#7C9278]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Travel Party */}
          <div className="bg-[#F8F6F3] rounded-3xl p-6 sm:p-8 border border-[#D8C9BE] space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#26382D] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7C9278]" />
              <span>{t.travelersHeading}</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {/* Adults */}
              <div className="p-3 bg-white rounded-xl border border-[#D8C9BE]">
                <label className="block text-[11px] font-medium text-[#A99587] mb-1">
                  {t.adults}
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={adults}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAdults(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                      markDirty();
                    }}
                    placeholder="e.g. 1"
                    className="w-full text-base font-semibold text-[#26382D] bg-transparent focus:outline-none mt-1"
                  />
                </label>
              </div>

              {/* Children */}
              <div className="p-3 bg-white rounded-xl border border-[#D8C9BE]">
                <label className="block text-[11px] font-medium text-[#A99587] mb-1">
                  {t.children}
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={children}
                    onChange={(e) => { setChildren(Math.max(0, parseInt(e.target.value, 10) || 0)); markDirty(); }}
                    className="w-full text-base font-semibold text-[#26382D] bg-transparent focus:outline-none mt-1"
                  />
                </label>
              </div>

              {/* Seniors */}
              <div className="p-3 bg-white rounded-xl border border-[#D8C9BE]">
                <label className="block text-[11px] font-medium text-[#A99587] mb-1">
                  {t.seniors}
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={seniors}
                    onChange={(e) => { setSeniors(Math.max(0, parseInt(e.target.value, 10) || 0)); markDirty(); }}
                    className="w-full text-base font-semibold text-[#26382D] bg-transparent focus:outline-none mt-1"
                  />
                </label>
              </div>

              {/* Wheelchair */}
              <div className="p-3 bg-white rounded-xl border border-[#D8C9BE]">
                <label className="block text-[11px] font-medium text-[#A99587] mb-1">
                  {t.wheelchair}
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={wheelchairUsers}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWheelchairUsers(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                      markDirty();
                    }}
                    placeholder="0"
                    className="w-full text-base font-semibold text-[#26382D] bg-transparent focus:outline-none mt-1"
                  />
                </label>
              </div>
              
              {/* Nights */}
              <div className="p-3 bg-white rounded-xl border border-[#D8C9BE]">
                <label className="block text-[11px] font-medium text-[#A99587] mb-1">
                  {t.nightsLabel}
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={nights}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNights(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                      markDirty();
                    }}
                    placeholder="e.g. 3"
                    className="w-full text-base font-semibold text-[#26382D] bg-transparent focus:outline-none mt-1"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Accessibility Requirements (A5 + Rule 6 Preservation) */}
          <div className="bg-[#F8F6F3] rounded-3xl p-6 sm:p-8 border border-[#D8C9BE] space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#26382D] flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-[#7C9278]" />
              <span>{tI18n('accessibility.heading')}</span>
            </h2>

            {/* General Coarse Flags notice (Preserving Rule 6) */}
            {generalFlags.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#F1EDE9] border border-[#A9B8A3] text-xs text-[#26382D] space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-[#7C9278]">
                  <Info className="w-3.5 h-3.5" />
                  <span>{tI18n('accessibility.generalFlagsNotice')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {generalFlags.map((flag) => (
                    <span
                      key={flag}
                      className="px-2.5 py-0.5 rounded-md bg-white border border-[#D8C9BE] text-[11px] font-medium text-[#26382D]"
                    >
                      {flag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-[#26382D]/75">
              {tI18n('accessibility.chipsHelper')}
            </p>

            {/* Desktop Variant: Multi-column chip grid (AGENTS.md Rule 9) */}
            <div className="hidden md:grid md:grid-cols-3 gap-3 pt-1">
              {ACCESSIBILITY_CHIPS.map((chip) => {
                const isSelected = selectedChips.includes(chip.id);
                const chipLabel = tI18n(chip.i18nKey);
                return (
                  <button
                    key={`desktop-${chip.id}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleChip(chip.id)}
                    className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none ${
                      isSelected
                        ? 'bg-[#26382D] text-[#F8F6F3] border-[#26382D] shadow-xs'
                        : 'bg-white text-[#26382D]/85 border-[#D8C9BE] hover:border-[#7C9278] hover:bg-[#F1EDE9]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border text-[9px] transition-colors ${
                        isSelected
                          ? 'bg-[#7C9278] border-[#7C9278] text-white'
                          : 'border-[#A99587] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="leading-snug">{chipLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Variant: Full-width, easy-to-tap cards with min 44px height (AGENTS.md Rule 9) */}
            <div className="flex md:hidden flex-col gap-2.5 pt-1">
              {ACCESSIBILITY_CHIPS.map((chip) => {
                const isSelected = selectedChips.includes(chip.id);
                const chipLabel = tI18n(chip.i18nKey);
                return (
                  <button
                    key={`mobile-${chip.id}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleChip(chip.id)}
                    className={`w-full min-h-[48px] flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium border transition-all active:scale-[0.99] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none ${
                      isSelected
                        ? 'bg-[#26382D] text-[#F8F6F3] border-[#26382D] shadow-xs'
                        : 'bg-white text-[#26382D]/85 border-[#D8C9BE] active:bg-[#F1EDE9]'
                    }`}
                  >
                    <span className="text-left font-medium leading-normal pr-2">{chipLabel}</span>
                    <div
                      className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center border text-[11px] transition-colors ${
                        isSelected
                          ? 'bg-[#7C9278] border-[#7C9278] text-white'
                          : 'border-[#A99587] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Budget & Travel Time (A6 & A7) */}
          <div className="bg-[#F8F6F3] rounded-3xl p-6 sm:p-8 border border-[#D8C9BE] space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Budget Control (A6: Range slider + Numeric Input, dual layout) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-[#26382D] flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-[#7C9278]" />
                    <span>{tI18n('budget.label')}</span>
                  </div>
                  <span className="text-[11px] text-[#26382D]/70 font-normal hidden sm:inline">
                    {tI18n('budget.helper')}
                  </span>
                </div>

                {/* Desktop Layout Variant (hidden md:block per AGENTS.md Rule 9) */}
                <div className="hidden md:block space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        id="trip-budget-slider-desktop"
                        type="range"
                        min={3000}
                        max={50000}
                        step={500}
                        value={effectiveSliderValue}
                        onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                        aria-label={tI18n('budget.label')}
                        aria-valuemin={3000}
                        aria-valuemax={50000}
                        aria-valuenow={effectiveSliderValue}
                        aria-valuetext={formatCurrencyINR(budgetMax || 3000)}
                        className="w-full accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-[#A99587] pt-1">
                        <span>{tI18n('budget.minimum')}</span>
                        <span>{tI18n('budget.midpoint')}</span>
                        <span>{tI18n('budget.maximum')}</span>
                      </div>
                    </div>

                    <div className="w-36 shrink-0">
                      <div className="flex items-center px-3 py-2 rounded-xl bg-white border border-[#D8C9BE] focus-within:border-[#7C9278] focus-within:ring-2 focus-within:ring-[#7C9278]/20 transition-all shadow-2xs">
                        <span className="text-sm font-semibold text-[#26382D] pr-1 select-none">₹</span>
                        <input
                          id="trip-budget-input-desktop"
                          type="text"
                          inputMode="numeric"
                          value={budgetInput}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onBlur={handleInputBlur}
                          placeholder={tI18n('budget.inputPlaceholder')}
                          aria-label={tI18n('budget.label')}
                          className="w-full text-sm font-semibold font-mono text-[#26382D] bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout Variant (block md:hidden per AGENTS.md Rule 9) */}
                <div className="block md:hidden space-y-3">
                  <div className="flex items-center px-4 py-3 rounded-2xl bg-white border border-[#D8C9BE] focus-within:border-[#7C9278] focus-within:ring-2 focus-within:ring-[#7C9278]/20 transition-all min-h-[48px] shadow-2xs">
                    <span className="text-base font-semibold text-[#26382D] pr-1.5 select-none">₹</span>
                    <input
                      id="trip-budget-input-mobile"
                      type="text"
                      inputMode="numeric"
                      value={budgetInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onBlur={handleInputBlur}
                      placeholder={tI18n('budget.inputPlaceholder')}
                      aria-label={tI18n('budget.label')}
                      className="w-full text-base font-semibold font-mono text-[#26382D] bg-transparent focus:outline-none"
                    />
                  </div>

                  <div className="pt-1">
                    <input
                      id="trip-budget-slider-mobile"
                      type="range"
                      min={3000}
                      max={50000}
                      step={500}
                      value={effectiveSliderValue}
                      onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                      aria-label={tI18n('budget.label')}
                      aria-valuemin={3000}
                      aria-valuemax={50000}
                      aria-valuenow={effectiveSliderValue}
                      aria-valuetext={formatCurrencyINR(budgetMax || 3000)}
                      className="w-full accent-[#7C9278] cursor-pointer h-7 focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-[#A99587]">
                      <span>{tI18n('budget.minimum')}</span>
                      <span>{tI18n('budget.midpoint')}</span>
                      <span>{tI18n('budget.maximum')}</span>
                    </div>
                  </div>
                </div>

                {/* Non-blocking warning when budget is below minimum threshold */}
                {isBelowMinimum && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-[#E8CFC4]/50 border border-[#A99587] text-xs text-[#26382D] animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-[#26382D] shrink-0 mt-0.5" />
                    <span>{tI18n('budget.warningBelowCheapest')}</span>
                  </div>
                )}
              </div>

              {/* Time Slider (A7) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-[#26382D] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#7C9278]" />
                    <span>{tI18n('time.label')}</span>
                  </div>
                  <span className="text-[11px] text-[#26382D]/70 font-normal hidden sm:inline">
                    {tI18n('time.helper')}
                  </span>
                </div>

                {/* Desktop Layout Variant (hidden md:block per AGENTS.md Rule 9) */}
                <div className="hidden md:block space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        id="trip-time-slider-desktop"
                        type="range"
                        min={1}
                        max={24}
                        step={1}
                        value={effectiveTimeValue}
                        onChange={(e) => handleTimeSliderChange(parseInt(e.target.value, 10))}
                        aria-label={tI18n('time.label')}
                        aria-valuemin={1}
                        aria-valuemax={24}
                        aria-valuenow={effectiveTimeValue}
                        aria-valuetext={`${effectiveTimeValue} ${tI18n('time.hours')}`}
                        className="w-full accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-[#A99587] pt-1">
                        <span>{tI18n('time.minTick')}</span>
                        <span>{tI18n('time.midTick')}</span>
                        <span>{tI18n('time.maxTick')}</span>
                      </div>
                    </div>

                    <div className="w-36 shrink-0">
                      <div className="flex items-center px-3 py-2 rounded-xl bg-white border border-[#D8C9BE] focus-within:border-[#7C9278] focus-within:ring-2 focus-within:ring-[#7C9278]/20 transition-all shadow-2xs">
                        <input
                          id="trip-time-input-desktop"
                          type="text"
                          inputMode="numeric"
                          value={timeInput}
                          onChange={(e) => handleTimeInputChange(e.target.value)}
                          onBlur={handleTimeInputBlur}
                          placeholder={tI18n('time.inputPlaceholder')}
                          aria-label={tI18n('time.label')}
                          className="w-full text-sm font-semibold font-mono text-[#26382D] bg-transparent focus:outline-none"
                        />
                        <span className="text-sm font-semibold text-[#26382D] pl-1 select-none">{tI18n('time.hours')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout Variant (block md:hidden per AGENTS.md Rule 9) */}
                <div className="block md:hidden space-y-3">
                  <div className="flex items-center px-4 py-3 rounded-2xl bg-white border border-[#D8C9BE] focus-within:border-[#7C9278] focus-within:ring-2 focus-within:ring-[#7C9278]/20 transition-all min-h-[48px] shadow-2xs">
                    <input
                      id="trip-time-input-mobile"
                      type="text"
                      inputMode="numeric"
                      value={timeInput}
                      onChange={(e) => handleTimeInputChange(e.target.value)}
                      onBlur={handleTimeInputBlur}
                      placeholder={tI18n('time.inputPlaceholder')}
                      aria-label={tI18n('time.label')}
                      className="w-full text-base font-semibold font-mono text-[#26382D] bg-transparent focus:outline-none"
                    />
                    <span className="text-base font-semibold text-[#26382D] pl-1.5 select-none">{tI18n('time.hours')}</span>
                  </div>

                  <div className="pt-1">
                    <input
                      id="trip-time-slider-mobile"
                      type="range"
                      min={1}
                      max={24}
                      step={1}
                      value={effectiveTimeValue}
                      onChange={(e) => handleTimeSliderChange(parseInt(e.target.value, 10))}
                      aria-label={tI18n('time.label')}
                      aria-valuemin={1}
                      aria-valuemax={24}
                      aria-valuenow={effectiveTimeValue}
                      aria-valuetext={`${effectiveTimeValue} ${tI18n('time.hours')}`}
                      className="w-full accent-[#7C9278] cursor-pointer h-7 focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-[#A99587]">
                      <span>{tI18n('time.minTick')}</span>
                      <span>{tI18n('time.midTick')}</span>
                      <span>{tI18n('time.maxTick')}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 5: Weight Sliders Panel (A8 - Collapsed by default) */}
          <div className="bg-[#F8F6F3] rounded-3xl p-6 sm:p-8 border border-[#D8C9BE]">
            <button
              type="button"
              aria-expanded={showPriorities}
              onClick={() => setShowPriorities(!showPriorities)}
              className="w-full flex items-center justify-between text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#7C9278]" />
                <span className="font-serif text-lg font-medium text-[#26382D]">
                  {tI18n('weights.heading')}
                </span>
              </div>
              {showPriorities ? (
                <ChevronUp className="w-4 h-4 text-[#A99587]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#A99587]" />
              )}
            </button>

            {showPriorities && (
              <>
                {/* Desktop Layout Variant (hidden md:grid per AGENTS.md Rule 9) */}
                <div className="hidden md:grid mt-5 pt-4 border-t border-[#D8C9BE]/60 grid-cols-2 gap-6 text-xs">
                  {/* Environmental */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="weight-env-desktop" className="font-medium text-[#26382D]">{tI18n('weights.environmental')}</label>
                      <span className="font-mono font-semibold">{Math.round(weights.environmental * 100)}%</span>
                    </div>
                    <input
                      id="weight-env-desktop"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weights.environmental}
                      onChange={(e) => { setWeights({ ...weights, environmental: parseFloat(e.target.value) }); markDirty(); }}
                      aria-label={tI18n('weights.environmental')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(weights.environmental * 100)}
                      aria-valuetext={`${Math.round(weights.environmental * 100)}%`}
                      className="w-full accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                  </div>

                  {/* Accessibility */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="weight-acc-desktop" className="font-medium text-[#26382D]">{tI18n('weights.accessibility')}</label>
                      <span className="font-mono font-semibold">{Math.round(weights.accessibility * 100)}%</span>
                    </div>
                    <input
                      id="weight-acc-desktop"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weights.accessibility}
                      onChange={(e) => { setWeights({ ...weights, accessibility: parseFloat(e.target.value) }); markDirty(); }}
                      aria-label={tI18n('weights.accessibility')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(weights.accessibility * 100)}
                      aria-valuetext={`${Math.round(weights.accessibility * 100)}%`}
                      className="w-full accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                  </div>

                  {/* Cost */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="weight-cost-desktop" className="font-medium text-[#26382D]">{tI18n('weights.affordability')}</label>
                      <span className="font-mono font-semibold">{Math.round(weights.affordability * 100)}%</span>
                    </div>
                    <input
                      id="weight-cost-desktop"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weights.affordability}
                      onChange={(e) => { setWeights({ ...weights, affordability: parseFloat(e.target.value) }); markDirty(); }}
                      aria-label={tI18n('weights.affordability')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(weights.affordability * 100)}
                      aria-valuetext={`${Math.round(weights.affordability * 100)}%`}
                      className="w-full accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                  </div>

                  {/* Convenience */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label htmlFor="weight-conv-desktop" className="font-medium text-[#26382D]">{tI18n('weights.convenience')}</label>
                      <span className="font-mono font-semibold">{Math.round(weights.convenience * 100)}%</span>
                    </div>
                    <input
                      id="weight-conv-desktop"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weights.convenience}
                      onChange={(e) => { setWeights({ ...weights, convenience: parseFloat(e.target.value) }); markDirty(); }}
                      aria-label={tI18n('weights.convenience')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(weights.convenience * 100)}
                      aria-valuetext={`${Math.round(weights.convenience * 100)}%`}
                      className="w-full accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                  </div>
                </div>

                {/* Mobile Layout Variant (flex flex-col md:hidden per AGENTS.md Rule 9) */}
                <div className="flex flex-col md:hidden mt-5 pt-4 border-t border-[#D8C9BE]/60 gap-5 text-sm">
                  {/* Environmental */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="weight-env-mobile" className="font-medium text-[#26382D]">{tI18n('weights.environmental')}</label>
                      <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded border border-[#D8C9BE] text-xs">
                        {Math.round(weights.environmental * 100)}%
                      </span>
                    </div>
                    <input
                      id="weight-env-mobile"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weights.environmental}
                      onChange={(e) => { setWeights({ ...weights, environmental: parseFloat(e.target.value) }); markDirty(); }}
                      aria-label={tI18n('weights.environmental')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(weights.environmental * 100)}
                      aria-valuetext={`${Math.round(weights.environmental * 100)}%`}
                      className="w-full h-8 accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                  </div>

                  {/* Accessibility */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="weight-acc-mobile" className="font-medium text-[#26382D]">{tI18n('weights.accessibility')}</label>
                      <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded border border-[#D8C9BE] text-xs">
                        {Math.round(weights.accessibility * 100)}%
                      </span>
                    </div>
                    <input
                      id="weight-acc-mobile"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weights.accessibility}
                      onChange={(e) => { setWeights({ ...weights, accessibility: parseFloat(e.target.value) }); markDirty(); }}
                      aria-label={tI18n('weights.accessibility')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(weights.accessibility * 100)}
                      aria-valuetext={`${Math.round(weights.accessibility * 100)}%`}
                      className="w-full h-8 accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                  </div>

                  {/* Cost */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="weight-cost-mobile" className="font-medium text-[#26382D]">{tI18n('weights.affordability')}</label>
                      <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded border border-[#D8C9BE] text-xs">
                        {Math.round(weights.affordability * 100)}%
                      </span>
                    </div>
                    <input
                      id="weight-cost-mobile"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weights.affordability}
                      onChange={(e) => { setWeights({ ...weights, affordability: parseFloat(e.target.value) }); markDirty(); }}
                      aria-label={tI18n('weights.affordability')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(weights.affordability * 100)}
                      aria-valuetext={`${Math.round(weights.affordability * 100)}%`}
                      className="w-full h-8 accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                  </div>

                  {/* Convenience */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="weight-conv-mobile" className="font-medium text-[#26382D]">{tI18n('weights.convenience')}</label>
                      <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded border border-[#D8C9BE] text-xs">
                        {Math.round(weights.convenience * 100)}%
                      </span>
                    </div>
                    <input
                      id="weight-conv-mobile"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weights.convenience}
                      onChange={(e) => { setWeights({ ...weights, convenience: parseFloat(e.target.value) }); markDirty(); }}
                      aria-label={tI18n('weights.convenience')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(weights.convenience * 100)}
                      aria-valuetext={`${Math.round(weights.convenience * 100)}%`}
                      className="w-full h-8 accent-[#7C9278] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Section 6: Data State Toggle & Submit */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs text-[#26382D]/80 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUnverified}
                onChange={(e) => setIncludeUnverified(e.target.checked)}
                className="w-4 h-4 accent-[#7C9278] rounded cursor-pointer"
              />
              <span>{t.unverifiedToggle}</span>
            </label>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#26382D] text-[#F8F6F3] text-sm font-semibold tracking-wide hover:bg-[#1b2820] active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(38,56,45,0.12)] cursor-pointer"
            >
              {t.submitBtn}
            </button>
          </div>

          {isSubmitted && (
            <div role="status" className="p-4 rounded-xl bg-[#7C9278]/15 border border-[#7C9278] text-xs text-[#26382D] text-center font-medium animate-in fade-in">
              {t.submittedMsg}
            </div>
          )}

        </form>
    </>
  );

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col min-h-screen bg-[#F1EDE9] font-sans pb-24">
        {/* Top Navigation */}
        <div className="flex items-center justify-between px-4 py-4 bg-[#F1EDE9]">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#26382D]/80 hover:text-[#26382D] transition-colors py-2 px-3 rounded-lg hover:bg-[#F8F6F3] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none"
            >
              <ArrowLeft className="w-4 h-4 text-[#7C9278]" />
              <span>{t.back}</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-3">
            {/* Language Switcher (EN, HI, MR) */}
            <div className="flex items-center rounded-xl bg-white border border-[#D8C9BE] p-1 text-[11px] font-semibold shadow-2xs">
              {(['en', 'hi', 'mr'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    i18n.changeLanguage(l);
                    localStorage.setItem('clarity_lang', l);
                  }}
                  className={`px-2.5 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                    currentLang === l
                      ? 'bg-[#26382D] text-[#F8F6F3] shadow-xs'
                      : 'text-[#26382D]/70 hover:text-[#26382D] hover:bg-[#F1EDE9]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full px-4 pb-6 space-y-6">
          {renderContent()}
        </div>
        <BottomNavBar />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#F1EDE9] text-[#26382D] selection:bg-[#7C9278] selection:text-white font-sans">
        <Navbar />
        
        <div className="max-w-4xl mx-auto space-y-6 px-8 py-8 w-full">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#26382D]/80 hover:text-[#26382D] transition-colors py-2 px-3 rounded-lg hover:bg-[#F8F6F3] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:outline-none mb-2"
            >
              <ArrowLeft className="w-4 h-4 text-[#7C9278]" />
              <span>{t.back}</span>
            </button>
          )}

          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default RequirementFormPage;
