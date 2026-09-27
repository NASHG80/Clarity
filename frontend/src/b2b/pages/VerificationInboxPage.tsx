import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  getAllListings, 
  getAnalytics, 
  getOpportunities, 
  getBusinessProfile,
  updateBusinessProfile,
  BusinessProfileResponse,
  ListingResponse, 
  AnalyticsResponse, 
  OpportunitiesResponse 
} from '../../lib/api';
import { Button } from '../../shared/components/Button';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { 
  Building2, MapPin, Edit2, ArrowRight, ShieldCheck, 
  CheckCircle2, AlertCircle, BarChart2, Zap, Mail, Phone, Globe, Save, X
} from 'lucide-react';

export default function VerificationInboxPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Business Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileResponse>({
    id: 'biz_001',
    name: 'Green Hotels Group',
    description: 'A collection of sustainable properties committed to eco-friendly practices across India.',
    industry: 'Hospitality Management',
    location: 'Mumbai, Maharashtra',
    contactEmail: 'contact@greenhotels.com',
    contactPhone: '+91 98765 43210',
    website: 'www.greenhotels.in'
  });
  const [editForm, setEditForm] = useState(businessProfile);

  const businessId = "biz_001";

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [listingsData, analyticsData, oppData, profileData] = await Promise.all([
        getAllListings().catch(() => []),
        getAnalytics(businessId).catch(() => null),
        getOpportunities(businessId).catch(() => null),
        getBusinessProfile(businessId).catch(() => null)
      ]);
      
      setListings(listingsData || []);
      setAnalytics(analyticsData);
      setOpportunities(oppData);
      if (profileData) {
        setBusinessProfile(profileData);
        setEditForm(profileData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEditProfile = () => {
    setEditForm(businessProfile);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const updated = await updateBusinessProfile(businessId, {
        name: editForm.name,
        description: editForm.description,
        industry: editForm.industry,
        location: editForm.location,
        contactEmail: editForm.contactEmail,
        contactPhone: editForm.contactPhone,
        website: editForm.website
      });
      setBusinessProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert("Failed to save profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm(businessProfile);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="w-full h-64 bg-white rounded-2xl border border-[#D8C9BE]"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 h-96 bg-white rounded-2xl border border-[#D8C9BE]"></div>
            <div className="h-96 bg-white rounded-2xl border border-[#D8C9BE]"></div>
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

  return (
    <div className="min-h-screen bg-[#F8F6F3] font-sans text-[#26382D] pb-24">
      {/* PROFILE HEADER / HERO */}
      <div className="bg-white border-b border-[#D8C9BE]">
        <div className="max-w-6xl mx-auto w-full">
          {/* Cover Image */}
          <div className="h-64 sm:h-80 w-full relative bg-[#26382D] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#26382D] to-[#3a5243] opacity-90" />
            
            {/* Logo Avatar Overlapping */}
            <div className="absolute -bottom-12 left-4 sm:left-8 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-sm border-4 border-white flex items-center justify-center overflow-hidden">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#7C9278]" />
            </div>
          </div>

          {/* Hero Content */}
          <div className="pt-16 pb-8 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="text-3xl sm:text-4xl font-serif font-bold text-[#26382D] bg-white border border-[#D8C9BE] rounded px-3 py-1 w-full max-w-md focus:ring-2 focus:ring-[#7C9278] outline-none"
                  />
                ) : (
                  <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#26382D]">{businessProfile.name}</h1>
                )}
                
                {!isEditing && (
                  <span className="inline-flex items-center gap-1 bg-[#E8F0E6] text-[#26382D] px-2.5 py-1 rounded-md text-xs font-semibold border border-[#7C9278]/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Business
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[#26382D]/70 text-sm font-medium mt-3">
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {businessProfile.industry}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="bg-white border border-[#D8C9BE] rounded px-2 py-1 text-sm focus:ring-2 focus:ring-[#7C9278] outline-none"
                    />
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {businessProfile.location}</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancelEdit} leftIcon={<X className="w-4 h-4" />}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSaveProfile} leftIcon={<Save className="w-4 h-4" />}>
                    Save Profile
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={handleEditProfile} leftIcon={<Edit2 className="w-4 h-4" />}>
                  {t('profile.editProfile', 'Edit Profile')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Main Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ABOUT */}
            <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <h2 className="text-xl font-serif font-bold text-[#26382D] mb-4">{t('profile.aboutTitle', 'About the Business')}</h2>
              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={4}
                  className="w-full bg-white border border-[#D8C9BE] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#7C9278] outline-none resize-none"
                  placeholder="Describe your business..."
                />
              ) : (
                <p className="text-[#26382D]/80 leading-relaxed">
                  {businessProfile.description || 'No description provided.'}
                </p>
              )}
            </section>

            {/* CONTACT INFO */}
            <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <h2 className="text-xl font-serif font-bold text-[#26382D] mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-[#26382D]/50 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.contactEmail}
                      onChange={(e) => setEditForm({...editForm, contactEmail: e.target.value})}
                      className="w-full bg-white border border-[#D8C9BE] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C9278] outline-none"
                    />
                  ) : (
                    <p className="font-medium text-[15px]">{businessProfile.contactEmail}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#26382D]/50 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.contactPhone}
                      onChange={(e) => setEditForm({...editForm, contactPhone: e.target.value})}
                      className="w-full bg-white border border-[#D8C9BE] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C9278] outline-none"
                    />
                  ) : (
                    <p className="font-medium text-[15px]">{businessProfile.contactPhone}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-[#26382D]/50 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</p>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                      className="w-full bg-white border border-[#D8C9BE] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C9278] outline-none"
                    />
                  ) : (
                    <a href={`https://${businessProfile.website}`} target="_blank" rel="noreferrer" className="font-medium text-[15px] text-[#7C9278] hover:underline">
                      {businessProfile.website}
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* PROPERTIES LIST */}
            <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif font-bold text-[#26382D]">Managed Properties</h2>
                <Button variant="outline" onClick={() => navigate('/b2b/listings')} className="text-sm">
                  View All
                </Button>
              </div>
              
              {listings.length > 0 ? (
                <div className="space-y-4">
                  {listings.map((listingItem, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-[#D8C9BE]/50 bg-[#F8F6F3]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#E5DFD6] overflow-hidden shrink-0">
                          {listingItem.photos && listingItem.photos.length > 0 ? (
                            <img src={listingItem.photos[0]} alt="Prop" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-full h-full p-3 text-[#26382D]/20" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#26382D]">{(listingItem.translations?.en?.name as any) || (listingItem as any).name || 'Unnamed Property'}</p>
                          <p className="text-sm text-[#26382D]/70 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {listingItem.city}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" onClick={() => navigate(`/b2b/listings/${listingItem._id || (listingItem as any).id}`)}>
                        Manage
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#F8F6F3] border border-[#D8C9BE] border-dashed rounded-xl p-8 text-center">
                  <p className="text-[#26382D]/70 mb-4">No properties connected to your business yet.</p>
                  <Button variant="primary" onClick={() => navigate('/onboarding')}>Add Property</Button>
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
                  <DataStateBadge state="verified" />
                </div>
                <div className="flex justify-between items-center text-sm pb-3 border-b border-[#D8C9BE]/50">
                  <span className="font-medium">Total Properties</span>
                  <span className="text-[#26382D]/80 font-bold">{listings.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Business ID</span>
                  <span className="font-mono text-xs text-[#26382D]/60">{businessId}</span>
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
                    <p className="text-2xl font-bold text-[#26382D] mb-0.5">{(analytics.funnel?.listing_impressions ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-[#26382D]/60 font-medium uppercase tracking-wider">Impressions</p>
                  </div>
                  <div className="bg-[#F8F6F3] p-3 rounded-xl border border-[#D8C9BE]/50 text-center">
                    <p className="text-2xl font-bold text-[#26382D] mb-0.5">{(analytics.funnel?.detail_opens ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-[#26382D]/60 font-medium uppercase tracking-wider">Views</p>
                  </div>
                  <div className="bg-[#F8F6F3] p-3 rounded-xl border border-[#D8C9BE]/50 text-center">
                    <p className="text-2xl font-bold text-[#26382D] mb-0.5">{(analytics.funnel?.saves ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-[#26382D]/60 font-medium uppercase tracking-wider">Saves</p>
                  </div>
                  <div className="bg-[#F8F6F3] p-3 rounded-xl border border-[#D8C9BE]/50 text-center">
                    <p className="text-2xl font-bold text-[#26382D] mb-0.5">{(analytics.funnel?.bookings ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-[#26382D]/60 font-medium uppercase tracking-wider">Bookings</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#26382D]/60 mb-5">Analytics data is not available yet.</p>
              )}
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/b2b/analytics')} rightIcon={<ArrowRight className="w-4 h-4" />}>
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
              
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/b2b/opportunity-detector')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                {t('profile.viewOpportunities', 'View Opportunities')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
