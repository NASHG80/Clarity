import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TransportResult } from '../../lib/api';
import JourneySegmentTimeline from '../components/JourneySegmentTimeline';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Navbar from '../../shared/components/Navbar';
import BottomNavBar from '../../shared/components/BottomNavBar';

interface RouteNavigationState {
  result?: TransportResult;
}

export default function JourneyViewPage() {
  const { t } = useTranslation('b2c');
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as RouteNavigationState | null;
  const result = state?.result;

  const handleBackToResults = () => {
    navigate(-1); // Go back to results
  };

  const handleBackToSearch = () => {
    navigate('/requirements'); // Go back to search
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-[#A99587] mb-4" />
          <h2 className="text-2xl font-serif font-medium text-[#26382D] mb-2">
            {t('journey.unavailable')}
          </h2>
          <p className="text-[#A99587] mb-8 text-center max-w-md">
            {t('journey.unavailableHelper')}
          </p>
          <button
            type="button"
            onClick={handleBackToSearch}
            className="bg-[#26382D] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#3A5043] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#26382D]"
          >
            {t('journey.backToSearch')}
          </button>
        </main>
        <BottomNavBar />
      </div>
    );
  }

  const renderContent = () => (
    <>
      <div className="hidden md:flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto px-8 py-8">
        <div className="flex-1 max-w-3xl">
          <div className="bg-white rounded-2xl p-6 border border-[#D8C9BE] shadow-sm">
            <JourneySegmentTimeline segments={result.segments} />
          </div>
        </div>
        
        {/* Desktop Right Sidebar (Info summary / Deferred map placeholder) */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-[#EAE4DD] rounded-xl p-6 border border-[#D8C9BE] sticky top-32">
            <h3 className="font-serif text-lg font-medium text-[#26382D] mb-4">{t('journey.infoTitle', 'Journey Info')}</h3>
            <p className="text-sm text-[#A99587]">
              {t('journey.deferredMap', 'Google Maps overlay is deferred (requires route geometry).')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex md:hidden flex-col gap-6 px-4 py-6 w-full">
        <JourneySegmentTimeline segments={result.segments} />
      </div>
    </>
  );

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col min-h-screen bg-[#F8F6F3] font-sans pb-24">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#D8C9BE] px-4 py-4">
          <button
            type="button"
            onClick={handleBackToResults}
            className="flex items-center gap-2 text-[#7C9278] hover:text-[#26382D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] rounded px-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium text-sm">{t('journey.backToResults')}</span>
          </button>
          
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-medium text-[#26382D]">
                {t('journey.title')}
              </h1>
              <p className="text-sm text-[#A99587] mt-1 capitalize">
                {result.mode.replace(/\+/g, ' + ')}
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-sm text-[#A99587] block mb-1">{t('journey.totalTime', 'Total Time')}</span>
              <span className="font-semibold text-[#26382D] text-lg bg-[#F8F6F3] px-3 py-1 rounded">
                {t('journey.duration', { minutes: result.duration_minutes })}
              </span>
            </div>
          </div>
        </div>
        
        <main className="flex-1 w-full">
          <div className="flex md:hidden flex-col gap-6 px-4 py-6 w-full">
            <JourneySegmentTimeline segments={result.segments} />
          </div>
        </main>
        
        <BottomNavBar />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#F8F6F3] font-sans">
        <Navbar />
        
        {/* Desktop Header */}
        <div className="bg-white border-b border-[#D8C9BE] sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <button
              type="button"
              onClick={handleBackToResults}
              className="flex items-center gap-2 text-[#7C9278] hover:text-[#26382D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] rounded mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-sm">{t('journey.backToResults')}</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-medium text-[#26382D]">
                  {t('journey.title')}
                </h1>
                <p className="text-sm text-[#A99587] mt-1 capitalize">
                  {result.mode.replace(/\+/g, ' + ')}
                </p>
              </div>
              
              <div className="text-right">
                <span className="text-sm text-[#A99587] block mb-1">{t('journey.totalTime', 'Total Time')}</span>
                <span className="font-semibold text-[#26382D] text-lg bg-[#F8F6F3] px-3 py-1 rounded">
                  {t('journey.duration', { minutes: result.duration_minutes })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-8">
          <div className="hidden md:flex flex-col lg:flex-row gap-8">
            <div className="flex-1 max-w-3xl">
              <div className="bg-white rounded-2xl p-6 border border-[#D8C9BE] shadow-sm">
                <JourneySegmentTimeline segments={result.segments} />
              </div>
            </div>
            
            <div className="w-80 flex-shrink-0">
              <div className="bg-[#EAE4DD] rounded-xl p-6 border border-[#D8C9BE] sticky top-32">
                <h3 className="font-serif text-lg font-medium text-[#26382D] mb-4">Journey Info</h3>
                <p className="text-sm text-[#A99587]">
                  Google Maps overlay is deferred (requires route geometry).
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
