export const SUSTAINABILITY_FEATURES = [
  'solar_power',
  'waste_program',
  'water_program',
  'local_sourcing'
] as const;

export type SustainabilityFeatureKey = typeof SUSTAINABILITY_FEATURES[number];
