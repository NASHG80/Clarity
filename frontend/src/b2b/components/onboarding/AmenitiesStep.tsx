import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { Wifi, Coffee, Car, Utensils, Waves, Dumbbell, Snowflake, Tv, Plus, Check } from 'lucide-react';

export type AmenitiesData = Record<string, boolean>;

interface AmenitiesStepProps {
  value: AmenitiesData;
  onChange: (value: AmenitiesData) => void;
  onContinue: () => void;
  onBack: () => void;
}

const defaultAmenities = [
  { id: 'wifi', label: 'Free High-Speed WiFi', icon: <Wifi className="w-5 h-5" /> },
  { id: 'breakfast', label: 'Complimentary Breakfast', icon: <Coffee className="w-5 h-5" /> },
  { id: 'parking', label: 'On-site Parking', icon: <Car className="w-5 h-5" /> },
  { id: 'restaurant', label: 'Restaurant', icon: <Utensils className="w-5 h-5" /> },
  { id: 'pool', label: 'Swimming Pool', icon: <Waves className="w-5 h-5" /> },
  { id: 'gym', label: 'Fitness Center', icon: <Dumbbell className="w-5 h-5" /> },
  { id: 'ac', label: 'Air Conditioning', icon: <Snowflake className="w-5 h-5" /> },
  { id: 'tv', label: 'Smart TV', icon: <Tv className="w-5 h-5" /> },
];

export function AmenitiesStep({ value, onChange, onContinue, onBack }: AmenitiesStepProps) {
  const { t } = useTranslation();
  const [customAmenity, setCustomAmenity] = useState('');

  const toggleAmenity = (id: string) => {
    onChange({
      ...value,
      [id]: !value[id],
    });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAmenity.trim()) {
      onChange({
        ...value,
        [customAmenity.trim()]: true
      });
      setCustomAmenity('');
    }
  };

  // Merge default keys with any custom keys added
  const allKeys = Object.keys(value);
  const customKeys = allKeys.filter(k => !defaultAmenities.some(da => da.id === k));

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2">Amenities</h2>
        <p className="text-sm sm:text-base text-[#26382D]/70">What premium amenities do you offer to your guests?</p>
      </div>

      <div className="bg-[#F8F6F3] p-5 sm:p-8 rounded-2xl shadow-[0_4px_16px_rgba(38,56,45,0.03)] border border-[#D8C9BE]/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {defaultAmenities.map((item) => {
            const isSelected = !!value[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggleAmenity(item.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                  isSelected 
                    ? 'bg-white border-[#7C9278] shadow-sm ring-1 ring-[#7C9278]/20' 
                    : 'bg-white/50 border-[#D8C9BE]/60 hover:border-[#7C9278]/50 hover:bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#7C9278]/10 text-[#7C9278]' : 'bg-[#F1EDE9] text-[#26382D]/50'}`}>
                  {item.icon}
                </div>
                <span className={`font-medium ${isSelected ? 'text-[#26382D]' : 'text-[#26382D]/70'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {customKeys.map((key) => {
            const isSelected = !!value[key];
            if (!isSelected) return null; // Hide if toggled off
            return (
              <button
                key={key}
                onClick={() => toggleAmenity(key)}
                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 bg-white border-[#7C9278] shadow-sm ring-1 ring-[#7C9278]/20`}
              >
                <div className="p-2 rounded-lg bg-[#7C9278]/10 text-[#7C9278]">
                  <Check className="w-5 h-5" />
                </div>
                <span className="font-medium text-[#26382D] capitalize">
                  {key}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleAddCustom} className="mt-8 border-t border-[#D8C9BE]/50 pt-6">
          <label className="block text-sm font-medium text-[#26382D] mb-2">Add Custom Amenity</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              placeholder="e.g., Mini Bar, Ocean View"
              className="flex-1 h-11 px-4 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-white text-[#26382D]"
            />
            <Button type="submit" variant="outline" className="shrink-0 gap-2 h-11">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </form>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4 border-t border-[#D8C9BE]/40">
        <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">
          {t('onboarding.back', 'Back')}
        </Button>
        <Button variant="primary" onClick={onContinue} className="w-full sm:w-auto">
          {t('onboarding.continue', 'Continue')}
        </Button>
      </div>
    </div>
  );
}
