import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getOpportunities, 
  getDemand, 
  getAnalytics, 
  getListingDetail,
  AnalyticsResponse,
  ListingDetailResponse 
} from '../../lib/api';
import { UnifiedOpportunity } from '../types/opportunity';
import KpiTile from '../components/KpiTile';
import OpportunityCard from '../components/OpportunityCard';
import TravelerFunnel from '../components/TravelerFunnel';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { Button } from '../../shared/components/Button';
import { Loader2, AlertCircle, Sparkles, Building2, Eye, MousePointerClick, Bookmark, CalendarCheck, CheckCircle2, Users, Leaf } from 'lucide-react';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [opportunities, setOpportunities] = useState<UnifiedOpportunity[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [listing, setListing] = useState<ListingDetailResponse | null>(null);
  const [demandGaps, setDemandGaps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const businessId = "biz_001";
  const listingId = "hotel_014";

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [oppRes, demandRes, analyticsRes, listingRes] = await Promise.allSettled([
        getOpportunities(businessId),
        getDemand(businessId),
        getAnalytics(businessId),
        getListingDetail(listingId)
      ]);

      if (oppRes.status === 'rejected' && demandRes.status === 'rejected' && analyticsRes.status === 'rejected') {
        throw new Error('Failed to fetch dashboard data');
      }

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value);
      }

      if (listingRes.status === 'fulfilled') {
        setListing(listingRes.value);
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

      const gaps: any[] = [];
      if (demandRes.status === 'fulfilled') {
        demandRes.value.gaps?.forEach(gap => {
          gaps.push(gap);
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
      setDemandGaps(gaps);
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

  const hasDemo = opportunities.some(op => op.is_demo_data) || analytics?.is_demo_data;
  
  const redOps = opportunities.filter(o => o.severity === 'red' || o.severity === 'high');
  const yellowOps = opportunities.filter(o => o.severity === 'yellow' || o.severity === 'medium');

  const lang = i18n.language as 'en' | 'hi' | 'mr';
  const propertyName = listing?.translations?.[lang]?.name || listing?.translations?.en?.name || t('dashboard.yourProperty', 'Your Property');
  
  const renderAccessInfo = (key: string, label: string) => {
    const item = listing?.accessibility_items?.find(i => i.label === key);
    if (!item) return null;
    return (
      <div className="flex items-center gap-2 mb-2">
        <DataStateBadge state={item.data_state as any} />
        <span className="text-[#3E5245] text-sm">{label}</span>
      </div>
    );
  };

  const renderSustainabilityInfo = (key: string, label: string) => {
    const item = listing?.sustainability_items?.find(i => i.label === key);
    if (!item) return null;
    return (
      <div className="flex items-center gap-2 mb-2">
        <DataStateBadge state={item.data_state as any} />
        <span className="text-[#3E5245] text-sm">{label}</span>
      </div>
    );
  };

  return (
    <main className="w-full h-full flex flex-col bg-[#FAF9F7] font-sans pb-20">
      {/* HEADER HERO */}
      <header className="bg-white border-b border-[#D8C9BE] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#7C9278]" />
              <span className="text-sm font-bold uppercase tracking-[0.15em] text-[#5B6D62]">
                {t('dashboard.opportunityDetector', 'Opportunity Detector')}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#1C2B22] leading-tight mb-2">
              {t('dashboard.recommendationsFor', 'Your recommendations for')} {propertyName}
            </h1>
            <div className="flex items-center gap-3 text-[#3E5245] text-[15px]">
              {listing?.city && (
                <>
                  <span className="flex items-center gap-1"><Building2 className="w-4 h-4"/> {listing.city}</span>
                  <span>&middot;</span>
                </>
              )}
              {listing?.price_inr_per_night && (
                <>
                  <span>₹{listing.price_inr_per_night.toLocaleString('en-IN')}/night</span>
                  <span>&middot;</span>
                </>
              )}
              <span className="text-yellow-500">{'★'.repeat(listing?.star_rating || 5)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#7C9278] mb-4" />
            <p className="text-[#26382D]/70">{t('dashboard.loading', 'Loading intelligence...')}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">{t('dashboard.errorTitle', 'Could not load dashboard')}</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <Button variant="primary" onClick={fetchDashboardData}>{t('dashboard.retry', 'Retry')}</Button>
          </div>
        ) : (
          <>
            {/* KPI ANALYTICS ROW */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1C2B22]">{t('analytics.performanceMetrics', 'Performance Metrics')}</h2>
                {hasDemo && (
                  <DataStateBadge state="demo_synthetic" />
                )}
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-[#D8C9BE] shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#5B6D62]">{t('analytics.views', 'Listing Views')}</span>
                    <Eye className="w-4 h-4 text-[#7C9278]" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#1C2B22]">
                    {analytics?.funnel.listing_impressions?.toLocaleString() ?? 0}
                  </div>
                  <div className="text-[13px] text-[#7C9278] font-medium mt-1">{t('analytics.thisWeek', 'this week')}</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#D8C9BE] shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#5B6D62]">{t('analytics.opens', 'Listing Opens')}</span>
                    <MousePointerClick className="w-4 h-4 text-[#7C9278]" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#1C2B22]">
                    {analytics?.funnel.listing_opens?.toLocaleString() ?? 0}
                  </div>
                  <div className="text-[13px] text-[#7C9278] font-medium mt-1">{t('analytics.thisWeek', 'this week')}</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#D8C9BE] shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#5B6D62]">{t('analytics.saves', 'Saves')}</span>
                    <Bookmark className="w-4 h-4 text-[#7C9278]" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#1C2B22]">
                    {analytics?.funnel.saves?.toLocaleString() ?? 0}
                  </div>
                  <div className="text-[13px] text-[#7C9278] font-medium mt-1">{t('analytics.thisWeek', 'this week')}</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#D8C9BE] shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#5B6D62]">{t('analytics.bookings', 'Bookings')}</span>
                    <CalendarCheck className="w-4 h-4 text-[#7C9278]" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#1C2B22]">
                    {analytics?.funnel.bookings?.toLocaleString() ?? 0}
                  </div>
                  <div className="text-[13px] text-[#7C9278] font-medium mt-1">{t('analytics.thisWeek', 'this week')}</div>
                </div>
              </div>
            </section>

            {/* GRAPHS ROW: Traveler Funnel & Opportunity Mix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {analytics && <TravelerFunnel funnel={analytics.funnel} />}
              </div>
              
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#1C2B22]">{t('dashboard.actionPriority', 'Action Priority')}</h2>
                  <p className="text-[#5B6D62] text-[14px] mt-1">{opportunities.length} {t('dashboard.totalRecs', 'total recommendations')}</p>
                </div>
                
                <div className="mt-8">
                  <div className="w-full h-3 flex rounded-full overflow-hidden mb-6 bg-[#F0EBE1]">
                    <div style={{ width: `${(redOps.length / Math.max(opportunities.length, 1)) * 100}%` }} className="bg-[#E88D67]" />
                    <div style={{ width: `${(yellowOps.length / Math.max(opportunities.length, 1)) * 100}%` }} className="bg-[#F4C753]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-[#F0EBE1] bg-[#FAF9F7] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-serif font-bold text-[#1C2B22]">{redOps.length}</span>
                      <span className="text-[11px] font-bold text-[#E88D67] uppercase tracking-wider mt-1">{t('severity.red', 'Critical')}</span>
                    </div>
                    <div className="border border-[#F0EBE1] bg-[#FAF9F7] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-serif font-bold text-[#1C2B22]">{yellowOps.length}</span>
                      <span className="text-[11px] font-bold text-[#D4A017] uppercase tracking-wider mt-1">{t('severity.yellow', 'Review')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RECOMMENDATIONS SECTION */}
            <section className="pt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">{t('dashboard.recommendations', 'Recommendations')}</h2>
                <p className="text-[#5B6D62] text-[15px]">{t('dashboard.improveWhatMatters', 'Improve what matters most')}</p>
              </div>

              {opportunities.length === 0 ? (
                <div className="bg-white border border-[#D8C9BE] rounded-xl p-12 flex flex-col items-center text-center shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-[#7C9278] mb-4" />
                  <h3 className="text-lg font-serif font-bold text-[#1C2B22] mb-1">{t('dashboard.emptyOppsTitle', 'No new opportunities right now')}</h3>
                  <p className="text-[#5B6D62]">{t('dashboard.emptyOppsDesc', 'Your property has no additional recommendations at this time.')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...opportunities].sort((a, b) => {
                    if (a.severity === 'red' || a.severity === 'high') return -1;
                    if (b.severity === 'red' || b.severity === 'high') return 1;
                    return 0;
                  }).map((opp, idx) => (
                    <OpportunityCard key={opp.id || idx} opportunity={opp} />
                  ))}
                </div>
              )}
            </section>

            {/* BOTTOM SECTION: TRAVELER DEMAND & PROPERTY AT A GLANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
              
              {/* Traveler Demand */}
              <section className="bg-white rounded-2xl border border-[#E5DFD6] p-8 shadow-sm">
                <h2 className="text-xl font-serif font-bold text-[#1C2B22] mb-6">{t('dashboard.travelerDemand', 'Traveler Demand')}</h2>
                {demandGaps.length === 0 ? (
                  <p className="text-[#5B6D62]">{t('dashboard.noDemandData', 'Not enough search data available yet.')}</p>
                ) : (
                  <div className="space-y-6">
                    {demandGaps.map((gap, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#F0EBE1] bg-[#FAF9F7]">
                        <div>
                          <p className="text-[15px] font-bold text-[#1C2B22] mb-1 capitalize">{gap.label?.replace(/_/g, ' ')}</p>
                          <p className="text-[14px] text-[#5B6D62]">{gap.count} {t('dashboard.searches', 'searches')}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[12px] font-bold uppercase tracking-wider text-[#5B6D62] mb-1">{t('dashboard.yourProperty', 'Your property')}</p>
                          <DataStateBadge state={gap.property_data_state || 'not_verified'} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Property Snapshot */}
              <section className="bg-white rounded-2xl border border-[#E5DFD6] p-8 shadow-sm">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] mb-6">
                  {t('dashboard.propertyAtGlance', 'Property at a glance')}
                </h2>
                {listing?.photos && listing.photos.length > 0 ? (
                  <div className="h-48 rounded-xl overflow-hidden mb-6 relative shadow-sm">
                    <img src={listing.photos[0]} alt={propertyName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B22]/80 via-[#1C2B22]/20 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <h3 className="text-xl font-serif font-bold text-white mb-1 drop-shadow-sm">{propertyName}</h3>
                      <p className="text-[#F0EBE1] text-[13px] font-medium">
                        {[
                          listing?.city,
                          listing?.price_inr_per_night ? `₹${listing.price_inr_per_night.toLocaleString('en-IN')}/night` : null,
                          listing?.star_rating ? '★'.repeat(listing.star_rating) : null
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-6 bg-[#FAF9F7] rounded-xl border border-[#F0EBE1]">
                    <h3 className="text-xl font-serif font-bold text-[#1C2B22] mb-1">{propertyName}</h3>
                    <p className="text-[#5B6D62] text-[13px] font-medium">
                      {[
                        listing?.city,
                        listing?.price_inr_per_night ? `₹${listing.price_inr_per_night.toLocaleString('en-IN')}/night` : null,
                        listing?.star_rating ? '★'.repeat(listing.star_rating) : null
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#FAF9F7] border border-[#F0EBE1] rounded-xl p-5">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#7C9278] mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('category.accessibility', 'Accessibility')}
                    </h4>
                    <div className="space-y-3">
                      {renderAccessInfo('step_free_entrance', 'Step-free entrance')}
                      {renderAccessInfo('accessible_toilet', 'Accessible toilet')}
                      {renderAccessInfo('roll_in_shower', 'Roll-in shower')}
                      {!listing?.accessibility_items && <p className="text-sm text-[#5B6D62]">No data reported.</p>}
                    </div>
                  </div>
                  <div className="bg-[#FAF9F7] border border-[#F0EBE1] rounded-xl p-5">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#7C9278] mb-4 flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      {t('category.sustainability', 'Sustainability')}
                    </h4>
                    <div className="space-y-3">
                      {renderSustainabilityInfo('waste_management', 'Waste program')}
                      {renderSustainabilityInfo('renewable_energy', 'Solar power')}
                      {renderSustainabilityInfo('water_efficiency', 'Water efficiency')}
                      {!listing?.sustainability_items && <p className="text-sm text-[#5B6D62]">No data reported.</p>}
                    </div>
                  </div>
                </div>
              </section>
              
            </div>
          </>
        )}
      </div>
    </main>
  );
}
