import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { SustainabilityFeatureKey } from '../../../shared/constants/sustainability';
import { Check } from 'lucide-react';

export type SustainabilityData = Record<SustainabilityFeatureKey, boolean>;

interface SustainabilityStepProps {
  value: SustainabilityData;
  onChange: (value: SustainabilityData) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function SustainabilityStep({ value, onChange, onContinue, onBack }: SustainabilityStepProps) {
  const { t } = useTranslation();

  const toggleFeature = (key: SustainabilityFeatureKey) => {
    onChange({
      ...value,
      [key]: !value[key]
    });
  };

  const practices = [
    { 
      key: 'solar_power' as SustainabilityFeatureKey, 
      label: t('onboarding.sustainability.solarPower', 'Solar power'),
      description: t('onboarding.sustainability.solarPowerDesc', 'Renewable energy generation or dedicated carbon-free energy sources.')
    },
    { 
      key: 'waste_program' as SustainabilityFeatureKey, 
      label: t('onboarding.sustainability.wasteProgram', 'Waste program'),
      description: t('onboarding.sustainability.wasteProgramDesc', 'Active recycling, composting, or single-use plastic reduction initiatives.')
    },
    { 
      key: 'water_program' as SustainabilityFeatureKey, 
      label: t('onboarding.sustainability.waterProgram', 'Water program'),
      description: t('onboarding.sustainability.waterProgramDesc', 'Water-efficient fixtures or structured linen/towel reuse programs.')
    },
    { 
      key: 'local_sourcing' as SustainabilityFeatureKey, 
      label: t('onboarding.sustainability.localSourcing', 'Local sourcing'),
      description: t('onboarding.sustainability.localSourcingDesc', 'Food, beverages, or amenities sourced from local suppliers and producers.')
    },
  ];

  const handleContinue = () => {
    onContinue();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2">
          {t('onboarding.sustainability.title', 'Sustainability Practices')}
        </h2>
        <p className="text-sm sm:text-base text-[#26382D]/70 mb-5">
          {t('onboarding.sustainability.subtitle', 'Tell travelers about sustainability practices your property currently provides.')}
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

      <fieldset className="bg-[#F8F6F3] p-5 sm:p-7 rounded-2xl shadow-[0_4px_16px_rgba(38,56,45,0.03)] border border-[#D8C9BE]/50 h-full flex flex-col">
        <legend className="sr-only">{t('onboarding.sustainability.legend', 'Sustainability practices selection')}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {practices.map(item => (
            <label 
              key={item.key} 
              className={`flex items-start gap-4 p-4 sm:p-5 rounded-xl border transition-all cursor-pointer group
                ${value[item.key] ? 'bg-[#7C9278]/10 border-[#7C9278]' : 'bg-white border-[#D8C9BE]/50 hover:border-[#7C9278]/50'}
              `}
            >
              <div className="relative flex items-start pt-1">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={value[item.key]}
                  onChange={() => toggleFeature(item.key)}
                  aria-label={item.label}
                  aria-describedby={`desc-${item.key}`}
                />
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#7C9278] peer-focus-visible:ring-offset-2
                  ${value[item.key] ? 'bg-[#7C9278] border-[#7C9278]' : 'bg-white border-2 border-[#D8C9BE] group-hover:border-[#7C9278]'}
                `}>
                   {value[item.key] && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-base select-none leading-snug ${value[item.key] ? 'font-semibold text-[#26382D]' : 'font-medium text-[#26382D]/80'}`}>
                  {item.label}
                </span>
                <span id={`desc-${item.key}`} className="text-sm text-[#26382D]/60 leading-snug">
                  {item.description}
                </span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="pt-6 border-t border-[#D8C9BE]/50 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
        <button 
          onClick={onBack}
          className="text-[#7C9278] font-medium hover:text-[#26382D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          {t('onboarding.back', 'Back')}
        </button>
        <Button variant="primary" onClick={handleContinue} className="w-full sm:w-auto px-10">
          {t('onboarding.completeOnboarding', 'Complete Onboarding')}
        </Button>
      </div>
    </div>
  );
}
