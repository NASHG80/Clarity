export const ACCESSIBILITY_FEATURES = [
  'step_free_entrance',
  'elevator',
  'wheelchair_accessible_room',
  'roll_in_shower',
  'accessible_toilet',
  'low_walking_distance',
  'accessible_public_transport',
  'visual_assistance',
  'hearing_assistance'
] as const;

export type AccessibilityFeatureKey = typeof ACCESSIBILITY_FEATURES[number];
