import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../../shared/components/Navbar';
import { Button } from '../../shared/components/Button';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { Tabs } from '../../shared/components/Tabs';
import { getListing, createListing, ListingPayload, DataState } from '../../lib/api';
import { ACCESSIBILITY_FEATURES, AccessibilityFeatureKey } from '../../shared/constants/accessibility';
import { SUSTAINABILITY_FEATURES, SustainabilityFeatureKey } from '../../shared/constants/sustainability';
import { Loader2, AlertCircle, Camera } from 'lucide-react';

export default function ListingManagerPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;

  // Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState<string>('');
  const [starRating, setStarRating] = useState<string>('');
  
  const [accessibility, setAccessibility] = useState<Record<string, boolean>>({});
  const [sustainability, setSustainability] = useState<Record<string, boolean>>({});
  
  const [dataState, setDataState] = useState<'reported' | 'demo_synthetic' | null>(null);

  const [activeTab, setActiveTab] = useState('overview');

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      loadListing(editId);
    }
  }, [isEditMode, editId]);

  const loadListing = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const listing = await getListing(id);
      
      setName(listing.translations?.en?.name || listing.name || '');
      setCity(listing.city || '');
      setPrice(listing.price_inr_per_night?.toString() || '');
      setStarRating(listing.star_rating?.toString() || '');
      
      const accState: Record<string, boolean> = {};
      listing.accessibility_items?.forEach(item => {
        if (item.value) accState[item.label] = true;
      });
      setAccessibility(accState);

      const susState: Record<string, boolean> = {};
      listing.sustainability_items?.forEach(item => {
        if (item.value) susState[item.label] = true;
      });
      setSustainability(susState);

      if (listing.data_state === 'reported' || listing.data_state === 'demo_synthetic') {
        setDataState(listing.data_state);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load listing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessibilityToggle = (key: string) => {
    setAccessibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSustainabilityToggle = (key: string) => {
    setSustainability(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataState) {
      setError(t('listingManager.errorDataStateRequired', 'You must explicitly choose a Data State for this listing.'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const priceVal = price.trim() === '' ? null : parseInt(price, 10);
    const starVal = starRating.trim() === '' ? null : parseInt(starRating, 10);

    const payload: ListingPayload = {
      _id: isEditMode && editId ? editId : undefined,
      name,
      city,
      price_inr_per_night: isNaN(priceVal as number) ? null : priceVal,
      star_rating: isNaN(starVal as number) ? null : starVal,
      accessibility_items: Object.keys(accessibility).filter(k => accessibility[k]).map(k => ({
        label: k,
        value: true,
        data_state: dataState
      })),
      sustainability_items: Object.keys(sustainability).filter(k => sustainability[k]).map(k => ({
        label: k,
        value: true,
        data_state: dataState
      })),
      data_state: dataState
    };

    try {
      const res = await createListing(payload);
      setSuccess(t('listingManager.success', 'Listing saved successfully!'));
      if (!isEditMode) {
        // Option: clear form or redirect to edit mode
        navigate(`?id=${res._id}`, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C9278]" />
      </div>
    );
  }

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#D8C9BE]/50 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif font-bold text-[#26382D]">
                {isEditMode ? t('listingManager.editTitle', 'Edit Listing') : t('listingManager.addTitle', 'Add Listing')}
              </h1>
              {dataState && <DataStateBadge state={dataState} />}
            </div>
            <p className="text-[#26382D]/70 mt-1">
              {t('listingManager.subtitle', 'Manage property details and amenities')}
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={isSubmitting || !dataState}
            className="w-full md:w-auto px-8"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('listingManager.saving', 'Saving...')}
              </span>
            ) : (
              t('listingManager.save', 'Save Listing')
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
            <p className="font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          {/* =========================================
              DESKTOP LAYOUT (Hidden on mobile)
              ========================================= */}
          <div className="hidden lg:grid grid-cols-12 gap-8">
            <div className="col-span-8 space-y-8">
              <div className="mb-6">
                <Tabs 
                  items={[
                    { id: 'overview', label: t('listingManager.tabOverview', 'Overview') },
                    { id: 'photos', label: t('listingManager.tabPhotos', 'Photos') },
                    { id: 'rooms', label: t('listingManager.tabRooms', 'Rooms') },
                    { id: 'accessibility', label: t('listingManager.tabAccessibility', 'Accessibility') },
                    { id: 'sustainability', label: t('listingManager.tabSustainability', 'Sustainability') },
                    { id: 'location', label: t('listingManager.tabLocation', 'Location & Nearby') },
                    { id: 'preview', label: t('listingManager.tabPreview', 'Customer Preview') },
                  ]}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />
              </div>

              {activeTab === 'overview' && (
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#D8C9BE]">
                  <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-6">
                    {t('listingManager.basicInfoTitle', 'Basic Information')}
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name-desktop" className="block text-sm font-medium text-[#26382D]">{t('listingManager.nameLabel', 'Property Name')}</label>
                      <input id="name-desktop" type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#D8C9BE] focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="city-desktop" className="block text-sm font-medium text-[#26382D]">{t('listingManager.cityLabel', 'City')}</label>
                      <input id="city-desktop" type="text" required value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#D8C9BE] focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="price-desktop" className="block text-sm font-medium text-[#26382D]">{t('listingManager.priceLabel', 'Price per night (INR)')}</label>
                      <input id="price-desktop" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#D8C9BE] focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="starRating-desktop" className="block text-sm font-medium text-[#26382D]">{t('listingManager.starRatingLabel', 'Star Rating')}</label>
                      <input id="starRating-desktop" type="number" min="1" max="5" value={starRating} onChange={e => setStarRating(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#D8C9BE] focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'photos' && (
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#D8C9BE] flex flex-col items-center justify-center min-h-[300px]">
                   <p className="text-[#26382D]/70">{t('listingManager.photosPlaceholder', 'Photos manager will be displayed here.')}</p>
                   <Button variant="outline" className="mt-4" onClick={() => navigate(`/b2b/photos?id=${editId}`)}>Go to Photo Manager</Button>
                </section>
              )}

              {activeTab === 'rooms' && (
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#D8C9BE] flex flex-col items-center justify-center min-h-[300px]">
                   <p className="text-[#26382D]/70">{t('listingManager.roomsPlaceholder', 'Room types and inventory manager will be displayed here.')}</p>
                </section>
              )}

              {activeTab === 'accessibility' && (
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#D8C9BE]">
                  <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-2">{t('listingManager.accessibilityTitle', 'Accessibility Features')}</h2>
                  <p className="text-sm text-[#26382D]/70 mb-6">{t('listingManager.accessibilityDesc', 'Select the accessibility features this property explicitly claims. Unselected features will remain unverified.')}</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {ACCESSIBILITY_FEATURES.map(key => (
                      <label key={`desktop-acc-${key}`} className="flex items-start gap-3 p-3 rounded-lg border border-[#D8C9BE]/50 hover:bg-[#F8F6F3] cursor-pointer">
                        <input type="checkbox" checked={!!accessibility[key]} onChange={() => handleAccessibilityToggle(key)} className="mt-1 rounded text-[#7C9278] focus:ring-[#7C9278]" />
                        <span className="text-sm font-medium text-[#26382D]">{t(`labels.${key}`, key.replace(/_/g, ' '))}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'sustainability' && (
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#D8C9BE]">
                  <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-2">{t('listingManager.sustainabilityTitle', 'Sustainability Features')}</h2>
                  <p className="text-sm text-[#26382D]/70 mb-6">{t('listingManager.sustainabilityDesc', 'Select the sustainability practices this property explicitly claims. Unselected features will remain unverified.')}</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {SUSTAINABILITY_FEATURES.map(key => (
                      <label key={`desktop-sus-${key}`} className="flex items-start gap-3 p-3 rounded-lg border border-[#D8C9BE]/50 hover:bg-[#F8F6F3] cursor-pointer">
                        <input type="checkbox" checked={!!sustainability[key]} onChange={() => handleSustainabilityToggle(key)} className="mt-1 rounded text-[#7C9278] focus:ring-[#7C9278]" />
                        <span className="text-sm font-medium text-[#26382D]">{t(`labels.${key}`, key.replace(/_/g, ' '))}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'location' && (
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#D8C9BE]">
                   <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-6">{t('listingManager.locationTitle', 'Location & Nearby Places')}</h2>
                   
                   <div className="space-y-6">
                     <div className="space-y-2">
                       <label htmlFor="address-desktop" className="block text-sm font-medium text-[#26382D]">{t('listingManager.addressLabel', 'Search Address (Google Places)')}</label>
                       <div className="flex gap-2">
                         <input id="address-desktop" type="text" placeholder="Start typing address..." className="w-full px-4 py-2.5 rounded-lg border border-[#D8C9BE] focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                         <Button variant="outline">{t('listingManager.searchBtn', 'Search')}</Button>
                       </div>
                     </div>
                     
                     <div className="w-full h-[300px] bg-[#F1EDE9] rounded-xl flex items-center justify-center border border-[#D8C9BE]">
                       <p className="text-[#26382D]/70 font-medium">{t('listingManager.mapPlaceholder', 'Interactive Map View (Google Maps API)')}</p>
                     </div>

                     <div className="pt-4 border-t border-[#D8C9BE]/50">
                       <h3 className="text-lg font-medium text-[#26382D] mb-4">{t('listingManager.nearbyPlaces', 'Nearby Accessible Places')}</h3>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 border border-[#D8C9BE] rounded-xl bg-[#F8F6F3]">
                           <span className="font-semibold text-[#26382D] block">Metro Station</span>
                           <span className="text-sm text-[#26382D]/70">0.5 km • Wheelchair Accessible</span>
                         </div>
                         <div className="p-4 border border-[#D8C9BE] rounded-xl bg-[#F8F6F3]">
                           <span className="font-semibold text-[#26382D] block">City Hospital</span>
                           <span className="text-sm text-[#26382D]/70">1.2 km • Wheelchair Accessible</span>
                         </div>
                       </div>
                     </div>
                   </div>
                </section>
              )}

              {activeTab === 'preview' && (
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#D8C9BE]">
                   <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-6">{t('listingManager.previewTitle', 'Customer Preview')}</h2>
                   
                   <div className="max-w-2xl mx-auto bg-white rounded-2xl overflow-hidden border border-[#D8C9BE] shadow-md">
                     <div className="h-48 bg-gray-200 relative">
                       <div className="absolute inset-0 bg-[#7C9278]/20 flex items-center justify-center">
                         <Camera className="w-8 h-8 text-white" />
                       </div>
                       <div className="absolute top-4 left-4">
                         <DataStateBadge state={dataState || 'not_verified'} />
                       </div>
                     </div>
                     <div className="p-6">
                       <div className="flex justify-between items-start mb-2">
                         <h3 className="text-2xl font-serif font-bold text-[#26382D]">{name || 'Your Property Name'}</h3>
                         <div className="flex items-center gap-1 bg-[#F8F6F3] px-2 py-1 rounded">
                           <span className="text-sm font-bold text-[#26382D]">{starRating || '4'}</span>
                           <span className="text-[#E5A022]">★</span>
                         </div>
                       </div>
                       <p className="text-[#26382D]/70 mb-4">{city || 'City, India'}</p>
                       
                       <div className="flex flex-wrap gap-2 mb-6">
                         {Object.entries(accessibility).filter(([_, v]) => v).slice(0, 3).map(([key]) => (
                           <span key={key} className="px-3 py-1 bg-[#7C9278]/10 text-[#7C9278] rounded-full text-xs font-semibold border border-[#7C9278]/20">
                             {t(`labels.${key}`, key.replace(/_/g, ' '))}
                           </span>
                         ))}
                         {Object.entries(accessibility).filter(([_, v]) => v).length > 3 && (
                           <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold border border-gray-200">
                             +{Object.entries(accessibility).filter(([_, v]) => v).length - 3} more
                           </span>
                         )}
                       </div>
                       
                       <div className="pt-4 border-t border-[#D8C9BE]/50 flex justify-between items-center">
                         <div>
                           <span className="text-2xl font-bold text-[#26382D]">₹{price || '5000'}</span>
                           <span className="text-sm text-[#26382D]/70"> / night</span>
                         </div>
                         <Button variant="primary">Book Now</Button>
                       </div>
                     </div>
                   </div>
                </section>
              )}
            </div>

            <div className="col-span-4 space-y-8">
              {/* Section: Data State (CRITICAL) Sidebar */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE] sticky top-8">
                <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-4">{t('listingManager.dataStateTitle', 'Classification (Mandatory)')}</h2>
                <p className="text-sm text-[#26382D]/70 mb-6">{t('listingManager.dataStateDesc', 'How should this listing be classified? This explicitly dictates how data provenance is displayed to travelers.')}</p>
                
                <div className="space-y-4">
                  <label className={`block border rounded-xl p-4 cursor-pointer transition-colors ${dataState === 'reported' ? 'border-[#7C9278] bg-[#7C9278]/5' : 'border-[#D8C9BE] hover:border-[#7C9278]/50'}`}>
                    <div className="flex items-start gap-3">
                      <input type="radio" name="dataState-desktop" value="reported" checked={dataState === 'reported'} onChange={() => setDataState('reported')} className="mt-1" />
                      <div>
                        <span className="block font-semibold text-[#26382D]">{t('listingManager.stateReported', 'Property Reported')}</span>
                        <span className="block text-sm text-[#26382D]/70 mt-1">{t('listingManager.stateReportedDesc', 'Real information supplied by the property/business.')}</span>
                      </div>
                    </div>
                  </label>
                  <label className={`block border rounded-xl p-4 cursor-pointer transition-colors ${dataState === 'demo_synthetic' ? 'border-orange-500 bg-orange-50' : 'border-[#D8C9BE] hover:border-orange-500/50'}`}>
                    <div className="flex items-start gap-3">
                      <input type="radio" name="dataState-desktop" value="demo_synthetic" checked={dataState === 'demo_synthetic'} onChange={() => setDataState('demo_synthetic')} className="mt-1" />
                      <div>
                        <span className="block font-semibold text-[#26382D]">{t('listingManager.stateDemo', 'Demo / Synthetic')}</span>
                        <span className="block text-sm text-[#26382D]/70 mt-1">{t('listingManager.stateDemoDesc', 'Hypothetical data used only for the prototype demonstration.')}</span>
                      </div>
                    </div>
                  </label>
                </div>
              </section>
            </div>
          </div>

          {/* =========================================
              MOBILE LAYOUT (Hidden on desktop)
              ========================================= */}
          <div className="flex lg:hidden flex-col gap-8 pb-20">
            {/* Mobile Tabs */}
            <div className="bg-white sticky top-16 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 pt-2 pb-2 shadow-sm border-b border-[#D8C9BE]/50">
              <Tabs 
                items={[
                  { id: 'overview', label: t('listingManager.tabOverview', 'Overview') },
                  { id: 'photos', label: t('listingManager.tabPhotos', 'Photos') },
                  { id: 'rooms', label: t('listingManager.tabRooms', 'Rooms') },
                  { id: 'accessibility', label: t('listingManager.tabAccessibility', 'Accessibility') },
                  { id: 'sustainability', label: t('listingManager.tabSustainability', 'Sustainability') },
                  { id: 'location', label: t('listingManager.tabLocation', 'Location') },
                  { id: 'preview', label: t('listingManager.tabPreview', 'Preview') },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>

            {/* Section: Data State (Mandatory classification, always visible or put it somewhere visible) */}
            {activeTab === 'overview' && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE]">
                <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-4">{t('listingManager.dataStateTitle', 'Classification (Mandatory)')}</h2>
                <p className="text-sm text-[#26382D]/70 mb-6">{t('listingManager.dataStateDesc', 'How should this listing be classified? This explicitly dictates how data provenance is displayed to travelers.')}</p>
                
                <div className="space-y-4">
                  <label className={`block border rounded-xl p-4 cursor-pointer transition-colors ${dataState === 'reported' ? 'border-[#7C9278] bg-[#7C9278]/5' : 'border-[#D8C9BE] hover:border-[#7C9278]/50'}`}>
                    <div className="flex items-start gap-3">
                      <input type="radio" name="dataState-mobile" value="reported" checked={dataState === 'reported'} onChange={() => setDataState('reported')} className="mt-1" />
                      <div>
                        <span className="block font-semibold text-[#26382D]">{t('listingManager.stateReported', 'Property Reported')}</span>
                        <span className="block text-sm text-[#26382D]/70 mt-1">{t('listingManager.stateReportedDesc', 'Real information supplied by the property/business.')}</span>
                      </div>
                    </div>
                  </label>
                  <label className={`block border rounded-xl p-4 cursor-pointer transition-colors ${dataState === 'demo_synthetic' ? 'border-orange-500 bg-orange-50' : 'border-[#D8C9BE] hover:border-orange-500/50'}`}>
                    <div className="flex items-start gap-3">
                      <input type="radio" name="dataState-mobile" value="demo_synthetic" checked={dataState === 'demo_synthetic'} onChange={() => setDataState('demo_synthetic')} className="mt-1" />
                      <div>
                        <span className="block font-semibold text-[#26382D]">{t('listingManager.stateDemo', 'Demo / Synthetic')}</span>
                        <span className="block text-sm text-[#26382D]/70 mt-1">{t('listingManager.stateDemoDesc', 'Hypothetical data used only for the prototype demonstration.')}</span>
                      </div>
                    </div>
                  </label>
                </div>
              </section>
            )}

            {activeTab === 'overview' && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE]">
                <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-6">{t('listingManager.basicInfoTitle', 'Basic Information')}</h2>
                <div className="flex flex-col gap-5">
                  <div className="space-y-2">
                    <label htmlFor="name-mobile" className="block text-sm font-medium text-[#26382D]">{t('listingManager.nameLabel', 'Property Name')}</label>
                    <input id="name-mobile" type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-[#D8C9BE] text-base focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="city-mobile" className="block text-sm font-medium text-[#26382D]">{t('listingManager.cityLabel', 'City')}</label>
                    <input id="city-mobile" type="text" required value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-[#D8C9BE] text-base focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="price-mobile" className="block text-sm font-medium text-[#26382D]">{t('listingManager.priceLabel', 'Price per night (INR)')}</label>
                    <input id="price-mobile" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-[#D8C9BE] text-base focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="starRating-mobile" className="block text-sm font-medium text-[#26382D]">{t('listingManager.starRatingLabel', 'Star Rating')}</label>
                    <input id="starRating-mobile" type="number" min="1" max="5" value={starRating} onChange={e => setStarRating(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-[#D8C9BE] text-base focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'photos' && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE] flex flex-col items-center justify-center min-h-[300px]">
                  <p className="text-[#26382D]/70">{t('listingManager.photosPlaceholder', 'Photos manager will be displayed here.')}</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate(`/b2b/photos?id=${editId}`)}>Go to Photo Manager</Button>
              </section>
            )}

            {activeTab === 'rooms' && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE] flex flex-col items-center justify-center min-h-[300px]">
                  <p className="text-[#26382D]/70">{t('listingManager.roomsPlaceholder', 'Room types and inventory manager will be displayed here.')}</p>
              </section>
            )}

            {activeTab === 'accessibility' && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE]">
                <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-2">{t('listingManager.accessibilityTitle', 'Accessibility Features')}</h2>
                <p className="text-sm text-[#26382D]/70 mb-6">{t('listingManager.accessibilityDesc', 'Select the accessibility features this property explicitly claims. Unselected features will remain unverified.')}</p>
                <div className="flex flex-col gap-3">
                  {ACCESSIBILITY_FEATURES.map(key => (
                    <label key={`mobile-acc-${key}`} className="flex items-start gap-4 p-4 rounded-xl border border-[#D8C9BE]/50 hover:bg-[#F8F6F3] cursor-pointer">
                      <input type="checkbox" checked={!!accessibility[key]} onChange={() => handleAccessibilityToggle(key)} className="mt-1 w-5 h-5 rounded text-[#7C9278] focus:ring-[#7C9278]" />
                      <span className="text-base font-medium text-[#26382D]">{t(`labels.${key}`, key.replace(/_/g, ' '))}</span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'sustainability' && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE]">
                <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-2">{t('listingManager.sustainabilityTitle', 'Sustainability Features')}</h2>
                <p className="text-sm text-[#26382D]/70 mb-6">{t('listingManager.sustainabilityDesc', 'Select the sustainability practices this property explicitly claims. Unselected features will remain unverified.')}</p>
                <div className="flex flex-col gap-3">
                  {SUSTAINABILITY_FEATURES.map(key => (
                    <label key={`mobile-sus-${key}`} className="flex items-start gap-4 p-4 rounded-xl border border-[#D8C9BE]/50 hover:bg-[#F8F6F3] cursor-pointer">
                      <input type="checkbox" checked={!!sustainability[key]} onChange={() => handleSustainabilityToggle(key)} className="mt-1 w-5 h-5 rounded text-[#7C9278] focus:ring-[#7C9278]" />
                      <span className="text-base font-medium text-[#26382D]">{t(`labels.${key}`, key.replace(/_/g, ' '))}</span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'location' && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE]">
                 <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-6">{t('listingManager.locationTitle', 'Location & Nearby')}</h2>
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label htmlFor="address-mobile" className="block text-sm font-medium text-[#26382D]">{t('listingManager.addressLabel', 'Search Address')}</label>
                     <div className="flex gap-2">
                       <input id="address-mobile" type="text" placeholder="Start typing address..." className="w-full px-4 py-2.5 rounded-lg border border-[#D8C9BE] focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]" />
                     </div>
                   </div>
                   
                   <div className="w-full h-[200px] bg-[#F1EDE9] rounded-xl flex items-center justify-center border border-[#D8C9BE]">
                     <p className="text-[#26382D]/70 font-medium text-center px-4">Interactive Map View</p>
                   </div>
                 </div>
              </section>
            )}

            {activeTab === 'preview' && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE]">
                 <h2 className="text-xl font-serif font-semibold text-[#26382D] mb-6">{t('listingManager.previewTitle', 'Preview')}</h2>
                 <div className="bg-white rounded-2xl overflow-hidden border border-[#D8C9BE] shadow-md">
                     <div className="h-40 bg-gray-200 relative flex items-center justify-center">
                       <Camera className="w-8 h-8 text-[#26382D]/30" />
                       <div className="absolute top-2 left-2">
                         <DataStateBadge state={dataState || 'not_verified'} />
                       </div>
                     </div>
                     <div className="p-4">
                       <h3 className="text-xl font-serif font-bold text-[#26382D]">{name || 'Your Property'}</h3>
                       <p className="text-sm text-[#26382D]/70 mb-3">{city || 'City'}</p>
                       <div className="font-bold text-[#26382D]">₹{price || '5000'} <span className="font-normal text-sm">/ night</span></div>
                     </div>
                 </div>
              </section>
            )}
            
            {/* Sticky Mobile Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#D8C9BE] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
              <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !dataState} className="w-full py-3 text-lg">
                {isSubmitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('listingManager.saving', 'Saving...')}
                  </span>
                ) : (
                  t('listingManager.save', 'Save Listing')
                )}
              </Button>
            </div>
          </div>
        </form>
    </main>
  );
}
