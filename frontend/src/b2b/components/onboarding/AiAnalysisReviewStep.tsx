import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { LocalPhotoSelection, PhotoBucketId } from './PhotoUploadStep';
import { AiAnalysisData, Detection } from './AiAnalysisStep';
import { Info, Sparkles } from 'lucide-react';

interface AiAnalysisReviewStepProps {
  photoSelection: LocalPhotoSelection;
  aiAnalysis: AiAnalysisData;
  onContinue: () => void;
  onBack: () => void;
}

export function AiAnalysisReviewStep({
  photoSelection,
  aiAnalysis,
  onContinue,
  onBack
}: AiAnalysisReviewStepProps) {
  const { t } = useTranslation();

  // Flatten the photo selection into a single array for easier iteration
  const allPhotos = useMemo(() => {
    return (Object.keys(photoSelection) as PhotoBucketId[])
      .flatMap(bucket => photoSelection[bucket])
      .filter(p => p.isAccessibility);
  }, [photoSelection]);

  // Only review photos that have successfully completed analysis
  const completedPhotos = allPhotos.filter(p => aiAnalysis[p.id]?.status === 'completed');

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2">
          {t('onboarding.aiReview.title', 'AI Analysis Review')}
        </h2>
        <p className="text-sm sm:text-base text-[#26382D]/70 mb-4">
          {t('onboarding.aiReview.subtitle', 'Review what the AI found in your property photos.')}
        </p>
        
        <div className="bg-[#7C9278]/10 border border-[#7C9278]/30 rounded-lg p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-[#7C9278] shrink-0 mt-0.5" />
          <p className="text-sm text-[#26382D]">
            {t('onboarding.aiReview.helper', 'AI suggestions are for review. Confirmed features are added to your property information only after you approve them in the next step.')}
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {completedPhotos.length === 0 ? (
          <div className="bg-[#F8F6F3] p-8 text-center rounded-2xl border border-[#D8C9BE]/50">
            <p className="text-[#26382D]/70">
              {t('onboarding.aiReview.noResults', 'No analysis results available to review.')}
            </p>
          </div>
        ) : (
          completedPhotos.map(photo => (
            <PhotoReviewCard 
              key={photo.id}
              photoUrl={photo.previewUrl}
              bucket={photo.bucket}
              detections={aiAnalysis[photo.id].detections || []}
              t={t}
            />
          ))
        )}
      </div>

      <div className="pt-6 border-t border-[#D8C9BE]/50 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
        <button 
          onClick={onBack}
          className="text-[#7C9278] font-medium hover:text-[#26382D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          {t('onboarding.back', 'Back')}
        </button>
        <Button 
          variant="primary" 
          onClick={onContinue} 
          className="w-full sm:w-auto px-10"
        >
          {t('onboarding.continue', 'Continue')}
        </Button>
      </div>
    </div>
  );
}

interface PhotoReviewCardProps {
  photoUrl: string;
  bucket: string;
  detections: Detection[];
  t: any;
}

/**
 * Coordinate Adapter:
 * Converts the backend's current [x, y, w, h] pixel coordinate output into responsive CSS percentages.
 * NOTE: This is currently configured for absolute pixel coordinates from the mock.
 * If the canonical backend implementation changes to normalized coordinates (e.g. 0.0 - 1.0),
 * this adapter must be updated accordingly.
 */
function convertBboxToPercentages(bbox: [number, number, number, number], naturalSize: { w: number; h: number }) {
  const [x, y, w, h] = bbox;
  return {
    leftPct: (x / naturalSize.w) * 100,
    topPct: (y / naturalSize.h) * 100,
    widthPct: (w / naturalSize.w) * 100,
    heightPct: (h / naturalSize.h) * 100
  };
}

