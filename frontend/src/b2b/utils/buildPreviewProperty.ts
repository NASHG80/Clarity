import { ListingDetailResponse, AccommodationItem } from '../../lib/api';
import { BasicInfoData } from '../components/onboarding/BasicInfoStep';
import { AmenitiesData } from '../components/onboarding/AmenitiesStep';
import { AccessibilityData } from '../components/onboarding/AccessibilityStep';
import { SustainabilityData } from '../components/onboarding/SustainabilityStep';
import { RoomData } from '../components/onboarding/RoomsStep';
import { RulesData } from '../components/onboarding/RulesStep';
import { LocalPhotoSelection } from '../components/onboarding/PhotoUploadStep';
import { AiAnalysisData } from '../components/onboarding/AiAnalysisStep';

interface DraftState {
  basicInfo: BasicInfoData;
  amenitiesInfo: AmenitiesData;
  accessibilityInfo: AccessibilityData;
  sustainabilityInfo: SustainabilityData;
  roomsInfo: RoomData[];
  rulesInfo: RulesData;
  photoSelection: LocalPhotoSelection;
  aiAnalysis: AiAnalysisData;
}

/**
 * Normalizes onboarding form state into the shared ListingDetailResponse
 * format used by PropertyDetailTemplate.
 */
export function buildPreviewProperty(draft: DraftState): ListingDetailResponse {
  // Convert basic info
  const name = draft.basicInfo.name || 'Your Property Name';
  const city = draft.basicInfo.city || 'City pending...';
  
  const price = parseInt(draft.basicInfo.price) || 0;
  
  const rating = draft.basicInfo.starRating || undefined;

  // Convert accessibility
  const accessibility_items: AccommodationItem[] = Object.keys(draft.accessibilityInfo)
    .filter(k => draft.accessibilityInfo[k])
    .map(label => ({
      label,
      data_state: 'reported', // Unsaved, but acts as reported in preview
      value: true
    }));

  // Convert sustainability
  const sustainability_items: AccommodationItem[] = Object.keys(draft.sustainabilityInfo)
    .filter(k => draft.sustainabilityInfo[k])
    .map(label => ({
      label,
      data_state: 'reported',
      value: true
    }));

  // Consolidate photos for preview
  const photos: string[] = [];
  Object.values(draft.photoSelection).forEach(assetArray => {
    assetArray.forEach(asset => {
      if (asset.previewUrl) {
        photos.push(asset.previewUrl);
      } else if (asset.file) {
        photos.push(URL.createObjectURL(asset.file));
      }
    });
  });

  const amenities = Object.keys(draft.amenitiesInfo).filter(k => draft.amenitiesInfo[k]);

  return {
    id: 'draft-1',
    translations: {
      en: {
        name,
        description: draft.basicInfo.description || 'Add a description to help travelers understand your property.'
      }
    },
    city,
    price_inr_per_night: price,
    star_rating: rating,
    photos,
    data_state: 'reported', // Outer wrapper indicator for self-reported onboarding data
    accessibility_items,
    sustainability_items,
    confirmations: [],
    amenities,
    rooms: draft.roomsInfo,
    rules: draft.rulesInfo,
    address: draft.basicInfo.address,
    location: draft.basicInfo.address ? { lat: 15.2993, lng: 74.1240 } : undefined // Mock coordinate logic for preview
  };
}
