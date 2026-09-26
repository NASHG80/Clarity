import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getAiAnalyticsSummary, AIAnalyticsSummaryResponse } from '../../../lib/api';

interface AiAnalyticsPanelProps {
  businessId: string;
  period: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AiAnalyticsPanel({ businessId, period, isOpen, onClose }: AiAnalyticsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AIAnalyticsSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isOpen && !data && !loading && !error) {
      handleFetch();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 600);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAiAnalyticsSummary(businessId, period);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'AI insights are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-[#1C2B22]/10 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#FAF9F7] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 border-l border-[#E5DFD6]">
        
        {/* Header */}
        <div className="flex flex-col px-8 pt-8 pb-6 bg-white border-b border-[#F0EBE1]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 text-[#1C2B22]">
              <div className="w-8 h-8 rounded bg-[#F5F3ED] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#7C9278]" />
              </div>
              <h2 className="text-[17px] font-bold tracking-wide uppercase">AI Analytics Assistant</h2>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 hover:bg-[#F5F3ED] rounded-full transition-colors text-[#5B6D62]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#5B6D62] text-[15px]">A concise interpretation of your current data.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#7C9278] mb-6" />
              <h3 className="text-xl font-serif font-bold text-[#1C2B22] mb-8">Analyzing your property</h3>
              
              <div className="space-y-4 w-full max-w-[240px]">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${loadingStep >= 0 ? 'bg-[#7C9278] border-[#7C9278] text-white' : 'border-[#D8C9BE] text-transparent'}`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className={`text-[15px] ${loadingStep >= 0 ? 'text-[#1C2B22] font-medium' : 'text-[#A69C8E]'}`}>Traveler activity</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${loadingStep >= 1 ? 'bg-[#7C9278] border-[#7C9278] text-white' : 'border-[#D8C9BE] text-transparent'}`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className={`text-[15px] ${loadingStep >= 1 ? 'text-[#1C2B22] font-medium' : 'text-[#A69C8E]'}`}>Customer journey</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center rounded-full border ${loadingStep >= 2 ? 'bg-[#7C9278] border-[#7C9278] text-white' : 'border-[#D8C9BE] text-transparent'}`}>
                    {loadingStep >= 2 ? <Check className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-[#A69C8E]" />}
                  </div>
                  <span className={`text-[15px] ${loadingStep >= 2 ? 'text-[#1C2B22] font-medium' : 'text-[#A69C8E]'}`}>Accessibility demand</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center rounded-full border ${loadingStep >= 3 ? 'bg-[#7C9278] border-[#7C9278] text-white' : 'border-[#D8C9BE] text-transparent'}`}>
                    {loadingStep >= 3 ? <Check className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-[#A69C8E]" />}
                  </div>
                  <span className={`text-[15px] ${loadingStep >= 3 ? 'text-[#1C2B22] font-medium' : 'text-[#A69C8E]'}`}>Opportunities</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="text-red-800 font-bold mb-2">AI insights are temporarily unavailable.</p>
              <button 
                onClick={handleFetch}
                className="mt-4 px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {data && !loading && (
            <>
              <section>
                <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] mb-3">Executive Summary</h4>
                <p className="text-[#1C2B22] text-[17px] font-serif leading-relaxed">
                  {data.summary}
                </p>
              </section>

              {data.key_findings.length > 0 && (
                <section className="border-t border-[#F0EBE1] pt-8">
                  <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] mb-4">What Changed</h4>
                  <ul className="space-y-3">
                    {data.key_findings.map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="text-[#7C9278] mt-1">•</span>
                        <div>
                          <strong className="text-[#1C2B22] font-medium text-[15px] block">{item.title}</strong>
                          <span className="text-[#3E5245] text-sm">{item.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.demand_insights.length > 0 && (
                <section className="border-t border-[#F0EBE1] pt-8">
                  <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] mb-4">Traveler Demand</h4>
                  <ul className="space-y-3">
                    {data.demand_insights.map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="text-[#7C9278] mt-1">•</span>
                        <div>
                          <strong className="text-[#1C2B22] font-medium text-[15px] block">{item.title}</strong>
                          <span className="text-[#3E5245] text-sm">{item.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.data_gaps.length > 0 && (
                <section className="border-t border-[#F0EBE1] pt-8">
                  <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] mb-4">Data Gaps</h4>
                  <ul className="space-y-3">
                    {data.data_gaps.map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="text-[#7C9278] mt-1">•</span>
                        <div>
                          <strong className="text-[#1C2B22] font-medium text-[15px] block">{item.title}</strong>
                          <span className="text-[#3E5245] text-sm">{item.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.opportunities.length > 0 && (
                <section className="border-t border-[#F0EBE1] pt-8">
                  <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] mb-4">Opportunities</h4>
                  <ul className="space-y-3">
                    {data.opportunities.map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="text-[#7C9278] mt-1">•</span>
                        <div>
                          <strong className="text-[#1C2B22] font-medium text-[15px] block">{item.title}</strong>
                          <span className="text-[#3E5245] text-sm">{item.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.next_actions.length > 0 && (
                <section className="border-t border-[#F0EBE1] pt-8">
                  <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#5B6D62] mb-4">Next Things To Look At</h4>
                  <ol className="space-y-4 counter-reset-list pl-0">
                    {data.next_actions.map((item, i) => (
                      <li key={i} className="flex gap-3 items-start relative">
                        <span className="text-[12px] font-bold text-[#7C9278] mt-0.5 min-w-[16px]">{i + 1}.</span>
                        <div>
                          <strong className="text-[#1C2B22] font-medium text-[15px] block">{item.title}</strong>
                          <span className="text-[#3E5245] text-[15px]">{item.description}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              <div className="pt-8 border-t border-[#F0EBE1] flex justify-center pb-8">
                <button 
                  onClick={handleFetch}
                  className="flex items-center gap-2 bg-white border border-[#D8C9BE] text-[#26382D] hover:bg-[#FDFCFB] transition-colors py-2 px-4 rounded-lg text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate insights
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
