import React from 'react';
import { useTranslation } from 'react-i18next';
import { AccommodationResult } from '../../../../lib/api';
import AccommodationResultCard from '../../../components/AccommodationResultCard';
import { Building2 } from 'lucide-react';

interface HotelResultsSectionProps {
  results: AccommodationResult[];
  onResultOpened: (id: string, name: string) => void;
  onResultSaved: (id: string, name: string) => void;
}

export default function HotelResultsSection({
  results,
  onResultOpened,
  onResultSaved,
}: HotelResultsSectionProps) {
  const { t, i18n } = useTranslation('b2c');
  const lang = i18n.language;

  function getHotelName(result: AccommodationResult): string {
    return result.translations?.[lang]?.name
      || result.translations?.['en']?.name
      || 'Unknown Hotel';
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 text-center shadow-sm">
        <Building2 className="w-10 h-10 text-[#A69C8E] mx-auto mb-4" />
        <p className="font-serif text-xl font-bold text-[#1C2B22] mb-2">{t('planning.noResults')}</p>
        <p className="text-[14px] text-[#5B6D62]">{t('planning.noResultsHelper')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-4 mt-2">
        <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#5B6D62]">
          {t('planning.resultsTitle')}
        </p>
        <span className="text-xs text-[#A69C8E]">({results.length})</span>
      </div>
      <div className="flex flex-col gap-3">
        {results.map(result => (
          <div
            key={result.id}
            onClick={() => onResultOpened(result.id, getHotelName(result))}
            className="cursor-pointer"
          >
            <AccommodationResultCard result={result} />
          </div>
        ))}
      </div>
    </div>
  );
}
