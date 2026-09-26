import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Plus, Edit2, Eye, MapPin, Star, Building2, Map } from 'lucide-react';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { searchAccommodation, AccommodationResult } from '../../lib/api';

export default function ListingTablePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<AccommodationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await searchAccommodation({
          origin: '',
          destination: 'Goa',
          destination_city: 'Goa',
          budget_max: 100000,
          time_max_hours: 100,
          accessibility_required: [],
          weights: { environmental: 1, accessibility: 1, affordability: 1, convenience: 1 },
          include_unverified: true
        });
        setProperties(res.results);
      } catch (err) {
        console.error("Failed to load listings", err);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-[#F1EDE9] min-h-[calc(100vh-64px)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#D8C9BE]/50 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#26382D]">
            {t('listings.manageTitle', 'Manage your properties')}
          </h1>
          <p className="text-[#26382D]/70 mt-1 text-sm">
            {t('listings.manageSubtitle', 'Preview exactly how travelers see your listings.')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#D8C9BE] h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-2xl border border-[#D8C9BE] shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
              
              {/* Left: Image */}
              <div className="w-full md:w-1/3 h-56 md:h-auto relative bg-[#E5DFD6]">
                {prop.photos && prop.photos.length > 0 ? (
                  <img src={prop.photos[0]} alt={prop.translations?.en?.name || 'Property'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#26382D]/40">
                    <Building2 className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">{t('listings.noPhotos', 'No Photos')}</span>
                  </div>
                )}
                {prop.photos && prop.photos.length > 1 && (
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                    {prop.photos.length} {t('listings.photosCount', 'Photos')}
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#26382D] px-3 py-1 rounded-md text-xs font-bold border border-[#D8C9BE]/50 shadow-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {t('listings.businessPreviewBadge', 'Business Preview')}
                </div>
              </div>

              {/* Center: Details */}
              <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                    <h2 className="text-xl md:text-2xl font-serif font-bold text-[#26382D] line-clamp-1">
                      {prop.translations?.en?.name || 'Unnamed Property'}
                    </h2>
                    <div className="shrink-0 mt-1 sm:mt-0">
                      <DataStateBadge state={prop.data_state as any} />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#26382D]/70 mb-4">
                    {prop.star_rating && (
                      <div className="flex items-center gap-1 font-medium">
                        <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                        <span>{prop.star_rating} {t('listings.stars', 'Stars')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{prop.city}</span>
                    </div>
                  </div>

                  {/* Highlights (Accessibility & Sustainability) */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {prop.accessibility_items?.slice(0, 2).map((item, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#F8F6F3] text-xs font-medium text-[#26382D] border border-[#D8C9BE]/50">
                        {item.label.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {prop.sustainability_items?.slice(0, 1).map((item, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#E8F0E6] text-xs font-medium text-[#26382D] border border-[#7C9278]/20">
                        {item.label.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#D8C9BE]/30 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    {prop.price_inr_per_night && (
                      <p className="text-2xl font-serif font-bold text-[#26382D]">
                        ₹{prop.price_inr_per_night.toLocaleString()} <span className="text-sm font-sans font-normal text-[#26382D]/60">/ {t('listings.night', 'night')}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Button 
                      variant="primary"
                      onClick={() => navigate(`/b2b/listings/${prop.id}`)}
                      className="flex-1 sm:flex-none"
                    >
                      {t('listings.viewPreview', 'Preview Listing')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
