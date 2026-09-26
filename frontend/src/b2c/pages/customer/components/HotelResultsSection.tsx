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
      <div className="bg-[#F8F6F3] rounded-2xl border border-[#D8C9BE] p-8 text-center">
        <Building2 className="w-8 h-8 text-[#D8C9BE] mx-auto mb-3" />
        <p className="font-serif text-[18px] text-[#26382D] mb-2">{t('planning.noResults')}</p>
        <p className="text-[12px] text-[#A99587]">{t('planning.noResultsHelper')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#7C9278]">
          {t('planning.resultsTitle')}
        </p>
        <span className="text-[10px] text-[#A99587]">({results.length})</span>
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
