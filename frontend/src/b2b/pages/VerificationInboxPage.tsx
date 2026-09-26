import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  getAllListings, 
  getAnalytics, 
  getOpportunities, 
  ListingResponse, 
  AnalyticsResponse, 
  OpportunitiesResponse 
} from '../../lib/api';
import { Button } from '../../shared/components/Button';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { 
  Building2, MapPin, Camera, Edit2, ArrowRight, ShieldCheck, 
  Map, Star, CheckCircle2, AlertCircle, Eye, Image as ImageIcon,
  BarChart2, Zap
} from 'lucide-react';

export default function VerificationInboxPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const businessId = "biz_001";

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [listingsData, analyticsData, oppData] = await Promise.all([
        getAllListings().catch(() => []),
        getAnalytics(businessId).catch(() => null),
        getOpportunities(businessId).catch(() => null)
      ]);
      
      if (listingsData && listingsData.length > 0) {
        setListing(listingsData[0]);
      }
      setAnalytics(analyticsData);
      setOpportunities(oppData);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="w-full h-64 bg-white rounded-2xl border border-[#D8C9BE]"></div>
          <div className="flex gap-4">
            <div className="w-1/4 h-12 bg-white rounded-lg border border-[#D8C9BE]"></div>
            <div className="w-1/4 h-12 bg-white rounded-lg border border-[#D8C9BE]"></div>
            <div className="w-1/4 h-12 bg-white rounded-lg border border-[#D8C9BE]"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="h-48 bg-white rounded-2xl border border-[#D8C9BE]"></div>
              <div className="h-64 bg-white rounded-2xl border border-[#D8C9BE]"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-white rounded-2xl border border-[#D8C9BE]"></div>
              <div className="h-48 bg-white rounded-2xl border border-[#D8C9BE]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[#D8C9BE] text-center max-w-md w-full shadow-sm">
          <AlertCircle className="w-12 h-12 text-[#26382D]/40 mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-[#26382D] mb-2">{t('profile.errorTitle', 'Profile Unavailable')}</h2>
          <p className="text-[#26382D]/70 mb-6">{error}</p>
          <Button variant="primary" onClick={loadProfile}>{t('profile.retry', 'Retry')}</Button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[#D8C9BE] text-center max-w-md w-full shadow-sm">
          <Building2 className="w-12 h-12 text-[#26382D]/20 mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-[#26382D] mb-2">{t('profile.noListingTitle', 'No Property Connected')}</h2>
          <p className="text-[#26382D]/70 mb-6">{t('profile.noListingDesc', 'Add your first property to complete your business profile.')}</p>
          <Button variant="primary" onClick={() => navigate('/onboarding')}>{t('profile.addProperty', 'Add Property')}</Button>
        </div>
      </div>
    );
  }

  const name = listing.translations?.en?.name || (listing as any).name || 'Unnamed Property';
  const description = listing.translations?.en?.description || (listing as any).description || '';
  const coverPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null;

  const handleEditProfile = () => navigate('/onboarding');
  const handleViewListing = () => navigate(`/b2b/listings/${listing._id || (listing as any).id}`);
  const handleViewAnalytics = () => navigate('/b2b/analytics');
  const handleViewOpportunities = () => navigate('/b2b/opportunity-detector');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F3] font-sans text-[#26382D] pb-24">
      {/* PROFILE HEADER / HERO */}
      <div className="bg-white border-b border-[#D8C9BE]">
        <div className="max-w-6xl mx-auto w-full">
          {/* Cover Image */}
          <div className="h-64 sm:h-80 w-full relative bg-[#E5DFD6] overflow-hidden">
            {coverPhoto ? (
              <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#26382D]/40">
                <ImageIcon className="w-12 h-12 mb-3" />
                <p className="font-medium">{t('profile.noCover', 'Add a cover photo')}</p>
                <Button variant="ghost" className="mt-2" onClick={handleEditProfile}>{t('profile.editCover', 'Edit Profile')}</Button>
              </div>
            )}
            
            {/* Logo Avatar Overlapping */}
            <div className="absolute -bottom-12 left-4 sm:left-8 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-sm border-4 border-white flex items-center justify-center overflow-hidden">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#26382D]/20" />
            </div>
          </div>

          {/* Hero Content */}
          <div className="pt-16 pb-8 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#26382D]">{name}</h1>
                {listing.data_state === 'reported' && (
                  <span className="inline-flex items-center gap-1 bg-[#E8F0E6] text-[#26382D] px-2.5 py-1 rounded-md text-xs font-semibold border border-[#7C9278]/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Profile
                  </span>
                )}
                {listing.data_state === 'demo_synthetic' && (
                  <DataStateBadge state="demo_synthetic" />
                )}
              </div>
              <div className="flex items-center gap-4 text-[#26382D]/70 text-sm font-medium">
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Hospitality</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {listing.city}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={handleEditProfile} leftIcon={<Edit2 className="w-4 h-4" />}>
                {t('profile.editProfile', 'Edit Profile')}
              </Button>
              <Button variant="primary" onClick={handleViewListing} leftIcon={<Eye className="w-4 h-4" />}>
                {t('profile.previewListing', 'Preview as Traveler')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY NAVIGATION */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-[#D8C9BE] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-2">
            {['Overview', 'Property', 'Accessibility', 'Sustainability', 'Photos'].map((tab) => (
              <button
                key={tab}
                onClick={() => scrollToSection(tab.toLowerCase())}
                className="px-4 py-2.5 text-sm font-semibold text-[#26382D]/70 hover:text-[#26382D] hover:bg-[#F8F6F3] rounded-lg whitespace-nowrap transition-colors"
              >
                {t(`profile.tab${tab}`, tab)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Main Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ABOUT */}
            <section id="overview" className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <h2 className="text-xl font-serif font-bold text-[#26382D] mb-4">{t('profile.aboutTitle', 'About the Business')}</h2>
              {description ? (
                <p className="text-[#26382D]/80 leading-relaxed">{description}</p>
              ) : (
                <div className="bg-[#F8F6F3] border border-[#D8C9BE] border-dashed rounded-xl p-6 text-center">
                  <p className="text-[#26382D]/70 mb-3">{t('profile.noDescription', 'Tell travelers what makes your property special.')}</p>
                  <Button variant="outline" onClick={handleEditProfile}>{t('profile.addDescription', 'Add description')}</Button>
                </div>
              )}
            </section>

            {/* PROPERTY INFO */}
            <section id="property" className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif font-bold text-[#26382D]">{t('profile.propertyInfoTitle', 'Property Information')}</h2>
                <Button variant="ghost" onClick={handleEditProfile} className="text-sm">{t('profile.edit', 'Edit')}</Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-[#26382D]/50 uppercase tracking-wider mb-1">Property Type</p>
                  <p className="font-medium">Hotel</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#26382D]/50 uppercase tracking-wider mb-1">Location</p>
                  <p className="font-medium">{listing.city}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#26382D]/50 uppercase tracking-wider mb-1">Star Rating</p>
                  <div className="flex items-center gap-1 font-medium">
                    {listing.star_rating ? (
                      <>
                        <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                        {listing.star_rating} Stars
                      </>
                    ) : (
                      <span className="text-[#26382D]/50">Not specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#26382D]/50 uppercase tracking-wider mb-1">Property ID</p>
                  <p className="font-mono text-sm text-[#26382D]/70">{listing._id || (listing as any).id}</p>
                </div>
              </div>
            </section>

            {/* ACCESSIBILITY */}
            <section id="accessibility" className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#26382D] mb-1">{t('profile.accessibilityTitle', 'Accessibility')}</h2>
                  <p className="text-sm text-[#26382D]/70">{t('profile.accessibilityDesc', 'Help travelers understand what your property offers.')}</p>
                </div>
                <Button variant="outline" onClick={handleViewListing} className="text-sm hidden sm:inline-flex">
                  {t('profile.editAccessibility', 'Edit Accessibility')}
                </Button>
              </div>

              {listing.accessibility_items && listing.accessibility_items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.accessibility_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-[#D8C9BE]/50 bg-[#F8F6F3]">
                      <span className="font-medium text-sm">{item.label.replace(/_/g, ' ')}</span>
                      <DataStateBadge state={item.data_state as any} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#F8F6F3] border border-[#D8C9BE] border-dashed rounded-xl p-8 text-center">
                  <p className="text-[#26382D]/70 mb-4">{t('profile.noAccessibility', 'Add accessibility information so travelers know what to expect.')}</p>
                  <Button variant="primary" onClick={handleViewListing}>{t('profile.addAccessibility', 'Add accessibility details')}</Button>
                </div>
              )}
            </section>

            {/* SUSTAINABILITY */}
            <section id="sustainability" className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#26382D] mb-1">{t('profile.sustainabilityTitle', 'Sustainability')}</h2>
                  <p className="text-sm text-[#26382D]/70">{t('profile.sustainabilityDesc', 'Share the practices that help make your property more responsible.')}</p>
                </div>
                <Button variant="outline" onClick={handleViewListing} className="text-sm hidden sm:inline-flex">
                  {t('profile.editSustainability', 'Edit Sustainability')}
                </Button>
              </div>

              {listing.sustainability_items && listing.sustainability_items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.sustainability_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-[#D8C9BE]/50 bg-[#F8F6F3]">
                      <span className="font-medium text-sm">{item.label.replace(/_/g, ' ')}</span>
                      <DataStateBadge state={item.data_state as any} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#F8F6F3] border border-[#D8C9BE] border-dashed rounded-xl p-8 text-center">
                  <p className="text-[#26382D]/70 mb-4">{t('profile.noSustainability', 'Add sustainability information to highlight your environmental practices.')}</p>
                  <Button variant="primary" onClick={handleViewListing}>{t('profile.addSustainability', 'Add sustainability details')}</Button>
                </div>
              )}
            </section>

            {/* PHOTOS */}
            <section id="photos" className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#26382D] mb-1">{t('profile.photosTitle', 'Property Photos')}</h2>
                  <p className="text-sm text-[#26382D]/70">{t('profile.photosDesc', 'Show travelers what your property looks like.')}</p>
                </div>
                <Button variant="outline" onClick={handleViewListing} className="text-sm hidden sm:inline-flex">
                  {t('profile.managePhotos', 'Manage Photos')}
                </Button>
              </div>

              {listing.photos && listing.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2 row-span-2 rounded-xl overflow-hidden bg-[#E5DFD6]">
                    <img src={listing.photos[0]} alt="Featured" className="w-full h-full object-cover" />
                  </div>
                  {listing.photos.slice(1, 3).map((p, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden bg-[#E5DFD6] aspect-square">
                      <img src={p} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#F8F6F3] border border-[#D8C9BE] border-dashed rounded-xl p-8 text-center">
                  <ImageIcon className="w-10 h-10 text-[#26382D]/20 mx-auto mb-3" />
                  <p className="text-[#26382D]/70 mb-4">{t('profile.noPhotos', 'Add photos to make your property stand out.')}</p>
                  <Button variant="primary" onClick={handleViewListing}>{t('profile.addPhotos', 'Upload Photos')}</Button>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: Sidebar (Trust, Analytics, Actions) */}
          <div className="space-y-6">
            
            {/* TRUST & DATA STATUS */}
            <div className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#7C9278]" />
                <h3 className="text-lg font-serif font-bold text-[#26382D]">{t('profile.trustTitle', 'Trust & Status')}</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm pb-3 border-b border-[#D8C9BE]/50">
                  <span className="font-medium">Business Identity</span>
                  <DataStateBadge state="reported" />
                </div>
                <div className="flex justify-between items-center text-sm pb-3 border-b border-[#D8C9BE]/50">
                  <span className="font-medium">Property Details</span>
                  <DataStateBadge state={listing.data_state as any} />
                </div>
                <div className="flex justify-between items-center text-sm pb-3 border-b border-[#D8C9BE]/50">
                  <span className="font-medium">Accessibility Data</span>
                  <span className="text-[#26382D]/60">{listing.accessibility_items?.length || 0} fields reported</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Sustainability Data</span>
                  <span className="text-[#26382D]/60">{listing.sustainability_items?.length || 0} fields reported</span>
                </div>
              </div>
            </div>

            {/* PERFORMANCE */}
            <div className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-[#26382D]/60" />
                <h3 className="text-lg font-serif font-bold text-[#26382D]">{t('profile.performanceTitle', 'Performance (30d)')}</h3>
              </div>
              
              {analytics ? (
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-[#F8F6F3] p-3 rounded-xl border border-[#D8C9BE]/50 text-center">
                    <p className="text-2xl font-bold text-[#26382D] mb-0.5">{analytics.funnel.listing_impressions.toLocaleString()}</p>
                    <p className="text-xs text-[#26382D]/60 font-medium uppercase tracking-wider">Impressions</p>
                  </div>
                  <div className="bg-[#F8F6F3] p-3 rounded-xl border border-[#D8C9BE]/50 text-center">
                    <p className="text-2xl font-bold text-[#26382D] mb-0.5">{analytics.funnel.detail_opens.toLocaleString()}</p>
                    <p className="text-xs text-[#26382D]/60 font-medium uppercase tracking-wider">Views</p>
                  </div>
                  <div className="bg-[#F8F6F3] p-3 rounded-xl border border-[#D8C9BE]/50 text-center">
                    <p className="text-2xl font-bold text-[#26382D] mb-0.5">{analytics.funnel.saves.toLocaleString()}</p>
                    <p className="text-xs text-[#26382D]/60 font-medium uppercase tracking-wider">Saves</p>
                  </div>
                  <div className="bg-[#F8F6F3] p-3 rounded-xl border border-[#D8C9BE]/50 text-center">
                    <p className="text-2xl font-bold text-[#26382D] mb-0.5">{analytics.funnel.bookings.toLocaleString()}</p>
                    <p className="text-xs text-[#26382D]/60 font-medium uppercase tracking-wider">Bookings</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#26382D]/60 mb-5">Analytics data is not available yet.</p>
              )}
              <Button variant="outline" className="w-full justify-between" onClick={handleViewAnalytics} rightIcon={<ArrowRight className="w-4 h-4" />}>
                {t('profile.viewAnalytics', 'View Analytics')}
              </Button>
            </div>

            {/* OPPORTUNITIES */}
            <div className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[#E68A47]" />
                <h3 className="text-lg font-serif font-bold text-[#26382D]">{t('profile.opportunitiesTitle', 'Opportunities')}</h3>
              </div>
              
              {opportunities && opportunities.opportunities && opportunities.opportunities.length > 0 ? (
                <div className="space-y-4 mb-5">
                  <p className="text-sm font-medium">
                    <span className="font-bold text-[#E68A47]">{opportunities.opportunities.length}</span> opportunities identified
                  </p>
                  {opportunities.opportunities.slice(0, 1).map((opp, idx) => (
                    <div key={idx} className="bg-[#FFF4E5] border border-[#FAD3A3] p-3 rounded-xl text-sm text-[#935215]">
                      <span className="font-bold block mb-1">{opp.title}</span>
                      <span className="opacity-90">{opp.estimate || 'Capture unmet demand.'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#26382D]/60 mb-5">No critical opportunities detected right now.</p>
              )}
              
              <Button variant="outline" className="w-full justify-between" onClick={handleViewOpportunities} rightIcon={<ArrowRight className="w-4 h-4" />}>
                {t('profile.viewOpportunities', 'View Opportunities')}
              </Button>
            </div>
            
            {/* QUICK ACTIONS */}
            <div className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <h3 className="text-sm font-semibold text-[#26382D] uppercase tracking-wider mb-4">{t('profile.quickActions', 'Quick Actions')}</h3>
              <div className="flex flex-col gap-2">
                <button onClick={handleViewListing} className="text-left px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#F8F6F3] transition-colors">{t('profile.actionPreview', 'Preview Customer Listing')}</button>
                <button onClick={handleEditProfile} className="text-left px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#F8F6F3] transition-colors">{t('profile.actionEditBasic', 'Edit Profile & Details')}</button>
                <button onClick={handleViewListing} className="text-left px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#F8F6F3] transition-colors">{t('profile.actionEditPhotos', 'Manage Photos')}</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
