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
import { Loader2, AlertCircle, Info, Download, Sparkles, ChevronDown, RefreshCw } from 'lucide-react';
import { DataStateBadge } from '../../shared/components/DataStateBadge';

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [demandData, setDemandData] = useState<DemandResponse | null>(null);
  const [opportunitiesData, setOpportunitiesData] = useState<OpportunitiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('this_week');

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    setToastMessage(t('analytics.updated', 'Analytics updated'));
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExport = () => {
    if (!data || !demandData || !opportunitiesData) return;
    setIsExporting(true);
    try {
      const rows = [
        ['Metric', 'Value', 'Period'],
        ['Impressions', data.funnel.listing_impressions, data.period || 'this_week'],
        ['Property Opens', data.funnel.listing_opens, data.period || 'this_week'],
        ['Detail Views', data.funnel.detail_opens, data.period || 'this_week'],
        ['Saves', data.funnel.saves, data.period || 'this_week'],
        ['Bookings', data.funnel.bookings, data.period || 'this_week'],
        [],
        ['Demand Gap', 'Searches', 'Status'],
        ...(demandData.gaps || []).map(gap => [gap.label, gap.count, gap.property_data_state]),
      ];
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + rows.map(e => e.join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `analytics_${businessId}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Unable to export analytics.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderContent = () => (
    <div className="w-full min-h-screen bg-[#FAF9F7] text-[#26382D] font-sans pb-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        
        {/* TOAST */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1C2B22] text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-medium animate-in slide-in-from-bottom-5">
            {toastMessage}
          </div>
        )}

        {/* HEADER */}
        <header className="mb-14 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl lg:text-[40px] font-serif font-bold text-[#1C2B22] leading-tight">
                Analytics
              </h1>

            </div>
            <p className="text-[#3E5245] text-[17px] leading-relaxed">
              Understand how travelers discover, evaluate, and interact with your property.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select 
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  handleRefresh();
                }}
                className="appearance-none bg-white border border-[#D8C9BE] text-[#26382D] text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg hover:bg-[#FDFCFB] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="this_week">This week</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="last_90_days">Last 90 days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#26382D]/50 pointer-events-none" />
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-white border border-[#D8C9BE] text-[#26382D] hover:bg-[#FDFCFB] transition-colors py-2.5 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#7C9278]' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 bg-white border border-[#D8C9BE] text-[#26382D] hover:bg-[#FDFCFB] transition-colors py-2.5 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            <button 
              onClick={() => setIsAiPanelOpen(true)}
              className="flex items-center gap-2 bg-[#26382D] text-white hover:bg-[#1C2B22] transition-colors py-2.5 px-5 rounded-lg text-sm font-medium shadow-sm hover:shadow"
            >
              AI Insights
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
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Card 1: Impressions */}
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-[#5B6D62] uppercase tracking-[0.1em]">Impressions</p>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-100 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    18%
                  </span>
                </div>
                <p className="text-4xl font-serif font-bold text-[#1C2B22] mb-1">{data.funnel.listing_impressions?.toLocaleString() ?? 0}</p>
                <p className="text-xs text-[#5B6D62]">Total views in search results</p>
              </div>
              
              {/* Card 2: Property Opens */}
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-[#5B6D62] uppercase tracking-[0.1em]">Property Opens</p>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-100 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    24%
                  </span>
                </div>
                <p className="text-4xl font-serif font-bold text-[#1C2B22] mb-1">{data.funnel.listing_opens?.toLocaleString() ?? 0}</p>
                <p className="text-xs text-[#5B6D62]">Travelers viewed your listing</p>
              </div>

              {/* Card 3: Detail Views */}
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-[#5B6D62] uppercase tracking-[0.1em]">Detail Views</p>
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-100 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    4%
                  </span>
                </div>
                <p className="text-4xl font-serif font-bold text-[#1C2B22] mb-1">{data.funnel.detail_opens?.toLocaleString() ?? 0}</p>
                <p className="text-xs text-[#5B6D62]">Expanded photos or amenities</p>
              </div>

              {/* Card 4: Bookings */}
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-[#5B6D62] uppercase tracking-[0.1em]">Bookings</p>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-100 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    12%
                  </span>
                </div>
                <p className="text-4xl font-serif font-bold text-[#1C2B22] mb-1">{data.funnel.bookings?.toLocaleString() ?? 0}</p>
                <p className="text-xs text-[#5B6D62]">Completed reservations</p>
              </div>
            </section>

            {/* MAIN PERFORMANCE CHART */}
            <section>
              <ActivityTrendChart data={[
                { date: 'Mon', impressions: 4000, opens: 2400, saves: 1200 },
                { date: 'Tue', impressions: 3000, opens: 1398, saves: 800 },
                { date: 'Wed', impressions: 2000, opens: 9800, saves: 2000 },
                { date: 'Thu', impressions: 2780, opens: 3908, saves: 1000 },
                { date: 'Fri', impressions: 1890, opens: 4800, saves: 1500 },
                { date: 'Sat', impressions: 2390, opens: 3800, saves: 1100 },
                { date: 'Sun', impressions: 3490, opens: 4300, saves: 1900 },
              ]} />
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
                <p className="text-[#3E5245] text-sm mb-8">How travelers interact with your accessibility information.</p>
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-[#1C2B22]">Filtered by Accessibility</span>
                      <span className="text-[#5B6D62] font-medium">42%</span>
                    </div>
                    <div className="w-full bg-[#F5F3ED] rounded-full h-2">
                      <div className="bg-[#7C9278] h-2 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-[#1C2B22]">Expanded Photo Details</span>
                      <span className="text-[#5B6D62] font-medium">78%</span>
                    </div>
                    <div className="w-full bg-[#F5F3ED] rounded-full h-2">
                      <div className="bg-[#7C9278] h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-[#1C2B22]">Booking Conversion (with filters)</span>
                      <span className="text-[#5B6D62] font-medium">8.4%</span>
                    </div>
                    <div className="w-full bg-[#F5F3ED] rounded-full h-2">
                      <div className="bg-[#7C9278] h-2 rounded-full" style={{ width: '8.4%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
                <h3 className="text-[13px] font-bold text-[#5B6D62] uppercase tracking-[0.15em] mb-2">Sustainability Engagement</h3>
                <p className="text-[#3E5245] text-sm mb-8">How travelers interact with your environmental data.</p>
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-[#1C2B22]">Carbon Comparison Views</span>
                      <span className="text-[#5B6D62] font-medium">65%</span>
                    </div>
                    <div className="w-full bg-[#F5F3ED] rounded-full h-2">
                      <div className="bg-[#5B6D62] h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-[#1C2B22]">Expanded Certifications</span>
                      <span className="text-[#5B6D62] font-medium">21%</span>
                    </div>
                    <div className="w-full bg-[#F5F3ED] rounded-full h-2">
                      <div className="bg-[#5B6D62] h-2 rounded-full" style={{ width: '21%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-[#1C2B22]">Filtered by EV Charging</span>
                      <span className="text-[#5B6D62] font-medium">34%</span>
                    </div>
                    <div className="w-full bg-[#F5F3ED] rounded-full h-2">
                      <div className="bg-[#5B6D62] h-2 rounded-full" style={{ width: '34%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* CARBON EMISSIONS FOOTPRINT */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">Carbon Emissions Footprint</h2>
                <p className="text-[#3E5245] text-[15px] mt-1">Your property's environmental impact compared to regional benchmarks.</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left side: Stats */}
                <div>
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="text-5xl font-serif font-bold text-[#1C2B22]">18.4</span>
                    <span className="text-[#5B6D62] font-medium text-lg">kg CO₂e / guest night</span>
                  </div>
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded text-sm border border-emerald-100 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      22% lower than typical
                    </span>
                    <span className="text-[#A69C8E] text-[13px] uppercase tracking-wider font-bold">vs. Regional Benchmark (23.5 kg)</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-[#F5F3ED] p-1.5 rounded text-[#7C9278]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#1C2B22]">Method: Property Benchmark</p>
                        <p className="text-[#5B6D62] text-[13px] mt-1">Calculated using verified energy bills (electricity, gas) divided by reported occupancy for the last quarter.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-[#F5F3ED] p-1.5 rounded text-[#7C9278]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#1C2B22]">Key Driver</p>
                        <p className="text-[#5B6D62] text-[13px] mt-1">Your recent switch to 100% renewable electricity accounts for the majority of your performance advantage.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Chart/Visual */}
                <div className="relative h-64 w-full flex items-end gap-10 justify-center border-b-2 border-[#E5DFD6] pb-0 pt-4">
                  {/* Regional Benchmark Bar */}
                  <div className="flex flex-col items-center w-28 relative group">
                    <span className="text-[13px] font-bold text-[#A69C8E] mb-3 absolute -top-8 transition-transform group-hover:-translate-y-1">23.5 kg</span>
                    <div className="w-full bg-[#F0EBE1] rounded-t-xl transition-all duration-1000 ease-out border-x border-t border-[#E5DFD6]" style={{ height: '100%' }}></div>
                    <span className="text-[11px] font-bold text-[#7C9278] uppercase tracking-widest mt-4 mb-2 text-center">Regional<br/>Avg</span>
                  </div>
                  
                  {/* Property Bar */}
                  <div className="flex flex-col items-center w-28 relative group">
                    <span className="text-[14px] font-bold text-[#1C2B22] mb-3 absolute -top-8 transition-transform group-hover:-translate-y-1">18.4 kg</span>
                    <div className="w-full bg-[#5B6D62] rounded-t-xl transition-all duration-1000 ease-out shadow-lg" style={{ height: '78%' }}></div>
                    <span className="text-[11px] font-bold text-[#1C2B22] uppercase tracking-widest mt-4 mb-2 text-center">Your<br/>Property</span>
                  </div>
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
    </div>
  );

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col bg-[#FAF9F7] min-h-screen w-full">
        {renderContent()}
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col bg-[#FAF9F7] min-h-screen w-full">
        {renderContent()}
      </div>
    </>
  );
}
