import React from 'react';
import { useTranslation } from 'react-i18next';
import { DemandResponse } from '../../lib/api';
import { AlertCircle, FileQuestion, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import { getLocalizedLabel } from '../utils/labels';
import { DataStateBadge } from '../../shared/components/DataStateBadge';

interface DemandComparisonProps {
  demand: DemandResponse;
}

export default function DemandComparison({ demand }: DemandComparisonProps) {
  const { t } = useTranslation();

  const gaps = demand.gaps || [];

  if (gaps.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] p-8 sm:p-12 text-center">
        <p className="text-[#26382D]/70 text-lg">
          {t('demandComparison.empty', 'No high-demand information gaps were returned for this period.')}
        </p>
      </div>
    );
  }

  // Helper to render state appropriately
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
    <div className="flex flex-col gap-6">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#26382D] mb-1">
            {t('demandComparison.title', 'Traveler Demand vs Your Property')}
          </h2>
          <p className="text-[#26382D]/70 text-sm">
            {t('demandComparison.subtitle', 'High-demand requirements with no reportable property information')}
          </p>
        </div>
      </div>
      {demand.is_demo_data && (
        <div className="flex items-center gap-2">
          <DataStateBadge state="demo_synthetic" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gaps.map((gap, idx) => {
          const stateConfig = renderPropertyState(gap.property_data_state);

          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#D8C9BE]/50 bg-[#F8F6F3]">
                <h3 className="font-bold text-[#26382D] text-lg">
                  {getLocalizedLabel(gap.label, t)}
                </h3>
              </div>
              
              <div className="p-6 flex flex-col gap-6 flex-1">
                {/* Traveler Demand Section */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold uppercase tracking-wide text-[#26382D]/50">
                    {t('demandComparison.travelerDemandLabel', 'Traveler demand')}
                  </span>
                  <span className="text-[#26382D] font-medium">
                    {t('demandComparison.searchesContext', { 
                      count: gap.count, 
                      period: t('demand.periodThisWeek', 'this week').toLowerCase()
                    })}
                  </span>
                </div>

                {/* Property Information Section */}
                <div className="flex flex-col gap-2 mt-auto">
                  <span className="text-sm font-bold uppercase tracking-wide text-[#26382D]/50">
                    {t('demandComparison.propertyInfoLabel', 'Property information')}
                  </span>
                  <div className={`inline-flex items-start gap-2 p-3 rounded-lg border border-white/20 ${stateConfig.bgColor}`}>
                    <div className="mt-0.5">{stateConfig.icon}</div>
                    <span className={`text-sm font-medium ${stateConfig.textColor} leading-snug`}>
                      {stateConfig.text}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
