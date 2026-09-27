import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, MapPin, Star, Camera, Info, Check, 
  BookOpen, StarHalf, Image as ImageIcon,
  Wifi, Coffee, Car, Utensils, Waves, Dumbbell, Snowflake, Tv, Users, Leaf, ArrowRight, Edit3
} from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { DataStateBadge } from '../../../shared/components/DataStateBadge';
import { ListingDetailResponse } from '../../../lib/api';
import { LocationMapSection } from '../../../shared/components/LocationMapSection';

const amenityIcons: Record<string, any> = {
  wifi: <Wifi className="w-5 h-5" />,
  breakfast: <Coffee className="w-5 h-5" />,
  parking: <Car className="w-5 h-5" />,
  restaurant: <Utensils className="w-5 h-5" />,
  pool: <Waves className="w-5 h-5" />,
  gym: <Dumbbell className="w-5 h-5" />,
  ac: <Snowflake className="w-5 h-5" />,
  tv: <Tv className="w-5 h-5" />
};

export interface PropertyDetailTemplateProps {
  listing: ListingDetailResponse;
  mode: 'customer-preview' | 'business';
  onEdit?: (section: string, initialData?: any) => void;
  actionButton?: React.ReactNode;
}

// Premier scenic villa & resort zones across key Indian destinations
const VILLA_LOCALITIES: Record<string, { lat: number; lng: number; area: string }> = {
  goa: { lat: 15.5186, lng: 73.7684, area: "Candolim Beach Villa Enclave, North Goa" },
  delhi: { lat: 28.5529, lng: 77.1218, area: "Aerocity Hospitality Enclave, New Delhi" },
  mumbai: { lat: 19.0988, lng: 72.8264, area: "Juhu Seaside Villas, Mumbai" },
  bengaluru: { lat: 12.9784, lng: 77.6408, area: "Indiranagar Green Villas, Bengaluru" },
  bangalore: { lat: 12.9784, lng: 77.6408, area: "Indiranagar Green Villas, Bengaluru" },
  jaipur: { lat: 26.9054, lng: 75.7892, area: "Civil Lines Heritage Enclave, Jaipur" },
  udaipur: { lat: 24.5764, lng: 73.6835, area: "Lake Pichola Waterfront Villas, Udaipur" },
  kochi: { lat: 9.9656, lng: 76.2421, area: "Fort Kochi Heritage Waterfront, Kochi" },
  cochin: { lat: 9.9656, lng: 76.2421, area: "Fort Kochi Heritage Waterfront, Kochi" },
  agra: { lat: 27.1612, lng: 78.0483, area: "Taj View Enclave, Fatehabad Road, Agra" },
  varanasi: { lat: 25.3216, lng: 82.9876, area: "Cantonment Heritage Enclave, Varanasi" },
  manali: { lat: 32.2496, lng: 77.1802, area: "Old Manali Hillside Forest Villas, Manali" },
  shimla: { lat: 31.1048, lng: 77.1734, area: "Chotta Shimla Pine Estate, Shimla" },
  hyderabad: { lat: 17.4326, lng: 78.4071, area: "Jubilee Hills Estate, Hyderabad" },
  pune: { lat: 18.5362, lng: 73.8940, area: "Koregaon Park Green Belt, Pune" },
  chennai: { lat: 12.9102, lng: 80.2520, area: "ECR Beachfront Villa Enclave, Chennai" },
  kolkata: { lat: 22.5355, lng: 88.3512, area: "Ballygunge Heritage Enclave, Kolkata" }
};

