import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { Check, X, Search } from 'lucide-react';

export type SustainabilityData = Record<string, boolean>;

interface SustainabilityStepProps {
  value: SustainabilityData;
  onChange: (value: SustainabilityData) => void;
  onContinue: () => void;
  onBack: () => void;
}

const PREDEFINED_PRACTICES = [
  { key: 'solar_power', label: 'Solar power' },
  { key: 'waste_program', label: 'Waste program' },
  { key: 'water_program', label: 'Water program' },
  { key: 'local_sourcing', label: 'Local sourcing' },
  { key: 'rainwater_harvesting', label: 'Rainwater harvesting' },
  { key: 'ev_charging', label: 'EV charging powered by renewable energy' },
  { key: 'composting', label: 'Composting' },
];

export function SustainabilityStep({ value, onChange, onContinue, onBack }: SustainabilityStepProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFeature = (key: string) => {
    onChange({
      ...value,
      [key]: !value[key]
    });
  };

  const removeFeature = (key: string) => {
    const updated = { ...value };
    delete updated[key];
    onChange(updated);
  };

  const addCustomFeature = () => {
    const clean = searchQuery.trim();
    if (!clean) return;
    
    // Check if it exists exactly (case-insensitive)
    const exists = Object.keys(value).find(k => k.toLowerCase() === clean.toLowerCase());
    if (!exists) {
      onChange({ ...value, [clean]: true });
    }
    setSearchQuery('');
  };

  const predefinedKeys = PREDEFINED_PRACTICES.map(f => f.key);
  const customFeatures = Object.keys(value).filter(k => !predefinedKeys.includes(k) && value[k]);
  
  const filteredPredefined = useMemo(() => {
    const lowerQ = searchQuery.toLowerCase();
    return PREDEFINED_PRACTICES.filter(f => 
      f.label.toLowerCase().includes(lowerQ) || 
      t(`onboarding.sustainability.${f.key}`, f.label).toLowerCase().includes(lowerQ)
    );
  }, [searchQuery, t]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2">
          {t('onboarding.sustainability.title', 'Sustainability Practices')}
        </h2>
        <p className="text-sm sm:text-base text-[#26382D]/70 mb-5">
          {t('onboarding.sustainability.subtitle', 'Select or add sustainability practices your property currently provides.')}
        </p>
        <div className="inline-flex items-start sm:items-center gap-3 bg-[#F8F6F3] border border-[#D8C9BE] px-4 py-3 rounded-xl shadow-sm">
           <span className="text-[10px] font-bold text-[#7C9278] uppercase tracking-widest bg-[#7C9278]/10 px-2 py-1 rounded mt-0.5 sm:mt-0">
             {t('onboarding.sustainability.noteBadge', 'Note')}
           </span>
           <span className="text-sm text-[#26382D]/80 leading-snug">
             {t('onboarding.sustainability.selfReportNote', 'These details are self-reported by your property and will be marked as "Reported by property" until independently verified.')}
           </span>
        </div>
      </div>

      <div className="bg-[#F8F6F3] p-5 sm:p-7 rounded-2xl shadow-[0_4px_16px_rgba(38,56,45,0.03)] border border-[#D8C9BE]/50 space-y-6">
        
        {/* Search / Add Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#26382D]/40" />
          </div>
          <input
            type="text"
            className="w-full h-12 pl-10 pr-24 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-1 focus:ring-[#7C9278] focus:outline-none bg-white text-[#26382D]"
            placeholder={t('onboarding.sustainability.searchPlaceholder', 'Search sustainability features...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomFeature();
              }
            }}
          />
          <div className="absolute inset-y-0 right-1 flex items-center">
             <button
                type="button"
                onClick={addCustomFeature}
                className="px-3 py-1.5 text-sm font-medium bg-[#7C9278]/10 text-[#7C9278] rounded-lg hover:bg-[#7C9278]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278]"
             >
                {t('onboarding.sustainability.add', 'Add')}
             </button>
          </div>
        </div>

        {/* Common Features */}
        <div>
          <h3 className="text-sm font-semibold text-[#26382D] uppercase tracking-wider mb-3">
            {t('onboarding.sustainability.commonPractices', 'Common practices')}
          </h3>
          {filteredPredefined.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filteredPredefined.map(f => {
                const isSelected = value[f.key];
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleFeature(f.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278]
                      ${isSelected ? 'bg-[#7C9278] border-[#7C9278] text-white' : 'bg-white border-[#D8C9BE] text-[#26382D] hover:border-[#7C9278]/50'}
                    `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    {t(`onboarding.sustainability.${f.key}`, f.label)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#26382D]/50 italic">
               {t('onboarding.sustainability.noMatch', 'No matching practice. Add it as a custom practice.')}
            </p>
          )}
        </div>

        {/* Custom Features Added */}
        {customFeatures.length > 0 && (
          <div className="pt-4 border-t border-[#D8C9BE]/50">
            <h3 className="text-sm font-semibold text-[#26382D] uppercase tracking-wider mb-3">
              {t('onboarding.sustainability.addedByYou', 'Added by you')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {customFeatures.map(feat => (
                <div key={feat} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#26382D] text-white text-sm">
                  <span>{feat}</span>
                  <button 
                    type="button"
                    onClick={() => removeFeature(feat)}
                    className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={t('onboarding.sustainability.removeCustom', 'Remove custom practice')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#26382D]/50 mt-3">
              {t('onboarding.sustainability.customCount', { count: customFeatures.length, defaultValue: '{{count}} custom practice(s) added' })}
            </p>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-[#D8C9BE]/50 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
        <button 
          onClick={onBack}
          className="text-[#7C9278] font-medium hover:text-[#26382D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          {t('onboarding.back', 'Back')}
        </button>
        <Button variant="primary" onClick={onContinue} className="w-full sm:w-auto px-10">
          {t('onboarding.continue', 'Continue')}
        </Button>
      </div>
    </div>
  );
}
