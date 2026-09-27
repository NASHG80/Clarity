import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UnifiedOpportunity } from '../types/opportunity';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { ArrowRight, AlertCircle, LineChart, FileQuestion, Users, CheckCircle2, ShieldCheck, Leaf, ArrowUpRight } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: UnifiedOpportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Decide Icon based on type
  let Icon = LineChart;
  if (opportunity.type === 'demand_gap') Icon = Users;
  else if (opportunity.title.toLowerCase().includes('water') || opportunity.title.toLowerCase().includes('waste')) Icon = Leaf;

  const getSeverityStyle = (severity?: string) => {
    return 'border-[#E5DFD6] bg-[#F8F6F3] text-[#5B6D62]';
  };
  
  const getSeverityLabel = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'red':
        return t('severity.red', 'RED');
      case 'medium':
      case 'yellow':
        return t('severity.yellow', 'YELLOW');
      default:
        return t('severity.neutral', 'NEUTRAL');
    }
  };

  const getCategory = () => {
    if (opportunity.type === 'demand_gap') return t('category.accessibility', 'ACCESSIBILITY');
    if (opportunity.title.toLowerCase().includes('water') || opportunity.title.toLowerCase().includes('waste')) return t('category.sustainability', 'SUSTAINABILITY');
    return t('category.operations', 'OPERATIONS');
  };

  const severityStyle = getSeverityStyle(opportunity.severity);

  return (
    <div className="rounded-xl border border-[#E5DFD6] bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
      <div className="p-6 md:p-8 flex-1 flex flex-col">
        {/* Header line */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${severityStyle}`}>
              {getSeverityLabel(opportunity.severity)} &middot; {getCategory()}
            </div>
            {opportunity.is_demo_data && (
              <DataStateBadge state="demo_synthetic" />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-serif font-bold text-[#1C2B22] mb-4 capitalize">
          {opportunity.type === 'demand_gap' 
            ? (opportunity.title.toLowerCase().startsWith('demand gap:') 
                ? opportunity.title 
                : `${t('opportunity.demandGapPrefix', 'Demand gap:')} ${opportunity.title.replace(/_/g, ' ')}`)
            : opportunity.title}
        </h3>
        
        {/* Reasoning / Metric */}
        <div className="mb-6 text-[#3E5245] text-[15px] leading-relaxed">
          {opportunity.type === 'demand_gap' ? (
            <p>{opportunity.demand_count} {t('opportunity.travelerSearched', 'travelers searched for this feature')}</p>
          ) : (
            <p>{opportunity.estimate}</p>
          )}
        </div>

        <div className="mt-auto pt-5 border-t border-[#F0EBE1] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#5B6D62] mb-1">
              {t('opportunity.suggestedAction', 'Suggested action')}
            </p>
            <p className="text-[#1C2B22] font-medium">
              {opportunity.suggested_action || t('opportunity.defaultAction', 'Review and update property information')}
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/b2b/listings')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#26382D] text-white rounded-lg text-sm font-bold hover:bg-[#1C2B22] transition-colors shrink-0 group"
          >
            {t('opportunity.viewDetails', 'View details')}
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
