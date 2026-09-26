export type OpportunityType = 'resource' | 'demand_gap' | 'ai_detection_pending';

export interface UnifiedOpportunity {
  type: OpportunityType;
  id: string;
  severity?: string;
  title: string;
  estimate?: string;
  suggested_action?: string;
  is_demo_data: boolean;
  
  // Specific to demand gaps
  label?: string;
  demand_count?: number;
  property_data_state?: string;
}
