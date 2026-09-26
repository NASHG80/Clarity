import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { AccessibilityFeatureKey } from '../../../shared/constants/accessibility';
import { Check } from 'lucide-react';

export type AccessibilityData = Record<AccessibilityFeatureKey, boolean>;

interface AccessibilityStepProps {
  value: AccessibilityData;
  onChange: (value: AccessibilityData) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function AccessibilityStep({ value, onChange, onContinue, onBack }: AccessibilityStepProps) {
  const { t } = useTranslation();

  const toggleFeature = (key: AccessibilityFeatureKey) => {
    onChange({
      ...value,
      [key]: !value[key]
    });
  };

  const categories = [
    {
      title: t('onboarding.accessibility.gettingAround', 'Getting around'),
      items: [
        { key: 'step_free_entrance' as AccessibilityFeatureKey, label: t('onboarding.accessibility.stepFreeEntrance', 'Step-free entrance') },
        { key: 'elevator' as AccessibilityFeatureKey, label: t('onboarding.accessibility.elevator', 'Elevator') },
        { key: 'low_walking_distance' as AccessibilityFeatureKey, label: t('onboarding.accessibility.lowWalkingDistance', 'Low walking distance') },
      ]
    },
    {
      title: t('onboarding.accessibility.roomBathroom', 'Room & bathroom'),
      items: [
        { key: 'wheelchair_accessible_room' as AccessibilityFeatureKey, label: t('onboarding.accessibility.wheelchairRoom', 'Wheelchair-accessible room') },
        { key: 'roll_in_shower' as AccessibilityFeatureKey, label: t('onboarding.accessibility.rollInShower', 'Roll-in shower') },
        { key: 'accessible_toilet' as AccessibilityFeatureKey, label: t('onboarding.accessibility.accessibleToilet', 'Accessible toilet') },
      ]
    },
    {
      title: t('onboarding.accessibility.transport', 'Transport'),
      items: [
        { key: 'accessible_public_transport' as AccessibilityFeatureKey, label: t('onboarding.accessibility.publicTransport', 'Accessible public transport') },
      ]
    },
    {
      title: t('onboarding.accessibility.sensorySupport', 'Sensory support'),
      items: [
        { key: 'visual_assistance' as AccessibilityFeatureKey, label: t('onboarding.accessibility.visualAssistance', 'Visual assistance') },
        { key: 'hearing_assistance' as AccessibilityFeatureKey, label: t('onboarding.accessibility.hearingAssistance', 'Hearing assistance') },
      ]
    }
  ];

  const handleContinue = () => {
    // Self-assessment permits an empty checklist, as unselected features naturally map to "not_verified"
    onContinue();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2">
          {t('onboarding.accessibility.title', 'Accessibility')}
        </h2>
        <p className="text-sm sm:text-base text-[#26382D]/70 mb-5">
          {t('onboarding.accessibility.subtitle', 'Tell travelers which accessibility features your property currently provides.')}
        </p>
        <div className="inline-flex items-start sm:items-center gap-3 bg-[#F8F6F3] border border-[#D8C9BE] px-4 py-3 rounded-xl shadow-sm">
           <span className="text-[10px] font-bold text-[#7C9278] uppercase tracking-widest bg-[#7C9278]/10 px-2 py-1 rounded mt-0.5 sm:mt-0">
             {t('onboarding.accessibility.noteBadge', 'Note')}
           </span>
           <span className="text-sm text-[#26382D]/80 leading-snug">
             {t('onboarding.accessibility.selfReportNote', 'These details are self-reported by your property and will be marked as "Reported by property" until independently verified.')}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {categories.map(category => (
          <fieldset key={category.title} className="bg-[#F8F6F3] p-5 sm:p-7 rounded-2xl shadow-[0_4px_16px_rgba(38,56,45,0.03)] border border-[#D8C9BE]/50 h-full flex flex-col">
            <legend className="text-lg font-serif font-semibold text-[#26382D] mb-5 w-full border-b border-[#D8C9BE]/50 pb-3">
              {category.title}
            </legend>
            <div className="space-y-3.5 flex-1">
              {category.items.map(item => (
                <label 
                  key={item.key} 
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer group
                    ${value[item.key] ? 'bg-[#7C9278]/10 border-[#7C9278]' : 'bg-white border-[#D8C9BE]/50 hover:border-[#7C9278]/50'}
                  `}
                >
                  <div className="relative flex items-start pt-0.5">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={value[item.key]}
                      onChange={() => toggleFeature(item.key)}
                      aria-label={item.label}
                    />
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#7C9278] peer-focus-visible:ring-offset-2
                      ${value[item.key] ? 'bg-[#7C9278] border-[#7C9278]' : 'bg-white border-2 border-[#D8C9BE] group-hover:border-[#7C9278]'}
                    `}>
                       {value[item.key] && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className={`text-sm select-none pt-0.5 leading-snug ${value[item.key] ? 'font-medium text-[#26382D]' : 'text-[#26382D]/80'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="pt-6 border-t border-[#D8C9BE]/50 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
        <button 
          onClick={onBack}
          className="text-[#7C9278] font-medium hover:text-[#26382D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          {t('onboarding.back', 'Back')}
        </button>
        <Button variant="primary" onClick={handleContinue} className="w-full sm:w-auto px-10">
          {t('onboarding.continue', 'Continue')}
        </Button>
      </div>
    </div>
  );
}
