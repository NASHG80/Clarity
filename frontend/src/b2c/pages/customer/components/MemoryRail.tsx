import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, BookmarkPlus, MapPin, Search, SlidersHorizontal, BarChart3, Leaf } from 'lucide-react';
import { TripInteraction } from '../../../../lib/api';

const EVENT_ICONS: Record<string, React.ElementType> = {
  trip_basics_submitted:        MapPin,
  destination_changed:          MapPin,
  dates_changed:                Clock,
  traveler_count_changed:       BarChart3,
  accessibility_filter_selected: SlidersHorizontal,
  accessibility_filter_removed:  SlidersHorizontal,
  sustainability_filter_selected: Leaf,
  sustainability_filter_removed:  Leaf,
  budget_changed:               BarChart3,
  weight_changed:               BarChart3,
  persona_preset_applied:       SlidersHorizontal,
  search_performed:             Search,
  result_viewed:                MapPin,
  result_opened:                MapPin,
  result_saved:                 BookmarkPlus,
  filter_changed_after_results: SlidersHorizontal,
  search_refreshed:             Search,
};

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

interface MemoryRailProps {
  interactions: TripInteraction[];
}

interface MemoryEntryProps {
  interaction: TripInteraction;
}

function MemoryEntry({ interaction }: MemoryEntryProps) {
  const { t } = useTranslation('b2c');
  const Icon = EVENT_ICONS[interaction.event_type] || Clock;
  const label = t(`memory.${interaction.event_type}`, { defaultValue: interaction.event_type });

  // Build a brief detail string from payload
  let detail = '';
  let mainLabel = t(`memory.${interaction.event_type}`, { defaultValue: interaction.event_type });
  const p = interaction.payload as Record<string, unknown>;
  
  if (p.destination) detail = String(p.destination);
  else if (p.filter) {
    if (interaction.event_type === 'persona_preset_applied') {
      mainLabel = t(`planning.persona.${p.filter}`, { defaultValue: String(p.filter) });
      detail = t('planning.applied', 'Applied profile');
    } else {
      const isAccess = interaction.event_type.includes('accessibility');
      const isAdded = interaction.event_type.includes('selected');
      const filterKey = isAccess ? `accessibility.chips.${p.filter}` : `sustainability.chips.${p.filter}`;
      mainLabel = t(filterKey, { defaultValue: String(p.filter) });
      detail = isAdded ? t('planning.added', 'Added') : t('planning.removed', 'Removed');
    }
  }
  else if (p.hotel_name) detail = String(p.hotel_name);
  else if (interaction.event_type === 'search_performed' || interaction.event_type === 'filter_changed_after_results') {
    const acc = (p.accessibility_required as string[]) || [];
    const sus = (p.sustainability_preferred as string[]) || [];
    const total = acc.length + sus.length;
    mainLabel = interaction.event_type === 'search_performed' ? 'Searched Stays' : 'Updated Filters';
    detail = total > 0 ? `${total} filters applied` : 'No filters applied';
  }
  else if (interaction.event_type === 'search_results_found') {
    mainLabel = t('planning.foundStays', 'Found Stays');
    detail = p.result_count !== undefined ? `${p.result_count} hotels matching criteria` : '';
  }
  else if (p.result_count !== undefined) detail = `${p.result_count} hotels`;
  else if (p.to !== undefined) detail = `→ ${p.to}`;

  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-[#D8C9BE]/40 last:border-0">
      <div className="w-6 h-6 rounded-full bg-[#E8CFC4]/60 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-[#7C9278]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#26382D] leading-tight truncate">{mainLabel}</p>
        {detail && <p className="text-[11px] text-[#A99587] truncate mt-0.5">{detail}</p>}
      </div>
      <span className="text-[10px] text-[#D8C9BE] flex-shrink-0 mt-0.5">
        {formatTimestamp(interaction.timestamp)}
      </span>
    </div>
  );
}

export default function MemoryRail({ interactions }: MemoryRailProps) {
  const { t } = useTranslation('b2c');

  return (
    <div className="bg-[#F8F6F3] rounded-2xl border border-[#D8C9BE] shadow-[0_4px_16px_rgba(38,56,45,0.03)] p-4">
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#7C9278] mb-3">
        {t('dashboard.memoryTitle')}
      </p>

      {interactions.length === 0 ? (
        <p className="text-[12px] text-[#A99587] leading-relaxed">
          {t('dashboard.memoryEmpty')}
        </p>
      ) : (
        <div className="flex flex-col">
          {[...interactions]
            .filter(i => i.event_type !== 'trip_basics_submitted')
            .reverse()
            .slice(0, 8)
            .map(interaction => (
            <MemoryEntry key={interaction.interaction_id} interaction={interaction} />
          ))}
        </div>
      )}
    </div>
  );
}
