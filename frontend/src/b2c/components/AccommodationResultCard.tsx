import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccommodationResult } from '../../lib/api';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { Star, Image as ImageIcon } from 'lucide-react';
import { formatCurrencyINR } from '../../lib/formatters';

interface AccommodationResultCardProps {
  result: AccommodationResult;
}

export default function AccommodationResultCard({ result }: AccommodationResultCardProps) {
  const { t, i18n } = useTranslation('b2c');
  const navigate = useNavigate();
  const location = useLocation();
  const lang = i18n.language as string;

  const translation = result.translations[lang];
  const name = translation?.name || result.translations['en']?.name || 'Unknown Hotel';
  const showEnglishFallback = !translation && !!result.translations['en'];

  const isDemoRoot = result.data_state === 'demo_synthetic';
  const accessibilityCount = result.accessibility_items ? result.accessibility_items.length : 0;
  
  const handleCardClick = () => {
    navigate(`/listings/${result.id}`, { state: { ...location.state, hotelResult: result } });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] overflow-hidden flex flex-col md:flex-row h-full cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Photos Section */}
      <div className="w-full md:w-72 h-48 md:h-auto bg-[#F8F6F3] flex-shrink-0 relative">
        {result.photos && result.photos.length > 0 ? (
          <img
            src={result.photos[0]}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Neutral failure treatment
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center text-[#A99587] ${(result.photos && result.photos.length > 0) ? 'hidden' : ''}`}>
          <ImageIcon className="w-10 h-10 opacity-30" />
        </div>
        {isDemoRoot && (
          <div className="absolute top-3 left-3 bg-[#E88D67] text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
            {t('results.badgeDemo', 'DEMO')}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-serif text-[#26382D] line-clamp-2">
              {name}
              {showEnglishFallback && (
                <span className="text-xs font-sans text-[#7C9278] ml-2 font-normal">
                  {t('accommodation.shownInEnglish')}
                </span>
              )}
            </h3>
            <p className="text-[#A99587] text-sm mt-1">{result.city}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-semibold text-[#26382D]">
              {result.price_inr_per_night ? formatCurrencyINR(result.price_inr_per_night) : '--'}
            </div>
            <div className="text-[#7C9278] text-xs mt-0.5">{t('accommodation.perNight')}</div>
          </div>
        </div>

        {/* Star Rating */}
        {typeof result.star_rating === 'number' && (
          <div className="flex items-center mt-3 gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (result.star_rating || 0)
                    ? 'fill-[#E2C792] text-[#E2C792]'
                    : 'fill-transparent text-[#D8C9BE]'
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex-grow">
          {/* Summary */}
          {accessibilityCount > 0 && (
            <div className="text-sm font-medium text-[#26382D] mb-2">
              {t('accommodation.accessibility')}: {accessibilityCount}
            </div>
          )}

          {/* Items */}
          <div className="flex flex-wrap gap-2">
            {result.accessibility_items?.map((item, idx) => (
              <div
                key={`acc-${idx}`}
                className="inline-flex items-center bg-[#F8F6F3] border border-[#D8C9BE] rounded-full px-2.5 py-1"
              >
                <span className="text-xs text-[#26382D] mr-2">{t(`features.${item.label}`, item.label)}</span>
                <DataStateBadge state={item.data_state || 'not_verified'} />
              </div>
            ))}
            {result.sustainability_items?.map((item, idx) => (
              <div
                key={`sus-${idx}`}
                className="inline-flex items-center bg-[#F4F9F5] border border-[#C5D9CB] rounded-full px-2.5 py-1"
              >
                <span className="text-xs text-[#1F4029] mr-2">{t(`features.${item.label}`, item.label)}</span>
                <DataStateBadge state={item.data_state || 'not_verified'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
