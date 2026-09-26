import React from 'react';
import { useTranslation } from 'react-i18next';
import { DemandResponse } from '../../../lib/api';
import { getLocalizedLabel } from '../../utils/labels';

interface DemandChartProps {
  demand: DemandResponse;
}

export function DemandChart({ demand }: DemandChartProps) {
  const { t } = useTranslation();

  const sortedCounts = [...demand.requirement_search_counts].sort((a, b) => b.count - a.count);
  const maxCount = sortedCounts.length > 0 ? sortedCounts[0].count : 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
      <div className="mb-10">
        <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">
          What Travelers Are Looking For
        </h2>
        <p className="text-[#3E5245] text-[15px] mt-1">
          Accessibility requirements appearing in recent travel searches.
        </p>
      </div>

      {sortedCounts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#E5DFD6] rounded-xl bg-[#F5F3ED]/50 p-6">
          <p className="text-[#5B6D62] text-[15px] font-medium text-center">
            No traveler demand recorded for this period.
          </p>
        </div>
      ) : (
        <div className="space-y-6 flex-1">
          {sortedCounts.map((item, index) => {
            const percentage = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
            // First item gets a slightly darker highlight color as requested "subtle accent colors"
            const barColor = index === 0 ? 'bg-[#5B6D62]' : 'bg-[#A69C8E]';
            
            return (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline text-sm">
                  <span className="font-bold text-[#1C2B22] text-[15px] truncate pr-4">{getLocalizedLabel(item.label, t)}</span>
                  <span className="font-bold text-[#5B6D62] text-[13px] tracking-wide shrink-0">{item.count.toLocaleString()} searches</span>
                </div>
                <div className="w-full bg-[#F5F3ED] rounded-sm h-3 overflow-hidden">
                  <div 
                    className={`${barColor} h-full rounded-sm transition-all duration-1000 ease-out`} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
