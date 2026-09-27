import React, { useState, useRef, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { UploadCloud, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export type PhotoBucketId = string;

export interface LocalPhotoAsset {
  id: string;
  bucket: PhotoBucketId;
  file: File;
  previewUrl: string;
  status: 'uploading' | 'ready' | 'failed';
  error?: string;
  isAccessibility?: boolean;
  cloudUrl?: string;
  publicId?: string;
}

export type LocalPhotoSelection = Record<PhotoBucketId, LocalPhotoAsset[]>;

export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedTypes: string[];
}

const DEFAULT_VALIDATION_CONFIG: FileValidationConfig = {
  maxSizeBytes: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png'],
};

interface PhotoUploadStepProps {
  value: LocalPhotoSelection;
  onChange: (value: LocalPhotoSelection | ((prev: LocalPhotoSelection) => LocalPhotoSelection)) => void;
  onContinue: () => void;
  onBack: () => void;
  validationConfig?: FileValidationConfig;
}

export function PhotoUploadStep({ 
  value, 
  onChange, 
  onContinue, 
  onBack,
  validationConfig = DEFAULT_VALIDATION_CONFIG
}: PhotoUploadStepProps) {
  const { t } = useTranslation();

  const handleFiles = (files: FileList | null, bucket: PhotoBucketId, isAccessibility: boolean) => {
    if (!files || files.length === 0) return;

    const newPhotos: LocalPhotoAsset[] = [];
    const validFiles: { id: string; file: File }[] = [];
    const updatedValue = { ...value };
    
    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).substring(7);
      
      if (!validationConfig.allowedTypes.includes(file.type)) {
        newPhotos.push({
          id, bucket, file, previewUrl: URL.createObjectURL(file), status: 'failed',
          error: t('onboarding.photos.errorType', 'Only JPEG and PNG are allowed.'),
          isAccessibility
        });
        return;
      }
      
      if (file.size > validationConfig.maxSizeBytes) {
        newPhotos.push({
          id, bucket, file, previewUrl: URL.createObjectURL(file), status: 'failed',
          error: t('onboarding.photos.errorSize', { 
            defaultValue: `File must be less than ${validationConfig.maxSizeBytes / (1024 * 1024)}MB.`,
            maxSize: validationConfig.maxSizeBytes / (1024 * 1024)
          }),
          isAccessibility
        });
        return;
      }

      validFiles.push({ id, file });
      newPhotos.push({
        id, bucket, file, previewUrl: URL.createObjectURL(file), status: 'uploading', isAccessibility
      });
    });

    updatedValue[bucket] = [...(updatedValue[bucket] || []), ...newPhotos];
    onChange(updatedValue);
    
    // Kick off async uploads for valid files
    validFiles.forEach(async ({ id, file }) => {
      try {
        const { uploadPhotoToCloudinary } = await import('../../../lib/api');
        const res = await uploadPhotoToCloudinary(file, bucket);
        
        onChange(prev => {
          const currentBucket = prev[bucket] || [];
          return {
            ...prev,
            [bucket]: currentBucket.map(p => 
              p.id === id ? { ...p, status: 'ready', cloudUrl: res.url, publicId: res.public_id } : p
            )
          };
        });
      } catch (error: any) {
        onChange(prev => {
          const currentBucket = prev[bucket] || [];
          return {
            ...prev,
            [bucket]: currentBucket.map(p => 
              p.id === id ? { ...p, status: 'failed', error: error.message || 'Upload failed' } : p
            )
          };
        });
      }
    });
  };

  const removePhoto = (bucket: PhotoBucketId, id: string) => {
    const updatedValue = { ...value };
    const photoToRemove = updatedValue[bucket]?.find(p => p.id === id);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    }
    updatedValue[bucket] = updatedValue[bucket]?.filter(p => p.id !== id) || [];
    onChange(updatedValue);
  };

  const generalBuckets = [
    { id: 'entrance', title: t('onboarding.photos.entrance', 'Entrance'), desc: t('onboarding.photos.entranceDesc', 'Show the main entrance and access path.') },
    { id: 'bathroom', title: t('onboarding.photos.bathroom', 'Bathroom'), desc: t('onboarding.photos.bathroomDesc', 'Show bathrooms and washroom areas.') },
    { id: 'room', title: t('onboarding.photos.room', 'Room'), desc: t('onboarding.photos.roomDesc', 'Show rooms and accommodation interiors.') },
    { id: 'parking', title: t('onboarding.photos.parking', 'Parking'), desc: t('onboarding.photos.parkingDesc', 'Show available parking areas.') },
  ];

  const accessibilityBuckets = [
    { id: 'acc_entrance', title: t('onboarding.photos.accEntrance', 'Accessible entrance'), desc: 'Main accessible entry points.' },
    { id: 'acc_ramps', title: t('onboarding.photos.accRamps', 'Ramps'), desc: 'Ramps for mobility access.' },
    { id: 'acc_elevators', title: t('onboarding.photos.accElevators', 'Elevators'), desc: 'Lifts and elevators.' },
    { id: 'acc_bathroom', title: t('onboarding.photos.accBathroom', 'Accessible bathroom'), desc: 'Bathrooms with accessible features.' },
    { id: 'acc_grab_bars', title: t('onboarding.photos.accGrabBars', 'Grab bars / handrails'), desc: 'Support bars.' },
    { id: 'acc_room', title: t('onboarding.photos.accRoom', 'Accessible room'), desc: 'Wheelchair-accessible rooms.' },
    { id: 'acc_parking', title: t('onboarding.photos.accParking', 'Accessible parking'), desc: 'Designated parking spots.' },
    { id: 'acc_other', title: t('onboarding.photos.accOther', 'Other accessibility'), desc: 'Any other accessibility features.' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2">
          {t('onboarding.photos.title', 'Property Photos')}
        </h2>
        <p className="text-sm sm:text-base text-[#26382D]/70 mb-5">
          {t('onboarding.photos.subtitle', 'Upload photos of your property. Accessibility photos will be analyzed to verify features.')}
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h3 className="text-xl font-serif font-semibold text-[#26382D] mb-4 border-b border-[#D8C9BE]/50 pb-2">
            A. General property photos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generalBuckets.map(bucket => (
              <BucketDropzone 
                key={bucket.id}
                bucket={bucket.id}
                title={bucket.title}
                desc={bucket.desc}
                photos={value[bucket.id] || []}
                onFiles={(files: FileList | null) => handleFiles(files, bucket.id, false)}
                onRemove={(id: string) => removePhoto(bucket.id, id)}
                validationConfig={validationConfig}
                t={t}
              />
            ))}
          </div>
        </section>
        
        <section>
          <h3 className="text-xl font-serif font-semibold text-[#26382D] mb-4 border-b border-[#D8C9BE]/50 pb-2">
            B. Accessibility photos
          </h3>
          <p className="text-sm text-[#26382D]/80 mb-6 bg-[#7C9278]/10 p-3 rounded-xl border border-[#7C9278]/20">
            These photos will be analyzed by our AI system to detect accessibility features. Please ensure features are clearly visible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accessibilityBuckets.map(bucket => (
              <BucketDropzone 
                key={bucket.id}
                bucket={bucket.id}
                title={bucket.title}
                desc={bucket.desc}
                photos={value[bucket.id] || []}
                onFiles={(files: FileList | null) => handleFiles(files, bucket.id, true)}
                onRemove={(id: string) => removePhoto(bucket.id, id)}
                validationConfig={validationConfig}
                t={t}
              />
            ))}
          </div>
        </section>
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
          disabled={Object.values(value).flat().some(p => p.status === 'uploading')}
          className="w-full sm:w-auto px-10"
        >
          {t('onboarding.submit', 'Submit to Dashboard')}
        </Button>
      </div>
    </div>
  );
}

