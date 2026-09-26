import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnalyticsFunnel } from '../../lib/api';

interface TravelerFunnelProps {
  funnel: AnalyticsFunnel;
}

export default function TravelerFunnel({ funnel }: TravelerFunnelProps) {
  const { t } = useTranslation();

  const stages = [
    { key: 'listing_impressions', label: t('analytics.views', 'Listing views'), value: funnel.listing_impressions ?? 0 },
    { key: 'listing_opens', label: t('analytics.opens', 'Listing opens'), value: funnel.listing_opens ?? 0 },
    { key: 'detail_opens', label: t('analytics.detailOpens', 'Detail views'), value: funnel.detail_opens ?? 0 },
    { key: 'saves', label: t('analytics.saves', 'Saves'), value: funnel.saves ?? 0 },
    { key: 'booking_starts', label: t('analytics.bookingStarts', 'Booking starts'), value: funnel.booking_starts ?? 0 },
    { key: 'bookings', label: t('analytics.bookings', 'Bookings'), value: funnel.bookings ?? 0 },
  ];

  const maxVal = Math.max(...stages.map(s => s.value));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] p-6 sm:p-8">
      <h2 className="text-xl font-serif font-bold text-[#26382D] mb-8">
        {t('analytics.funnelTitle', 'Traveler Funnel')}
      </h2>

      {/* Mobile Layout: Vertical Stacked List */}
      <div className="flex flex-col gap-6 md:hidden">
        {stages.map((stage, i) => {
          const pct = maxVal > 0 ? (stage.value / maxVal) * 100 : 0;
          return (
            <div key={stage.key} className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-[#26382D] font-bold text-sm">
                  <span className="text-[#7C9278] mr-2">{String(i + 1).padStart(2, '0')}</span>
                  {stage.label}
                </span>
                <span className="text-[#26382D] font-medium">
                  {stage.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-[#F8F6F3] rounded-full overflow-hidden border border-[#D8C9BE]/50">
                <div 
                  className="h-full bg-[#7C9278] transition-all duration-500 ease-out" 
                  style={{ width: `${pct}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Layout: Centered Funnel Visualization */}
      <div className="hidden md:flex flex-col items-center w-full py-4">
        {stages.map((stage, idx) => {
          const pct = maxVal > 0 ? (stage.value / maxVal) * 100 : 0;
          return (
            <div key={stage.key} className="w-full flex flex-col items-center">
              <span className="text-[#26382D] font-bold text-xl mb-2">
                {stage.value.toLocaleString()}
              </span>
              <div 
                className="bg-[#E7E2DB] border border-[#D8C9BE] h-14 flex items-center justify-center rounded-lg px-6 shadow-sm transition-all duration-500 ease-out"
                style={{ width: `max(220px, ${pct}%)` }}
                title={`${stage.label}: ${stage.value.toLocaleString()}`}
              >
                <span className="text-[#26382D] font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                  {stage.label}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div className="h-8 w-px bg-[#D8C9BE] my-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
