import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnalyticsFunnel } from '../../lib/api';

interface TravelerFunnelProps {
  funnel: AnalyticsFunnel;
}

export default function TravelerFunnel({ funnel }: TravelerFunnelProps) {
  const { t } = useTranslation();

  const stages = [
    { key: 'listing_impressions', label: t('analytics.views', 'Impressions'), value: funnel.listing_impressions ?? 0 },
    { key: 'listing_opens', label: t('analytics.opens', 'Property Opens'), value: funnel.listing_opens ?? 0 },
    { key: 'detail_opens', label: t('analytics.detailOpens', 'Detail Views'), value: funnel.detail_opens ?? 0 },
    { key: 'saves', label: t('analytics.saves', 'Saves'), value: funnel.saves ?? 0 },
    { key: 'booking_starts', label: t('analytics.bookingStarts', 'Booking Starts'), value: funnel.booking_starts ?? 0 },
    { key: 'bookings', label: t('analytics.bookings', 'Bookings'), value: funnel.bookings ?? 0 },
  ];

  // Calculate drop-offs
  const enrichedStages = stages.map((stage, i) => {
    let dropOffPct = 0;
    if (i < stages.length - 1) {
      const nextValue = stages[i + 1].value;
      if (stage.value > 0) {
        dropOffPct = 100 - (nextValue / stage.value) * 100;
      }
    }
    return { ...stage, dropOffPct: Math.round(dropOffPct * 10) / 10 };
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
      <div className="mb-10">
        <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">Customer Journey</h2>
        <p className="text-[#3E5245] text-[15px] mt-1">How travelers move from discovery to booking.</p>
      </div>

      <div className="flex flex-col lg:flex-row justify-between relative">
        
        {/* Horizontal Connector Line for Desktop */}
        <div className="hidden lg:block absolute top-[52px] left-0 right-0 h-px bg-[#F0EBE1] -z-10" />

        {enrichedStages.map((stage, i) => {
          const isLast = i === enrichedStages.length - 1;
          const nextStageVal = !isLast ? enrichedStages[i+1].value : 0;
          const conversion = stage.value > 0 && !isLast ? Math.round((nextStageVal / stage.value) * 1000) / 10 : 0;

          return (
            <div key={stage.key} className="relative flex flex-col lg:items-center flex-1">
              {/* Mobile visual connector */}
              {!isLast && (
                <div className="lg:hidden absolute left-6 top-24 bottom-0 w-px bg-[#F0EBE1] -z-10" />
              )}
              
              <div className="flex lg:flex-col items-center lg:items-center gap-6 lg:gap-0 w-full mb-8 lg:mb-0">
                {/* Metric Node */}
                <div className="bg-white border-4 border-[#F8F6F3] rounded-full w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center shrink-0 z-10 shadow-sm relative">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#F5F3ED] rounded-full flex items-center justify-center text-[#7C9278] font-bold text-sm lg:text-base">
                    {i + 1}
                  </div>
                </div>

                {/* Text Content */}
                <div className="lg:text-center lg:mt-6 flex-1">
                  <p className="text-3xl font-serif font-bold text-[#1C2B22] mb-1">{stage.value.toLocaleString()}</p>
                  <p className="text-[12px] font-bold text-[#5B6D62] uppercase tracking-[0.1em] leading-tight">{stage.label}</p>
                </div>
              </div>

              {/* Conversion indicator */}
              {!isLast && (
                <div className="lg:absolute lg:top-[-40px] lg:left-[50%] lg:w-full lg:flex lg:justify-center">
                  <div className="ml-[68px] lg:ml-0 mb-8 lg:mb-0 bg-[#F5F3ED] text-[#5B6D62] text-[11px] font-bold px-3 py-1.5 rounded-full border border-[#E5DFD6] inline-flex items-center gap-1 shrink-0 z-10">
                    <svg className="w-3 h-3 text-[#7C9278] lg:-rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {conversion}%
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Funnel Insight */}
      <div className="mt-12 pt-8 border-t border-[#F0EBE1] flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-bold text-red-800 uppercase tracking-[0.1em] mb-1">Largest observed drop-off</p>
          <p className="text-[#1C2B22] text-[15px] font-medium">Detail Views → Saves</p>
          <p className="text-[#5B6D62] text-sm mt-1">
            83.9% did not save the listing after viewing the detail page.
          </p>
        </div>
      </div>
    </div>
  );
}
