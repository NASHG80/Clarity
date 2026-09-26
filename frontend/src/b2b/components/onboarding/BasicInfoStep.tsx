import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { Star } from 'lucide-react';

import { MapPin, Navigation, Map as MapIcon, X } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { Modal } from '../../../shared/components/Modal';

export interface BasicInfoData {
  name: string;
  city: string;
  price: string;
  starRating: number | null;
  description: string;
  address: string;
}

interface BasicInfoStepProps {
  value: BasicInfoData;
  onChange: (value: BasicInfoData) => void;
  onContinue: () => void;
}

export function BasicInfoStep({ value, onChange, onContinue }: BasicInfoStepProps) {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<{ name?: boolean; city?: boolean; price?: boolean; starRating?: boolean; description?: boolean }>({});
  const [touched, setTouched] = useState<{ name?: boolean; city?: boolean; price?: boolean; starRating?: boolean; description?: boolean }>({});
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 15.4909, lng: 73.8166 }); // Default Goa
  const [markerPos, setMarkerPos] = useState<{lat: number, lng: number} | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const handleOpenMap = () => {
    setIsMapModalOpen(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(pos);
          setMarkerPos(pos);
        },
        () => {
          console.warn("Geolocation denied or failed.");
        }
      );
    }
  };

  const confirmLocation = () => {
    if (markerPos) {
      // Very basic reverse geocoding mock or real if we had a geocoder service instantiated
      // We will just put Lat/Lng as a placeholder if no address is set, or keep the typed address
      const newAddress = value.address || `Lat: ${markerPos.lat.toFixed(4)}, Lng: ${markerPos.lng.toFixed(4)}`;
      onChange({ ...value, address: newAddress });
    }
    setIsMapModalOpen(false);
  };

  const validate = () => {
    const newErrors = {
      name: !value.name.trim(),
      city: !value.city.trim(),
      price: !value.price || isNaN(Number(value.price)),
      starRating: !value.starRating,
      description: !value.description.trim(),
    };
    setErrors(newErrors);
    
    // Focus first error for accessibility
    if (newErrors.name) document.getElementById('b4-name')?.focus();
    else if (newErrors.city) document.getElementById('b4-city')?.focus();
    else if (newErrors.description) document.getElementById('b4-desc')?.focus();
    // For radio groups, we rely on semantic error presentation rather than forced focus on hidden inputs

    return !Object.values(newErrors).some(Boolean);
  };

  const handleContinue = () => {
    setTouched({ name: true, city: true, price: true, starRating: true, description: true });
    if (validate()) {
      onContinue();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2">{t('onboarding.basicInfo.title', 'Basic Information')}</h2>
        <p className="text-sm sm:text-base text-[#26382D]/70">{t('onboarding.basicInfo.subtitle', 'Let’s start with the basics of your property.')}</p>
      </div>

      <div className="space-y-6 bg-[#F8F6F3] p-5 sm:p-8 rounded-2xl shadow-[0_4px_16px_rgba(38,56,45,0.03)] border border-[#D8C9BE]/50">
        
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="b4-name" className="block text-sm font-medium text-[#26382D]">
            {t('onboarding.basicInfo.name', 'Property Name')} <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="b4-name"
            type="text"
            className={`w-full h-11 px-4 rounded-xl border ${errors.name && touched.name ? 'border-red-500 focus:ring-red-500' : 'border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278]'} focus:outline-none focus:ring-1 bg-white text-[#26382D] transition-shadow`}
            value={value.name}
            onChange={(e) => {
               onChange({ ...value, name: e.target.value });
               if (touched.name) setErrors(prev => ({ ...prev, name: !e.target.value.trim() }));
            }}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            placeholder={t('onboarding.basicInfo.namePlaceholder', 'e.g., Green Valley Resort')}
            aria-invalid={errors.name && touched.name ? 'true' : 'false'}
            aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
          />
          {errors.name && touched.name && (
            <p id="name-error" className="text-sm text-red-600 mt-1">{t('onboarding.basicInfo.nameError', 'Please enter your property name.')}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <label htmlFor="b4-city" className="block text-sm font-medium text-[#26382D]">
            {t('onboarding.basicInfo.city', 'City')} <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="b4-city"
            type="text"
            className={`w-full h-11 px-4 rounded-xl border ${errors.city && touched.city ? 'border-red-500 focus:ring-red-500' : 'border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278]'} focus:outline-none focus:ring-1 bg-white text-[#26382D] transition-shadow`}
            value={value.city}
            onChange={(e) => {
              onChange({ ...value, city: e.target.value });
              if (touched.city) setErrors(prev => ({ ...prev, city: !e.target.value.trim() }));
            }}
            onBlur={() => setTouched(prev => ({ ...prev, city: true }))}
            placeholder={t('onboarding.basicInfo.cityPlaceholder', 'e.g., Goa')}
            aria-invalid={errors.city && touched.city ? 'true' : 'false'}
            aria-describedby={errors.city && touched.city ? 'city-error' : undefined}
          />
          {errors.city && touched.city && (
            <p id="city-error" className="text-sm text-red-600 mt-1">{t('onboarding.basicInfo.cityError', 'Please enter your city.')}</p>
          )}
        </div>

        {/* Address & Location Map Hint */}
        <div className="space-y-1.5">
          <label htmlFor="b4-address" className="block text-sm font-medium text-[#26382D]">
            Exact Address
          </label>
          <div className="relative flex items-center">
            <input
              id="b4-address"
              type="text"
              className="w-full h-11 pl-4 pr-12 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-white text-[#26382D] transition-shadow"
              value={value.address}
              onChange={(e) => onChange({ ...value, address: e.target.value })}
              placeholder="e.g., 123 Beach Road, North Goa"
            />
            <button 
              onClick={handleOpenMap}
              className="absolute right-2 p-1.5 text-[#7C9278] hover:bg-[#7C9278]/10 rounded-lg transition-colors"
              title="Open Map"
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-[#26382D]/60 mt-1">
            Map coordinates will be automatically generated from this address using Google Maps API.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="b4-desc" className="block text-sm font-medium text-[#26382D]">
            About Property <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <textarea
            id="b4-desc"
            className={`w-full h-32 p-4 rounded-xl border ${errors.description && touched.description ? 'border-red-500 focus:ring-red-500' : 'border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278]'} focus:outline-none focus:ring-1 bg-white text-[#26382D] transition-shadow resize-none`}
            value={value.description}
            onChange={(e) => {
               onChange({ ...value, description: e.target.value });
               if (touched.description) setErrors(prev => ({ ...prev, description: !e.target.value.trim() }));
            }}
            onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
            placeholder="Write a compelling description for your property..."
            aria-invalid={errors.description && touched.description ? 'true' : 'false'}
          />
          {errors.description && touched.description && (
            <p className="text-sm text-red-600 mt-1">Please enter a description.</p>
          )}
        </div>

        {/* Price Band -> Price Per Night */}
        <div className="space-y-1.5">
          <label htmlFor="b4-price" className="block text-sm font-medium text-[#26382D]" id="price-label">
            Price (INR / Night) <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="b4-price"
            type="number"
            className={`w-full h-11 px-4 rounded-xl border ${errors.price && touched.price ? 'border-red-500 focus:ring-red-500' : 'border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278]'} focus:outline-none focus:ring-1 bg-white text-[#26382D] transition-shadow`}
            value={value.price}
            onChange={(e) => {
              onChange({ ...value, price: e.target.value });
              if (touched.price) setErrors(prev => ({ ...prev, price: !e.target.value.trim() || isNaN(Number(e.target.value)) }));
            }}
            onBlur={() => setTouched(prev => ({ ...prev, price: true }))}
            placeholder="e.g., 3500"
          />
          {errors.price && touched.price && (
            <p className="text-sm text-red-600 mt-1" role="alert">Please enter a valid numeric price.</p>
          )}
        </div>

        {/* Star Rating */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#26382D]" id="star-rating-label">
            {t('onboarding.basicInfo.starRating', 'Star Rating')} <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div 
            className="flex items-center gap-2"
            role="radiogroup"
            aria-labelledby="star-rating-label"
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const isSelected = value.starRating !== null && value.starRating >= star;
              return (
                <label key={star} className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="starRating"
                    value={star}
                    className="sr-only peer"
                    checked={value.starRating === star}
                    onChange={() => {
                      onChange({ ...value, starRating: star });
                      if (touched.starRating) setErrors(prev => ({ ...prev, starRating: false }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, starRating: true }))}
                  />
                  <div className="p-1 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-[#7C9278] peer-focus-visible:ring-offset-2 transition-colors">
                    <Star 
                      className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${isSelected ? 'fill-[#7C9278] text-[#7C9278]' : 'text-[#D8C9BE] group-hover:text-[#A9B8A3]'}`}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="sr-only">{star} {t('onboarding.basicInfo.stars', 'stars')}</span>
                </label>
              );
            })}
          </div>
          {errors.starRating && touched.starRating && (
            <p className="text-sm text-red-600 mt-1" role="alert">{t('onboarding.basicInfo.starRatingError', 'Please select a star rating.')}</p>
          )}
        </div>

      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleContinue} className="w-full sm:w-auto px-10">
          {t('onboarding.continue', 'Continue')}
        </Button>
      </div>

      {isMapModalOpen && (
        <Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)}>
          <div className="p-6 max-w-3xl w-full mx-auto bg-white rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-serif font-bold text-[#26382D]">Select Location</h3>
              <button onClick={() => setIsMapModalOpen(false)} className="p-2 hover:bg-[#F8F6F3] rounded-full">
                <X className="w-5 h-5 text-[#26382D]" />
              </button>
            </div>
            <div className="w-full h-[400px] bg-[#E5DFD6] rounded-xl overflow-hidden mb-4 relative">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter}
                  zoom={13}
                  onClick={(e) => {
                    if (e.latLng) {
                      setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                    }
                  }}
                  options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                  }}
                >
                  {markerPos && <Marker position={markerPos} draggable={true} onDragEnd={(e) => {
                    if (e.latLng) {
                      setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                    }
                  }} />}
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center w-full h-full text-[#26382D]/50">
                  Loading map...
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-[#26382D]/70">
                {markerPos ? `Selected: ${markerPos.lat.toFixed(4)}, ${markerPos.lng.toFixed(4)}` : 'Click on the map to place a pin.'}
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setIsMapModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={confirmLocation} disabled={!markerPos}>Confirm Location</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
