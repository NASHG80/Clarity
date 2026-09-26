import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { Star } from 'lucide-react';

// Isolated representation since no canonical backend enum exists yet for price band.
export type PriceBand = 'budget' | 'mid_range' | 'premium' | 'luxury';

export interface BasicInfoData {
  name: string;
  city: string;
  priceBand: PriceBand | null;
  starRating: number | null;
}

interface BasicInfoStepProps {
  value: BasicInfoData;
  onChange: (value: BasicInfoData) => void;
  onContinue: () => void;
}

export function BasicInfoStep({ value, onChange, onContinue }: BasicInfoStepProps) {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<{ name?: boolean; city?: boolean; priceBand?: boolean; starRating?: boolean }>({});
  const [touched, setTouched] = useState<{ name?: boolean; city?: boolean; priceBand?: boolean; starRating?: boolean }>({});

  const validate = () => {
    const newErrors = {
      name: !value.name.trim(),
      city: !value.city.trim(),
      priceBand: !value.priceBand,
      starRating: !value.starRating,
    };
    setErrors(newErrors);
    
    // Focus first error for accessibility
    if (newErrors.name) document.getElementById('b4-name')?.focus();
    else if (newErrors.city) document.getElementById('b4-city')?.focus();
    // For radio groups, we rely on semantic error presentation rather than forced focus on hidden inputs

    return !Object.values(newErrors).some(Boolean);
  };

  const handleContinue = () => {
    setTouched({ name: true, city: true, priceBand: true, starRating: true });
    if (validate()) {
      onContinue();
    }
  };

  const bands: { value: PriceBand; label: string }[] = [
    { value: 'budget', label: t('onboarding.priceBand.budget', 'Budget') },
    { value: 'mid_range', label: t('onboarding.priceBand.mid', 'Mid-range') },
    { value: 'premium', label: t('onboarding.priceBand.premium', 'Premium') },
    { value: 'luxury', label: t('onboarding.priceBand.luxury', 'Luxury') },
  ];

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

        {/* Price Band */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#26382D]" id="price-band-label">
            {t('onboarding.basicInfo.priceBand', 'Price Band')} <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div 
            className="grid grid-cols-2 sm:grid-cols-4 gap-3" 
            role="radiogroup" 
            aria-labelledby="price-band-label"
          >
            {bands.map((band) => {
              const isSelected = value.priceBand === band.value;
              return (
                <label
                  key={band.value}
                  className={`relative flex items-center justify-center p-3 cursor-pointer rounded-xl border-2 transition-all focus-within:ring-2 focus-within:ring-[#7C9278] focus-within:ring-offset-1
                    ${isSelected ? 'border-[#7C9278] bg-[#7C9278]/10 text-[#26382D]' : 'border-[#D8C9BE]/50 bg-white text-[#26382D]/80 hover:border-[#7C9278]/50'}
                  `}
                >
                  <input
                    type="radio"
                    name="priceBand"
                    value={band.value}
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => {
                      onChange({ ...value, priceBand: band.value });
                      if (touched.priceBand) setErrors(prev => ({ ...prev, priceBand: false }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, priceBand: true }))}
                  />
                  <span className="text-sm font-medium">{band.label}</span>
                </label>
              );
            })}
          </div>
          {errors.priceBand && touched.priceBand && (
            <p className="text-sm text-red-600 mt-1" role="alert">{t('onboarding.basicInfo.priceBandError', 'Please select a price band.')}</p>
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
    </div>
  );
}
