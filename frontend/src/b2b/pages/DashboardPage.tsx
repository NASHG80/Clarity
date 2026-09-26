import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getOpportunities, getDemand, getAnalytics, AnalyticsResponse } from '../../lib/api';
import { UnifiedOpportunity } from '../types/opportunity';
import KpiTile from '../components/KpiTile';
import OpportunityCard from '../components/OpportunityCard';
import { Button } from '../../shared/components/Button';
import { Loader2, AlertCircle, Plus, Camera } from 'lucide-react';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<UnifiedOpportunity[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const businessId = "biz_001";

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [oppRes, demandRes, analyticsRes] = await Promise.allSettled([
        getOpportunities(businessId),
        getDemand(businessId),
        getAnalytics(businessId)
      ]);

      if (oppRes.status === 'rejected' && demandRes.status === 'rejected' && analyticsRes.status === 'rejected') {
        throw new Error('Failed to fetch dashboard data');
      }

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value);
      }

      const unifiedOps: UnifiedOpportunity[] = [];
      const seenIds = new Set<string>();

      const sanitizeLabel = (title: string) => {
        const match = title.match(/demand gap:\s*(.*)/i);
        if (match) {
          return match[1].toLowerCase().replace(/[\s-]/g, '_');
        }
        return null;
      };

      if (oppRes.status === 'fulfilled') {
        oppRes.value.opportunities.forEach(opp => {
          const extractedLabel = sanitizeLabel(opp.title);
          
          if (extractedLabel) {
            const id = `demand_gap:${extractedLabel}`;
            if (!seenIds.has(id)) {
              seenIds.add(id);
              unifiedOps.push({
                ...opp,
                type: 'demand_gap',
                id,
                label: extractedLabel,
                is_demo_data: opp.is_demo_data ?? false,
              });
            }
          } else {
            const id = `resource:${opp.title.toLowerCase().replace(/[\s-]/g, '_')}`;
            if (!seenIds.has(id)) {
              seenIds.add(id);
              unifiedOps.push({
                ...opp,
                type: 'resource',
                id,
                is_demo_data: opp.is_demo_data ?? false,
              });
            }
          }
        });
      }

      if (demandRes.status === 'fulfilled') {
        demandRes.value.gaps?.forEach(gap => {
          const id = `demand_gap:${gap.label}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            unifiedOps.push({
              type: 'demand_gap',
              id,
              title: gap.label,
              is_demo_data: demandRes.value.is_demo_data || false,
              label: gap.label,
              demand_count: gap.count,
              property_data_state: gap.property_data_state,
              severity: 'neutral', // default
            });
          } else {
            const existing = unifiedOps.find(o => o.id === id);
            if (existing) {
              existing.demand_count = gap.count;
              existing.property_data_state = gap.property_data_state;
              existing.label = gap.label;
            }
          }
        });
      }

      setOpportunities(unifiedOps);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [businessId]);

  const isAllDemo = opportunities.length > 0 && opportunities.every(op => op.is_demo_data) && analytics?.is_demo_data;
  const hasDemo = opportunities.some(op => op.is_demo_data) || analytics?.is_demo_data;

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold text-[#26382D]">
              {t('dashboard.title', 'Partner Dashboard')}
            </h1>
            {isAllDemo && <DataStateBadge state="demo_synthetic" />}
          </div>
          <p className="text-[#26382D]/70 mt-2 text-lg">
            {t('dashboard.subtitle', 'Welcome back. Here is how your property is performing.')}
          </p>
          {hasDemo && !isAllDemo && (
            <p className="text-sm text-orange-600 mt-1">
              {t('dashboard.demoWarning', 'Note: Some metrics shown here are sample data.')}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<Camera className="w-4 h-4" />} onClick={() => navigate('/b2b/photos?id=hotel_014')}>
            {t('dashboard.uploadPhotos', 'Upload Photos')}
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/b2b/listings/editor?id=hotel_014')}>
            {t('dashboard.editListing', 'Edit Listing')}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-[#7C9278] mb-4" />
          <p className="text-[#26382D]/70">{t('dashboard.loading', 'Loading dashboard...')}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">{t('dashboard.errorTitle', 'Could not load dashboard')}</h2>
          <p className="text-red-700 mb-6">{t('dashboard.errorDesc', 'There was a problem retrieving your dashboard data. Please try again.')}</p>
          <Button variant="primary" onClick={fetchDashboardData}>
            {t('dashboard.retry', 'Retry')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {/* Performance Summary */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiTile label={t('analytics.views', 'Listing views')} value={analytics.funnel.listing_impressions?.toLocaleString() ?? 0} severity="neutral" />
              <KpiTile label={t('analytics.opens', 'Listing opens')} value={analytics.funnel.listing_opens?.toLocaleString() ?? 0} severity="neutral" />
              <KpiTile label={t('analytics.saves', 'Saves')} value={analytics.funnel.saves?.toLocaleString() ?? 0} severity="neutral" />
              <KpiTile label={t('analytics.bookings', 'Bookings')} value={analytics.funnel.bookings?.toLocaleString() ?? 0} severity="neutral" />
            </div>
          )}

          {/* Unified opportunity feed */}
          <div className="pt-8 border-t border-[#D8C9BE]/50">
            <h2 className="text-2xl font-serif font-bold text-[#26382D] mb-6">
              {t('dashboard.opportunitiesTitle', 'Recommended Actions')}
            </h2>
            {opportunities.length === 0 ? (
              <div className="bg-white border border-[#D8C9BE] rounded-xl p-12 flex flex-col items-center text-center shadow-sm">
                <div className="w-16 h-16 bg-[#F8F6F3] rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl text-[#7C9278]">✓</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#26382D] mb-2">{t('dashboard.emptyTitle', 'You are all set!')}</h2>
                <p className="text-[#26382D]/70 max-w-md">{t('dashboard.emptyDesc', 'There are currently no actionable opportunities detected for this property.')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {opportunities.map((opp, idx) => (
                  <OpportunityCard key={opp.id || idx} opportunity={opp} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
