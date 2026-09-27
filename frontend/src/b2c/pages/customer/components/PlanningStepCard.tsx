import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface PlanningStepCardProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  complete?: boolean;
  children: React.ReactNode;
}

export default function PlanningStepCard({
  stepNumber,
  title,
  subtitle,
  complete = false,
  children,
}: PlanningStepCardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl border shadow-sm p-6 lg:p-8 transition-shadow hover:shadow-md
        ${complete ? 'border-[#A9B8A3]' : 'border-[#E5DFD6]'}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div
          className={`
            flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-1
            ${complete
              ? 'bg-[#7C9278] text-white'
              : 'bg-[#F5F3ED] text-[#A99587]'
            }
          `}
        >
          {complete ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-2xl font-bold text-[#1C2B22] leading-tight">{title}</h2>
          {subtitle && <p className="text-[#5B6D62] text-[13px] mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="pl-9">
        {children}
      </div>
    </div>
  );
}
