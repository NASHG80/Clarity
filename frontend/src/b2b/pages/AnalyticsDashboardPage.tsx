import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnalytics, AnalyticsResponse, getDemand, DemandResponse, getOpportunities, OpportunitiesResponse } from '../../lib/api';
import TravelerFunnel from '../components/TravelerFunnel';
import DemandComparison from '../components/DemandComparison';
import OpportunityCard from '../components/OpportunityCard';
import { ActivityTrendChart } from '../components/analytics/ActivityTrendChart';
import { DemandChart } from '../components/analytics/DemandChart';
import { AiAnalyticsPanel } from '../components/analytics/AiAnalyticsPanel';
import { Button } from '../../shared/components/Button';
import { Loader2, AlertCircle, Info, Download, Sparkles, ChevronDown } from 'lucide-react';
import { DataStateBadge } from '../../shared/components/DataStateBadge';

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [demandData, setDemandData] = useState<DemandResponse | null>(null);
  const [opportunitiesData, setOpportunitiesData] = useState<OpportunitiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  const businessId = "biz_001"; // Default identity for prototype

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [analyticsRes, demandRes, oppsRes] = await Promise.all([
        getAnalytics(businessId),
        getDemand(businessId),
        getOpportunities(businessId)
      ]);
      setData(analyticsRes);
      setDemandData(demandRes);
      setOpportunitiesData(oppsRes);
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
    <main className="w-full min-h-screen bg-[#FAF9F7] text-[#26382D] font-sans pt-12 pb-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        
        {/* HEADER */}
        <header className="mb-14 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl lg:text-[40px] font-serif font-bold text-[#1C2B22] leading-tight">
                Analytics
              </h1>
              {data?.is_demo_data && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-widest border border-amber-200">
                  Demo Data
                </span>
              )}
            </div>
            <p className="text-[#3E5245] text-[17px] leading-relaxed">
              Understand how travelers discover, evaluate, and interact with your property.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select className="appearance-none bg-white border border-[#D8C9BE] text-[#26382D] text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg hover:bg-[#FDFCFB] focus:outline-none transition-colors cursor-pointer" disabled>
                <option>7 days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#26382D]/50 pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 bg-white border border-[#D8C9BE] text-[#26382D] hover:bg-[#FDFCFB] transition-colors py-2.5 px-4 rounded-lg text-sm font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => setIsAiPanelOpen(true)}
              className="flex items-center gap-2 bg-[#26382D] text-white hover:bg-[#1C2B22] transition-colors py-2.5 px-5 rounded-lg text-sm font-medium shadow-sm hover:shadow"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              ✨ AI Insights
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#7C9278]" />
            <p className="text-[#3E5245] font-medium tracking-wide">Loading intelligence...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex flex-col items-center text-center max-w-2xl mx-auto mt-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Data Unavailable</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <Button variant="primary" onClick={fetchData}>Retry Connection</Button>
          </div>
        ) : data && demandData && opportunitiesData ? (
          <div className="space-y-16">
            
            {/* EXECUTIVE SNAPSHOT */}
            <section>
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
                {/* Primary Metric */}
                <div className="mb-10 pb-10 border-b border-[#F0EBE1] flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-[13px] font-bold text-[#5B6D62] uppercase tracking-[0.15em] mb-3">Traveler Impressions</h2>
                    <div className="flex items-baseline gap-4">
                      <span className="text-[56px] font-serif font-bold text-[#1C2B22] leading-none">
                        {data.funnel.listing_impressions?.toLocaleString() ?? 0}
                      </span>
                      <span className="text-green-700 font-medium bg-green-50 px-2 py-1 rounded-md text-sm border border-green-100 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        18% vs prev
                      </span>
                    </div>
                  </div>
                  <div className="h-16 w-32 md:w-48 opacity-40">
                    {/* Simulated mini sparkline */}
                    <svg viewBox="0 0 100 30" className="w-full h-full text-[#7C9278]" preserveAspectRatio="none">
                      <path d="M0 30 Q 10 20, 20 25 T 40 15 T 60 20 T 80 5 T 100 10 L 100 30 Z" fill="currentColor" opacity="0.1" />
                      <path d="M0 30 Q 10 20, 20 25 T 40 15 T 60 20 T 80 5 T 100 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-[#F0EBE1]">
                  <div className="pt-4 md:pt-0 md:px-6 first:px-0">
                    <p className="text-[13px] font-bold text-[#5B6D62] uppercase tracking-[0.1em] mb-2">Property Opens</p>
                    <p className="text-3xl font-serif font-bold text-[#1C2B22]">{data.funnel.listing_opens?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="pt-4 md:pt-0 md:px-6">
                    <p className="text-[13px] font-bold text-[#5B6D62] uppercase tracking-[0.1em] mb-2">Detail Views</p>
                    <p className="text-3xl font-serif font-bold text-[#1C2B22]">{data.funnel.detail_opens?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="pt-4 md:pt-0 md:px-6">
                    <p className="text-[13px] font-bold text-[#5B6D62] uppercase tracking-[0.1em] mb-2">Saves</p>
                    <p className="text-3xl font-serif font-bold text-[#1C2B22]">{data.funnel.saves?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="pt-4 md:pt-0 md:px-6">
                    <p className="text-[13px] font-bold text-[#5B6D62] uppercase tracking-[0.1em] mb-2">Bookings</p>
                    <p className="text-3xl font-serif font-bold text-[#1C2B22]">{data.funnel.bookings?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* MAIN PERFORMANCE CHART */}
            <section>
              <ActivityTrendChart data={[]} />
            </section>

            {/* CUSTOMER JOURNEY */}
            <section>
              <TravelerFunnel funnel={data.funnel} />
            </section>

            {/* 2-COLUMN: DEMAND & GAPS */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              <DemandChart demand={demandData} />
              <DemandComparison demand={demandData} />
            </section>

            {/* 2-COLUMN: ENGAGEMENT (Accessibility & Sustainability) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
                <h3 className="text-[13px] font-bold text-[#5B6D62] uppercase tracking-[0.15em] mb-2">Accessibility Engagement</h3>
                <p className="text-[#3E5245] text-sm mb-12">How travelers interact with your accessibility information.</p>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-[#F5F3ED] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#A69C8E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                  <p className="text-[#5B6D62] text-[15px] font-medium leading-relaxed max-w-sm">
                    Accessibility engagement insights will appear as more traveler interactions are recorded.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
                <h3 className="text-[13px] font-bold text-[#5B6D62] uppercase tracking-[0.15em] mb-2">Sustainability Engagement</h3>
                <p className="text-[#3E5245] text-sm mb-12">How travelers interact with your environmental data.</p>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-[#F5F3ED] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#A69C8E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-[#5B6D62] text-[15px] font-medium leading-relaxed max-w-sm">
                    Sustainability engagement insights will appear as more traveler interactions are recorded.
                  </p>
                </div>
              </div>
            </section>

            {/* BUSINESS OPPORTUNITIES */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">Business Opportunities</h2>
                <p className="text-[#3E5245] text-[15px] mt-1">High-value actions you can take based on current data.</p>
              </div>
              <div className="grid gap-4">
                {opportunitiesData.opportunities.length > 0 ? (
                  opportunitiesData.opportunities.map((opp, idx) => (
                    <OpportunityCard key={idx} opportunity={{...opp, id: String(idx), type: (opp as any).type || 'resource', is_demo_data: opp.is_demo_data ?? false}} />
                  ))
                ) : (
                  <div className="bg-white border border-[#E5DFD6] rounded-2xl p-12 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
                    <div className="w-12 h-12 rounded-full bg-[#F8F6F3] mx-auto flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-[#7C9278]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#26382D] mb-2">No immediate opportunities</h3>
                    <p className="text-[#5B6D62]">Your property profile is in great shape for current demand.</p>
                  </div>
                )}
              </div>
            </section>

            {/* OBSERVED SIGNALS */}
            {data.signals && data.signals.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">Observed Signals</h2>
                  <p className="text-[#3E5245] text-[15px] mt-1">Patterns detected in traveler interactions.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.signals.map((signal, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] border border-[#E5DFD6] p-6 flex gap-4 items-start">
                      <div className="mt-1 bg-[#F5F3ED] p-2 rounded-lg shrink-0">
                        <Info className="w-5 h-5 text-[#7C9278]" />
                      </div>
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#F5F3ED] text-[#5B6D62] border border-[#E5DFD6] mb-2">
                          Correlation
                        </span>
                        <p className="text-[#1C2B22] font-medium leading-relaxed text-[15px]">{signal.text}</p>
                        <p className="text-[#5B6D62] text-xs mt-3 uppercase tracking-wider">Source: Customer interaction data</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        ) : null}

        <AiAnalyticsPanel 
          isOpen={isAiPanelOpen} 
          onClose={() => setIsAiPanelOpen(false)} 
          businessId={businessId} 
          period={data?.period || 'this_week'} 
        />
      </div>
    </main>
  );
}
