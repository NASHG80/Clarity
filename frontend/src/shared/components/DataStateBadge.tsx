import React from 'react';
import { Badge } from './Badge';
import { CheckCircle2, AlertCircle, HelpCircle, FileText, FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Ready for i18n

export type DataState = 'verified' | 'reported' | 'community_confirmed' | 'not_verified' | 'demo_synthetic';

export interface DataStateBadgeProps {
  state: string; // Accepts string defensively
  className?: string;
  label?: string; // Optional custom label override
}

export function DataStateBadge({ state, className = '', label }: DataStateBadgeProps) {
  const { t } = useTranslation();

  // Fallback map safely falls back to 'not_verified' if an unknown string is passed
  let safeState: DataState = 'not_verified';
  if (['verified', 'reported', 'community_confirmed', 'not_verified', 'demo_synthetic'].includes(state)) {
    safeState = state as DataState;
  }

  const config: Record<DataState, { variant: any; icon: React.ReactNode; defaultLabel: string }> = {
    verified: {
      variant: 'success',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      defaultLabel: t('dataState.verified', 'Verified'),
    },
    reported: {
      variant: 'neutral', // Property reported
      icon: <FileText className="w-3.5 h-3.5" />,
      defaultLabel: t('dataState.reported', 'Reported by property'),
    },
    community_confirmed: {
      variant: 'info',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      defaultLabel: t('dataState.community_confirmed', 'Confirmed by travelers'),
    },
    not_verified: {
      variant: 'neutral',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      defaultLabel: t('dataState.not_verified', 'Not verified'),
    },
    demo_synthetic: {
      variant: 'demo',
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      defaultLabel: t('dataState.demo_synthetic', 'Demo data'),
    },
  };

  const { variant, icon, defaultLabel } = config[safeState];

  return (
    <Badge variant={variant} icon={icon} className={className}>
      {label || defaultLabel}
    </Badge>
  );
}
