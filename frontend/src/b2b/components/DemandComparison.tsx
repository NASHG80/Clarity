import React from 'react';
import { useTranslation } from 'react-i18next';
import { DemandResponse } from '../../lib/api';
import { getLocalizedLabel } from '../utils/labels';
import { ArrowRight, AlertCircle, FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemandComparisonProps {
  demand: DemandResponse;
}

export default function DemandComparison({ demand }: DemandComparisonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gaps = demand.gaps || [];

  return (
    <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
      <div className="mb-10">
        <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">Demand Gaps</h2>
        <p className="text-[#3E5245] text-[15px] mt-1">High-demand features missing verified property data.</p>
      </div>

      {gaps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#E5DFD6] rounded-xl bg-[#F5F3ED]/50 p-6">
          <p className="text-[#5B6D62] text-[15px] font-medium text-center">
            No high-demand information gaps were returned for this period.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          {gaps.map((gap, idx) => (
            <div key={idx} className="flex flex-col border border-[#E5DFD6] rounded-xl overflow-hidden bg-[#FAF9F7] relative group">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E5DFD6]">
                
                {/* Traveler Demand */}
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] mb-3 block">Traveler Demand</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-serif font-bold text-[#1C2B22]">{gap.count.toLocaleString()}</span>
                    <span className="text-[#5B6D62] text-sm font-medium">searches</span>
                  </div>
                </div>

                {/* Property Data */}
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] mb-3 block">Property Data</span>
                  <p className="text-[#1C2B22] font-medium text-[15px] mb-1">{getLocalizedLabel(gap.label, t)}</p>
                  <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200/50 w-max">
                    <FileQuestion className="w-3.5 h-3.5" />
                    Not verified
                  </div>
                </div>
              </div>

              {/* Action */}
              <button 
                onClick={() => navigate('/onboarding')}
                className="w-full p-4 border-t border-[#E5DFD6] bg-white flex justify-between items-center transition-colors hover:bg-[#FDFCFB] group cursor-pointer focus:outline-none focus:bg-[#FDFCFB]"
              >
                <span className="text-[13px] font-bold text-[#3E5245]">Review or add accessibility information</span>
                <ArrowRight className="w-4 h-4 text-[#7C9278] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
