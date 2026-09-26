import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Camera, Image as ImageIcon, Trash2, GripVertical, AlertCircle, Upload, CheckCircle2, Loader2 } from 'lucide-react';

interface PhotoBucket {
  id: string;
  label: string;
  desc: string;
}

const BUCKETS: PhotoBucket[] = [
  { id: 'entrance', label: 'Entrance & Parking', desc: 'Photos showing step-free access, ramps, and accessible parking spots.' },
  { id: 'bathroom', label: 'Bathroom', desc: 'Photos showing roll-in showers, grab bars, and turning radius.' },
  { id: 'room', label: 'Room', desc: 'Photos showing bed height, clearance, and accessible features.' },
  { id: 'general', label: 'General / Common Areas', desc: 'Lobby, restaurant, paths, and general property amenities.' }
];

export default function PhotoUploadPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const listingId = searchParams.get('id') || 'New Listing';
  
  const [activeBucket, setActiveBucket] = useState('entrance');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock state for photos per bucket
  const [photos, setPhotos] = useState<Record<string, { id: string, url: string, file: File, analyzed: boolean }[]>>({
    entrance: [], bathroom: [], room: [], general: []
  });

  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{ [id: string]: any }>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed.';
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return 'Image size must be less than 5MB.';
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles: { id: string, url: string, file: File, analyzed: boolean }[] = [];
    
    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        setError(err);
        return; // Stop processing on first error
      }
      validFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        file,
        analyzed: false
      });
    }

    setPhotos(prev => ({
      ...prev,
      [activeBucket]: [...(prev[activeBucket] || []), ...validFiles]
    }));
  };

  const removePhoto = (bucketId: string, photoId: string) => {
    setPhotos(prev => ({
      ...prev,
      [bucketId]: prev[bucketId].filter(p => p.id !== photoId)
    }));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulate AI vision service delay
    setTimeout(() => {
      const newResults = { ...analysisResults };
      Object.values(photos).flat().forEach(photo => {
        newResults[photo.id] = {
          detections: [
            { label: 'wheelchair ramp', confidence: 0.89 },
            { label: 'handrail', confidence: 0.95 }
          ]
        };
        photo.analyzed = true;
      });
      setAnalysisResults(newResults);
      setPhotos({ ...photos });
      setIsAnalyzing(false);
    }, 2500);
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#D8C9BE]/50 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-4">&larr; Back</Button>
            <h1 className="text-3xl font-serif font-bold text-[#26382D]">
              {t('photos.title', 'Photo Manager')}
            </h1>
          </div>
          <p className="text-[#26382D]/70 mt-1">
            {t('photos.subtitle', 'Upload property photos for traveler preview and AI accessibility verification.')}
          </p>
        </div>
        <Button variant="primary" leftIcon={isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} onClick={handleAnalyze} disabled={isAnalyzing || Object.values(photos).flat().length === 0}>
          {isAnalyzing ? t('photos.analyzing', 'Analyzing with AI...') : t('photos.analyzeAction', 'Run AI Analysis')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Buckets */}
        <div className="col-span-1 space-y-2">
          {BUCKETS.map(bucket => {
            const count = photos[bucket.id]?.length || 0;
            return (
              <button
                key={bucket.id}
                onClick={() => setActiveBucket(bucket.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  activeBucket === bucket.id 
                    ? 'border-[#7C9278] bg-[#F8F6F3]' 
                    : 'border-transparent hover:bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#26382D]">{bucket.label}</span>
                  {count > 0 && (
                    <span className="bg-[#7C9278] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#26382D]/70">{bucket.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Main Area: Upload & Gallery */}
        <div className="col-span-3 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Upload Dropzone */}
          <div 
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
              isDragging ? 'border-[#7C9278] bg-[#7C9278]/5' : 'border-[#D8C9BE] bg-white hover:bg-[#F8F6F3]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center cursor-pointer">
              <div className="w-16 h-16 bg-[#F1EDE9] rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-[#7C9278]" />
              </div>
              <h3 className="text-lg font-bold text-[#26382D] mb-1">
                {t('photos.dragDrop', 'Drag & drop photos here')}
              </h3>
              <p className="text-sm text-[#26382D]/60 mb-6">
                {t('photos.uploadHints', 'JPG, PNG, WEBP up to 5MB. Horizontal orientation preferred.')}
              </p>
              <Button variant="outline" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                {t('photos.browse', 'Browse Files')}
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                multiple 
                className="hidden" 
              />
            </div>
          </div>

          {/* Photo Gallery Grid */}
          {photos[activeBucket] && photos[activeBucket].length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
              {photos[activeBucket].map((photo, index) => (
                <div key={photo.id} className="group relative bg-white border border-[#D8C9BE] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    <img src={photo.url} alt="Uploaded preview" className="w-full h-full object-cover" />
                    
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" title="Reorder (drag)">
                        <GripVertical className="w-5 h-5" />
                      </button>
                      <button onClick={() => removePhoto(activeBucket, photo.id)} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm" title="Remove">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Analysis Results Badge */}
                  {photo.analyzed && analysisResults[photo.id] && (
                    <div className="p-3 bg-white border-t border-[#D8C9BE]/50">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        AI Verified Features
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {analysisResults[photo.id].detections.map((det: any, i: number) => (
                          <span key={i} className="px-2 py-1 bg-green-50 text-green-800 text-[10px] rounded border border-green-200">
                            {det.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
