import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExperienceResult } from '../../lib/api';
import DataStateBadge from '../../shared/components/DataStateBadge';
import { formatCurrencyINR, formatDuration } from '../../lib/formatters';
import { Clock, MapPin, IndianRupee } from 'lucide-react';

// Wrapper to isolate Person B's placeholder dependency without TS workarounds
const IsolatedDataStateBadge = ({ state }: { state: string }) => {
  return (
    <div className="flex flex-col gap-1 items-start sm:items-end">
      <DataStateBadge />
      {state === 'demo_synthetic' && (
        <span className="text-[10px] font-bold text-[#E88D67] uppercase bg-[#E88D67]/10 px-1.5 py-0.5 rounded">
          {state}
        </span>
      )}
    </div>
  );
};

interface ExperienceCardProps {
  experience: ExperienceResult;
  isSelected?: boolean;
  onToggle?: () => void;
}

export default function ExperienceCard({ experience, isSelected = false, onToggle }: ExperienceCardProps) {
  const { t, i18n } = useTranslation('b2c');
  const lang = i18n.language as string;

  const translation = experience.translations[lang];
  const name = translation?.name || experience.translations['en']?.name || 'Unknown Experience';
  const description = translation?.description || experience.translations['en']?.description || '';
  const showEnglishFallback = !translation && !!experience.translations['en'];

  const isDemoRoot = experience.data_state === 'demo_synthetic';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] overflow-hidden hover:shadow-md transition-shadow relative p-5 md:p-6 flex flex-col md:flex-row gap-6">
      
      {/* Absolute Demo Badge if Root is demo_synthetic */}
      {isDemoRoot && (
        <div className="absolute top-4 right-4 bg-[#E88D67] text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10 hidden md:block">
          DEMO
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl md:text-2xl font-serif text-[#26382D] pr-4">
            {name}
            {showEnglishFallback && (
              <span className="text-xs font-sans text-[#7C9278] ml-2 font-normal whitespace-nowrap">
                {t('explore.shownInEnglish')}
              </span>
            )}
            {isDemoRoot && (
              <span className="md:hidden ml-2 bg-[#E88D67] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm align-middle">
                DEMO
              </span>
            )}
          </h3>
        </div>
        
        <p className="text-[#7C9278] text-sm md:text-base leading-relaxed mb-6 line-clamp-2">
          {description}
        </p>
        
        {/* Claims / Badges */}
        <div className="mt-auto space-y-3 border-t border-[#D8C9BE]/30 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#F8F6F3] p-3 rounded-lg gap-2">
            <span className="text-sm font-medium text-[#26382D]">
              {experience.accessibility.value ? t(`features.${experience.accessibility.value}`, experience.accessibility.value) as string : t('listing.emptyAccessibility')}
            </span>
            <IsolatedDataStateBadge state={experience.accessibility.data_state} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#F8F6F3] p-3 rounded-lg gap-2">
            <span className="text-sm font-medium text-[#26382D]">
              {experience.environmental_impact.value ? t(`features.${experience.environmental_impact.value}`, experience.environmental_impact.value) as string : t('listing.emptySustainability')}
            </span>
            <IsolatedDataStateBadge state={experience.environmental_impact.data_state} />
          </div>
        </div>
      </div>

      {/* Stats/Price Area (Sidebar-like on Desktop) */}
      <div className="md:w-48 flex-shrink-0 flex flex-row md:flex-col justify-between md:justify-start gap-4 border-t md:border-t-0 md:border-l border-[#D8C9BE]/50 pt-4 md:pt-0 md:pl-6">
        
        <div className="flex flex-col gap-1">
          <div className="text-xl md:text-2xl font-semibold text-[#26382D]">
            {experience.cost_inr === 0 
              ? t('explore.costFree') 
              : formatCurrencyINR(experience.cost_inr)}
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-[#A99587]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7C9278]" />
            <span>{formatDuration(t, { 
              hours: Math.floor(experience.duration_minutes / 60) > 0 ? Math.floor(experience.duration_minutes / 60) : undefined, 
              minutes: (experience.duration_minutes % 60) > 0 ? (experience.duration_minutes % 60) : undefined 
            })}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#7C9278]" />
            <span>{t('explore.distance', { distance: experience.distance_km })}</span>
          </div>
        </div>

        {onToggle && (
          <div className="mt-auto pt-2">
            <button
              onClick={onToggle}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isSelected 
                  ? 'bg-[#E8CFC4] text-[#26382D] hover:bg-[#D8BFA9] focus-visible:ring-[#E8CFC4]' 
                  : 'bg-[#26382D] text-white hover:bg-[#3A5043] focus-visible:ring-[#26382D]'
              }`}
            >
              {isSelected ? t('explore.remove', 'Remove') : t('explore.add', 'Add Experience')}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
