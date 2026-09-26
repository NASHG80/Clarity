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
        bg-[#F8F6F3] rounded-2xl border shadow-[0_4px_16px_rgba(38,56,45,0.03)] p-6 transition-all duration-300
        ${complete ? 'border-[#A9B8A3]' : 'border-[#D8C9BE]'}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`
            flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold
            ${complete
              ? 'bg-[#7C9278] text-white'
              : 'bg-[#D8C9BE] text-[#A99587]'
            }
          `}
        >
          {complete ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-[18px] text-[#26382D] leading-tight">{title}</h2>
          {subtitle && <p className="text-[12px] text-[#A99587] mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="pl-9">
        {children}
      </div>
    </div>
  );
}
