import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { searchTransport, TransportSearchRequest, TransportResult } from '../../lib/api';
import { formatCurrencyINR, formatDuration } from '../../lib/formatters';
import Navbar from '../../shared/components/Navbar';
import BottomNavBar from '../../shared/components/BottomNavBar';
import DataStateBadge from '../../shared/components/DataStateBadge';
import { Train, Plane, Bus, Car, ChevronLeft, Leaf, Clock, IndianRupee, ShieldCheck, ThumbsUp, AlertTriangle } from 'lucide-react';

interface RouteNavigationState {
  searchPayload?: TransportSearchRequest;
}

const getModeIcon = (mode: string) => {
  switch (mode.toLowerCase()) {
    case 'flight':
    case 'air':
      return <Plane className="w-5 h-5" />;
    case 'train':
      return <Train className="w-5 h-5" />;
    case 'bus':
      return <Bus className="w-5 h-5" />;
    case 'taxi':
    case 'car':
      return <Car className="w-5 h-5" />;
    default:
      return <Bus className="w-5 h-5" />;
  }
};

function A10TransportTradeOffCard({ result }: { result: TransportResult }) {
  const { t } = useTranslation('b2c');
  const navigate = useNavigate();
  const location = useLocation();
  const [showEmissions, setShowEmissions] = useState(false);
  const emissionsDetailsId = `emissions-details-${result.id}`;

  const formatCurrency = formatCurrencyINR;
  
  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return formatDuration(t, { hours: hrs > 0 ? hrs : undefined, minutes: mins > 0 ? mins : undefined });
  };

  // Rule 6: Visibly identify DEMO if present in the data states we know about.
  const isDemo = result.accessibility?.data_state === 'demo_synthetic' || 
                 result.segments?.some(s => s.data_state === 'demo_synthetic');

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#D8C9BE] shadow-sm hover:shadow-md transition-shadow relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b border-[#F8F6F3]">
        <div className="flex items-center gap-3">
          <div className="bg-[#F8F6F3] p-2.5 rounded-full text-[#7C9278]">
            {getModeIcon(result.mode)}
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-[#26382D] capitalize">
              {result.mode}
            </h3>
            {result.personal_match_pct !== undefined && (
              <span className="text-sm font-medium text-[#7C9278]">
                {t('results.match')}: {Math.round(result.personal_match_pct * 100)}%
              </span>
            )}
          </div>
        </div>
        {isDemo && (
          <div className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded border border-orange-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {t('results.badgeDemo')}
          </div>
        )}
      </div>

      {/* Trade-off Dimensions */}
      <div className="grid grid-cols-1 gap-3 mb-5">
        {/* Cost */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[#A99587]">
            <IndianRupee className="w-4 h-4" />
            <span>{t('results.cost')}</span>
          </div>
          <span className="font-semibold text-[#26382D]">{formatCurrency(result.cost_inr)}</span>
        </div>

        {/* Time */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[#A99587]">
            <Clock className="w-4 h-4" />
            <span>{t('results.time')}</span>
          </div>
          <span className="font-semibold text-[#26382D]">{formatTime(result.duration_minutes)}</span>
        </div>

        {/* CO2 Emissions */}
        {result.emissions && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#A99587]">
                <Leaf className="w-4 h-4" />
                <span>{t('results.co2')}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-semibold text-[#26382D]">{result.emissions.co2e_kg} kg CO₂e</span>
                <button
                  type="button"
                  aria-expanded={showEmissions}
                  aria-controls={emissionsDetailsId}
                  onClick={() => setShowEmissions(!showEmissions)}
                  className="text-[10px] uppercase text-[#7C9278] hover:text-[#26382D] font-medium tracking-wider cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#7C9278] rounded px-1 -mr-1"
                >
                  {result.emissions.method === 'estimated' ? t('results.emissionsEstimated') : t('results.emissionsBenchmark')} ▾
                </button>
              </div>
            </div>
            
            {showEmissions && (
              <div id={emissionsDetailsId} className="bg-[#F8F6F3] rounded-lg p-3 text-xs text-[#26382D] border border-[#D8C9BE]">
                <p className="font-medium text-[#7C9278] mb-2">{t('results.howCalculated')}</p>
                {result.emissions.method === 'estimated' ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-[#A99587]">{t('results.calcDistance')}</span>
                      <span className="font-mono">{result.emissions.distance_km} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A99587]">{t('results.calcEmissionFactor')}</span>
                      <span className="font-mono">{result.emissions.emission_factor} kg/km</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-[#A99587]">{t('results.calcBenchmark')}</span>
                      <span className="font-mono">{result.emissions.benchmark_kg} kg CO₂e</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A99587]">{t('results.calcReduction')}</span>
                      <span className="font-mono text-[#7C9278] font-semibold">{result.emissions.reduction_pct}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Accessibility */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[#A99587]">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('results.accessibility')}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-semibold text-[#26382D]">{result.accessibility.value}</span>
            <div className="scale-90 origin-right">
              {/* Injecting Person B's shared component, even if it's a placeholder now */}
              {/* @ts-expect-error ignoring prop errors since Person B hasn't defined them yet, but passing what they likely need */}
              <DataStateBadge state={result.accessibility.data_state} />
            </div>
          </div>
        </div>
      </div>

      {/* Trade-off Summary Bullets */}
      {result.trade_off_summary && result.trade_off_summary.length > 0 && (
        <div className="bg-[#F8F6F3] rounded-lg p-3 text-sm">
          <ul className="space-y-1.5">
            {result.trade_off_summary.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-[#26382D]/80">
                <span className="text-[#7C9278] mt-0.5">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate('/accommodation-results', { state: { ...location.state, searchPayload: location.state?.searchPayload, transportResult: result } })}
          className="w-full bg-[#26382D] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#3A5043] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#26382D]"
        >
          {t('results.selectTransport')}
        </button>
        {result.segments && result.segments.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/journey', { state: { result } })}
            className="w-full bg-white text-[#26382D] py-2.5 rounded-lg text-sm font-medium border border-[#D8C9BE] hover:bg-[#F8F6F3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D8C9BE]"
          >
            {t('results.viewJourney')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function TransportResultsPage() {
  const { t } = useTranslation('b2c');
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TransportResult[]>([]);

  const state = location.state as RouteNavigationState | null;
  const searchPayload = state?.searchPayload;

  useEffect(() => {
    if (!searchPayload) return;

    let isMounted = true;
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchTransport(searchPayload);
        if (isMounted) {
          setResults(response.results);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || t('results.error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [searchPayload, t]);

  if (!searchPayload) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] font-sans flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-serif text-[#26382D] mb-3">{t('results.title')}</h2>
            <p className="text-[#26382D]/70 mb-6">{t('results.missingPayload')}</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-[#26382D] text-white px-6 py-2.5 rounded-full hover:bg-[#3A5043] transition-colors"
            >
              {t('results.backToSearch')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-[#A99587]">
          <div className="w-8 h-8 border-4 border-[#D8C9BE] border-t-[#7C9278] rounded-full animate-spin mb-4" />
          <p>{t('results.loading')}</p>
        </div>
      );
    }
    if (error) {
      return (
        <div role="alert" className="bg-red-50 text-red-800 p-6 rounded-2xl text-center border border-red-100">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
          <p>{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded-full transition-colors text-sm font-medium"
          >
            {t('results.goBack')}
          </button>
        </div>
      );
    }
    if (results.length === 0) {
      return (
        <div className="bg-white p-10 rounded-2xl text-center border border-[#D8C9BE] shadow-sm max-w-xl mx-auto">
          <div className="bg-[#F8F6F3] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-[#A99587]" />
          </div>
          <h3 className="text-xl font-serif text-[#26382D] mb-2">{t('results.empty')}</h3>
          <p className="text-[#A99587] mb-6">{t('results.emptyHelper')}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border-2 border-[#26382D] text-[#26382D] rounded-full font-medium hover:bg-[#F8F6F3] transition-colors"
          >
            {t('results.goBack')}
          </button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {results.map(r => (
          <A10TransportTradeOffCard key={r.id} result={r} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col min-h-screen bg-[#F8F6F3] font-sans pb-24">
        <div className="sticky top-0 z-10 bg-white border-b border-[#D8C9BE] px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-medium text-[#7C9278] hover:text-[#26382D] transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('results.goBack')}
          </button>
          <div>
            <h1 className="text-2xl font-serif text-[#26382D]">
              {t('results.title')}
            </h1>
            <p className="text-[#A99587] text-sm mt-1">
              {searchPayload.origin} → {searchPayload.destination} • {t('results.subtitle')}
            </p>
          </div>
        </div>
        <main className="flex-grow px-4 py-6 w-full">
          {renderContent()}
        </main>
        <BottomNavBar />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#F8F6F3] font-sans">
        <Navbar />

        {/* Header Area */}
        <div className="bg-white border-b border-[#D8C9BE] sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm font-medium text-[#7C9278] hover:text-[#26382D] transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('results.goBack')}
            </button>
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-serif text-[#26382D]">
                  {t('results.title')}
                </h1>
                <p className="text-[#A99587] text-base mt-1">
                  {searchPayload.origin} → {searchPayload.destination} • {t('results.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-grow max-w-7xl mx-auto px-8 py-8 w-full">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
