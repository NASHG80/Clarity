import React from 'react';
import { AlertCircle, ArrowUpCircle, Info } from 'lucide-react';

interface KpiTileProps {
  label: string;
  value: number | string;
  severity: 'red' | 'yellow' | 'neutral';
  className?: string;
}

export default function KpiTile({ label, value, severity, className = '' }: KpiTileProps) {
  let bgColor = 'bg-white';
  let borderColor = 'border-[#D8C9BE]';
  let iconColor = 'text-[#26382D]/50';
  let Icon = Info;
  let titleColor = 'text-[#26382D]/70';

  if (severity === 'red') {
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    iconColor = 'text-red-500';
    Icon = AlertCircle;
    titleColor = 'text-red-800';
  } else if (severity === 'yellow') {
    bgColor = 'bg-yellow-50';
    borderColor = 'border-yellow-200';
    iconColor = 'text-yellow-600';
    Icon = ArrowUpCircle;
    titleColor = 'text-yellow-800';
  }

  return (
    <div className={`flex flex-col p-5 rounded-xl border shadow-sm ${bgColor} ${borderColor} ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-sm font-semibold tracking-wide uppercase ${titleColor}`}>
          {label}
        </span>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="text-4xl font-serif font-bold text-[#26382D]">
        {value}
      </div>
    </div>
  );
}
