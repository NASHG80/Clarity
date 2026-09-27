import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Leaf, Wallet, Accessibility } from 'lucide-react';
import { DashboardPhase, TripState, TripWeights } from '../../../../lib/api';
import {
  CANONICAL_ACCESSIBILITY_IDS,
  PERSONA_PRESETS,
  PersonaType,
} from '../../RequirementFormPage';

const SUSTAINABILITY_ITEMS = [
  { id: 'solar_power', i18nKey: 'sustainability.chips.solar_power' },
  { id: 'waste_program', i18nKey: 'sustainability.chips.waste_program' },
  { id: 'water_program', i18nKey: 'sustainability.chips.water_program' },
  { id: 'local_sourcing', i18nKey: 'sustainability.chips.local_sourcing' },
] as const;

const WEIGHT_AXES = [
  { key: 'environmental' as keyof TripWeights, label: 'environmental', icon: Leaf },
  { key: 'accessibility' as keyof TripWeights, label: 'accessibility', icon: Accessibility },
  { key: 'affordability' as keyof TripWeights, label: 'affordability', icon: Wallet },
  { key: 'convenience' as keyof TripWeights, label: 'convenience', icon: Clock },
];

interface FilterPanelProps {
  phase: DashboardPhase;
  currentState: Pick<TripState,
    | 'destination' | 'adults' | 'children' | 'rooms' | 'arrival_date' | 'departure_date'
    | 'accessibility_required' | 'sustainability_preferred' | 'budget_max' | 'weights'
  >;
  searchLoading: boolean;
  onAccessibilityChange: (ids: string[]) => void;
  onAccessibilityCommit: (eventType: string, filter: string) => void;
  onSustainabilityChange: (ids: string[]) => void;
  onSustainabilityCommit: (eventType: string, filter: string) => void;
  onBudgetChange: (val: number | null) => void;
  onBudgetCommit: (from: number | null, to: number | null) => void;
  onWeightsChange: (w: TripWeights) => void;
  onFindStays: () => void;
}

