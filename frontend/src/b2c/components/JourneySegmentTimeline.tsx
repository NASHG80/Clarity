import React from 'react';
import { useTranslation } from 'react-i18next';
import { TransportSegment } from '../../lib/api';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { Train, Bus, Info, ShieldCheck, ShieldAlert, Navigation } from 'lucide-react';

interface JourneySegmentTimelineProps {
  segments: TransportSegment[];
}

function getModeIcon(mode: string) {
  switch (mode.toLowerCase()) {
    case 'train':
    case 'metro':
      return <Train className="w-5 h-5" />;
    case 'bus':
    case 'shuttle':
      return <Bus className="w-5 h-5" />;
    default:
      return <Navigation className="w-5 h-5" />;
  }
}

export default function JourneySegmentTimeline({ segments }: JourneySegmentTimelineProps) {
  const { t } = useTranslation('b2c');

  const getModeTranslation = (mode: string) => {
    const key = `journey.mode.${mode.toLowerCase()}`;
    const translated = t(key);
    // If translation doesn't exist, it returns the key. Fallback to raw mode.
    if (translated === key) {
      return mode;
    }
    return translated;
  };

  if (!segments || segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#F8F6F3] rounded-xl text-[#7C9278]">
        <Info className="w-8 h-8 mb-3 opacity-50" />
        <p>{t('journey.empty')}</p>
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-[#D8C9BE] ml-4 md:ml-6 space-y-8 py-2">
      {segments.map((segment, index) => {
        // Accessibility logic per segment
        const hasAccessibleField = segment.accessible !== undefined;
        const isAccessible = segment.accessible;
        
        // If data_state missing, treat as not verified
        const dataState = segment.data_state || 'not_verified';
        const isNotVerified = dataState === 'not_verified';

        return (
          <div key={index} className="relative pl-8 md:pl-10">
            {/* Timeline node */}
            <div className="absolute -left-[17px] md:-left-[17px] top-1 w-8 h-8 bg-white border-2 border-[#D8C9BE] rounded-full flex items-center justify-center text-[#7C9278]">
              {getModeIcon(segment.type)}
            </div>

            <div className="bg-white rounded-xl p-4 md:p-5 border border-[#D8C9BE] shadow-sm flex flex-col gap-3">
              {/* Header: Mode & Basics */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-serif text-lg font-medium text-[#26382D] capitalize">
                  {getModeTranslation(segment.type)}
                </h4>
                
                <div className="flex items-center gap-3 text-sm text-[#A99587]">
                  {segment.distance_m !== undefined && (
                    <span className="font-mono">
                      {t('journey.distance', { distance: segment.distance_m })}
                    </span>
                  )}
                  {segment.duration_minutes !== undefined && (
                    <span className="font-mono bg-[#F8F6F3] px-2 py-1 rounded text-[#26382D]">
                      {t('journey.duration', { minutes: segment.duration_minutes })}
                    </span>
                  )}
                </div>
              </div>

              {/* Accessibility */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F8F6F3]">
                <div className="flex items-center gap-2">
                  {hasAccessibleField ? (
                    isAccessible ? (
                      <div className="flex items-center gap-1.5 text-[#26382D]">
                        <ShieldCheck className="w-4 h-4 text-[#7C9278]" />
                        <span className="text-sm font-medium">{t('journey.accessible')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#26382D]">
                        <ShieldAlert className="w-4 h-4 text-red-700/70" />
                        <span className="text-sm font-medium">{t('journey.inaccessible')}</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 text-[#A99587]">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-sm italic">{t('journey.notVerified')}</span>
                    </div>
                  )}
                </div>

                {/* Data State Badge (Person B component integration) */}
                <div className="scale-90 origin-right">
                  <DataStateBadge state={dataState} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
