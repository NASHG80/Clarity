import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BasicInfoStep, BasicInfoData } from '../components/onboarding/BasicInfoStep';
import { AccessibilityStep, AccessibilityData } from '../components/onboarding/AccessibilityStep';
import { SustainabilityStep, SustainabilityData } from '../components/onboarding/SustainabilityStep';
import { AmenitiesStep, AmenitiesData } from '../components/onboarding/AmenitiesStep';
import { RoomsStep, RoomData } from '../components/onboarding/RoomsStep';
import { RulesStep, RulesData } from '../components/onboarding/RulesStep';
import { PhotoUploadStep, LocalPhotoSelection } from '../components/onboarding/PhotoUploadStep';
import { AiAnalysisStep, AiAnalysisData } from '../components/onboarding/AiAnalysisStep';
import { AiAnalysisReviewStep } from '../components/onboarding/AiAnalysisReviewStep';
import { AiConfirmationStep } from '../components/onboarding/AiConfirmationStep';
import { DetectionConfirmationItem } from '../../lib/api';
import { Navbar } from '../../shared/components/Navbar';
import { Check, Eye, Edit2 } from 'lucide-react';
import { PropertyDetailTemplate } from '../components/property/PropertyDetailTemplate';
import { buildPreviewProperty } from '../utils/buildPreviewProperty';

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  // Step 1 State
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    name: '',
    city: '',
    price: '',
    starRating: null,
    description: '',
    address: '',
  });

  // Step 2 State
  const [amenitiesInfo, setAmenitiesInfo] = useState<AmenitiesData>({});

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

  // Step 5 State
  const [roomsInfo, setRoomsInfo] = useState<RoomData[]>([]);

  // Step 6 State
  const [rulesInfo, setRulesInfo] = useState<RulesData>({
    checkIn: '',
    checkOut: '',
    cancellationPolicy: '',
    petsAllowed: false,
    smokingAllowed: false,
    partiesAllowed: false,
    customRules: [],
  });

  // Step 7 State
  const [photoSelection, setPhotoSelection] = useState<LocalPhotoSelection>({
    entrance: [],
    bathroom: [],
    room: [],
    parking: [],
  });

  // Step 8,9,10 State
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
    navigate('/b2b/opportunity-detector');
  };

  const steps = [
    t('onboarding.step1', 'Basic Info'),
    t('onboarding.stepAmenities', 'Amenities'),
    t('onboarding.step2', 'Accessibility'),
    t('onboarding.step3', 'Sustainability'),
    t('onboarding.stepRooms', 'Rooms'),
    t('onboarding.stepRules', 'Rules'),
    t('onboarding.step4', 'Photos'),
    t('onboarding.step5', 'AI Analysis'),
    t('onboarding.step6', 'Review AI'),
    t('onboarding.step7', 'Confirm Findings'),
  ];

  const previewProperty = buildPreviewProperty({
    basicInfo,
    amenitiesInfo,
    accessibilityInfo,
    sustainabilityInfo,
    roomsInfo,
    rulesInfo,
    photoSelection,
    aiAnalysis
  });

  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-[#F1EDE9]">
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        
        {/* Mobile Toggle Bar */}
        <div className="md:hidden flex items-center bg-[#F8F6F3] border-b border-[#D8C9BE] p-2 shrink-0">
          <div className="flex bg-[#E5DFD6] rounded-lg p-1 w-full relative">
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors z-10 ${mobileView === 'editor' ? 'bg-white shadow-sm text-[#26382D]' : 'text-[#26382D]/60'}`}
              onClick={() => setMobileView('editor')}
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors z-10 ${mobileView === 'preview' ? 'bg-[#26382D] shadow-sm text-white' : 'text-[#26382D]/60'}`}
              onClick={() => setMobileView('preview')}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>

        {/* LEFT: Editor Area */}
        <div className={`w-full md:w-[45%] lg:w-[500px] xl:w-[600px] flex-col shrink-0 border-r border-[#D8C9BE] bg-[#F1EDE9] overflow-y-auto ${mobileView === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          {/* Sticky Progress Header */}
          <div className="bg-[#F8F6F3] border-b border-[#D8C9BE]/50 sticky top-0 z-40 shadow-sm overflow-x-auto">
            <div className="min-w-max mx-auto px-4 py-4">
              
              {/* Desktop step indicators */}
              <div className="hidden sm:flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[#D8C9BE]/40 -z-10"></div>
                {steps.map((stepLabel, idx) => {
                  const stepNumber = idx + 1;
                  const isActive = stepNumber === currentStep;
                  const isCompleted = stepNumber < currentStep;

                  return (
                    <div key={stepNumber} className="flex flex-col items-center gap-2 bg-[#F8F6F3] px-1 lg:px-2">
                      <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium transition-colors shrink-0
                        ${isActive ? 'bg-[#26382D] text-white ring-4 ring-[#26382D]/10' : ''}
                        ${isCompleted ? 'bg-[#7C9278] text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-white border-2 border-[#D8C9BE] text-[#26382D]/50' : ''}
                      `}>
                        {isCompleted ? <Check className="w-3 h-3 lg:w-4 lg:h-4" /> : stepNumber}
                      </div>
                      <span className={`text-[9px] lg:text-[10px] font-semibold uppercase tracking-wider text-center max-w-[60px] leading-tight
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
          <div className="flex-1 w-full px-4 lg:px-6 py-6 pb-24">
            {currentStep === 1 && (
              <BasicInfoStep 
                value={basicInfo} 
                onChange={setBasicInfo} 
                onContinue={handleNext} 
              />
            )}
            
            {currentStep === 2 && (
              <AmenitiesStep 
                value={amenitiesInfo}
                onChange={setAmenitiesInfo}
                onContinue={handleNext}
                onBack={handleBack}
              />
            )}
            
            {currentStep === 3 && (
              <AccessibilityStep 
                value={accessibilityInfo}
                onChange={setAccessibilityInfo}
                onContinue={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 4 && (
              <SustainabilityStep 
                value={sustainabilityInfo}
                onChange={setSustainabilityInfo}
                onContinue={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 5 && (
              <RoomsStep 
                value={roomsInfo}
                onChange={setRoomsInfo}
                onContinue={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 6 && (
              <RulesStep 
                value={rulesInfo}
                onChange={setRulesInfo}
                onContinue={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 7 && (
              <PhotoUploadStep 
                value={photoSelection}
                onChange={setPhotoSelection}
                onContinue={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 8 && (
              <AiAnalysisStep 
                photoSelection={photoSelection}
                value={aiAnalysis}
                onChange={setAiAnalysis}
                onContinue={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 9 && (
              <AiAnalysisReviewStep 
                photoSelection={photoSelection}
                aiAnalysis={aiAnalysis}
                onContinue={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 10 && (
              <AiConfirmationStep 
                photoSelection={photoSelection}
                aiAnalysis={aiAnalysis}
                onConfirmComplete={handleConfirmComplete}
                onBack={handleBack}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Live Preview Area */}
        <div className={`flex-1 bg-white overflow-y-auto relative ${mobileView === 'preview' ? 'block' : 'hidden md:block'}`}>
          <div className="sticky top-0 z-10 bg-[#26382D] text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest py-2 text-center shadow-sm">
            Live Customer Preview <span className="opacity-60 font-normal">· Unsaved Changes</span>
          </div>
          <div className="transform scale-[0.85] sm:scale-[0.95] lg:scale-100 origin-top">
            <PropertyDetailTemplate 
              listing={previewProperty} 
              mode="customer-preview" 
            />
          </div>
        </div>

      </main>
    </div>
  );
}
