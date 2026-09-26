import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnalytics, AnalyticsResponse, getDemand, DemandResponse } from '../../lib/api';
import KpiTile from '../components/KpiTile';
import TravelerFunnel from '../components/TravelerFunnel';
import DemandTable from '../components/DemandTable';
import DemandComparison from '../components/DemandComparison';
import { Navbar } from '../../shared/components/Navbar';
import { Button } from '../../shared/components/Button';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { DataStateBadge } from '../../shared/components/DataStateBadge';

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [demandData, setDemandData] = useState<DemandResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const businessId = "biz_001"; // Default identity for prototype

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [analyticsRes, demandRes] = await Promise.all([
        getAnalytics(businessId),
        getDemand(businessId)
      ]);
      setData(analyticsRes);
      setDemandData(demandRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#26382D]">
            {t('analytics.title', 'Weekly Listing Analytics')}
          </h1>
          
          {data && (
            <div className="mt-2 flex flex-col items-start gap-4">
              <p className="text-[#26382D]/70 text-lg capitalize">
                {t(`analytics.period${data.period === 'this_week' ? 'ThisWeek' : ''}`, data.period.replace('_', ' '))}
              </p>
              
              {data.is_demo_data && (
                <div className="inline-flex items-center gap-3 bg-orange-50 border border-orange-200 px-4 py-2 rounded-lg">
                  <DataStateBadge state="demo_synthetic" />
                  <span className="text-orange-800 text-sm font-medium">
                    {t('analytics.demoWarning', 'Demo data — sample metrics for prototype use')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-[#7C9278] mb-4" />
            <p className="text-[#26382D]/70">{t('analytics.loading', 'Loading analytics...')}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">{t('analytics.errorTitle', 'Could not load analytics')}</h2>
            <p className="text-red-700 mb-6">{t('analytics.errorDesc', 'There was a problem retrieving your analytics data. Please try again.')}</p>
            <Button variant="primary" onClick={fetchData}>
              {t('analytics.retry', 'Retry')}
            </Button>
          </div>
        ) : data && demandData ? (
          <>
            {/* =========================================
                DESKTOP LAYOUT (Hidden on mobile)
                ========================================= */}
            <div className="hidden lg:flex flex-col gap-8">
              {/* Desktop: KPI Row (4 columns wrapped) */}
              <div className="grid grid-cols-4 xl:grid-cols-6 gap-4">
                <KpiTile label={t('analytics.views', 'Listing views')} value={data.funnel.listing_impressions?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.opens', 'Listing opens')} value={data.funnel.listing_opens?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.detailOpens', 'Detail views')} value={data.funnel.detail_opens?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.saves', 'Saves')} value={data.funnel.saves?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.bookingStarts', 'Booking starts')} value={data.funnel.booking_starts?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.bookings', 'Bookings')} value={data.funnel.bookings?.toLocaleString() ?? 0} severity="neutral" />
              </div>

              <div className="grid grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="col-span-8 flex flex-col gap-8">
                  <TravelerFunnel funnel={data.funnel} />
                  <DemandComparison demand={demandData} />
                  <DemandTable demand={demandData} />
                </div>
                
                {/* Side Content Area */}
                <div className="col-span-4 flex flex-col gap-8">
                  {data.signals && data.signals.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] p-6 sticky top-8">
                      <h3 className="text-sm font-bold text-[#26382D]/70 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {t('analytics.insightSignal', 'Analytics Insight')}
                      </h3>
                      <ul className="space-y-3">
                        {data.signals.map((signal, idx) => (
                          <li key={idx} className="text-[#26382D] flex items-start gap-2">
                            <span className="text-[#7C9278] mt-1">•</span>
                            <span>{signal.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* =========================================
                MOBILE LAYOUT (Hidden on desktop)
                ========================================= */}
            <div className="flex lg:hidden flex-col gap-8">
              {/* Mobile: 2-Column Stacked KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <KpiTile label={t('analytics.views', 'Listing views')} value={data.funnel.listing_impressions?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.opens', 'Listing opens')} value={data.funnel.listing_opens?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.detailOpens', 'Detail views')} value={data.funnel.detail_opens?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.saves', 'Saves')} value={data.funnel.saves?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.bookingStarts', 'Booking starts')} value={data.funnel.booking_starts?.toLocaleString() ?? 0} severity="neutral" />
                <KpiTile label={t('analytics.bookings', 'Bookings')} value={data.funnel.bookings?.toLocaleString() ?? 0} severity="neutral" />
              </div>

              {/* Mobile: Signals grouped high for visibility */}
              {data.signals && data.signals.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] p-5">
                  <h3 className="text-sm font-bold text-[#26382D]/70 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {t('analytics.insightSignal', 'Analytics Insight')}
                  </h3>
                  <ul className="space-y-3">
                    {data.signals.map((signal, idx) => (
                      <li key={idx} className="text-[#26382D] text-sm flex items-start gap-2">
                        <span className="text-[#7C9278] mt-0.5">•</span>
                        <span>{signal.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mobile: Vertical Funnel component */}
              <TravelerFunnel funnel={data.funnel} />
              
              {/* Mobile: Stacked Demand Gap Cards */}
              <DemandComparison demand={demandData} />
              
              {/* Mobile: Stacked Demand List */}
              <DemandTable demand={demandData} />
            </div>
          </>
        ) : null}
    </main>
  );
}