function PhotoReviewCard({ photoUrl, bucket, detections, t }: PhotoReviewCardProps) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [activeDetectionIdx, setActiveDetectionIdx] = useState<number | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setNaturalSize({
      w: e.currentTarget.naturalWidth,
      h: e.currentTarget.naturalHeight
    });
  };

  const hasDetections = detections.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#D8C9BE]/50 shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* Image Section */}
      <div className="w-full md:w-3/5 bg-[#F8F6F3] border-b md:border-b-0 md:border-r border-[#D8C9BE]/50 p-4 sm:p-6 flex items-center justify-center relative">
        <div className="relative inline-block max-w-full">
          <img 
            src={photoUrl} 
            alt={t('onboarding.aiReview.photoAlt', 'Property photo under review')}
            className="block max-w-full h-auto max-h-[500px] object-contain rounded-lg shadow-sm"
            onLoad={handleImageLoad}
          />
          
          {/* Bounding Box Overlays */}
          {naturalSize && detections.map((det, idx) => {
            const { leftPct, topPct, widthPct, heightPct } = convertBboxToPercentages(det.bbox, naturalSize);
            const isActive = activeDetectionIdx === idx;

            return (
              <div 
                key={idx}
                className={`absolute border-2 transition-colors duration-200 pointer-events-none rounded-sm
                  ${isActive ? 'border-[#26382D] z-20 shadow-[0_0_0_2px_rgba(255,255,255,0.5)]' : 'border-[#D8C9BE] z-10'}
                `}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
              >
                {/* Optional Box Label */}
                <div className={`absolute -top-6 left-0 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap rounded-t-sm transition-colors duration-200
                  ${isActive ? 'bg-[#26382D] text-white' : 'bg-white text-[#26382D] shadow-sm'}
                `}>
                  {det.label}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bucket identifier */}
        <div className="absolute top-4 left-4 bg-white/90 text-[#26382D] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm backdrop-blur-sm">
          {bucket}
        </div>
      </div>

      {/* Detections List Section */}
      <div className="w-full md:w-2/5 p-5 sm:p-6 flex flex-col">
        <h3 className="text-sm font-bold text-[#26382D] uppercase tracking-wider mb-4 border-b border-[#D8C9BE]/30 pb-2">
          {t('onboarding.aiReview.detectedFeatures', 'Detected Features')}
        </h3>

        {!hasDetections ? (
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <p className="text-sm text-[#26382D]/60 italic">
              {t('onboarding.aiReview.emptyDetections', 'No features detected in this image.')}
            </p>
          </div>
        ) : (
          <ul className="space-y-2 flex-1">
            {detections.map((det, idx) => (
              <li 
                key={idx}
                tabIndex={0}
                role="button"
                onMouseEnter={() => setActiveDetectionIdx(idx)}
                onMouseLeave={() => setActiveDetectionIdx(null)}
                onFocus={() => setActiveDetectionIdx(idx)}
                onBlur={() => setActiveDetectionIdx(null)}
                onClick={() => setActiveDetectionIdx(idx)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveDetectionIdx(idx); }}
                aria-label={t('onboarding.aiReview.highlightDetection', { defaultValue: `Highlight detection: ${det.label}` })}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278]
                  ${activeDetectionIdx === idx ? 'bg-[#7C9278]/10 border-[#7C9278]/30' : 'bg-transparent border-[#D8C9BE]/30 hover:border-[#D8C9BE] hover:bg-gray-50'}
                `}
              >
                <div className={`mt-0.5 rounded-full p-1 transition-colors
                  ${activeDetectionIdx === idx ? 'bg-[#26382D] text-white' : 'bg-[#D8C9BE]/50 text-[#26382D]/70'}
                `}>
                  <Sparkles className="w-3 h-3" />
                </div>
                <span className={`text-sm font-medium transition-colors pt-0.5
                  ${activeDetectionIdx === idx ? 'text-[#26382D]' : 'text-[#26382D]/80'}
                `}>
                  {det.label}
                </span>
                
                {/* Note: Confidence is omitted from the UI here per project rules */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
