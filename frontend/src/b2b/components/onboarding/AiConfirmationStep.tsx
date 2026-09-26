import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { DataStateBadge } from '../../../shared/components/DataStateBadge';
import { LocalPhotoSelection, PhotoBucketId } from './PhotoUploadStep';
import { AiAnalysisData, Detection } from './AiAnalysisStep';
import { 
  confirmDetections, 
  DetectionConfirmationItem, 
  ConfirmDetectionsResponse 
} from '../../../lib/api';
import { 
  Check, 
  X, 
  Info, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RotateCcw,
  ShieldAlert
} from 'lucide-react';

export type DecisionType = 'pending' | 'confirmed' | 'rejected';

interface AiConfirmationStepProps {
  photoSelection: LocalPhotoSelection;
  aiAnalysis: AiAnalysisData;
  onConfirmComplete: (confirmedFeatures: string[], decisions: DetectionConfirmationItem[]) => void;
  onBack: () => void;
}

/**
 * Coordinate Adapter:
 * Converts [x, y, w, h] pixel bounding box coordinates into responsive CSS percentages.
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

export function AiConfirmationStep({
  photoSelection,
  aiAnalysis,
  onConfirmComplete,
  onBack
}: AiConfirmationStepProps) {
  const { t } = useTranslation('b2b');

  // Flatten photos with completed analyses
  const completedPhotos = useMemo(() => {
    const all = (Object.keys(photoSelection) as PhotoBucketId[]).flatMap(bucket => 
      photoSelection[bucket]
    );
    return all.filter(p => aiAnalysis[p.id]?.status === 'completed');
  }, [photoSelection, aiAnalysis]);

  // Build a unique key for each detection: `${photoId}::${index}`
  // NOTE ON CONTRACT GAP:
  // The backend API contract currently defines confirmation items as `{ label, confirmed, image_id }`
  // without a unique `detection_id`. In local UI state, we track each detection by composite
  // `${photoId}::${index}` to allow per-item UI toggles even if duplicate labels exist in an image.
  const [decisions, setDecisions] = useState<Record<string, DecisionType>>(() => {
    const initial: Record<string, DecisionType> = {};
    completedPhotos.forEach(photo => {
      const dets = aiAnalysis[photo.id]?.detections || [];
      dets.forEach((det, idx) => {
        const key = `${photo.id}::${idx}`;
        initial[key] = det.review_status || 'pending';
      });
    });
    return initial;
  });

  // Highlighted detection across cards and photo overlay
  const [activeDetectionKey, setActiveDetectionKey] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessResult, setSubmitSuccessResult] = useState<ConfirmDetectionsResponse | null>(null);
  const [submittedPayload, setSubmittedPayload] = useState<DetectionConfirmationItem[]>([]);

  // Count totals
  const totalDetectionsCount = useMemo(() => {
    return completedPhotos.reduce((sum, p) => sum + (aiAnalysis[p.id]?.detections?.length || 0), 0);
  }, [completedPhotos, aiAnalysis]);

  const confirmedCount = useMemo(() => {
    return Object.values(decisions).filter(d => d === 'confirmed').length;
  }, [decisions]);

  const rejectedCount = useMemo(() => {
    return Object.values(decisions).filter(d => d === 'rejected').length;
  }, [decisions]);

  const pendingCount = useMemo(() => {
    return Object.values(decisions).filter(d => d === 'pending').length;
  }, [decisions]);

  // Handle decision toggle (reversible before submission)
  const setDecision = (key: string, newDecision: DecisionType) => {
    setDecisions(prev => {
      // If clicking already selected decision, toggle back to pending
      if (prev[key] === newDecision) {
        return { ...prev, [key]: 'pending' };
      }
      return { ...prev, [key]: newDecision };
    });
    if (submitError) setSubmitError(null);
  };

  // Submit decisions
  const handleSubmit = async () => {
    if (isSubmitting || totalDetectionsCount === 0) return;

    // Serialize decisions into canonical API format: list of { label, confirmed, image_id }
    const itemsToSubmit: DetectionConfirmationItem[] = [];

    completedPhotos.forEach(photo => {
      const dets = aiAnalysis[photo.id]?.detections || [];
      dets.forEach((det, idx) => {
        const key = `${photo.id}::${idx}`;
        const decision = decisions[key] || 'pending';
        // Confirmed = true; Rejected = false.
        // If an item was left pending, we do not mark confirmed.
        // However, per design rules, user should resolve items.
        itemsToSubmit.push({
          label: det.label,
          confirmed: decision === 'confirmed',
          image_id: photo.id,
        });
      });
    });

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await confirmDetections(itemsToSubmit);
      setSubmitSuccessResult(result);
      setSubmittedPayload(itemsToSubmit);
    } catch (err: any) {
      setSubmitError(err?.message || t('onboarding.confirmAi.errorDesc', 'An error occurred while submitting decisions. Selections are preserved. Please retry.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (submitSuccessResult) {
      onConfirmComplete(submitSuccessResult.updated_checklist_items, submittedPayload);
    }
  };

  // If already successfully submitted, show final post-submission summary
  if (submitSuccessResult) {
    const confirmedItemsList = submittedPayload.filter(item => item.confirmed);
    const rejectedItemsList = submittedPayload.filter(item => !item.confirmed);

    return (
      <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl border border-[#7C9278]/40 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#7C9278]/20 flex items-center justify-center shrink-0 text-[#26382D]">
              <CheckCircle2 className="w-7 h-7 text-[#7C9278]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-semibold text-[#26382D]">
                {t('onboarding.confirmAi.successTitle', 'Decisions Recorded Successfully')}
              </h2>
              <p className="text-sm text-[#26382D]/70">
                {t('onboarding.confirmAi.successDesc', 'Your decisions have been submitted. Confirmed features have been updated to "Reported by property". Rejected items were discarded.')}
              </p>
            </div>
          </div>

          {/* Hard Rule Transparency Notice */}
          <div className="bg-[#F8F6F3] border border-[#D8C9BE] rounded-xl p-4 flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-[#7C9278] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-[#26382D]/80 leading-relaxed">
              {t('onboarding.confirmAi.noVerifiedNotice', 'Note: Confirmed features are recorded as "Reported by property", strictly never "Verified". Official audits are required for verified status.')}
            </p>
          </div>

          {/* Summary Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#D8C9BE]/40">
            {/* Confirmed Features */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#26382D] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#7C9278]" />
                {t('onboarding.confirmAi.reportedFeatures', 'Reported by Property')} ({confirmedItemsList.length})
              </h3>
              {confirmedItemsList.length === 0 ? (
                <p className="text-xs text-[#26382D]/60 italic">No features confirmed from photos.</p>
              ) : (
                <ul className="space-y-2">
                  {confirmedItemsList.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#7C9278]/10 border border-[#7C9278]/20 text-xs sm:text-sm">
                      <span className="font-medium text-[#26382D] capitalize">
                        {t(`labels.${item.label}`, item.label)}
                      </span>
                      <DataStateBadge state="reported" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Discarded Features */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#26382D]/80 flex items-center gap-2">
                <X className="w-4 h-4 text-gray-500" />
                {t('onboarding.confirmAi.discardedFeatures', 'Discarded (Not Added)')} ({rejectedItemsList.length})
              </h3>
              {rejectedItemsList.length === 0 ? (
                <p className="text-xs text-[#26382D]/60 italic">No features rejected.</p>
              ) : (
                <ul className="space-y-2">
                  {rejectedItemsList.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs sm:text-sm text-[#26382D]/70">
                      <span className="capitalize">{t(`labels.${item.label}`, item.label)}</span>
                      <span className="text-[11px] font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                        {t('onboarding.confirmAi.rejected', 'Rejected')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-[#D8C9BE]/40 flex justify-end">
            <Button variant="primary" onClick={handleFinish} className="px-8 w-full sm:w-auto">
              {t('onboarding.confirmAi.finish', 'Complete Onboarding')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2 flex items-center gap-3">
          {t('onboarding.confirmAi.title', 'Review & Confirm AI Findings')}
        </h2>
        <p className="text-sm sm:text-base text-[#26382D]/70 mb-4">
          {t('onboarding.confirmAi.subtitle', 'Confirm only features that your property currently provides. Confirmed items will be reported by your property.')}
        </p>

        {/* Informational Banner */}
        <div className="bg-[#7C9278]/10 border border-[#7C9278]/30 rounded-lg p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-[#7C9278] shrink-0 mt-0.5" />
          <div className="text-sm text-[#26382D] space-y-1">
            <p>
              {t('onboarding.confirmAi.helper', 'AI suggestions are never verified automatically. Your explicit confirmation marks a feature as "Reported by property". Rejected items are discarded and will not be recorded as claims.')}
            </p>
          </div>
        </div>
      </div>

      {/* Decision Summary Tracker */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#D8C9BE]/50 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#26382D]/60">
              {t('onboarding.confirmAi.summaryTotal', 'Total Findings')}:
            </span>
            <span className="text-sm font-bold text-[#26382D] bg-[#F1EDE9] px-2.5 py-0.5 rounded-full">
              {totalDetectionsCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#7C9278]">
              {t('onboarding.confirmAi.summaryConfirmed', 'Confirmed')}:
            </span>
            <span className="text-sm font-bold text-[#7C9278] bg-[#7C9278]/10 px-2.5 py-0.5 rounded-full">
              {confirmedCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#8B4513]">
              {t('onboarding.confirmAi.summaryRejected', 'Rejected')}:
            </span>
            <span className="text-sm font-bold text-[#8B4513] bg-[#8B4513]/10 px-2.5 py-0.5 rounded-full">
              {rejectedCount}
            </span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-700">
                {t('onboarding.confirmAi.summaryPending', 'Pending')}:
              </span>
              <span className="text-sm font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            </div>
          )}
        </div>

        {pendingCount > 0 && (
          <div className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('onboarding.confirmAi.pendingWarning', { count: pendingCount, defaultValue: `Please make a decision for all detected features (${pendingCount} pending) before submitting.` })}</span>
          </div>
        )}
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3 text-red-900">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-bold">{t('onboarding.confirmAi.errorTitle', 'Submission Failed')}</h4>
            <p className="text-xs sm:text-sm text-red-800">{submitError}</p>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="text-xs shrink-0 bg-white"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {t('onboarding.confirmAi.retry', 'Retry')}
          </Button>
        </div>
      )}

      {/* Photos & Detections List */}
      <div className="space-y-12">
        {completedPhotos.length === 0 ? (
          <div className="bg-[#F8F6F3] p-8 text-center rounded-2xl border border-[#D8C9BE]/50">
            <p className="text-[#26382D]/70">
              {t('onboarding.confirmAi.noResults', 'No completed photo analyses available to confirm.')}
            </p>
          </div>
        ) : (
          completedPhotos.map(photo => {
            const detections = aiAnalysis[photo.id]?.detections || [];
            return (
              <PhotoConfirmationCard
                key={photo.id}
                photoId={photo.id}
                photoUrl={photo.previewUrl}
                bucket={photo.bucket}
                detections={detections}
                decisions={decisions}
                activeDetectionKey={activeDetectionKey}
                onSelectDetection={setActiveDetectionKey}
                onSetDecision={setDecision}
                t={t}
              />
            );
          })
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-6 border-t border-[#D8C9BE]/50 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
        <button 
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-[#7C9278] font-medium hover:text-[#26382D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          {t('onboarding.confirmAi.back', 'Back')}
        </button>

        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isSubmitting || totalDetectionsCount === 0 || pendingCount > 0}
          className="w-full sm:w-auto px-10 min-w-[200px]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('onboarding.confirmAi.submitting', 'Submitting Decisions...')}
            </span>
          ) : (
            t('onboarding.confirmAi.submit', { count: totalDetectionsCount, defaultValue: `Submit Decisions (${totalDetectionsCount})` })
          )}
        </Button>
      </div>
      {/* Note: Disabling the submit button when pendingCount > 0 is a UX choice to ensure 
          all AI suggestions are explicitly addressed. The backend API contract does not strictly 
          forbid submitting with pending items (unconfirmed items simply don't become 'reported'). */}
    </div>
  );
}

interface PhotoConfirmationCardProps {
  photoId: string;
  photoUrl: string;
  bucket: string;
  detections: Detection[];
  decisions: Record<string, DecisionType>;
  activeDetectionKey: string | null;
  onSelectDetection: (key: string | null) => void;
  onSetDecision: (key: string, decision: DecisionType) => void;
  t: any;
}

function PhotoConfirmationCard({
  photoId,
  photoUrl,
  bucket,
  detections,
  decisions,
  activeDetectionKey,
  onSelectDetection,
  onSetDecision,
  t
}: PhotoConfirmationCardProps) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setNaturalSize({
      w: e.currentTarget.naturalWidth,
      h: e.currentTarget.naturalHeight
    });
  };

  const hasDetections = detections.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#D8C9BE]/50 shadow-sm overflow-hidden">
      {/* Real Desktop Layout: side-by-side (hidden md:flex) */}
      <div className="hidden md:flex flex-row">
        {/* Left Side: Photo with Bounding Boxes */}
        <div className="w-7/12 bg-[#F8F6F3] border-r border-[#D8C9BE]/50 p-6 flex items-center justify-center relative min-h-[380px]">
          <div className="relative inline-block max-w-full">
            <img 
              src={photoUrl} 
              alt={t('onboarding.confirmAi.photoAlt', `Property photo of ${bucket}`)}
              className="block max-w-full h-auto max-h-[460px] object-contain rounded-lg shadow-sm"
              onLoad={handleImageLoad}
            />

            {/* Bounding Box Overlays */}
            {naturalSize && detections.map((det, idx) => {
              const key = `${photoId}::${idx}`;
              const { leftPct, topPct, widthPct, heightPct } = convertBboxToPercentages(det.bbox, naturalSize);
              const isActive = activeDetectionKey === key;
              const decision = decisions[key] || 'pending';

              let borderColor = 'border-[#D8C9BE]';
              let badgeColor = 'bg-white text-[#26382D]';

              if (isActive) {
                borderColor = 'border-[#26382D] ring-2 ring-white z-30';
                badgeColor = 'bg-[#26382D] text-white';
              } else if (decision === 'confirmed') {
                borderColor = 'border-[#7C9278] z-20';
                badgeColor = 'bg-[#7C9278] text-white';
              } else if (decision === 'rejected') {
                borderColor = 'border-[#8B4513]/60 z-10';
                badgeColor = 'bg-[#8B4513]/80 text-white';
              }

              return (
                <div 
                  key={idx}
                  className={`absolute border-2 transition-all duration-200 pointer-events-none rounded-sm ${borderColor}`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                >
                  <div className={`absolute -top-6 left-0 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap rounded-t-sm transition-colors duration-200 shadow-sm ${badgeColor}`}>
                    {t(`labels.${det.label}`, det.label)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bucket Badge */}
          <div className="absolute top-4 left-4 bg-white/95 text-[#26382D] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm backdrop-blur-sm border border-[#D8C9BE]/40">
            {bucket}
          </div>
        </div>

        {/* Right Side: Detections Decision Panel */}
        <div className="w-5/12 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#D8C9BE]/40 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#26382D] uppercase tracking-wider">
                {t('onboarding.confirmAi.candidateFeature', 'AI Detected Features')} ({detections.length})
              </h3>
              <span className="text-[11px] text-[#26382D]/60">
                {bucket}
              </span>
            </div>

            {!hasDetections ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-medium text-[#26382D]/70">
                  {t('onboarding.confirmAi.noDetections', 'No features detected in this image.')}
                </p>
                <p className="text-xs text-[#26382D]/50">
                  {t('onboarding.confirmAi.noDetectionsSub', 'Nothing to confirm or reject for this photo.')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {detections.map((det, idx) => {
                  const key = `${photoId}::${idx}`;
                  const decision = decisions[key] || 'pending';
                  const isActive = activeDetectionKey === key;

                  return (
                    <DetectionDecisionCard
                      key={key}
                      detectionKey={key}
                      detection={det}
                      decision={decision}
                      isActive={isActive}
                      bucket={bucket}
                      onFocus={() => onSelectDetection(key)}
                      onBlur={() => onSelectDetection(null)}
                      onMouseEnter={() => onSelectDetection(key)}
                      onMouseLeave={() => onSelectDetection(null)}
                      onSetDecision={(d) => onSetDecision(key, d)}
                      t={t}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real Mobile Layout: stacked (block md:hidden) */}
      <div className="block md:hidden p-4 space-y-4">
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-[#D8C9BE]/40 pb-2">
          <span className="text-xs font-bold text-[#26382D] uppercase tracking-wider">
            {bucket}
          </span>
          <span className="text-xs text-[#26382D]/60">
            {detections.length} {detections.length === 1 ? 'feature' : 'features'}
          </span>
        </div>

        {/* Mobile Image */}
        <div className="bg-[#F8F6F3] rounded-lg p-3 flex items-center justify-center relative border border-[#D8C9BE]/50">
          <div className="relative inline-block max-w-full">
            <img 
              src={photoUrl} 
              alt={t('onboarding.confirmAi.photoAlt', `Property photo of ${bucket}`)}
              className="block max-w-full h-auto max-h-[300px] object-contain rounded"
              onLoad={handleImageLoad}
            />

            {naturalSize && detections.map((det, idx) => {
              const key = `${photoId}::${idx}`;
              const { leftPct, topPct, widthPct, heightPct } = convertBboxToPercentages(det.bbox, naturalSize);
              const isActive = activeDetectionKey === key;
              const decision = decisions[key] || 'pending';

              let borderColor = 'border-[#D8C9BE]';
              let badgeColor = 'bg-white text-[#26382D]';

              if (isActive) {
                borderColor = 'border-[#26382D] ring-2 ring-white z-30';
                badgeColor = 'bg-[#26382D] text-white';
              } else if (decision === 'confirmed') {
                borderColor = 'border-[#7C9278] z-20';
                badgeColor = 'bg-[#7C9278] text-white';
              } else if (decision === 'rejected') {
                borderColor = 'border-[#8B4513]/60 z-10';
                badgeColor = 'bg-[#8B4513]/80 text-white';
              }

              return (
                <div 
                  key={idx}
                  className={`absolute border-2 transition-all duration-200 pointer-events-none rounded-sm ${borderColor}`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                >
                  <div className={`absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap rounded-t-sm shadow-sm ${badgeColor}`}>
                    {t(`labels.${det.label}`, det.label)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Detections List */}
        {!hasDetections ? (
          <div className="py-6 text-center text-xs text-[#26382D]/60 italic bg-[#F8F6F3] rounded-lg">
            {t('onboarding.confirmAi.noDetections', 'No features detected in this image.')}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {detections.map((det, idx) => {
              const key = `${photoId}::${idx}`;
              const decision = decisions[key] || 'pending';
              const isActive = activeDetectionKey === key;

              return (
                <DetectionDecisionCard
                  key={key}
                  detectionKey={key}
                  detection={det}
                  decision={decision}
                  isActive={isActive}
                  bucket={bucket}
                  onFocus={() => onSelectDetection(key)}
                  onBlur={() => onSelectDetection(null)}
                  onMouseEnter={() => onSelectDetection(key)}
                  onMouseLeave={() => onSelectDetection(null)}
                  onSetDecision={(d) => onSetDecision(key, d)}
                  t={t}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface DetectionDecisionCardProps {
  detectionKey: string;
  detection: Detection;
  decision: DecisionType;
  isActive: boolean;
  bucket: string;
  onFocus: () => void;
  onBlur: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onSetDecision: (decision: DecisionType) => void;
  t: any;
}

function DetectionDecisionCard({
  detectionKey,
  detection,
  decision,
  isActive,
  bucket,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  onSetDecision,
  t
}: DetectionDecisionCardProps) {
  const isConfirmed = decision === 'confirmed';
  const isRejected = decision === 'rejected';
  const isPending = decision === 'pending';

  return (
    <div 
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278]
        ${isActive ? 'bg-[#7C9278]/10 border-[#7C9278] shadow-sm' : 'bg-white border-[#D8C9BE]/50 hover:border-[#D8C9BE]'}
      `}
      aria-label={t('onboarding.confirmAi.highlight', { label: detection.label, defaultValue: `Highlight ${detection.label} on photo` })}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#26382D]/5 flex items-center justify-center shrink-0 text-[#26382D]/70">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#26382D] capitalize">
              {t(`labels.${detection.label}`, detection.label)}
            </h4>
            <span className="text-[11px] text-[#26382D]/60 block leading-tight">
              {t('onboarding.confirmAi.candidateFeature', 'AI detected feature')}
            </span>
          </div>
        </div>

        {/* State Indicator Badge (Non-color only: explicit text + icons) */}
        <div>
          {isConfirmed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C9278] bg-[#7C9278]/10 px-2 py-0.5 rounded-full border border-[#7C9278]/30">
              <Check className="w-3 h-3" />
              {t('onboarding.confirmAi.confirmed', 'Confirmed')}
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8B4513] bg-[#8B4513]/10 px-2 py-0.5 rounded-full border border-[#8B4513]/30">
              <X className="w-3 h-3" />
              {t('onboarding.confirmAi.rejected', 'Rejected')}
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#26382D]/60 bg-[#F1EDE9] px-2 py-0.5 rounded-full border border-[#D8C9BE]/50">
              <Clock className="w-3 h-3 text-[#26382D]/50" />
              {t('onboarding.confirmAi.pending', 'Pending decision')}
            </span>
          )}
        </div>
      </div>

      {/* Decision Buttons (Min 44px touch target on mobile) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {/* Confirm Button */}
        <button
          type="button"
          onClick={() => onSetDecision('confirmed')}
          aria-pressed={isConfirmed}
          aria-label={t('onboarding.confirmAi.ariaConfirm', { label: detection.label, bucket, defaultValue: `Confirm ${detection.label} in ${bucket} photo` })}
          className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] min-h-[44px] sm:min-h-[38px]
            ${isConfirmed 
              ? 'bg-[#26382D] text-white shadow-sm ring-1 ring-[#26382D]' 
              : 'bg-white border border-[#D8C9BE] text-[#26382D] hover:bg-[#7C9278]/10 hover:border-[#7C9278]'}
          `}
        >
          <Check className={`w-3.5 h-3.5 ${isConfirmed ? 'text-[#7C9278]' : 'text-current'}`} strokeWidth={2.5} />
          <span>{t('onboarding.confirmAi.confirm', 'Confirm')}</span>
        </button>

        {/* Reject Button */}
        <button
          type="button"
          onClick={() => onSetDecision('rejected')}
          aria-pressed={isRejected}
          aria-label={t('onboarding.confirmAi.ariaReject', { label: detection.label, bucket, defaultValue: `Reject ${detection.label} in ${bucket} photo` })}
          className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B4513] min-h-[44px] sm:min-h-[38px]
            ${isRejected 
              ? 'bg-[#8B4513] text-white shadow-sm ring-1 ring-[#8B4513]' 
              : 'bg-white border border-[#D8C9BE] text-[#26382D] hover:bg-gray-100 hover:border-gray-400'}
          `}
        >
          <X className={`w-3.5 h-3.5 ${isRejected ? 'text-white' : 'text-current'}`} strokeWidth={2.5} />
          <span>{t('onboarding.confirmAi.reject', 'Reject')}</span>
        </button>
      </div>
    </div>
  );
}
