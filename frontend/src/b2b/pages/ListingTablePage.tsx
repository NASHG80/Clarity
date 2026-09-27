import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Plus, Edit2, Eye, MapPin, Star, Building2, Map, Search } from 'lucide-react';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { API_BASE_URL } from '../../lib/api';

export default function ListingTablePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProperties(data.reverse ? data.reverse() : data);
      } catch (err) {
        console.error("Failed to load listings", err);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    if (!searchQuery) return properties;
    return properties.filter(prop => {
      const name = (prop.translations?.en?.name || prop.name || '').toLowerCase();
      const city = (prop.city || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || city.includes(query);
    });
  }, [properties, searchQuery]);

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
        <div className="shrink-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7C9278]" />
            <input 
              type="text" 
              placeholder="Search properties..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D8C9BE] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C9278]/20 text-sm"
            />
          </div>
          <Button variant="primary" onClick={() => navigate('/onboarding')} className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            {t('listings.create', 'Create Listing')}
          </Button>
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
          {filteredProperties.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-[#D8C9BE] text-center">
              <Building2 className="w-12 h-12 text-[#26382D]/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-[#26382D] mb-2">No properties found</h3>
              <p className="text-[#26382D]/60 mb-6">Try adjusting your search or create a new listing.</p>
              <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
            </div>
          ) : (
            filteredProperties.map((prop) => (
            <div key={(prop as any).id || prop._id} className="group bg-white rounded-2xl border border-[#D8C9BE] shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-xl hover:border-[#C5D5C8] hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => navigate(`/b2b/listings/${prop.id}`)}>
              
              {/* Left: Image */}
              <div className="w-full md:w-2/5 h-64 md:h-auto relative bg-[#E5DFD6] overflow-hidden">
                {prop.photos && prop.photos.length > 0 ? (
                  <>
                    <img src={prop.photos[0]} alt={prop.translations?.en?.name || 'Property'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#26382D]/40 bg-gradient-to-br from-[#F0EBE1] to-[#E5DFD6]">
                    <Building2 className="w-16 h-16 mb-3 opacity-50" />
                    <span className="text-sm font-medium tracking-wide uppercase">{t('listings.noPhotos', 'No Photos')}</span>
                  </div>
                )}
                
                {/* Image Overlays */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#1C2B22] px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm uppercase tracking-widest flex items-center gap-1.5 z-10">
                  <Eye className="w-3.5 h-3.5 text-[#7C9278]" />
                  {t('listings.businessPreviewBadge', 'Business Preview')}
                </div>
                
                {prop.photos && prop.photos.length > 1 && (
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[11px] font-medium tracking-wider flex items-center gap-1.5 z-10 border border-white/20">
                    <Map className="w-3.5 h-3.5" />
                    {prop.photos.length} {t('listings.photosCount', 'Photos')}
                  </div>
                )}
              </div>

              {/* Center & Right: Details */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-[#1C2B22] line-clamp-1 group-hover:text-[#3E5245] transition-colors">
                        {prop.translations?.en?.name || (prop as any).name || 'Unnamed Property'}
                      </h2>
                      <div className="flex items-center gap-4 text-[13px] text-[#5B6D62] mt-2 font-medium tracking-wide uppercase">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#7C9278]" />
                          <span>{prop.city || 'Location unset'}</span>
                        </div>
                        {prop.star_rating && (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                            <span>{prop.star_rating} {t('listings.stars', 'Stars')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <DataStateBadge state={prop.data_state as any} />
                    </div>
                  </div>
                  
                  {/* Highlights (Accessibility, Sustainability, Rooms) */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {prop.rooms && prop.rooms.length > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#FAF9F7] text-xs font-bold text-[#5B6D62] border border-[#E5DFD6] uppercase tracking-wider">
                        {prop.rooms.length} Room Types
                      </span>
                    )}
                    {prop.accessibility_items && prop.accessibility_items.length > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#FAF9F7] text-xs font-bold text-[#5B6D62] border border-[#E5DFD6] uppercase tracking-wider">
                        {prop.accessibility_items.length} Access Features
                      </span>
                    )}
                    {prop.sustainability_items && prop.sustainability_items.length > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#E8F0E6] text-xs font-bold text-[#26382D] border border-[#7C9278]/30 uppercase tracking-wider">
                        {prop.sustainability_items.length} Eco Features
                      </span>
                    )}
                  </div>
                  
                  {/* Description Snippet */}
                  {prop.translations?.en?.description && (
                    <p className="text-sm text-[#5B6D62] line-clamp-2 leading-relaxed mb-6">
                      {prop.translations.en.description}
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-[#F0EBE1] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    {prop.price_inr_per_night ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[12px] font-bold text-[#7C9278] uppercase tracking-widest">Starting from</span>
                        <p className="text-2xl font-serif font-bold text-[#1C2B22]">
                          ₹{prop.price_inr_per_night.toLocaleString()}
                        </p>
                        <span className="text-[13px] font-medium text-[#5B6D62]">/ {t('listings.night', 'night')}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-[#5B6D62] italic">Pricing not set</p>
                    )}
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <Button 
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/b2b/listings/${prop.id}`);
                      }}
                      className="w-full sm:w-auto shadow-md hover:shadow-lg"
                    >
                      {t('listings.viewPreview', 'Preview Listing')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
