import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListingDetail, ListingDetailResponse } from '../../lib/api';
// Using this loosely to prevent TypeScript errors in the rest of the file
// until Person B finishes the strict shared component.
import DataStateBadge from '../../shared/components/DataStateBadge';
import Navbar from '../../shared/components/Navbar';
import BottomNavBar from '../../shared/components/BottomNavBar';
import { Star, MapPin, Loader2, ArrowLeft, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { formatCurrencyINR } from '../../lib/formatters';

// Wrapper to isolate Person B's placeholder dependency without TS workarounds
const IsolatedDataStateBadge = ({ state }: { state: string }) => {
  const { t } = useTranslation('b2c');
  return (
    <div className="flex flex-col gap-1 items-end">
      <DataStateBadge />
      {state === 'demo_synthetic' && (
        <span className="text-[10px] font-bold text-[#E88D67] uppercase bg-[#E88D67]/10 px-1.5 py-0.5 rounded">
          {t('results.badgeDemo', 'DEMO')}
        </span>
      )}
    </div>
  );
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('b2c');
  const lang = i18n.language as string;

  const [listing, setListing] = useState<ListingDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'accessibility' | 'sustainability' | 'confirmations'>('overview');

  useEffect(() => {
    if (!id) return;
    
    let isMounted = true;
    setLoading(true);
    setError(false);
    
    getListingDetail(id)
      .then(data => {
        if (isMounted) {
          setListing(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });
      
    return () => { isMounted = false; };
  }, [id]);

  const handleBack = () => {
    // Navigate back to accommodation results, preserving transport payload
    navigate('/accommodation-results', { state: location.state });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex flex-col items-center justify-center p-6 text-[#7C9278]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-lg font-medium">{t('listing.loading')}</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] p-4 md:p-8 flex flex-col items-center justify-center">
        <div role="alert" className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-[#E88D67] mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-[#26382D] mb-2">{t('listing.error')}</h2>
          <p className="text-[#A99587] mb-6">{t('listing.notFound')}</p>
          <button 
            onClick={handleBack}
            className="w-full bg-[#26382D] text-white rounded-full py-3 font-medium hover:bg-[#1F2E25] transition-colors"
          >
            {t('accommodation.backToSearch', 'Back to Search')}
          </button>
        </div>
      </div>
    );
  }

  const translation = listing.translations[lang];
  const showEnglishFallback = !translation && !!listing.translations['en'];
  const activeTranslation = translation || listing.translations['en'] || { name: 'Unknown', description: '' };
  const isDemoRoot = listing.data_state === 'demo_synthetic';

  const renderTabsList = () => {
    const tabs = [
      { id: 'overview', label: t('listing.tabs.overview') },
      { id: 'accessibility', label: t('listing.tabs.accessibility') },
      { id: 'sustainability', label: t('listing.tabs.sustainability') },
      { id: 'confirmations', label: t('listing.tabs.confirmations') }
    ] as const;

    return (
      <div role="tablist" className="flex border-b border-[#D8C9BE] overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-6 py-4 font-medium text-sm transition-colors ${
              activeTab === tab.id 
                ? 'text-[#26382D] border-b-2 border-[#E88D67]' 
                : 'text-[#A99587] hover:text-[#7C9278]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="prose prose-stone max-w-none">
        <p className="text-[#26382D] leading-relaxed">
          {activeTranslation.description || t('listing.noDescription', 'No description available.')}
        </p>
      </div>
      
      {/* Amenities/Extra info could go here, but omitted as per contract restriction */}
    </div>
  );

  const renderChecklist = (items: any[], emptyKey: string) => {
    if (!items || items.length === 0) {
      return (
        <div className="py-8 text-center text-[#A99587]">
          {t(emptyKey)}
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F8F6F3] rounded-lg border border-[#D8C9BE]/50 gap-3">
            <div className="flex items-center gap-3">
              <span className="font-medium text-[#26382D]">
                {t(`features.${item.label}`, item.label) as string}
              </span>
            </div>
            <div className="flex-shrink-0">
              <IsolatedDataStateBadge state={item.data_state || 'not_verified'} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderConfirmations = () => {
    const items = listing.confirmations;
    if (!items || items.length === 0) {
      return (
        <div className="py-12 text-center text-[#A99587] bg-[#F8F6F3] rounded-xl border border-dashed border-[#D8C9BE]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>{t('listing.confirmations.empty')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white shadow-sm rounded-xl border border-[#D8C9BE] gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-[#26382D] text-lg mb-1">
                {t(`features.${item.item_label}`, item.item_label) as string}
              </h4>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-[#F4F9F5] border border-[#C5D9CB] rounded-lg px-4 py-2 text-center">
                <span className="block text-2xl font-serif text-[#1F4029]">{item.confirmed_by_count}</span>
                <span className="text-xs font-medium text-[#7C9278] uppercase tracking-wider">
                  {t('listing.confirmations.confirmedByLabel', { count: item.confirmed_by_count })}
                </span>
              </div>
              
              <div className="bg-[#FFF5F5] border border-[#FEE2E2] rounded-lg px-4 py-2 text-center">
                <span className="block text-2xl font-serif text-[#991B1B]">{item.disputed_count}</span>
                <span className="text-xs font-medium text-[#DC2626] uppercase tracking-wider">
                  {t('listing.confirmations.disputedByLabel', { count: item.disputed_count })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0">
        {/* Title / Header Area */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-serif text-[#26382D] leading-tight mb-2">
            {activeTranslation.name}
            {showEnglishFallback && (
              <span className="inline-block text-sm font-sans text-[#7C9278] ml-3 align-middle font-normal">
                {t('listing.shownInEnglish')}
              </span>
            )}
          </h1>
          <div className="flex items-center text-[#A99587] gap-4">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {listing.city}
            </div>
            {listing.star_rating !== undefined && (
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 fill-current text-[#E88D67]" />
                {listing.star_rating}
              </div>
            )}
          </div>
        </div>

        {/* Photos Area */}
        <div className="relative w-full h-64 md:h-96 bg-[#D8C9BE] rounded-2xl overflow-hidden mb-8 shadow-sm">
          {isDemoRoot && (
            <div className="absolute top-4 left-4 z-10 bg-[#E88D67] text-white text-sm font-bold px-3 py-1.5 rounded shadow-sm">
              {t('results.badgeDemo', 'DEMO')}
            </div>
          )}
          {listing.photos && listing.photos.length > 0 ? (
            <img 
              src={listing.photos[0]} 
              alt={activeTranslation.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#A99587]/50">
              <ImageIcon className="w-16 h-16 mb-2" />
            </div>
          )}
        </div>

        {/* Content Tabs Area */}
        <div className="bg-white rounded-2xl border border-[#D8C9BE] shadow-sm overflow-hidden">
          {/* Isolated Tabs Dependency */}
          {renderTabsList()}
          
          <div className="p-6 md:p-8">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'accessibility' && renderChecklist(listing.accessibility_items, 'listing.emptyAccessibility')}
            {activeTab === 'sustainability' && renderChecklist(listing.sustainability_items, 'listing.emptySustainability')}
            {activeTab === 'confirmations' && renderConfirmations()}
          </div>
        </div>
      </div>

      {/* STICKY SIDEBAR */}
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="sticky top-8 bg-white rounded-2xl border border-[#D8C9BE] shadow-sm p-6">
          <div className="mb-6 border-b border-[#F8F6F3] pb-6">
            <span className="block text-3xl font-serif text-[#26382D] mb-1">
              {t('listing.pricePerNight', { price: formatCurrencyINR(listing.price_inr_per_night) })}
            </span>
            <span className="text-[#A99587] text-sm">
              {/* Prices could include taxes note here if supported, but skipping */}
              {t('accommodation.perNight', 'per night')}
            </span>
          </div>

          <button 
            onClick={() => navigate(`/explore/${listing.city}`, { state: { ...location.state, hotelResult: listing } })}
            className="w-full bg-[#E88D67] text-white rounded-xl py-3.5 font-medium shadow-sm hover:bg-[#D47A56] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E88D67]"
          >
            {t('listing.selectRoom', 'Select Room')}
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col min-h-screen bg-[#F8F6F3] font-sans pb-24">
        {/* Mobile Header (Back button) */}
        <div className="sticky top-0 z-20 bg-[#F8F6F3]/90 backdrop-blur-md px-4 py-3 border-b border-[#D8C9BE]">
          <button onClick={handleBack} className="flex items-center text-[#26382D]">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">{t('results.goBack', 'Go Back')}</span>
          </button>
        </div>

        <div className="px-4 pt-4 pb-12">
          {renderContent()}
        </div>
        <BottomNavBar />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#F8F6F3] font-sans">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-8 pt-8 w-full pb-12">
          {/* Desktop Header */}
          <div className="mb-6">
            <button 
              onClick={handleBack}
              className="flex items-center text-[#7C9278] hover:text-[#26382D] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">{t('accommodation.backToSearch', 'Back to Search')}</span>
            </button>
          </div>

          {renderContent()}
        </div>
      </div>
    </>
  );
}
