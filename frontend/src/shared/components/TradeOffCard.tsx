import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Star, Check } from 'lucide-react';
import { DataStateBadge } from './DataStateBadge';

export type EmissionsData =
  | {
      co2e_kg: number;
      method: 'estimated';
      distance_km: number;
      emission_factor: number;
    }
  | {
      co2e_kg: number;
      method: 'route_benchmark';
      benchmark_kg: number;
      reduction_pct: number;
    };

export interface AccessibilityData {
  value: string | null;
  data_state: string; // 'verified' | 'reported' | 'community_confirmed' | 'not_verified' | 'demo_synthetic'
}

export interface TradeOffCardProps {
  // Identity
  title: string;
  subtitle?: string;
  imageSlot?: React.ReactNode;
  badgeSlot?: React.ReactNode;

  // Primary trade-off dimensions
  costInr?: number;
  durationMinutes?: number;
  emissions?: EmissionsData;
  accessibility?: AccessibilityData;
  convenience?: string | null;

  // Secondary elements
  personalMatchPct?: number;
  tradeOffSummary?: string[];

  // Interactive slots
  actionSlot?: React.ReactNode;
  
  // Container props
  className?: string;
}

export function TradeOffCard({
  title,
  subtitle,
  imageSlot,
  badgeSlot,
  costInr,
  durationMinutes,
  emissions,
  accessibility,
  convenience,
  personalMatchPct,
  tradeOffSummary,
  actionSlot,
  className = '',
}: TradeOffCardProps) {
  const { t } = useTranslation();

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(cost);
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <article
      className={`bg-[#F8F6F3] rounded-2xl shadow-[0_4px_16px_rgba(38,56,45,0.03)] border border-[#D8C9BE]/50 overflow-hidden flex flex-col transition-all hover:shadow-[0_4px_20px_rgba(38,56,45,0.06)] ${className}`}
    >
      {/* Optional Top Image */}
      {imageSlot}

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Header Section */}
        <header className="flex justify-between items-start gap-4 mb-5">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-[#26382D] truncate whitespace-normal leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-[#26382D]/70 mt-0.5 line-clamp-1">{subtitle}</p>
            )}
          </div>
          {badgeSlot && <div className="shrink-0">{badgeSlot}</div>}
        </header>

        {/* 5 Primary Dimensions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4 mb-6">
          
          {/* Cost */}
          {costInr !== undefined && (
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-[#26382D]/60 mb-0.5">
                {t('tradeoff.cost', 'Cost')}
              </span>
              <span className="text-base sm:text-lg font-medium text-[#26382D]">
                {formatCost(costInr)}
              </span>
            </div>
          )}

          {/* Time */}
          {durationMinutes !== undefined && (
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-[#26382D]/60 mb-0.5">
                {t('tradeoff.time', 'Time')}
              </span>
              <span className="text-base sm:text-lg font-medium text-[#26382D]">
                {formatTime(durationMinutes)}
              </span>
            </div>
          )}

          {/* CO2 */}
          {emissions !== undefined && (
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-[#26382D]/60 mb-0.5">
                {t('tradeoff.co2', 'CO₂')}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-medium text-[#26382D]">
                  {emissions.co2e_kg} kg
                </span>
                <button
                  type="button"
                  aria-label={t('tradeoff.emissionsInfo', 'Emissions info')}
                  className="text-[#26382D]/40 hover:text-[#7C9278] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] rounded-full shrink-0"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-[#26382D]/50 mt-0.5">
                {emissions.method === 'estimated'
                  ? t('tradeoff.estimated', 'Estimated')
                  : t('tradeoff.routeBenchmark', 'Route benchmark')}
              </span>
            </div>
          )}

          {/* Accessibility */}
          {accessibility !== undefined && (
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-[#26382D]/60 mb-1">
                {t('tradeoff.accessibility', 'Accessibility')}
              </span>
              <div className="flex flex-col items-start gap-1.5">
                {accessibility.value ? (
                  <span className="text-sm font-medium text-[#26382D] leading-tight">
                    {accessibility.value}
                  </span>
                ) : (
                  <span className="text-sm text-[#26382D]/50 italic">
                    {t('tradeoff.unavailable', 'Unavailable')}
                  </span>
                )}
                {/* Rely on B1 shared DataStateBadge */}
                <DataStateBadge state={accessibility.data_state} />
              </div>
            </div>
          )}

          {/* Convenience */}
          {convenience !== undefined && (
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-[#26382D]/60 mb-0.5">
                {t('tradeoff.convenience', 'Convenience')}
              </span>
              {convenience ? (
                <span className="text-base font-medium text-[#26382D]">
                  {convenience}
                </span>
              ) : (
                <span className="text-sm text-[#26382D]/50 italic">
                  {t('tradeoff.unavailable', 'Unavailable')}
                </span>
              )}
            </div>
          )}

        </div>

        {/* Secondary / Supporting Information */}
        {(personalMatchPct !== undefined || (tradeOffSummary && tradeOffSummary.length > 0)) && (
          <div className="mt-auto pt-4 border-t border-[#D8C9BE]/40 space-y-4">
            
            {/* Personal Match */}
            {personalMatchPct !== undefined && (
              <div className="flex items-center gap-2 text-[#7C9278]">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">
                  {t('tradeoff.personalMatch', 'Personal Match')}: {personalMatchPct}%
                </span>
              </div>
            )}
            
            {/* Summary List */}
            {tradeOffSummary && tradeOffSummary.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[#26382D]/80 uppercase tracking-wider">
                  {t('tradeoff.whyThisOption', 'Why this option')}
                </p>
                <ul className="space-y-1.5">
                  {tradeOffSummary.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#26382D]/80 leading-snug">
                      <Check className="w-4 h-4 text-[#7C9278] mt-0.5 shrink-0" />
                      <span className="min-w-0 break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Area */}
        {actionSlot && (
          <footer className="mt-5 pt-4 border-t border-[#D8C9BE]/40 flex flex-wrap justify-end gap-3">
            {actionSlot}
          </footer>
        )}
      </div>
    </article>
  );
}
