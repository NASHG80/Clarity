import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BasicInfoStep, BasicInfoData } from '../components/onboarding/BasicInfoStep';
import { AccessibilityStep, AccessibilityData } from '../components/onboarding/AccessibilityStep';
import { SustainabilityStep, SustainabilityData } from '../components/onboarding/SustainabilityStep';
import { PhotoUploadStep, LocalPhotoSelection } from '../components/onboarding/PhotoUploadStep';
import { AiAnalysisStep, AiAnalysisData } from '../components/onboarding/AiAnalysisStep';
import { AiAnalysisReviewStep } from '../components/onboarding/AiAnalysisReviewStep';
import { AiConfirmationStep } from '../components/onboarding/AiConfirmationStep';
import { DetectionConfirmationItem } from '../../lib/api';
import { Navbar } from '../../shared/components/Navbar';
import { Check } from 'lucide-react';

export default function OnboardingPage() {
  const { t } = useTranslation();
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Step 1 State
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    name: '',
    city: '',
    priceBand: null,
    starRating: null,
  });

  // Step 2 State
  const [accessibilityInfo, setAccessibilityInfo] = useState<AccessibilityData>({
    step_free_entrance: false,
    elevator: false,
    wheelchair_accessible_room: false,
    roll_in_shower: false,
    accessible_toilet: false,
    low_walking_distance: false,
    accessible_public_transport: false,
    visual_assistance: false,
    hearing_assistance: false,
  });

  // Step 3 State
  const [sustainabilityInfo, setSustainabilityInfo] = useState<SustainabilityData>({
    solar_power: false,
    waste_program: false,
    water_program: false,
    local_sourcing: false,
  });

  // Step 4 State
  const [photoSelection, setPhotoSelection] = useState<LocalPhotoSelection>({
    entrance: [],
    bathroom: [],
    room: [],
    parking: [],
  });

  // Step 5 State
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisData>({});

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleConfirmComplete = (confirmedFeatures: string[], decisions: DetectionConfirmationItem[]) => {
    // 1. Update accessibility checklist items for confirmed detections
    setAccessibilityInfo(prev => {
      const updated = { ...prev };
      confirmedFeatures.forEach(feat => {
        if (feat in updated) {
          (updated as any)[feat] = true;
        }
      });
      return updated;
    });

    // 2. Update sustainability checklist items for confirmed detections
    setSustainabilityInfo(prev => {
      const updated = { ...prev };
      confirmedFeatures.forEach(feat => {
        if (feat in updated) {
          (updated as any)[feat] = true;
        }
      });
      return updated;
    });

    // 3. Update review_status in aiAnalysis state
    setAiAnalysis(prev => {
      const next = { ...prev };
      decisions.forEach(decision => {
        const analysisResult = next[decision.image_id];
        if (analysisResult) {
          const updatedDetections = analysisResult.detections.map(det => {
            if (det.label === decision.label) {
              return {
                ...det,
                review_status: (decision.confirmed ? 'confirmed' : 'rejected') as 'confirmed' | 'rejected'
              };
            }
            return det;
          });
          next[decision.image_id] = { ...analysisResult, detections: updatedDetections };
        }
      });
      return next;
    });

    // Final completion handoff
    handleComplete();
  };

  const handleComplete = () => {
    // Collects B4, B5, B6, B7, B8, B9, B10 payload ready for backend onboarding submission (C1/C13)
    console.log('Onboarding data prepared with confirmed AI findings:', { 
      basicInfo, 
      accessibilityInfo, 
      sustainabilityInfo, 
      photoSelection, 
      aiAnalysis 
    });
    alert(t('onboarding.successMessage', 'Onboarding review complete! Confirmed features recorded as "Reported by property".'));
  };

  const steps = [
    t('onboarding.step1', 'Basic Info'),
    t('onboarding.step2', 'Accessibility'),
    t('onboarding.step3', 'Sustainability'),
    t('onboarding.step4', 'Photos'),
    t('onboarding.step5', 'AI Analysis'),
    t('onboarding.step6', 'Review AI'),
    t('onboarding.step7', 'Confirm Findings'),
  ];

  return (
    <div className="min-h-screen bg-[#F1EDE9] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col relative">
        {/* Sticky Progress Header */}
        <div className="bg-[#F8F6F3] border-b border-[#D8C9BE]/50 sticky top-16 z-40 shadow-sm overflow-x-auto">
          <div className="min-w-max md:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            
            {/* Desktop step indicators */}
            <div className="hidden sm:flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[#D8C9BE]/40 -z-10"></div>
              {steps.map((stepLabel, idx) => {
                const stepNumber = idx + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;

                return (
                  <div key={stepNumber} className="flex flex-col items-center gap-2 bg-[#F8F6F3] px-2 md:px-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors shrink-0
                      ${isActive ? 'bg-[#26382D] text-white ring-4 ring-[#26382D]/10' : ''}
                      ${isCompleted ? 'bg-[#7C9278] text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-white border-2 border-[#D8C9BE] text-[#26382D]/50' : ''}
                    `}>
                      {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                    </div>
                    <span className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider text-center
                      ${isActive ? 'text-[#26382D]' : 'text-[#26382D]/50'}
                    `}>
                      {stepLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile progress */}
            <div className="sm:hidden flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#7C9278] uppercase tracking-wider">
                {t('onboarding.step', 'Step')} {currentStep} {t('onboarding.of', 'of')} {totalSteps}
              </span>
              <div className="w-full h-1.5 bg-[#D8C9BE]/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#7C9278] rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Wizard Content Area */}
        <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24">
          {currentStep === 1 && (
            <BasicInfoStep 
              value={basicInfo} 
              onChange={setBasicInfo} 
              onContinue={handleNext} 
            />
          )}
          
          {currentStep === 2 && (
            <AccessibilityStep 
              value={accessibilityInfo}
              onChange={setAccessibilityInfo}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <SustainabilityStep 
              value={sustainabilityInfo}
              onChange={setSustainabilityInfo}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <PhotoUploadStep 
              value={photoSelection}
              onChange={setPhotoSelection}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 5 && (
            <AiAnalysisStep 
              photoSelection={photoSelection}
              value={aiAnalysis}
              onChange={setAiAnalysis}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 6 && (
            <AiAnalysisReviewStep 
              photoSelection={photoSelection}
              aiAnalysis={aiAnalysis}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 7 && (
            <AiConfirmationStep 
              photoSelection={photoSelection}
              aiAnalysis={aiAnalysis}
              onConfirmComplete={handleConfirmComplete}
              onBack={handleBack}
            />
          )}
        </div>
      </main>
    </div>
  );
}