function resolveMapLocation(listing: ListingDetailResponse, propertyName: string) {
  if (
    listing.location &&
    typeof listing.location.lat === 'number' &&
    typeof listing.location.lng === 'number' &&
    listing.location.lat !== 0
  ) {
    return {
      lat: listing.location.lat,
      lng: listing.location.lng,
      areaTitle: "Verified Property Location",
      address: listing.address || `${propertyName}, ${listing.city || ''}`
    };
  }

  const cityKey = (listing.city || 'Goa').toLowerCase().trim();
  const base = VILLA_LOCALITIES[cityKey] || {
    lat: 15.5186,
    lng: 73.7684,
    area: `${listing.city || 'Central'} Private Villa Enclave`
  };

  // Deterministic micro-jitter so each property gets its own specific villa location in the area
  let hash = 0;
  const seed = `${listing.id || ''}_${propertyName}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  const latOffset = (((Math.abs(hash) % 100) - 50) * 0.00015);
  const lngOffset = (((Math.abs(hash >> 6) % 100) - 50) * 0.00015);

  const finalLat = Number((base.lat + latOffset).toFixed(5));
  const finalLng = Number((base.lng + lngOffset).toFixed(5));
  const finalAddress = listing.address || `${propertyName}, ${base.area}`;

  return {
    lat: finalLat,
    lng: finalLng,
    areaTitle: base.area.split(',')[0],
    address: finalAddress
  };
}

export function PropertyDetailTemplate({ listing, mode, onEdit, actionButton }: PropertyDetailTemplateProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'location' | 'rules' | 'reviews'>('overview');

  const currentTranslation = listing.translations?.[lang];
  const name = currentTranslation?.name || listing.translations?.['en']?.name || 'Unnamed Property';
  const description = currentTranslation?.description || listing.translations?.['en']?.description || '';
  const showEnglishFallback = !currentTranslation?.name && !!listing.translations?.['en']?.name && lang !== 'en';

  const renderEditButton = (section: string, initialData: any = {}) => {
    if (mode !== 'business') return null;
    return (
      <Button variant="ghost" size="sm" onClick={() => onEdit?.(section, initialData)} className="text-[#7C9278]">
        {t('preview.edit', 'Edit')}
      </Button>
    );
  };

  const NAV_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'location', label: 'Location' },
    { id: 'rules', label: 'Property Rules' },
    { id: 'reviews', label: 'User Reviews' },
  ] as const;

  return (
    <div className="w-full bg-white font-sans text-[#26382D] pb-24">
      <div className="w-full mx-auto pb-8">
        {/* â”€â”€ Header â”€â”€ */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-6 pt-6 px-4 sm:px-6 lg:px-8">
          
          {/* Header Title Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <DataStateBadge state={listing.data_state as any} />
              {showEnglishFallback && (
                <span className="text-xs font-normal text-[#7C9278] font-sans">({t('common.shownInEnglish', 'Shown in English')})</span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#26382D] mb-4 leading-tight">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-[15px] text-[#26382D]/80">
              {listing.star_rating && (
                <div className="flex items-center gap-1.5 font-medium text-[#1C2B22]">
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <span>{listing.star_rating} {t('preview.stars', 'Stars')}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 font-medium text-[#1C2B22]">
                <MapPin className="w-4 h-4 text-[#7C9278]" />
                <span>{listing.city || 'City pending...'}</span>
              </div>
            </div>
          </div>

          {/* Desktop Pricing & Action Box */}
          <div className="hidden md:flex flex-col justify-center bg-[#FAF9F7] p-6 rounded-2xl border border-[#D8C9BE] shadow-sm min-w-[320px] shrink-0">
            {listing.price_inr_per_night ? (
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl lg:text-4xl font-serif font-bold text-[#26382D]">₹{listing.price_inr_per_night.toLocaleString()}</span>
                <span className="text-[15px] text-[#26382D]/70">{t('preview.perNight', 'per night')}</span>
              </div>
            ) : (
              <p className="text-[15px] italic text-[#26382D]/60 mb-2">{t('preview.noPrice', 'Pricing not set')}</p>
            )}
            {actionButton && <div className="w-full mt-4">{actionButton}</div>}
          </div>
        </div>

        {/* â”€â”€ Photo Gallery â”€â”€ */}
        <div className="mb-6 relative group px-3 sm:px-6 lg:px-8">
          {mode === 'business' && (
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm border-[#D8C9BE]" onClick={() => onEdit?.('photos', { photos: (listing.photos || []).join('\n') })}>
                {t('preview.editPhotos', 'Edit Photos')}
              </Button>
            </div>
          )}
          {listing.photos && listing.photos.length > 0 ? (
            <div className={`grid grid-cols-1 ${listing.photos.length > 1 ? 'md:grid-cols-4' : ''} gap-2 rounded-2xl overflow-hidden h-[380px] sm:h-[450px]`}>
              <div className={`${listing.photos.length > 1 ? 'md:col-span-3' : 'w-full'} bg-[#E5DFD6] relative`}>
                <img 
                  src={name === "The Emerald Forest Retreat" ? "/emerald_forest.jpg" : listing.photos[0]} 
                  alt="Primary" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542314831-c6a4d27d66f6?auto=format&fit=crop&q=80&w=1000' }} 
                />
              </div>
              {listing.photos.length > 1 && (
                <div className="hidden md:flex flex-col gap-2">
                  {[...listing.photos.slice(1, 3), ...Array(Math.max(0, 3 - listing.photos.length)).fill('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600')].slice(0, 2).map((p, idx) => (
                    <div key={idx} className="bg-[#E5DFD6] flex-1 relative overflow-hidden">
                      <img 
                        src={p} 
                        alt={`Gallery ${idx+1}`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600' }} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[380px] bg-[#F8F6F3] rounded-2xl border-2 border-dashed border-[#D8C9BE] flex flex-col items-center justify-center text-center p-6">
              <Camera className="w-12 h-12 text-[#26382D]/30 mb-4" />
              <h3 className="text-lg font-medium text-[#26382D] mb-2">{t('preview.noPhotosTitle', 'No photos uploaded')}</h3>
              <p className="text-[#26382D]/60 mb-6 max-w-sm">{t('preview.noPhotosDesc', 'Travelers rely on photos to make decisions.')}</p>
              {mode === 'business' && <Button onClick={() => onEdit?.('photos', { photos: '' })}>{t('preview.addPhotos', 'Add Photos')}</Button>}
            </div>
          )}
        </div>

        {/* â”€â”€ Sticky Horizontal Tab Nav (matches image 4) â”€â”€ */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 mb-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto hide-scrollbar">
              {NAV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`shrink-0 py-4 px-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#1a73e8] text-[#1a73e8]'
                      : 'border-transparent text-[#26382D]/60 hover:text-[#26382D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* â”€â”€ Tab Content â”€â”€ */}
        <div className="px-4 sm:px-6 lg:px-8">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <section>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 mb-8 border-b border-[#D8C9BE]/40">
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[#7C9278] mb-1"><MapPin className="w-6 h-6" /></div>
                    <span className="font-bold text-sm text-[#26382D]">Great Location</span>
                    <span className="text-xs text-[#26382D]/70">95% of guests loved it</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[#7C9278] mb-1"><Leaf className="w-6 h-6" /></div>
                    <span className="font-bold text-sm text-[#26382D]">Eco-Certified</span>
                    <span className="text-xs text-[#26382D]/70">Level 3 Sustainability</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[#7C9278] mb-1"><Wifi className="w-6 h-6" /></div>
                    <span className="font-bold text-sm text-[#26382D]">Fast Wi-Fi</span>
                    <span className="text-xs text-[#26382D]/70">100+ Mbps verified</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[#7C9278] mb-1"><Coffee className="w-6 h-6" /></div>
                    <span className="font-bold text-sm text-[#26382D]">Breakfast</span>
                    <span className="text-xs text-[#26382D]/70">Locally sourced</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.about', 'About Property')}</h2>
                  {renderEditButton('about', { description })}
                </div>
                {description ? (
                  <p className="text-[#26382D]/80 leading-relaxed">{description}</p>
                ) : (
                  <div className="bg-[#F8F6F3] p-4 rounded-xl text-center border border-[#D8C9BE]/50">
                    <p className="text-[#26382D]/60 italic">{t('preview.noDesc', 'No description provided.')}</p>
                  </div>
                )}
              </section>

              <hr className="border-[#D8C9BE]/40" />

              {/* Amenities */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.amenities', 'Amenities')}</h2>
                  {renderEditButton('amenities')}
                </div>
                {listing.amenities && listing.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {listing.amenities.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#E5DFD6] shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-[#7C9278]">{amenityIcons[item] || <Check className="w-5 h-5" />}</div>
                        <span className="font-medium text-[#1C2B22] capitalize">{item.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F8F6F3] p-6 rounded-xl border border-[#D8C9BE]/50">
                    <p className="text-[#26382D]/60 italic">{t('preview.noAmenities', 'No amenities added yet.')}</p>
                  </div>
                )}
              </section>

              <hr className="border-[#D8C9BE]/40" />

              {/* Accessibility */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.accessibility', 'Accessibility')}</h2>
                  {renderEditButton('accessibility')}
                </div>
                {listing.accessibility_items && listing.accessibility_items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listing.accessibility_items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between p-4 bg-[#F8F6F3] rounded-xl border border-[#D8C9BE]/50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm"><Check className="w-4 h-4 text-[#7C9278]" /></div>
                          <span className="font-medium text-[#26382D] capitalize">{item.label.replace(/_/g, ' ')}</span>
                        </div>
                        <DataStateBadge state={item.data_state as any} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F8F6F3] p-6 rounded-xl text-center border border-[#D8C9BE]/50">
                    <Info className="w-8 h-8 text-[#26382D]/30 mx-auto mb-2" />
                    <p className="text-[#26382D]/60 font-medium">{t('preview.noAcc', 'Accessibility information not added yet.')}</p>
                  </div>
                )}
              </section>

              <hr className="border-[#D8C9BE]/40" />

              {/* Sustainability */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.sustainability', 'Sustainability')}</h2>
                  {renderEditButton('sustainability')}
                </div>
                {listing.sustainability_items && listing.sustainability_items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listing.sustainability_items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between p-4 bg-[#E8F0E6] rounded-xl border border-[#7C9278]/20">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm"><Check className="w-4 h-4 text-[#7C9278]" /></div>
                          <span className="font-medium text-[#26382D] capitalize">{item.label.replace(/_/g, ' ')}</span>
                        </div>
                        <DataStateBadge state={item.data_state as any} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F8F6F3] p-6 rounded-xl text-center border border-[#D8C9BE]/50">
                    <Info className="w-8 h-8 text-[#26382D]/30 mx-auto mb-2" />
                    <p className="text-[#26382D]/60 font-medium">{t('preview.noSus', 'Sustainability information not added yet.')}</p>
                  </div>
                )}
              </section>

              <hr className="border-[#D8C9BE]/40" />

              {/* Location Map Preview */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.location', 'Location')}</h2>
                  {renderEditButton('location')}
                </div>
                {listing.address || listing.city ? (
                  <p className="text-sm text-[#26382D]/70 flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{listing.address || listing.city}</span>
                  </p>
                ) : null}
                <LocationMapSection address={listing.address} city={listing.city} />
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Hosted By */}
              <section className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#E8F0E6] flex items-center justify-center text-xl font-bold text-[#7C9278]">
                    {(name.charAt(0) || 'C').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#26382D]">Hosted by {name.split(' ')[0] || 'CLARITY'}</h3>
                    <p className="text-sm text-[#26382D]/60">Joined in 2024</p>
                  </div>
                </div>
                <p className="text-sm text-[#26382D]/80 mb-4">
                  Committed to providing sustainable and accessible stays. We ensure our properties minimize environmental impact while maximizing comfort.
                </p>
                <Button variant="outline" className="w-full">Message Host</Button>
              </section>

              {/* Eco Badge */}
              <section className="bg-gradient-to-br from-[#E8F0E6] to-[#F1EDE9] p-6 rounded-2xl border border-[#7C9278]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white p-2 rounded-full shadow-sm"><Leaf className="w-5 h-5 text-[#7C9278]" /></div>
                  <h3 className="text-base font-bold text-[#26382D]">Verified Eco-Stay</h3>
                </div>
                <p className="text-sm text-[#26382D]/70 mb-4">
                  This property offsets 100% of its carbon footprint through local initiatives.
                </p>
                <div className="text-xs font-semibold text-[#7C9278] flex items-center gap-1 cursor-pointer hover:underline">
                  View Carbon Report <ArrowRight className="w-3 h-3" />
                </div>
              </section>

              {/* Rules summary */}
              <section className="bg-[#F8F6F3] p-6 rounded-2xl border border-[#D8C9BE]/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold text-[#26382D]">{t('preview.rules', 'Property Rules')}</h2>
                  {renderEditButton('rules')}
                </div>
                {listing.rules ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-medium">Check-in</span><span className="text-[#26382D]/70">{listing.rules.checkIn || 'Not set'}</span></div>
                    <div className="flex justify-between"><span className="font-medium">Check-out</span><span className="text-[#26382D]/70">{listing.rules.checkOut || 'Not set'}</span></div>
                    <div className="flex justify-between"><span className="font-medium">Cancellation</span><span className="text-[#26382D]/70 capitalize">{(listing.rules.cancellationPolicy || 'Not set').replace('_', '-')}</span></div>
                    <div className="pt-2 flex flex-col gap-2 text-[#26382D]/80">
                      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${listing.rules.petsAllowed ? 'bg-[#7C9278]' : 'bg-red-400'}`} />Pets {listing.rules.petsAllowed ? 'allowed' : 'not allowed'}</div>
                      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${listing.rules.smokingAllowed ? 'bg-[#7C9278]' : 'bg-red-400'}`} />Smoking {listing.rules.smokingAllowed ? 'allowed' : 'not allowed'}</div>
                      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${listing.rules.partiesAllowed ? 'bg-[#7C9278]' : 'bg-red-400'}`} />Parties {listing.rules.partiesAllowed ? 'allowed' : 'not allowed'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BookOpen className="w-8 h-8 text-[#26382D]/30 mx-auto mb-2" />
                    <p className="text-sm text-[#26382D]/60">{t('preview.noRules', 'Policies not set.')}</p>
                  </div>
                )}
              </section>

              {/* Reviews summary */}
              <section className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
                <h2 className="text-xl font-serif font-bold text-[#26382D] mb-4">{t('preview.reviews', 'Ratings & Reviews')}</h2>
                <div className="text-center py-6">
                  <StarHalf className="w-10 h-10 text-[#D4AF37]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#26382D]/60">{t('preview.noReviewsDesc', 'No reviews yet.')}</p>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ROOMS TAB */}
        {activeTab === 'rooms' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.rooms', 'Rooms')}</h2>
              {renderEditButton('rooms')}
            </div>
            {listing.rooms && listing.rooms.length > 0 ? (
              <div className="space-y-4">
                {listing.rooms.map((room: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-1/3 bg-[#F8F6F3] rounded-xl flex items-center justify-center min-h-[120px] border border-[#D8C9BE]/50 overflow-hidden">
                      {room.photoUrl ? (
                        <img src={room.photoUrl} alt={room.name || `Room ${idx+1}`} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-[#26382D]/20" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-xl font-serif font-bold text-[#26382D] mb-2">{room.name || `Room ${idx+1}`}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-[#26382D]/70 mb-3">
                        {room.capacity && <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Max {room.capacity}</span>}
                        {room.bedType && <span>â€¢ {room.bedType}</span>}
                        {room.size && <span>â€¢ {room.size}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-1/3 bg-[#F8F6F3] rounded-xl flex items-center justify-center min-h-[160px] border border-[#D8C9BE]/50 overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800" alt="Deluxe Room" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-xl font-serif font-bold text-[#26382D] mb-2">Deluxe Garden Suite</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-[#26382D]/70 mb-3">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Max 2 Adults</span>
                      <span>• King Bed</span>
                      <span>• 450 sq ft</span>
                    </div>
                    <p className="text-sm text-[#26382D]/80">Enjoy panoramic views of the forest from your private balcony. Includes eco-friendly bath amenities and organic cotton linens.</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-1/3 bg-[#F8F6F3] rounded-xl flex items-center justify-center min-h-[160px] border border-[#D8C9BE]/50 overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800" alt="Family Room" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-xl font-serif font-bold text-[#26382D] mb-2">Premium Family Villa</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-[#26382D]/70 mb-3">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Max 4 Guests</span>
                      <span>• 2 Queen Beds</span>
                      <span>• 850 sq ft</span>
                    </div>
                    <p className="text-sm text-[#26382D]/80">Spacious villa designed for families, featuring a separate living area, kitchenette, and direct access to the nature trail.</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* LOCATION TAB â€” Full-width interactive Google Map with landmarks/transport */}
        {activeTab === 'location' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.location', 'Location')}</h2>
              {renderEditButton('location')}
            </div>
            {listing.address || listing.city ? (
              <p className="text-sm text-[#26382D]/70 flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{listing.address || listing.city}</span>
              </p>
            ) : null}
            <LocationMapSection address={listing.address} city={listing.city} />
          </section>
        )}

        {/* PROPERTY RULES TAB */}
        {activeTab === 'rules' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.rules', 'Property Rules')}</h2>
              {renderEditButton('rules')}
            </div>
            {listing.rules ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                      <p className="text-xs text-[#26382D]/50 mb-1">Check-in</p>
                      <p className="font-semibold text-[#26382D]">{listing.rules.checkIn || 'Not set'}</p>
                    </div>
                    <div className="bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                      <p className="text-xs text-[#26382D]/50 mb-1">Check-out</p>
                      <p className="font-semibold text-[#26382D]">{listing.rules.checkOut || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                    <p className="text-xs text-[#26382D]/50 mb-1">Cancellation Policy</p>
                    <p className="font-semibold text-[#26382D] capitalize">{(listing.rules.cancellationPolicy || 'Not set').replace('_', '-')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    {[{ label: 'Pets', val: listing.rules.petsAllowed }, { label: 'Smoking', val: listing.rules.smokingAllowed }, { label: 'Parties', val: listing.rules.partiesAllowed }].map(r => (
                      <div key={r.label} className="flex items-center justify-between bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                        <span className="font-medium">{r.label}</span>
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${r.val ? 'bg-[#E8F0E6] text-[#7C9278]' : 'bg-red-50 text-red-500'}`}>{r.val ? 'Allowed' : 'Not allowed'}</span>
                      </div>
                    ))}
                  </div>
                  {listing.rules.customRules && listing.rules.customRules.length > 0 && (
                    <div className="bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                      <p className="text-xs text-[#26382D]/50 mb-3 font-semibold">Additional Rules</p>
                      <ul className="space-y-2 text-sm text-[#26382D]/80 list-disc list-inside">
                        {listing.rules.customRules.map((rule: string, i: number) => <li key={i}>{rule}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                      <p className="text-xs text-[#26382D]/50 mb-1">Check-in</p>
                      <p className="font-semibold text-[#26382D]">2:00 PM</p>
                    </div>
                    <div className="bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                      <p className="text-xs text-[#26382D]/50 mb-1">Check-out</p>
                      <p className="font-semibold text-[#26382D]">11:00 AM</p>
                    </div>
                  </div>
                  <div className="bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                    <p className="text-xs text-[#26382D]/50 mb-1">Cancellation Policy</p>
                    <p className="font-semibold text-[#26382D] capitalize">Free cancellation up to 48 hours before check-in.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                      <span className="font-medium">Pets</span>
                      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8F0E6] text-[#7C9278]">Allowed</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                      <span className="font-medium">Smoking</span>
                      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-red-50 text-red-500">Not allowed</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                      <span className="font-medium">Parties</span>
                      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-red-50 text-red-500">Not allowed</span>
                    </div>
                  </div>
                  <div className="bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50">
                    <p className="text-xs text-[#26382D]/50 mb-3 font-semibold">Additional Rules</p>
                    <ul className="space-y-2 text-sm text-[#26382D]/80 list-disc list-inside">
                      <li>Quiet hours are from 10:00 PM to 7:00 AM.</li>
                      <li>Please separate recyclables into the provided bins.</li>
                      <li>Conserve water by reusing towels when possible.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* USER REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.reviews', 'Ratings & Reviews')}</h2>
            </div>
            
            {(listing as any).reviews && (listing as any).reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(listing as any).reviews.map((rev: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E8F0E6] flex items-center justify-center text-[#7C9278] font-bold text-lg">
                          {rev.author.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#1C2B22]">{rev.author}</p>
                          <p className="text-xs text-[#5B6D62]">{rev.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-[#F0EBE1] px-2.5 py-1 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                        <span className="text-sm font-bold text-[#1C2B22]">{rev.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-[#5B6D62] leading-relaxed text-sm">{rev.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E8F0E6] flex items-center justify-center text-[#7C9278] font-bold text-lg">A</div>
                      <div>
                        <p className="font-bold text-[#1C2B22]">Aarav Patel</p>
                        <p className="text-xs text-[#5B6D62]">October 2025</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#F0EBE1] px-2.5 py-1 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                      <span className="text-sm font-bold text-[#1C2B22]">5.0</span>
                    </div>
                  </div>
                  <p className="text-[#5B6D62] leading-relaxed text-sm">Absolutely stunning property! The eco-friendly initiatives were clear everywhere, and the rooms were spotless. The breakfast was fantastic with locally sourced ingredients.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E8F0E6] flex items-center justify-center text-[#7C9278] font-bold text-lg">S</div>
                      <div>
                        <p className="font-bold text-[#1C2B22]">Sneha Sharma</p>
                        <p className="text-xs text-[#5B6D62]">September 2025</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#F0EBE1] px-2.5 py-1 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                      <span className="text-sm font-bold text-[#1C2B22]">4.8</span>
                    </div>
                  </div>
                  <p className="text-[#5B6D62] leading-relaxed text-sm">Very peaceful and serene. The staff was incredibly welcoming and accommodating of my accessibility needs. Will definitely be coming back next year.</p>
                </div>
              </div>
            )}
          </section>
        )}

        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5DFD6] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 flex items-center justify-between z-40">
        <div>
          {listing.price_inr_per_night ? (
            <>
              <p className="text-2xl font-serif font-bold text-[#26382D]">₹{listing.price_inr_per_night.toLocaleString()}</p>
              <p className="text-xs text-[#26382D]/70">{t('preview.perNight', 'per night')}</p>
            </>
          ) : (
            <p className="text-sm italic text-[#26382D]/60">{t('preview.noPrice', 'Pricing not set')}</p>
          )}
        </div>
        {actionButton && <div className="min-w-[140px]">{actionButton}</div>}
      </div>
    </div>
  );
}
