import React from 'react';
import { useTranslation } from 'react-i18next';
import { UnifiedOpportunity } from '../types/opportunity';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { AlertCircle, ArrowUpCircle, FileQuestion, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import { getLocalizedLabel } from '../utils/labels';

interface OpportunityCardProps {
  opportunity: UnifiedOpportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { t } = useTranslation();
  
  const isRed = opportunity.severity === 'red';
  const isYellow = opportunity.severity === 'yellow';

  const severityColorBar = isRed 
    ? 'bg-red-500' 
    : isYellow 
      ? 'bg-yellow-500' 
      : 'bg-[#D8C9BE]';

  const severityLabelClasses = isRed
    ? 'bg-red-100 text-red-800 border border-red-200'
    : isYellow
      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      : 'bg-[#F8F6F3] text-[#26382D]/70 border border-[#D8C9BE]/50';

  const SeverityIcon = isRed ? AlertCircle : isYellow ? ArrowUpCircle : null;

  const severityLabelText = isRed
    ? t('oppCard.severityRed', 'Red')
    : isYellow
      ? t('oppCard.severityYellow', 'Yellow')
      : opportunity.severity === 'neutral'
        ? t('oppCard.severityNeutral', 'Neutral')
        : opportunity.severity;

  const renderPropertyState = (state: string) => {
    switch (state) {
      case 'not_verified':
        return {
          icon: <FileQuestion className="w-5 h-5 text-[#26382D]/50" />,
          text: t('propertyState.notVerified', 'No reportable information for this feature'),
          textColor: 'text-[#26382D]/70',
          bgColor: 'bg-[#F8F6F3]'
        };
      case 'reported':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
          text: t('propertyState.reported', 'Reported by property'),
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-50'
        };
      case 'verified':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-green-600" />,
          text: t('propertyState.verified', 'Verified evidence available'),
          textColor: 'text-green-800',
          bgColor: 'bg-green-50'
        };
      case 'community_confirmed':
        return {
          icon: <Users className="w-5 h-5 text-purple-600" />,
          text: t('propertyState.communityConfirmed', 'Confirmed by travelers'),
          textColor: 'text-purple-800',
          bgColor: 'bg-purple-50'
        };
      case 'demo_synthetic':
        return {
          icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
          text: t('propertyState.demoSynthetic', 'Synthetic demo data'),
          textColor: 'text-orange-800',
          bgColor: 'bg-orange-50'
        };
      default:
        return {
          icon: <FileQuestion className="w-5 h-5 text-[#26382D]/50" />,
          text: state,
          textColor: 'text-[#26382D]/70',
          bgColor: 'bg-[#F8F6F3]'
        };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] overflow-hidden flex flex-col sm:flex-row transition-shadow hover:shadow-md">
      {/* Left colored bar based on severity */}
      <div className={`w-full sm:w-2 h-2 sm:h-auto shrink-0 ${severityColorBar}`} />
      
      <div className="p-5 sm:p-6 flex-1 flex flex-col gap-4">
        {/* Header: Title + Badge */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {opportunity.type === 'demand_gap' && (
              <span className="text-xs font-bold uppercase tracking-wider text-[#26382D]/50">
                {t('oppCard.typeDemandGap', 'Traveler demand gap')}
              </span>
            )}
            {opportunity.type === 'resource' && (
              <span className="text-xs font-bold uppercase tracking-wider text-[#26382D]/50">
                {t('oppCard.typeResource', 'Resource opportunity')}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-bold text-[#26382D] font-serif leading-tight">
                {opportunity.type === 'demand_gap' && opportunity.label 
                  ? getLocalizedLabel(opportunity.label, t) 
                  : opportunity.title}
              </h3>
              {opportunity.is_demo_data && <DataStateBadge state="demo_synthetic" />}
            </div>
          </div>
          
          {/* Semantic severity label */}
          <div className="shrink-0 flex items-center gap-2">
            {SeverityIcon && <SeverityIcon className={`w-4 h-4 ${isRed ? 'text-red-500' : 'text-yellow-600'}`} />}
            {severityLabelText && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${severityLabelClasses}`}>
                {severityLabelText}
              </span>
            )}
          </div>
        </div>

        {/* Demand Gap Info */}
        {opportunity.type === 'demand_gap' && opportunity.demand_count !== undefined && (
          <div className="flex flex-col gap-3">
            <span className="text-[#26382D] font-medium">
              {t('oppCard.searchesContext', { 
                count: opportunity.demand_count,
                period: t('demand.periodThisWeek', 'this week').toLowerCase()
              })}
            </span>
            
            {opportunity.property_data_state && (() => {
              const stateConfig = renderPropertyState(opportunity.property_data_state);
              return (
                <div className={`inline-flex items-start gap-2 p-3 rounded-lg border border-white/20 ${stateConfig.bgColor} w-fit`}>
                  <div className="mt-0.5">{stateConfig.icon}</div>
                  <span className={`text-sm font-medium ${stateConfig.textColor} leading-snug`}>
                    {stateConfig.text}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* Optional Estimate */}
        {opportunity.estimate && (
          <div className="text-[#26382D]/80 font-medium">
            {t('oppCard.estimate', 'Estimated:')}{' '}
            <span className="text-[#26382D] font-semibold">{opportunity.estimate}</span>
          </div>
        )}

        {/* Suggested Action */}
        {opportunity.suggested_action && (
          <div className="bg-[#F8F6F3] rounded-lg p-4 border border-[#D8C9BE]/50 mt-1">
            <h4 className="text-xs font-bold text-[#26382D]/70 uppercase tracking-wide mb-1.5 flex items-center gap-2">
              {t('oppCard.suggestedAction', 'Suggested action')}
            </h4>
            <p className="text-[#26382D] text-sm md:text-base leading-relaxed">
              {opportunity.suggested_action}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
