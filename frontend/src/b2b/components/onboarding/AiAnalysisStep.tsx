import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { LocalPhotoSelection, LocalPhotoAsset, PhotoBucketId } from './PhotoUploadStep';
import { Loader2, AlertCircle, CheckCircle2, BrainCircuit } from 'lucide-react';
import { mockInspectPropertyImage } from '../../../lib/api';

export interface Detection {
  label: string;
  bbox: [number, number, number, number];
  confidence: number;
  review_status?: 'pending' | 'confirmed' | 'rejected';
}

export type AnalysisStatus = 'ready' | 'analyzing' | 'completed' | 'failed';

export interface AnalysisResult {
  photoId: string;
  status: AnalysisStatus;
  detections: Detection[];
  error?: string;
}

export type AiAnalysisData = Record<string, AnalysisResult>;

interface AiAnalysisStepProps {
  photoSelection: LocalPhotoSelection;
  value: AiAnalysisData;
  onChange: (value: AiAnalysisData | ((prev: AiAnalysisData) => AiAnalysisData)) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function AiAnalysisStep({ 
  photoSelection, 
  value, 
  onChange, 
  onContinue, 
  onBack 
}: AiAnalysisStepProps) {
  const { t } = useTranslation();

  // Flatten the photo selection into a single array for easier iteration
  const allPhotos = useMemo(() => {
    return (Object.keys(photoSelection) as PhotoBucketId[]).flatMap(bucket => 
      photoSelection[bucket]
    );
  }, [photoSelection]);

  // Determine global state
  const totalPhotos = allPhotos.length;
  const completedCount = allPhotos.filter(p => value[p.id]?.status === 'completed').length;
  const failedCount = allPhotos.filter(p => value[p.id]?.status === 'failed').length;
  const analyzingCount = allPhotos.filter(p => value[p.id]?.status === 'analyzing').length;
  
  const hasPhotos = totalPhotos > 0;
  const allCompleted = hasPhotos && completedCount === totalPhotos;
  const isAnyAnalyzing = analyzingCount > 0;
  
  // Only photos that are 'ready' (no status yet) or 'failed' can be analyzed
  const canAnalyze = hasPhotos && allPhotos.some(p => 
    !value[p.id] || value[p.id].status === 'ready' || value[p.id].status === 'failed'
  );

  // Call API per photo
  const analyzePhoto = async (photo: LocalPhotoAsset) => {
    // 1. Mark as analyzing
    onChange((prev) => ({
      ...prev,
      [photo.id]: { photoId: photo.id, status: 'analyzing', detections: [] }
    }));

    try {
      // Use the API layer mock (as actual endpoint is missing)
      const detections = await mockInspectPropertyImage(photo.id, photo.bucket);

      onChange((prev) => ({
        ...prev,
        [photo.id]: { photoId: photo.id, status: 'completed', detections }
      }));
    } catch (error) {
      onChange((prev) => ({
        ...prev,
        [photo.id]: { 
          photoId: photo.id, 
          status: 'failed', 
          detections: [], 
          error: t('onboarding.ai.timeoutError', 'Analysis timed out. Please try again.') 
        }
      }));
    }
  };

  const handleAnalyzeAll = () => {
    if (!canAnalyze) return;
    
    // Find all photos that need analysis (not already completed/analyzing)
    const photosToAnalyze = allPhotos.filter(p => 
      !value[p.id] || value[p.id].status === 'ready' || value[p.id].status === 'failed'
    );
    
    // Kick off independent async requests. One failure will not crash the others.
    photosToAnalyze.forEach(photo => {
      analyzePhoto(photo);
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2 flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-[#7C9278]" />
          {t('onboarding.ai.title', 'Analyze Photos')}
        </h2>
        <p className="text-sm sm:text-base text-[#26382D]/70 mb-5">
          {t('onboarding.ai.subtitle', 'Our AI can automatically detect sustainability and accessibility features in your photos. You will be able to review the results in the next step.')}
        </p>
      </div>

      {!hasPhotos ? (
        <div className="bg-[#F8F6F3] p-8 text-center rounded-2xl border border-[#D8C9BE]/50">
          <p className="text-[#26382D]/70">{t('onboarding.ai.noPhotos', 'No photos were uploaded in the previous step.')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-[#D8C9BE]/50 shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#26382D]">
                {t('onboarding.ai.progress', { 
                  defaultValue: '{{completed}} of {{total}} photos analyzed',
                  completed: completedCount, 
                  total: totalPhotos 
                })}
              </span>
              {failedCount > 0 && (
                <span className="text-xs text-red-600 font-medium">
                  {t('onboarding.ai.failedCount', { defaultValue: '{{count}} failed', count: failedCount })}
                </span>
              )}
            </div>
            <Button 
              variant="primary" 
              onClick={handleAnalyzeAll} 
              disabled={!canAnalyze || isAnyAnalyzing}
              className="w-full sm:w-auto"
            >
              {isAnyAnalyzing 
                ? t('onboarding.ai.analyzingBtn', 'Analyzing...') 
                : t('onboarding.ai.analyzeBtn', 'Analyze Photos')}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allPhotos.map(photo => {
              const result = value[photo.id];
              const status = result?.status || 'ready';
              
              return (
                <div key={photo.id} className="relative group aspect-square rounded-lg border border-[#D8C9BE] overflow-hidden bg-white shadow-sm">
                  <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
                  
                  {/* Bucket Badge */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded backdrop-blur-sm">
                    {photo.bucket}
                  </div>

                  {/* Status Overlay */}
                  {status === 'analyzing' && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 text-[#7C9278] animate-spin" />
                      <span className="text-xs font-semibold text-[#26382D] uppercase tracking-wider">
                        {t('onboarding.ai.analyzing', 'Analyzing')}
                      </span>
                    </div>
                  )}

                  {status === 'completed' && (
                    <div className="absolute bottom-2 right-2 bg-white rounded-full px-2 py-1 shadow-sm flex items-center gap-1.5 border border-[#7C9278]/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#7C9278]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C9278]">
                        {t('onboarding.ai.complete', 'Complete')}
                      </span>
                    </div>
                  )}

                  {status === 'failed' && (
                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-3 text-center backdrop-blur-sm border-2 border-red-500/20">
                      <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
                      <span className="text-[11px] font-medium text-red-700 leading-tight mb-3">
                        {result?.error || t('onboarding.ai.defaultError', 'Analysis failed')}
                      </span>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => analyzePhoto(photo)}
                        className="text-[11px] py-1 px-3 min-h-0 h-auto bg-white"
                      >
                        {t('onboarding.ai.retry', 'Retry')}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

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
          disabled={!allCompleted && hasPhotos}
          className="w-full sm:w-auto px-10"
        >
          {t('onboarding.continue', 'Continue')}
        </Button>
      </div>
    </div>
  );
}