function Chip({
  label,
  selected,
  onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide border transition-all duration-200 cursor-pointer
        ${selected
          ? 'bg-[#26382D] text-white border-[#26382D]'
          : 'bg-transparent text-[#26382D] border-[#D8C9BE] hover:border-[#7C9278]'
        }
      `}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#5B6D62] mb-3">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="my-3 border-t border-[#D8C9BE]/60" />;
}

export default function FilterPanel({
  phase,
  currentState,
  searchLoading,
  onAccessibilityChange,
  onAccessibilityCommit,
  onSustainabilityChange,
  onSustainabilityCommit,
  onBudgetChange,
  onBudgetCommit,
  onWeightsChange,
  onFindStays,
}: FilterPanelProps) {
  const { t } = useTranslation('b2c');

  const filtersVisible = phase !== 'EMPTY';
  const findStaysEnabled = filtersVisible && !searchLoading;

  const [activePersona, setActivePersona] = React.useState<PersonaType | null>(null);

  const budgetRef = React.useRef<number | null>(currentState.budget_max);

  function toggleAccessibility(id: string) {
    const isSelected = currentState.accessibility_required.includes(id);
    const newList = isSelected
      ? currentState.accessibility_required.filter(x => x !== id)
      : [...currentState.accessibility_required, id];
    onAccessibilityChange(newList);
  }

  function toggleSustainability(id: string) {
    const isSelected = currentState.sustainability_preferred.includes(id);
    const newList = isSelected
      ? currentState.sustainability_preferred.filter(x => x !== id)
      : [...currentState.sustainability_preferred, id];
    onSustainabilityChange(newList);
  }

  function applyPersona(persona: PersonaType) {
    const preset = PERSONA_PRESETS[persona];
    const newChips = Array.from(new Set([...currentState.accessibility_required, ...preset.chips]));
    onAccessibilityChange(newChips);
    onWeightsChange({ ...currentState.weights, ...preset.weights });
    setActivePersona(persona);
  }

  function normalizeWeights(weights: TripWeights): TripWeights {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total <= 0) return { environmental: 0.25, accessibility: 0.25, affordability: 0.25, convenience: 0.25 };
    return {
      environmental: weights.environmental / total,
      accessibility: weights.accessibility / total,
      affordability: weights.affordability / total,
      convenience: weights.convenience / total,
    };
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5DFD6] shadow-sm p-5 lg:p-6 transition-shadow hover:shadow-md">
      {/* Trip summary */}
      {phase !== 'EMPTY' && (
        <>
          <SectionLabel>{t('planning.tripSummaryTitle')}</SectionLabel>
          <div className="text-[13px] text-[#26382D] font-medium mb-1">{currentState.destination}</div>
          <div className="text-[11px] text-[#A99587]">
            {currentState.adults}A · {currentState.children}C · {currentState.rooms}R
            {currentState.arrival_date && ` · ${currentState.arrival_date} → ${currentState.departure_date}`}
          </div>
          <Divider />
        </>
      )}

      {/* Empty placeholder */}
      {phase === 'EMPTY' && (
        <p className="text-[12px] text-[#A99587] leading-relaxed">
          {t('dashboard.filterPlaceholder')}
        </p>
      )}

      {/* Filters */}
      {filtersVisible && (
        <>
          {/* Persona presets */}
          <SectionLabel>Quick profiles</SectionLabel>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(['wheelchair', 'elderly', 'budget'] as PersonaType[]).map(p => {
              const isActive = activePersona === p;
              return (
                <button
                  key={p}
                  onClick={() => applyPersona(p)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                    isActive
                      ? 'border-[#26382D] bg-[#26382D] text-white'
                      : 'border-[#A9B8A3] text-[#7C9278] hover:bg-[#A9B8A3]/20'
                  }`}
                >
                  {t(`planning.persona.${p}`)}
                </button>
              );
            })}
          </div>

          <SectionLabel>{t('accessibility.heading')}</SectionLabel>
          <div className="flex flex-col gap-2 mb-4">
            {CANONICAL_ACCESSIBILITY_IDS.map(id => (
              <label key={id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentState.accessibility_required.includes(id)}
                  onChange={() => toggleAccessibility(id)}
                  className="w-4 h-4 rounded border-[#D8C9BE] text-[#26382D] focus:ring-[#26382D] focus:ring-offset-0 accent-[#26382D]"
                />
                <span className="text-[13px] text-[#26382D] group-hover:text-[#1a2a1e] transition-colors">
                  {t(`accessibility.chips.${id}`)}
                </span>
              </label>
            ))}
          </div>

          <Divider />
          <SectionLabel>{t('planning.step3Title')}</SectionLabel>
          <div className="flex flex-col gap-2 mb-1">
            {SUSTAINABILITY_ITEMS.map(({ id, i18nKey }) => (
              <label key={id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentState.sustainability_preferred.includes(id)}
                  onChange={() => toggleSustainability(id)}
                  className="w-4 h-4 rounded border-[#D8C9BE] text-[#26382D] focus:ring-[#26382D] focus:ring-offset-0 accent-[#26382D]"
                />
                <span className="text-[13px] text-[#26382D] group-hover:text-[#1a2a1e] transition-colors">
                  {t(i18nKey)}
                </span>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-[#A99587] mb-4 mt-1">{t('planning.step3Subtitle')}</p>

          <Divider />
          <SectionLabel>{t('planning.budgetLabel')}</SectionLabel>
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={currentState.budget_max ?? 50000}
            onChange={e => {
              const v = Number(e.target.value);
              onBudgetChange(v === 50000 ? null : v);
            }}
            onMouseUp={() => onBudgetCommit(budgetRef.current, currentState.budget_max)}
            onTouchEnd={() => onBudgetCommit(budgetRef.current, currentState.budget_max)}
            className="w-full accent-[#26382D] h-1 mt-1"
          />
          <div className="text-right text-[11px] text-[#26382D] font-semibold mt-0.5">
            {currentState.budget_max ? `₹${currentState.budget_max.toLocaleString('en-IN')}` : t('planning.budgetNone')}
          </div>

          <Divider />
          <SectionLabel>{t('planning.weightsHeading')}</SectionLabel>
          <div className="flex flex-col gap-2">
            {WEIGHT_AXES.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center gap-2">
                <Icon className="w-3 h-3 text-[#7C9278] shrink-0" />
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round(currentState.weights[key] * 100)}
                    onChange={e => {
                      const raw = { ...currentState.weights, [key]: Number(e.target.value) / 100 };
                      onWeightsChange(normalizeWeights(raw));
                    }}
                    className="w-full accent-[#7C9278] h-1"
                  />
                </div>
                <span className="text-[10px] text-[#A99587] w-6 text-right">
                  {Math.round(currentState.weights[key] * 100)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
