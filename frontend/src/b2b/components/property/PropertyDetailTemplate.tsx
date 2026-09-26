import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, MapPin, Star, Camera, Info, Check, 
  Map as MapIcon, BookOpen, StarHalf, Image as ImageIcon,
  Wifi, Coffee, Car, Utensils, Waves, Dumbbell, Snowflake, Tv, Users
} from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { DataStateBadge } from '../../../shared/components/DataStateBadge';
import { ListingDetailResponse } from '../../../lib/api';

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
}

export function PropertyDetailTemplate({ listing, mode, onEdit }: PropertyDetailTemplateProps) {
  const { t } = useTranslation();

  const name = listing.translations?.en?.name || 'Unnamed Property';
  const description = listing.translations?.en?.description || '';

  const renderEditButton = (section: string, initialData: any = {}) => {
    if (mode !== 'business') return null;
    return (
      <Button variant="ghost" size="sm" onClick={() => onEdit?.(section, initialData)} className="text-[#7C9278]">
        {t('preview.edit', 'Edit')}
      </Button>
    );
  };

  return (
    <div className="w-full bg-white font-sans text-[#26382D] pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#26382D]">
                {name}
              </h1>
              <DataStateBadge state={listing.data_state as any} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#26382D]/80">
              {listing.star_rating && (
                <div className="flex items-center gap-1 font-medium">
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <span>{listing.star_rating} {t('preview.stars', 'Stars')}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{listing.city || 'City pending...'}</span>
              </div>
            </div>
          </div>
          <div className="bg-[#F8F6F3] p-4 rounded-xl border border-[#D8C9BE]/50 flex flex-col items-end min-w-[200px]">
            {listing.price_inr_per_night ? (
              <>
                <p className="text-sm text-[#26382D]/70">{t('preview.priceFrom', 'Price from')}</p>
                <p className="text-3xl font-serif font-bold text-[#26382D]">
                  ₹{listing.price_inr_per_night.toLocaleString()}
                </p>
                <p className="text-sm text-[#26382D]/70">{t('preview.perNight', 'per night')}</p>
              </>
            ) : (
              <p className="text-sm italic text-[#26382D]/60">{t('preview.noPrice', 'Pricing not set')}</p>
            )}
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mb-12 relative group">
          {mode === 'business' && (
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 backdrop-blur-sm border-[#D8C9BE]"
                onClick={() => onEdit?.('photos', { photos: (listing.photos || []).join('\n') })}
              >
                {t('preview.editPhotos', 'Edit Photos')}
              </Button>
            </div>
          )}
          {listing.photos && listing.photos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden h-[400px]">
              <div className="md:col-span-3 bg-[#E5DFD6] relative">
                <img src={listing.photos[0]} alt="Primary" className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:flex flex-col gap-2">
                {listing.photos.slice(1, 3).map((p, idx) => (
                  <div key={idx} className="bg-[#E5DFD6] flex-1 relative">
                    <img src={p} alt={`Gallery ${idx+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {listing.photos.length <= 1 && (
                  <div className="bg-[#F8F6F3] flex-1 flex items-center justify-center border border-[#D8C9BE]">
                    <span className="text-sm text-[#26382D]/50">{t('preview.addMore', 'Add more photos')}</span>
                  </div>
                )}
                {listing.photos.length <= 2 && (
                  <div className="bg-[#F8F6F3] flex-1 flex items-center justify-center border border-[#D8C9BE]">
                     <span className="text-sm text-[#26382D]/50">{t('preview.addMore', 'Add more photos')}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-[400px] bg-[#F8F6F3] rounded-2xl border-2 border-dashed border-[#D8C9BE] flex flex-col items-center justify-center text-center p-6">
              <Camera className="w-12 h-12 text-[#26382D]/30 mb-4" />
              <h3 className="text-lg font-medium text-[#26382D] mb-2">{t('preview.noPhotosTitle', 'No photos uploaded')}</h3>
              <p className="text-[#26382D]/60 mb-6 max-w-sm">{t('preview.noPhotosDesc', 'Travelers rely on photos to make decisions. Add high-quality images of your property.')}</p>
              {mode === 'business' && (
                <Button onClick={() => onEdit?.('photos', { photos: '' })}>
                  {t('preview.addPhotos', 'Add Photos')}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Overview */}
            <section>
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

            {/* Amenities (Empty State) */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.amenities', 'Amenities')}</h2>
                {renderEditButton('amenities')}
              </div>
              {listing.amenities && listing.amenities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {listing.amenities.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#F8F6F3] rounded-xl border border-[#D8C9BE]/50">
                      <div className="text-[#7C9278]">
                        {amenityIcons[item] || <Check className="w-5 h-5" />}
                      </div>
                      <span className="font-medium text-[#26382D] capitalize">
                        {item.replace(/_/g, ' ')}
                      </span>
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
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <Check className="w-4 h-4 text-[#7C9278]" />
                        </div>
                        <span className="font-medium text-[#26382D] capitalize">
                          {item.label.replace(/_/g, ' ')}
                        </span>
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
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <Check className="w-4 h-4 text-[#7C9278]" />
                        </div>
                        <span className="font-medium text-[#26382D] capitalize">
                          {item.label.replace(/_/g, ' ')}
                        </span>
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

            {/* Rooms Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-[#26382D]">{t('preview.rooms', 'Rooms')}</h2>
                {renderEditButton('rooms')}
              </div>
              
              {listing.rooms && listing.rooms.length > 0 ? (
                <div className="space-y-4">
                  {listing.rooms.map((room, idx) => (
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
                          {room.capacity && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" /> Max {room.capacity}
                            </span>
                          )}
                          {room.bedType && <span>• {room.bedType}</span>}
                          {room.size && <span>• {room.size}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#F8F6F3] p-8 rounded-xl border-2 border-dashed border-[#D8C9BE] text-center">
                  <Building2 className="w-12 h-12 text-[#26382D]/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#26382D] mb-2">{t('preview.noRoomsTitle', 'No rooms configured')}</h3>
                  <p className="text-[#26382D]/60 mb-6">{t('preview.noRoomsDesc', 'Add room types, capacity, and pricing so travelers can see what you offer.')}</p>
                  {mode === 'business' && <Button variant="outline" onClick={() => onEdit?.('rooms', {})}>{t('preview.manageRooms', 'Manage Rooms')}</Button>}
                </div>
              )}
            </section>

          </div>

          {/* Secondary Column */}
          <div className="space-y-8">
            
            {/* Location Map */}
            <section className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-[#26382D]">{t('preview.location', 'Location')}</h2>
                {renderEditButton('location')}
              </div>
              <div className="w-full h-48 bg-[#E5DFD6] rounded-xl flex flex-col items-center justify-center text-[#26382D]/40 mb-4 border border-[#D8C9BE]">
                <MapIcon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">{t('preview.mapPreview', 'Map Preview')}</span>
              </div>
              <p className="text-[#26382D]/80 text-sm flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{listing.address || listing.city || 'Location Details'} — <em>{listing.location ? 'Map coordinates set' : t('preview.exactLocationHidden', 'Exact location details pending')}</em></span>
              </p>
            </section>

            {/* Property Rules */}
            <section className="bg-[#F8F6F3] p-6 rounded-2xl border border-[#D8C9BE]/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-[#26382D]">{t('preview.rules', 'Property Rules')}</h2>
                {renderEditButton('rules')}
              </div>
              
              {listing.rules ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#D8C9BE]/30">
                    <span className="text-sm font-medium text-[#26382D]">Check-in</span>
                    <span className="text-sm text-[#26382D]/80">{listing.rules.checkIn || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#D8C9BE]/30">
                    <span className="text-sm font-medium text-[#26382D]">Check-out</span>
                    <span className="text-sm text-[#26382D]/80">{listing.rules.checkOut || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#D8C9BE]/30">
                    <span className="text-sm font-medium text-[#26382D]">Cancellation</span>
                    <span className="text-sm text-[#26382D]/80 capitalize">{(listing.rules.cancellationPolicy || 'Not set').replace('_', '-')}</span>
                  </div>
                  <div className="pt-2 flex flex-col gap-2 text-sm text-[#26382D]/80">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${listing.rules.petsAllowed ? 'bg-[#7C9278]' : 'bg-red-400'}`} />
                      Pets {listing.rules.petsAllowed ? 'allowed' : 'not allowed'}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${listing.rules.smokingAllowed ? 'bg-[#7C9278]' : 'bg-red-400'}`} />
                      Smoking {listing.rules.smokingAllowed ? 'allowed' : 'not allowed'}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${listing.rules.partiesAllowed ? 'bg-[#7C9278]' : 'bg-red-400'}`} />
                      Parties {listing.rules.partiesAllowed ? 'allowed' : 'not allowed'}
                    </div>
                  </div>
                  
                  {listing.rules.customRules && listing.rules.customRules.length > 0 && (
                    <div className="pt-4 border-t border-[#D8C9BE]/30">
                      <h4 className="text-sm font-medium text-[#26382D] mb-3">Additional Rules</h4>
                      <ul className="space-y-2 text-sm text-[#26382D]/80 list-disc list-inside">
                        {listing.rules.customRules.map((rule: string, i: number) => (
                          <li key={i}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <BookOpen className="w-8 h-8 text-[#26382D]/30 mx-auto mb-2" />
                    <p className="text-sm text-[#26382D]/60">{t('preview.noRules', 'Check-in, checkout, and cancellation policies have not been set.')}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Reviews Summary */}
            <section className="bg-white p-6 rounded-2xl border border-[#D8C9BE] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-[#26382D]">{t('preview.reviews', 'Ratings & Reviews')}</h2>
              </div>
              <div className="text-center py-8 border-b border-[#D8C9BE]/30 mb-8">
                <StarHalf className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#26382D] mb-1">{t('preview.noReviewsTitle', 'No reviews yet')}</h3>
                <p className="text-sm text-[#26382D]/60">{t('preview.noReviewsDesc', 'When travelers book and stay at your property, their reviews will appear here.')}</p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif font-bold text-[#26382D]">{t('preview.customerPhotos', 'Customer Photos')}</h3>
              </div>
              <div className="text-center py-6">
                <ImageIcon className="w-10 h-10 text-[#26382D]/20 mx-auto mb-2" />
                <p className="text-sm text-[#26382D]/60">{t('preview.noCustomerPhotos', 'No customer photos yet')}</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
