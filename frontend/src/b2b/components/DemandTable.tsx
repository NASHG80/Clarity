import React from 'react';
import { useTranslation } from 'react-i18next';
import { DemandResponse } from '../../lib/api';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { getLocalizedLabel } from '../utils/labels';

interface DemandTableProps {
  demand: DemandResponse;
}

export default function DemandTable({ demand }: DemandTableProps) {
  const { t } = useTranslation();

  // Requirements formatting mapping: step_free_entrance -> Step-free entrance
  // (In a real app, this might use i18n keys for each label, but we format the string safely here)
  // Sort descending by count
  const sortedCounts = [...demand.requirement_search_counts].sort((a, b) => b.count - a.count);

  if (sortedCounts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] p-8 sm:p-12 text-center">
        <p className="text-[#26382D]/70 text-lg">{t('demand.empty', 'No traveler demand recorded for this period.')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] overflow-hidden">
      
      {/* Header Context */}
      <div className="p-6 border-b border-[#D8C9BE]/50 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#26382D] mb-1">
            {t('demand.title', 'Traveler Demand')}
          </h2>
          <p className="text-[#26382D]/70 text-sm">
            {t(`demand.periodThisWeek`, 'This week')}
          </p>
        </div>
        {demand.is_demo_data && (
          <div className="inline-flex items-center gap-2">
            <DataStateBadge state="demo_synthetic" />
          </div>
        )}
      </div>

      {/* Desktop Table (hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F6F3] border-b border-[#D8C9BE]">
              <th scope="col" className="py-4 px-6 font-bold text-sm uppercase tracking-wide text-[#26382D]/70">
                {t('demand.reqHeader', 'Requirement')}
              </th>
              <th scope="col" className="py-4 px-6 font-bold text-sm uppercase tracking-wide text-[#26382D]/70 text-right">
                {t('demand.searchesHeader', 'Searches')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCounts.map((item, idx) => (
              <tr key={idx} className="border-b border-[#D8C9BE]/30 last:border-0 hover:bg-[#F8F6F3]/50 transition-colors">
                <td className="py-4 px-6 text-[#26382D] font-medium whitespace-nowrap">
                  {getLocalizedLabel(item.label, t)}
                </td>
                <td className="py-4 px-6 text-[#26382D] font-semibold text-right tabular-nums">
                  {item.count.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile List (hidden on desktop) */}
      <div className="block md:hidden flex flex-col divide-y divide-[#D8C9BE]/30">
        {sortedCounts.map((item, idx) => (
          <div key={idx} className="p-5 flex flex-col gap-1">
            <span className="text-[#26382D] font-medium leading-tight">
              {getLocalizedLabel(item.label, t)}
            </span>
            <span className="text-[#7C9278] font-bold text-sm">
              {t('demand.searches', { count: item.count, formattedCount: item.count.toLocaleString() })}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