function BucketDropzone({ title, desc, photos, onFiles, onRemove, validationConfig, t }: any) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onFiles(e.dataTransfer.files);
  };

  return (
    <div className="bg-[#F8F6F3] p-5 sm:p-6 rounded-2xl shadow-[0_4px_16px_rgba(38,56,45,0.03)] border border-[#D8C9BE]/50 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-serif font-semibold text-[#26382D]">{title}</h3>
        <p className="text-sm text-[#26382D]/70">{desc}</p>
      </div>

      <div 
        className={`flex-1 min-h-[140px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-[#7C9278] bg-[#7C9278]/5' : 'border-[#D8C9BE] hover:border-[#7C9278]/50 bg-white'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        aria-label={t('onboarding.photos.selectLabel', { defaultValue: `Select photos for ${title}` })}
      >
        <UploadCloud className={`w-8 h-8 mb-3 transition-colors ${isDragging ? 'text-[#7C9278]' : 'text-[#D8C9BE]'}`} />
        <span className="text-sm font-medium text-[#26382D]">
          {t('onboarding.photos.dragDrop', 'Drag and drop or browse')}
        </span>
        <span className="text-xs text-[#26382D]/50 mt-1">
          {t('onboarding.photos.limits', {
            defaultValue: `JPEG or PNG, max ${validationConfig.maxSizeBytes / (1024 * 1024)}MB`,
            maxSize: validationConfig.maxSizeBytes / (1024 * 1024)
          })}
        </span>
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          multiple 
          accept={validationConfig.allowedTypes.join(',')}
          onChange={(e) => onFiles(e.target.files)} 
        />
      </div>

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo: LocalPhotoAsset) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg border border-[#D8C9BE] overflow-hidden bg-white">
              <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(photo.id); }}
                  className="bg-white/90 p-1.5 rounded-full text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label={t('onboarding.photos.remove', 'Remove photo')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {photo.status === 'uploading' && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-6 h-6 border-2 border-[#7C9278] border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C9278]">
                    {t('onboarding.photos.uploading', 'Uploading')}
                  </span>
                </div>
              )}
              
              {photo.status === 'ready' && (
                <div className="absolute bottom-1 right-1 bg-white rounded-full px-1.5 py-0.5 shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#7C9278]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#7C9278]">
                    {t('onboarding.photos.ready', 'Ready')}
                  </span>
                </div>
              )}

              {photo.status === 'failed' && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center p-2 text-center backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 mb-1" />
                  <span className="text-[10px] font-medium text-red-600 leading-tight">{photo.error}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemove(photo.id); }}
                    className="mt-1 text-[10px] text-gray-500 hover:text-gray-700 underline"
                  >
                    {t('onboarding.photos.remove', 'Remove')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
