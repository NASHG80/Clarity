import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../../shared/components/Navbar';
import BottomNavBar from '../../shared/components/BottomNavBar';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { searchAccommodation, AccommodationSearchRequest, AccommodationResult } from '../../lib/api';
import AccommodationResultCard from '../components/AccommodationResultCard';

interface RouteState {
  searchPayload?: any;
  transportResult?: any;
}

export default function AccommodationResultsPage() {
  const { t } = useTranslation('b2c');
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as RouteState | null;
  const searchPayload = state?.searchPayload;
  // transportResult is available in state if needed for later tasks

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AccommodationResult[]>([]);

  useEffect(() => {
    if (!searchPayload) return;

    let isMounted = true;
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload: AccommodationSearchRequest = {
          destination_city: searchPayload.destination,
          budget_max: searchPayload.vehicle_preferences?.budget_max,
          accessibility_required: searchPayload.wheelchair_accessible ? ['step_free'] : undefined,
          weights: searchPayload.vehicle_preferences?.weights
        };
        const response = await searchAccommodation(payload);
        if (isMounted) {
          setResults(response.results);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || t('accommodation.error'));
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
            <h2 className="text-2xl font-serif text-[#26382D] mb-3">{t('accommodation.title')}</h2>
            <p className="text-[#26382D]/70 mb-6">{t('accommodation.missingPayload')}</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-[#26382D] text-white px-6 py-2.5 rounded-full hover:bg-[#3A5043] transition-colors"
            >
              {t('accommodation.backToSearch')}
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
          <p>{t('accommodation.loading')}</p>
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
            {t('results.goBack', 'Go Back')}
          </button>
        </div>
      );
    }
    if (results.length === 0) {
      return (
        <div className="text-center py-20">
          <h3 className="text-xl font-serif text-[#26382D] mb-2">{t('accommodation.empty')}</h3>
          <p className="text-[#A99587]">{t('accommodation.emptyHelper')}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {results.map((result) => (
          <AccommodationResultCard key={result.id} result={result} />
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
            {t('results.goBack', 'Go Back')}
          </button>
          <div>
            <h1 className="text-2xl font-serif text-[#26382D]">
              {t('accommodation.title')}
            </h1>
            <p className="text-[#A99587] text-sm mt-1">
              {t('accommodation.subtitle', { city: searchPayload.destination })}
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
              {t('results.goBack', 'Go Back')}
            </button>
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-serif text-[#26382D]">
                  {t('accommodation.title')}
                </h1>
                <p className="text-[#A99587] text-base mt-1">
                  {t('accommodation.subtitle', { city: searchPayload.destination })}
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
