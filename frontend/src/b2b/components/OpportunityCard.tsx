import React from 'react';
import { useTranslation } from 'react-i18next';
import { UnifiedOpportunity } from '../types/opportunity';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { ArrowRight, AlertCircle, LineChart, FileQuestion, Users, CheckCircle2, ShieldCheck, Leaf } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: UnifiedOpportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { t } = useTranslation();
  
  // Decide Icon based on type
  let Icon = LineChart;
  if (opportunity.type === 'demand_gap') Icon = Users;
  else if (opportunity.title.toLowerCase().includes('water') || opportunity.title.toLowerCase().includes('waste')) Icon = Leaf;

  return (
    <div className="bg-white rounded-2xl border border-[#E5DFD6] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-all overflow-hidden flex flex-col md:flex-row group">
      
      {/* Icon Area */}
      <div className="bg-[#FAF9F7] md:border-r border-[#F0EBE1] p-6 flex flex-col items-center justify-center shrink-0 w-full md:w-32 border-b md:border-b-0">
        <div className="w-12 h-12 rounded-full bg-white border border-[#E5DFD6] shadow-sm flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-[#5B6D62]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] text-center">
          {opportunity.type === 'demand_gap' ? 'Demand Gap' : 'Resource'}
        </span>
      </div>
      
      {/* Content Area */}
      <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="flex-1">
            <h3 className="text-xl font-serif font-bold text-[#1C2B22] mb-1">
              {opportunity.title}
            </h3>
            
            {/* Metric or Estimate */}
            {(opportunity.estimate || opportunity.label) && (
              <div className="mt-2 mb-3 inline-flex items-center gap-2 bg-[#F5F3ED] border border-[#E5DFD6] px-3 py-1 rounded-md text-[13px] font-bold text-[#5B6D62]">
                {opportunity.type === 'demand_gap' ? (
                  <>{opportunity.demand_count || opportunity.estimate || 'High'} searches</>
                ) : (
                  <>{opportunity.estimate}</>
                )}
              </div>
            )}
            
            <p className="text-[#3E5245] text-[15px] leading-relaxed max-w-2xl">
              {opportunity.type === 'demand_gap' 
                ? 'Property information is currently not verified.' 
                : 'Potential efficiency improvement available.'}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end">
            <button className="inline-flex items-center gap-2 text-[#7C9278] font-bold text-sm hover:text-[#1C2B22] transition-colors mt-2 md:mt-0">
              {opportunity.suggested_action}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            {opportunity.is_demo_data && (
              <div className="mt-4">
                <DataStateBadge state="demo_synthetic" />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
